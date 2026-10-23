// Клиентский слой API «Секретный код 1978».
//
// Если FastAPI-бэкенд (по умолчанию http://localhost:8000, переопределяется VITE_API_URL)
// отвечает на /api/health — все вызовы идут в него. Если нет (или запрос упал) — тот же
// метод мгновенно отрабатывает на встроенном локальном движке (./localEngine.js)
// с теми же структурами данных. Контракт эндпоинтов: frontend/API_CONTRACT.md.
import * as local from './localEngine.js'

export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const HEALTH_TTL = 20000 // мс: как часто перепроверяем доступность бэкенда
const TIMEOUT = 3500

const state = {
  online: null, // null — ещё не проверяли
  checkedAt: 0,
  checking: null,
  info: null,
}
const listeners = new Set()

export function onStatusChange(fn) {
  listeners.add(fn)
  fn(getStatus())
  return () => listeners.delete(fn)
}
export function getStatus() {
  return { online: state.online, url: API_URL, info: state.info, mode: state.online ? 'remote' : 'local' }
}
function setOnline(v, info) {
  const changed = state.online !== v
  state.online = v
  state.checkedAt = Date.now()
  if (info !== undefined) state.info = info
  if (changed) listeners.forEach((fn) => fn(getStatus()))
}

async function timedFetch(url, opts = {}, ms = TIMEOUT) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function checkHealth(force = false) {
  if (!force && state.online !== null && Date.now() - state.checkedAt < HEALTH_TTL) return state.online
  if (state.checking) return state.checking
  state.checking = (async () => {
    for (const path of ['/api/health', '/health']) {
      try {
        const r = await timedFetch(API_URL + path, {}, 1500)
        if (r.ok) {
          let info = null
          try {
            info = await r.json()
          } catch {
            /* не JSON — тоже ок */
          }
          setOnline(true, info)
          return true
        }
      } catch {
        /* пробуем следующий путь */
      }
    }
    setOnline(false, null)
    return false
  })()
  try {
    return await state.checking
  } finally {
    state.checking = null
  }
}

/**
 * Выполнить запрос к бэкенду, а при недоступности — локальный fallback.
 * Ошибки валидации (4xx) пробрасываются как есть, чтобы форма показала их пользователю.
 */
async function call(method, path, body, fallback) {
  const online = await checkHealth()
  if (online) {
    try {
      const r = await timedFetch(API_URL + path, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (r.status === 422 || r.status === 400) {
        const data = await r.json().catch(() => ({}))
        const err = new Error('validation')
        err.status = r.status
        err.errors = normalizeErrors(data)
        throw err
      }
      if (r.ok) {
        const ct = r.headers.get('content-type') || ''
        return ct.includes('application/json') ? await r.json() : await r.text()
      }
      if (r.status === 404 || r.status === 405 || r.status === 501) {
        // эндпоинт ещё не реализован на бэкенде — тихо работаем локально
        return fallback()
      }
      throw new Error(`HTTP ${r.status}`)
    } catch (e) {
      if (e.status === 422 || e.status === 400) throw e
      setOnline(false)
    }
  }
  return fallback()
}

function normalizeErrors(data) {
  // FastAPI: {detail: [{loc: ['body','birth_date'], msg: '...'}]} или {errors: {field: msg}}
  if (data?.errors && typeof data.errors === 'object') return data.errors
  const out = {}
  if (Array.isArray(data?.detail)) {
    for (const d of data.detail) out[d.loc?.[d.loc.length - 1] || 'form'] = d.msg
  } else if (typeof data?.detail === 'string') out.form = data.detail
  return out
}

const q = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()
  return s ? `?${s}` : ''
}

/* --------------------------------------------------------------- публичный API */

export const api = {
  health: () => checkHealth(true),

  /** Новая игровая сессия (анонимная, до анкеты). */
  startSession: () =>
    call('POST', '/api/sessions', { started_at: new Date().toISOString() }, () => ({
      session_id: local.uid('sess'),
      source: 'local',
    })),

  /** Событие телеметрии: {session_id, event, payload}. Ошибки не мешают игре. */
  track: (session_id, event, payload = {}) =>
    call('POST', '/api/telemetry', { session_id, event, payload, ts: new Date().toISOString() }, () =>
      local.logEvent({ session_id, event, payload }),
    ).catch(() => null),

  /** ИИ-агент №1 — маскот «Крафти». */
  chat: (session_id, message, history = []) =>
    call('POST', '/api/mascot/chat', { session_id, message, history: history.slice(-8) }, () => local.mascotReply(message)).then((r) =>
      // если бэкенд вернул только текст — дополним тему локальным классификатором
      r && !r.topic ? { ...local.mascotReply(message), ...r } : r,
    ),

  /** ИИ-агент №2 — архетип, мэтч вакансий, вердикт. */
  recommendation: (session_id, telemetry) =>
    call('POST', '/api/recommendation', { session_id, telemetry }, () => local.buildRecommendation(telemetry)).then((r) =>
      r?.archetype && r?.matches ? r : local.buildRecommendation(telemetry),
    ),

  buyTicket: (session_id, item_id) =>
    call('POST', '/api/raffle/tickets', { session_id, item_id }, () => local.buyTicket({ session_id, item_id })),

  submitCandidate: (payload) => call('POST', '/api/candidates', payload, () => local.submitCandidate(payload)),

  listCandidates: (filters = {}) =>
    call('GET', `/api/candidates${q(filters)}`, undefined, () => local.listCandidates(filters)).then((r) =>
      Array.isArray(r) ? r.map(local.enrichCandidate) : Array.isArray(r?.items) ? r.items.map(local.enrichCandidate) : local.listCandidates(filters),
    ),

  /** candidate (необязательно) — уже загруженный объект: нужен, чтобы офлайн-досье строилось и для кандидатов с бэкенда. */
  dossier: (id, candidate) =>
    call('GET', `/api/candidates/${encodeURIComponent(id)}/dossier`, undefined, () => local.buildDossier(candidate || id)).then((r) =>
      r?.competencies && r?.candidate ? r : local.buildDossier(candidate || id),
    ),

  analytics: () => call('GET', '/api/analytics/summary', undefined, () => local.analytics()),

  exportMirapolis: (id, candidate) =>
    call('POST', `/api/candidates/${encodeURIComponent(id)}/mirapolis`, {}, () => local.mirapolisExport(candidate || id)),

  /** CSV формируем на клиенте из уже загруженного списка — так работает и офлайн. */
  csv: (list) => local.toCSV(list),
}

export { local }
