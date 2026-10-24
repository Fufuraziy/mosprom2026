// Приведение ответов бэкенда к форме, которую ждут экраны.
// Принимает и «фронтовую» форму (как отдаёт localEngine), и альтернативные имена ключей,
// которые использует FastAPI-бэкенд. Описание — frontend/API_CONTRACT.md, раздел «Ответы на вопросы бэкенда».
import { BLOCKS, ARCHETYPES, TOPIC_LABELS } from '../data/content.js'

// Станции: фронт пишет lab / engineering / line / design; бэкенд может называть их иначе.
export const STATION_ALIASES = { bottling: 'line', rnd: 'design', tech: 'engineering', laboratory: 'lab' }

/** Копия телеметрии, где станции названы так, как ждёт фронт. */
export function normalizeTelemetry(t) {
  if (!t || !t.stations) return t
  const stations = {}
  for (const [k, v] of Object.entries(t.stations)) stations[STATION_ALIASES[k] || k] = v
  return { ...t, stations }
}

// Архетипы: id совпадают с id станций; иконка — имя иконки lucide из content.js (ARCHETYPES[id].icon).
const ARCHETYPE_ALIASES = { bottling: 'line', rnd: 'design' }
const KNOWN_ICONS = new Set(Object.values(ARCHETYPES).map((a) => a.icon))

export function normalizeArchetype(a) {
  if (!a) return a
  const id = ARCHETYPE_ALIASES[a.id] || a.id
  const ref = ARCHETYPES[id]
  return {
    ...a,
    id,
    name: a.name || ref?.name,
    tagline: a.tagline || ref?.tagline,
    // эмодзи или неизвестное имя → иконка из справочника по id
    icon: KNOWN_ICONS.has(a.icon) ? a.icon : ref?.icon || 'FlaskConical',
  }
}

const toArray = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.entries(v).map(([k, n]) => ({ id: k, count: n })) : [])
const num = (...vals) => {
  for (const v of vals) if (typeof v === 'number' && !Number.isNaN(v)) return v
  return undefined
}

/**
 * Аналитика панели HR. Возвращает null, если в ответе нет воронки — тогда api.js возьмёт локальный расчёт.
 */
export function normalizeAnalytics(r) {
  if (!r || typeof r !== 'object') return null
  const funnelSrc = Array.isArray(r.funnel) ? r.funnel : []
  if (!funnelSrc.length) return null

  const funnel = funnelSrc.map((f) => ({
    step: f.step ?? f.label ?? f.title ?? f.id ?? '—',
    value: num(f.value, f.count, f.n) ?? 0,
  }))

  const by_block = toArray(r.by_block ?? r.blocks).map((b) => {
    const key = b.block ?? b.id ?? b.key
    return {
      block: key,
      label: b.label ?? BLOCKS[key]?.label ?? key,
      color: b.color ?? BLOCKS[key]?.color ?? '#A2AAAD',
      count: num(b.count, b.value, b.n) ?? 0,
    }
  })

  const by_university = toArray(r.by_university ?? r.top_universities)
    .map((u) => ({ university: u.university ?? u.name ?? u.title ?? u.id, count: num(u.count, u.value, u.n) ?? 0 }))
    .sort((a, b) => b.count - a.count)

  const top_topics = toArray(r.top_topics ?? r.asked_topics)
    .map((t) => {
      const key = t.topic ?? t.id ?? t.key
      return { topic: key, label: t.label ?? TOPIC_LABELS[key] ?? key, count: num(t.count, t.value, t.n) ?? 0 }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const total = num(r.total_candidates, r.submitted) ?? funnel[funnel.length - 1].value
  let conversion = num(r.conversion_to_form, r.conversion)
  if (conversion === undefined && funnel[0].value) conversion = (funnel[funnel.length - 1].value / funnel[0].value) * 100
  else if (r.conversion_to_form === undefined && conversion !== undefined && conversion <= 1) conversion *= 100 // доля → проценты

  return {
    ...r,
    total_candidates: total,
    live_candidates: num(r.live_candidates, r.submitted_today) ?? 0,
    funnel,
    conversion_to_form: +(conversion ?? 0).toFixed(1),
    baseline_conversion: num(r.baseline_conversion) ?? 0.02,
    probation_dropout: { current: r.probation_dropout?.current ?? 38, forecast: r.probation_dropout?.forecast ?? 9 },
    avg_age: num(r.avg_age) ?? null,
    company_avg_age: num(r.company_avg_age) ?? 52,
    by_block,
    by_university,
    top_topics,
    merch: r.merch,
    source: 'remote',
  }
}
