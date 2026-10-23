import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { api, onStatusChange } from '../services/api.js'
import { uid } from '../services/localEngine.js'
import { CODE } from '../data/content.js'

const LS_KEY = 'ochakovo1978_game_v1'

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
  mode: 'student', // student | hr
  screen: 'home', // home | locker | hub | station | finale
  stationId: null,
  sessionId: uid('sess'),
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
})

function load() {
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw)
    return { ...initialState(), ...s, telemetry: { ...emptyTelemetry(), ...(s.telemetry || {}) } }
  } catch {
    return initialState()
  }
}

function reducer(state, a) {
  const t = state.telemetry
  switch (a.type) {
    case 'MODE':
      return { ...state, mode: a.mode }
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
      const idx = ['lab', 'engineering', 'line', 'design'].indexOf(a.id)
      const digits = [...state.digits]
      digits[idx] = CODE[idx]
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
    case 'RESET':
      return { ...initialState(), mode: state.mode }
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

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  useEffect(() => onStatusChange(setApiStatus), [])

  useEffect(() => {
    if (sessionStarted.current) return
    sessionStarted.current = true
    api.health()
    api.track(state.sessionId, 'session_open', { screen: state.screen })
  }, [state.sessionId, state.screen])

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
        window.scrollTo?.({ top: 0, behavior: 'smooth' })
        track('navigate', { screen, stationId })
      },
      setMode: (mode) => {
        dispatch({ type: 'MODE', mode })
        window.scrollTo?.({ top: 0 })
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
          toast('+20 Крафт-баллов · Почему Очаково')
          track('why_ochakovo_cards_viewed', { id })
        }
      },
      ppeAttempt: (wrong, missing) => {
        dispatch({ type: 'PPE_ATTEMPT', wrong })
        track('ppe_attempt', { wrong, missing })
      },
      ppeDone: () => {
        dispatch({ type: 'PPE_DONE' })
        toast('+100 Крафт-баллов · Допуск к смене получен')
        track('ppe_done', {})
      },
      quiz: (station, idx, correct) => {
        dispatch({ type: 'QUIZ', correct })
        track('quiz_answer', { station, idx, correct })
      },
      stationDone: (id, points, result, skipped = false) => {
        dispatch({ type: 'STATION_DONE', id, points, result, skipped })
        toast(`+${points} Крафт-баллов · Станция пройдена`)
        track('station_done', { id, points, result, skipped })
      },
      capsuleAttempt: (code) => {
        dispatch({ type: 'CAPSULE_ATTEMPT' })
        track('capsule_attempt', { code })
      },
      capsuleOpen: () => {
        dispatch({ type: 'CAPSULE_OPEN' })
        toast('+150 Крафт-баллов · Капсула 1978 открыта!')
        track('capsule_open', {})
      },
      buy: (item) => {
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
      reset: () => {
        dispatch({ type: 'RESET' })
        window.scrollTo?.({ top: 0 })
      },
    }),
    [toast, track, state.sessionId],
  )

  const balance = state.points - state.spent
  const value = { state, balance, actions, toasts, toast, apiStatus }
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>
}

export const useGame = () => useContext(GameCtx)
