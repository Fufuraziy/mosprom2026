import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { api, onStatusChange } from '../services/api.js'
import { uid } from '../services/localEngine.js'
import { LEGACY_CODE, STATION_ORDER, newCapsuleCode } from '../data/content.js'
import { initVK, haptic, launchParams, storageLoad, storageSave, vkStorageEnabled } from '../services/vk.js'

const LS_KEY = 'ochakovo1978_game_v1'

/**
 * Навигация мини-приложения. MiniApp подставляет сюда переход через vk-mini-apps-router,
 * чтобы старый вызов actions.go(screen, stationId) из экранов игры менял адрес (#/hub, #/station/lab…)
 * и попадал в историю «Назад». На странице HR (hr.html) остаётся null — там экраны переключает state.mode.
 */
export const navigation = { go: null }

const emptyTelemetry = () => ({
  why_ochakovo_cards_viewed: [],
  ppe_attempts: 0,
  ppe_wrong_picks: [],
  stations: {},
  quiz: { correct: 0, total: 0 },
  capsule_attempts: 0,
  calculator: { interactions: 0, night_ok: false, last: null },
  asked_topics: {},
  skipped: [],
  started_at: new Date().toISOString(),
})

const initialState = () => ({
  mode: 'student', // student | bot | hr
  screen: 'home', // home | locker | hub | station | finale
  stationId: null,
  sessionId: uid('sess'),
  code: newCapsuleCode(), // код замка капсулы этой игры (4 случайные цифры)
  sessionRegistered: false, // игра зарегистрирована на бэкенде (POST /api/sessions)
  points: 0,
  spent: 0,
  digits: [null, null, null, null],
  ppeDone: false,
  capsuleOpened: false,
  tickets: {},
  candidate: null,
  telemetry: emptyTelemetry(),
  demoFast: false,
  chatHistory: [],
  storyShared: false,
  vkProfile: null,
  ageOk: false, // показано и подтверждено предупреждение 18+ (правило ВК 2.1.5)
  juryMode: false, // «Режим жюри»: Панель HR и ВК-бот внутри мини-приложения
  bot: emptyBot(),
})

function emptyBot() {
  // переписка с сообществом ОЧАКОВО во ВКонтакте (симулятор ВК-бота)
  return {
    threads: { me: { id: 'me', name: 'Вы (демо-кандидат)', candidateId: null, messages: [], unread: 0 } },
    order: ['me'],
    active: 'me',
  }
}

function load() {
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw)
    // сохранение до случайного кода: начатая игра доигрывается со старым кодом
    if (!Array.isArray(s.code) || s.code.length !== 4) s.code = (s.digits || []).some(Boolean) ? LEGACY_CODE : newCapsuleCode()
    return { ...initialState(), ...s, telemetry: { ...emptyTelemetry(), ...(s.telemetry || {}) }, bot: s.bot?.threads ? s.bot : emptyBot() }
  } catch {
    return initialState()
  }
}

function reducer(state, a) {
  const t = state.telemetry
  switch (a.type) {
    case 'MODE':
      return { ...state, mode: a.mode }
    case 'LOAD':
      // синхронизация с другой вкладкой / рамкой телефона: режим просмотра у каждой вкладки свой
      return { ...state, ...a.state, mode: state.mode, telemetry: { ...emptyTelemetry(), ...(a.state.telemetry || {}) } }
    case 'BOT_PUSH': {
      const b = state.bot
      const prev = b.threads[a.threadId] || { id: a.threadId, name: a.name || 'Кандидат', candidateId: a.candidateId || null, messages: [], unread: 0 }
      const msgs = a.messages.map((m) => ({ id: Math.random().toString(36).slice(2), ts: new Date().toISOString(), ...m }))
      const incoming = msgs.filter((m) => m.from !== 'user').length
      const thread = { ...prev, name: a.name || prev.name, messages: [...prev.messages, ...msgs].slice(-80), unread: a.markUnread ? prev.unread + incoming : prev.unread }
      return {
        ...state,
        bot: { ...b, threads: { ...b.threads, [a.threadId]: thread }, order: [a.threadId, ...b.order.filter((x) => x !== a.threadId)] },
      }
    }
    case 'BOT_ACTIVE': {
      const b = state.bot
      const th = b.threads[a.threadId]
      if (!th) return state
      return { ...state, bot: { ...b, active: a.threadId, threads: { ...b.threads, [a.threadId]: { ...th, unread: 0 } } } }
    }
    case 'STORY_SHARED':
      return state.storyShared ? state : { ...state, storyShared: true, points: state.points + 100 }
    case 'VK_PROFILE':
      return { ...state, vkProfile: a.profile }
    case 'GO':
      return { ...state, screen: a.screen, stationId: a.stationId ?? null, mode: 'student' }
    case 'AWARD':
      return { ...state, points: state.points + a.points }
    case 'WHY_VIEW':
      if (t.why_ochakovo_cards_viewed.includes(a.id)) return state
      return {
        ...state,
        points: state.points + 20,
        telemetry: { ...t, why_ochakovo_cards_viewed: [...t.why_ochakovo_cards_viewed, a.id] },
      }
    case 'PPE_ATTEMPT':
      return {
        ...state,
        telemetry: {
          ...t,
          ppe_attempts: t.ppe_attempts + 1,
          ppe_wrong_picks: [...new Set([...t.ppe_wrong_picks, ...(a.wrong || [])])],
        },
      }
    case 'PPE_DONE':
      if (state.ppeDone) return state
      return { ...state, ppeDone: true, points: state.points + 100 }
    case 'QUIZ':
      return {
        ...state,
        telemetry: { ...t, quiz: { correct: t.quiz.correct + (a.correct ? 1 : 0), total: t.quiz.total + 1 } },
      }
    case 'STATION_DONE': {
      if (t.stations[a.id]) return state
      const idx = STATION_ORDER.indexOf(a.id)
      const digits = [...state.digits]
      digits[idx] = state.code[idx] // станция N открывает N-ю цифру кода этой игры
      return {
        ...state,
        digits,
        points: state.points + a.points,
        telemetry: {
          ...t,
          stations: { ...t.stations, [a.id]: { ...a.result, score: a.points, completed_at: new Date().toISOString() } },
          skipped: a.skipped ? [...t.skipped, a.id] : t.skipped,
        },
      }
    }
    case 'CAPSULE_ATTEMPT':
      return { ...state, telemetry: { ...t, capsule_attempts: t.capsule_attempts + 1 } }
    case 'CAPSULE_OPEN':
      return state.capsuleOpened ? state : { ...state, capsuleOpened: true, points: state.points + 150 }
    case 'BUY': {
      if (state.points - state.spent < a.price) return state
      return { ...state, spent: state.spent + a.price, tickets: { ...state.tickets, [a.id]: (state.tickets[a.id] || 0) + 1 } }
    }
    case 'CALC': {
      const c = t.calculator
      return {
        ...state,
        telemetry: {
          ...t,
          calculator: {
            interactions: c.interactions + 1,
            night_ok: c.night_ok || a.value.nights > 0,
            last: a.value,
          },
        },
      }
    }
    case 'TOPIC': {
      if (!a.topic || a.topic === 'other') return state
      return {
        ...state,
        telemetry: { ...t, asked_topics: { ...t.asked_topics, [a.topic]: (t.asked_topics[a.topic] || 0) + 1 } },
      }
    }
    case 'CHAT':
      return { ...state, chatHistory: [...state.chatHistory, ...a.messages].slice(-40) }
    case 'CANDIDATE':
      return { ...state, candidate: a.candidate }
    case 'DEMO':
      return { ...state, demoFast: a.value }
    case 'REMOTE_SESSION': {
      // код от бэкенда принимаем, только пока ни одна цифра не открыта — иначе сломаем начатую игру
      const fresh = !state.digits.some(Boolean) && !state.capsuleOpened
      const code = fresh && Array.isArray(a.code) && a.code.length === 4 && a.code.every((d) => /^[0-9]$/.test(String(d))) ? a.code.map(String) : state.code
      return { ...state, sessionRegistered: true, code, sessionId: fresh && a.sessionId ? a.sessionId : state.sessionId }
    }
    case 'JURY':
      return { ...state, juryMode: a.value }
    case 'AGE_OK':
      return { ...state, ageOk: true }
    case 'RESET':
      return { ...initialState(), mode: state.mode, ageOk: state.ageOk, juryMode: state.juryMode }
    default:
      return state
  }
}

const GameCtx = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [toasts, setToasts] = useState([])
  const [apiStatus, setApiStatus] = useState({ online: null, mode: 'local' })
  const sessionStarted = useRef(false)

  // Сохранение: localStorage сразу, VK Storage (внутри ВК) — не чаще раза в 15 с и при сворачивании приложения.
  const vkDirty = useRef(false)
  const latest = useRef(state)
  latest.current = state
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
    } catch {
      /* ignore */
    }
    vkDirty.current = true
  }, [state])

  useEffect(() => {
    if (!vkStorageEnabled) return
    const flush = () => {
      if (!vkDirty.current) return
      vkDirty.current = false
      const s = latest.current
      // бот — только для страницы HR; чат — последние 30 реплик (лимиты VK Storage)
      storageSave({ ...s, bot: undefined, chatHistory: s.chatHistory.slice(-30), savedAt: Date.now() })
    }
    const id = setInterval(flush, 15000)
    window.addEventListener('och:pause', flush)
    // при старте — забираем прогресс с другого устройства, если он новее
    storageLoad().then((r) => {
      if (r?.state && (r.savedAt || 0) > (latest.current.savedAt || 0)) dispatch({ type: 'LOAD', state: r.state })
    })
    return () => {
      clearInterval(id)
      window.removeEventListener('och:pause', flush)
    }
  }, [])

  useEffect(() => onStatusChange(setApiStatus), [])

  // VK Mini App: VKWebAppInit при старте (в обычном браузере — no-op)
  useEffect(() => {
    initVK().then((r) => r.mode === 'vk' && api.track(state.sessionId, 'vk_init', r))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // синхронизация состояния между вкладкой и «рамкой телефона» (iframe того же сайта)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== LS_KEY || !e.newValue) return
      try {
        dispatch({ type: 'LOAD', state: JSON.parse(e.newValue) })
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (sessionStarted.current) return
    sessionStarted.current = true
    api.health()
    api.track(state.sessionId, 'session_open', { screen: state.screen, vk_platform: launchParams.vk_platform || null, vk_ref: launchParams.vk_ref || null })
  }, [state.sessionId, state.screen])

  // Новая игра (первый запуск или «Пройти заново») → регистрируем сессию на бэкенде.
  // Если бэкенд выдал свой код замка (target_code) — используем его, пока ни одна цифра не открыта.
  useEffect(() => {
    if (state.sessionRegistered) return
    api
      .startSession({ session_id: state.sessionId, target_code: state.code })
      .then((r) => r && r.source !== 'local' && dispatch({ type: 'REMOTE_SESSION', sessionId: r.session_id, code: r.target_code }))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionRegistered, state.sessionId])

  const toast = useCallback((msg, kind = 'points') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((x) => [...x, { id, msg, kind }])
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2600)
  }, [])

  const track = useCallback((event, payload) => api.track(state.sessionId, event, payload), [state.sessionId])

  const actions = useMemo(
    () => ({
      go: (screen, stationId) => {
        dispatch({ type: 'GO', screen, stationId })
        if (navigation.go) navigation.go(screen, stationId)
        else window.scrollTo?.({ top: 0, behavior: 'smooth' })
        track('navigate', { screen, stationId })
      },
      ageOk: () => {
        dispatch({ type: 'AGE_OK' })
        track('age_gate_ok', {})
      },
      setMode: (mode) => {
        dispatch({ type: 'MODE', mode })
        // в мини-приложении HR и бот — экраны «Режима жюри»
        if (navigation.go) {
          if (mode === 'hr' || mode === 'bot') navigation.go(mode === 'hr' ? 'jury_hr' : 'jury_bot')
        } else window.scrollTo?.({ top: 0 })
        track('mode', { mode })
      },
      award: (points, reason) => {
        dispatch({ type: 'AWARD', points })
        toast(`+${points} Крафт-баллов · ${reason}`)
        track('points', { points, reason })
      },
      viewWhy: (id, isNew) => {
        dispatch({ type: 'WHY_VIEW', id })
        if (isNew) {
          toast('+20 Крафт-баллов · Почему ОЧАКОВО')
          track('why_ochakovo_cards_viewed', { id })
        }
      },
      ppeAttempt: (wrong, missing) => {
        if (wrong.length || missing.length) haptic('error')
        dispatch({ type: 'PPE_ATTEMPT', wrong })
        track('ppe_attempt', { wrong, missing })
      },
      ppeDone: () => {
        haptic('success')
        dispatch({ type: 'PPE_DONE' })
        toast('+100 Крафт-баллов · Допуск к смене получен')
        track('ppe_done', {})
      },
      quiz: (station, idx, correct) => {
        haptic(correct ? 'success' : 'error')
        dispatch({ type: 'QUIZ', correct })
        track('quiz_answer', { station, idx, correct })
      },
      stationDone: (id, points, result, skipped = false) => {
        haptic('success')
        dispatch({ type: 'STATION_DONE', id, points, result, skipped })
        toast(`+${points} Крафт-баллов · Станция пройдена`)
        track('station_done', { id, points, result, skipped })
      },
      capsuleAttempt: (code) => {
        dispatch({ type: 'CAPSULE_ATTEMPT' })
        track('capsule_attempt', { code })
      },
      capsuleOpen: () => {
        haptic('success')
        dispatch({ type: 'CAPSULE_OPEN' })
        toast('+150 Крафт-баллов · Капсула 1978 открыта!')
        track('capsule_open', {})
      },
      buy: (item) => {
        haptic('medium')
        dispatch({ type: 'BUY', id: item.id, price: item.price })
        api.buyTicket(state.sessionId, item.id)
        toast(`Билет на розыгрыш: ${item.title}`, 'ticket')
        track('raffle_ticket', { item: item.id, price: item.price })
      },
      calc: (value) => {
        dispatch({ type: 'CALC', value })
        track('calculator', value)
      },
      topic: (topic) => dispatch({ type: 'TOPIC', topic }),
      chatPush: (messages) => dispatch({ type: 'CHAT', messages }),
      setCandidate: (candidate) => {
        dispatch({ type: 'CANDIDATE', candidate })
        track('candidate_submitted', { id: candidate?.id })
      },
      setDemo: (value) => dispatch({ type: 'DEMO', value }),
      setJury: (value) => {
        dispatch({ type: 'JURY', value })
        track('jury_mode', { value })
      },
      botPush: (threadId, messages, meta = {}) => dispatch({ type: 'BOT_PUSH', threadId, messages, ...meta }),
      botActive: (threadId) => dispatch({ type: 'BOT_ACTIVE', threadId }),
      storyShared: (source) => {
        dispatch({ type: 'STORY_SHARED' })
        toast('+100 Крафт-баллов · История ВКонтакте')
        track('vk_story_share', { source })
      },
      setVkProfile: (profile, source) => {
        dispatch({ type: 'VK_PROFILE', profile: { ...profile, source } })
        track('vk_autofill', { source })
      },
      reset: () => {
        dispatch({ type: 'RESET' })
        if (!navigation.go) window.scrollTo?.({ top: 0 })
      },
    }),
    [toast, track, state.sessionId],
  )

  const balance = state.points - state.spent
  const value = { state, balance, actions, toasts, toast, apiStatus }
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>
}

export const useGame = () => useContext(GameCtx)
