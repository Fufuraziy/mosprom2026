// Локальный движок: та же логика и те же структуры данных, что отдаёт FastAPI-бэкенд.
// Используется api.js, когда http://localhost:8000 недоступен (демо офлайн, GitHub Pages и т. п.).
import {
  VACANCIES,
  ARCHETYPES,
  MENTORS,
  BLOCKS,
  TOPIC_LABELS,
  FIRST_DAY,
} from '../data/content.js'
import { SEED_CANDIDATES } from '../data/seedCandidates.js'

const LS_CANDIDATES = 'ochakovo1978_candidates_v1'
const LS_EVENTS = 'ochakovo1978_events_v1'
const LS_TICKETS = 'ochakovo1978_tickets_v1'

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))
const round = (v) => (v == null ? null : Math.round(v))

function lsGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function lsSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}

export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export function ageFrom(birthDate, now = new Date()) {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return null
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

/* ---------------------------------------------------------------- компетенции */

export function computeCompetencies(t = {}) {
  const st = t.stations || {}
  const quiz = t.quiz || { correct: 0, total: 0 }
  const quizAcc = quiz.total ? quiz.correct / quiz.total : null

  let safety = null
  if (t.ppe_attempts) {
    safety = clamp(100 - (t.ppe_attempts - 1) * 22 - (t.ppe_wrong_picks?.length || 0) * 4, 20, 100)
  }

  let lab = null
  if (st.lab) {
    lab = 0.55 * (st.lab.titration_accuracy ?? 50) + 0.45 * (((st.lab.brix_correct ?? 2) / (st.lab.brix_total || 4)) * 100)
  }

  let speed = null
  if (st.line) {
    const c = st.line.defects_caught ?? 0
    const m = st.line.defects_missed ?? 0
    const ratio = c + m ? c / (c + m) : 0.6
    speed = clamp(ratio * 100 - (st.line.false_rejects ?? 0) * 6 + ((st.line.ttn_correct ?? 0) / 3) * 8, 10, 100)
  }

  let systems = null
  if (st.engineering) {
    const e = st.engineering
    const ms = e.mea_reaction_ms
    const mea = ms == null ? 20 : ms <= 1500 ? 100 : clamp(100 - ((ms - 1500) / 4500) * 60, 40, 100)
    systems = 0.5 * (e.pressure_stability ?? 50) + 0.25 * mea + 0.25 * (((e.inspections_correct ?? 1) / (e.inspections_total || 3)) * 100)
  }

  let lms = null
  if (st.design) {
    lms = 0.65 * (((st.design.mirapolis_correct ?? 2) / (st.design.mirapolis_total || 4)) * 100) + 0.35 * ((quizAcc ?? 0.6) * 100)
  } else if (quizAcc != null) {
    lms = quizAcc * 80
  }

  return {
    safety: round(safety),
    lab: round(lab),
    speed: round(speed),
    systems: round(systems),
    lms: round(lms),
  }
}

export const COMPETENCY_META = [
  { key: 'safety', label: 'Индекс ТБ и дисциплины (СИЗ)', source: 'Раздевалка: выбор СИЗ с первой попытки' },
  { key: 'lab', label: 'Лабораторная точность (ATAGO)', source: 'Титрование + рефрактометр ATAGO RX-7000i' },
  { key: 'speed', label: 'Скорость и стрессоустойчивость (SMI SK 500 P)', source: 'Отбраковка тары на линии + ТТН' },
  { key: 'systems', label: 'Системное мышление (мнемосхема МЭА/абсорбер)', source: 'Стабилизация давления, реакция на аварию, обход' },
  { key: 'lms', label: 'Готовность к СДО Mirapolis (SMART/SWOT)', source: 'Тест Mirapolis + исторические квизы' },
]

function avgKnown(comp) {
  const vals = Object.values(comp).filter((v) => v != null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 55
}

export function archetypeFor(comp) {
  const map = { lab: 'lab', systems: 'engineering', speed: 'line', lms: 'design' }
  let best = 'line'
  let bestV = -1
  for (const [k, a] of Object.entries(map)) {
    const v = comp[k]
    if (v != null && v > bestV) {
      bestV = v
      best = a
    }
  }
  return { id: best, ...ARCHETYPES[best] }
}

export function vacancyMatches(comp) {
  return VACANCIES.map((v) => {
    let s = 0
    for (const [k, w] of Object.entries(v.w)) s += w * (comp[k] ?? 50)
    const match = Math.round(clamp(52 + (s - 50) * 0.95, 38, 98))
    return { id: v.id, title: v.title, dept: v.dept, salary: v.salary, block: v.block, match }
  }).sort((a, b) => b.match - a.match)
}

function shiftReadiness(t) {
  const calc = t.calculator || {}
  if (!calc.interactions) return { level: 'unknown', label: 'График 2/2 не изучал' }
  if (calc.night_ok) return { level: 'full', label: 'Готов к 2/2 с ночными сменами' }
  return { level: 'day', label: 'Рассматривает только дневные смены' }
}

export function retentionScore(t = {}, form = {}) {
  const comp = computeCompetencies(t)
  const why = (t.why_ochakovo_cards_viewed || []).length
  const calc = t.calculator || {}
  const topics = Object.keys(t.asked_topics || {}).length
  const stationsDone = Object.keys(t.stations || {}).length
  let r = 33 + 0.3 * avgKnown(comp) + 2.4 * Math.min(why, 5) + (calc.interactions ? 6 : 0) + (calc.night_ok ? 6 : 0)
  r += Math.min(topics, 4) * 1.5 + stationsDone * 1.5
  const rd = form.readiness || ''
  if (/сразу|2 недели|сезона/i.test(rd)) r += 6
  if (/присматриваюсь/i.test(rd)) r -= 7
  if ((t.skipped || []).length) r -= 3 * t.skipped.length
  return Math.round(clamp(r, 25, 97))
}

/* --------------------------------------------------------------- рекомендация */

export function buildRecommendation(telemetry = {}) {
  const comp = computeCompetencies(telemetry)
  const archetype = archetypeFor(comp)
  const matches = vacancyMatches(comp)
  const retention = retentionScore(telemetry)
  const top = matches[0]
  const strengths = []
  const growth = []
  for (const m of [
    ['safety', 'дисциплина и ТБ', 'внимательнее к требованиям охраны труда'],
    ['lab', 'лабораторная точность', 'точность измерений'],
    ['speed', 'скорость реакции на линии', 'реакция на брак в потоке'],
    ['systems', 'системное мышление', 'чтение мнемосхем и последовательность действий'],
    ['lms', 'управленческие инструменты', 'SMART/SWOT и методы анализа'],
  ]) {
    const v = comp[m[0]]
    if (v == null) continue
    if (v >= 75) strengths.push(m[1])
    else if (v < 55) growth.push(m[2])
  }
  return {
    archetype,
    competencies: comp,
    matches: matches.slice(0, 4),
    retention_score: retention,
    strengths,
    growth,
    verdict:
      `${archetype.name}. ${archetype.tagline} ` +
      `Лучшее совпадение: «${top.title}» (${top.match}%). ` +
      (strengths.length ? `Сильные стороны: ${strengths.join(', ')}. ` : '') +
      (growth.length ? `Наставник поможет подтянуть: ${growth.join(', ')}.` : 'Можно выходить на смену с наставником хоть завтра.'),
    source: 'local',
  }
}

/* ---------------------------------------------------------------- кандидаты */

function blockForVacancy(title, comp) {
  const v = VACANCIES.find((x) => x.title === title)
  if (v) return v.block
  const a = archetypeFor(comp).id
  return { lab: 'profile', engineering: 'engineering', line: 'line', design: 'free' }[a]
}

export function enrichCandidate(c) {
  const comp = computeCompetencies(c.telemetry)
  const archetype = archetypeFor(comp)
  const matches = vacancyMatches(comp)
  const block = c.block || blockForVacancy(c.vacancy, comp)
  return {
    ...c,
    age: ageFrom(c.birth_date),
    block,
    block_label: BLOCKS[block]?.label,
    competencies: comp,
    archetype: archetype.name,
    archetype_id: archetype.id,
    top_match: matches[0],
    retention_score: retentionScore(c.telemetry, c),
    shift: shiftReadiness(c.telemetry || {}),
  }
}

export function allCandidates() {
  const own = lsGet(LS_CANDIDATES, [])
  return [...own, ...SEED_CANDIDATES].map(enrichCandidate)
}

export function listCandidates(filters = {}) {
  let list = allCandidates()
  if (filters.university) list = list.filter((c) => c.university === filters.university)
  if (filters.block) list = list.filter((c) => c.block === filters.block)
  if (filters.q) {
    const q = filters.q.toLowerCase()
    list = list.filter((c) => [c.fio, c.vacancy, c.university].join(' ').toLowerCase().includes(q))
  }
  const sort = filters.sort || 'created'
  if (sort === 'retention') list.sort((a, b) => b.retention_score - a.retention_score)
  else if (sort === 'points') list.sort((a, b) => b.points - a.points)
  else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return list
}

export function validateCandidate(form) {
  const errors = {}
  if (!form.fio || form.fio.trim().split(/\s+/).length < 2) errors.fio = 'Укажи фамилию и имя (можно с отчеством)'
  const hasContact = [form.phone, form.telegram, form.email].some((v) => v && v.trim())
  if (!hasContact) errors.contact = 'Нужен хотя бы один контакт: телефон, Telegram или email'
  if (form.phone && form.phone.replace(/\D/g, '').length < 10) errors.phone = 'Проверь номер телефона'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Проверь email'
  const age = ageFrom(form.birth_date)
  if (age == null) errors.birth_date = 'Укажи дату рождения'
  else if (age < 18) errors.birth_date = 'В «Очаково» принимают на работу и практику строго с 18 лет'
  else if (age > 80) errors.birth_date = 'Проверь год рождения'
  if (!form.vacancy) errors.vacancy = 'Выбери вакансию'
  if (!form.readiness) errors.readiness = 'Когда готов(а) выйти?'
  if (!form.university || form.university.trim().length < 2) errors.university = 'Укажи вуз или колледж'
  if (!form.consent) errors.consent = 'Нужно согласие на обработку персональных данных'
  return errors
}

export function submitCandidate({ form, telemetry, points, session_id }) {
  const errors = validateCandidate(form)
  if (Object.keys(errors).length) {
    const err = new Error('validation')
    err.status = 422
    err.errors = errors
    throw err
  }
  const candidate = {
    id: uid('cand'),
    session_id,
    fio: form.fio.trim(),
    phone: form.phone?.trim() || '',
    telegram: form.telegram?.trim() || '',
    email: form.email?.trim() || '',
    birth_date: form.birth_date,
    vacancy: form.vacancy,
    readiness: form.readiness,
    university: form.university.trim(),
    study_level: form.study_level || '',
    specialty: form.specialty || '',
    points: points || 0,
    telemetry: telemetry || {},
    created_at: new Date().toISOString(),
    is_live: true,
  }
  const own = lsGet(LS_CANDIDATES, [])
  lsSet(LS_CANDIDATES, [candidate, ...own.filter((c) => c.session_id !== session_id || !session_id)])
  return enrichCandidate(candidate)
}

/* --------------------------------------------------------------------- досье */

const TOPIC_TIPS = {
  dorm: 'Общежитие: Рябиновая, 36к2, 3 400 ₽ для студентов, 4–6 человек в комнате, вход до 23:00, фен взять с собой.',
  salary: 'Зарплата: выплаты 12 и 27 числа, ночные по повышенному коэффициенту, суммы в вакансии до НДФЛ.',
  session: 'Сессия: смены не ставят на даты экзаменов, в сезон можно сдавать экзамены на территории завода.',
  military: 'Военкомат: заявление в отдел кадров + оригинал повестки, согласовать с руководителем.',
  schedule: 'График: 2/2 по 12 часов, день — ночь — отсыпной — выходной. Покажите реальную неделю.',
  contract: 'Договор: срочный трудовой по ТК РФ, без испытательного срока, электронная трудовая.',
  food: 'Питание: 50% компенсирует компания, расчёт по карте сотрудника.',
  transport: 'Дорога: корпоративный автобус от м. Озёрная, автобусы от Кунцевской и Говорово.',
  uniform: 'Спецодежда выдаётся, прачечная в будни 8:30–16:30.',
  mentor: 'Наставник с первого дня + курсы в СДО Mirapolis.',
  health: 'Здравпункт круглосуточно (доб. 1370), больничный обязателен.',
  pass: 'Пропуск: выдаёт отдел кадров, потеря = штраф 500 ₽.',
  practice_docs: 'Документы практики: договор с вузом, приказ, дневник, характеристика (Учебный центр, каб. 525).',
  brands: 'Интересуется продуктом: расскажите про ЛЭП и запуск новых вкусов.',
  history: 'Интересуется историей: пригласите на экскурсию в музей.',
  vacancies: 'Сомневается в выборе вакансии: предложите 2–3 варианта по мэтчу.',
}

const MIRAPOLIS_COURSES = {
  profile: ['Охрана труда и пожарная безопасность (вводный)', 'Органолептический анализ напитков', 'Рефрактометрия и контроль Brix', 'Инструменты менеджмента'],
  engineering: ['Охрана труда и пожарная безопасность (вводный)', 'Мнемосхемы и КИПиА', 'Установка получения CO₂: абсорбер и МЭА', 'Инструменты менеджмента'],
  line: ['Охрана труда и пожарная безопасность (вводный)', 'HMI линии розлива SMI', 'Отбраковка тары и паллетирование', 'Оформление ТТН'],
  free: ['Охрана труда и пожарная безопасность (вводный)', 'Брендбук «Очаково» для дизайнера', 'Оцифровка производственной линии', 'Инструменты менеджмента'],
}

export function buildDossier(candidateOrId) {
  const c =
    typeof candidateOrId === 'string'
      ? allCandidates().find((x) => x.id === candidateOrId)
      : enrichCandidate(candidateOrId)
  if (!c) {
    const err = new Error('not found')
    err.status = 404
    throw err
  }
  const t = c.telemetry || {}
  const topics = Object.entries(t.asked_topics || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ topic: k, label: TOPIC_LABELS[k] || k, count: n, tip: TOPIC_TIPS[k] || '' }))
  const mentor = MENTORS[c.block] || MENTORS.line
  const comp = c.competencies
  const risks = []
  if (c.shift.level === 'unknown') risks.push('Не изучал график 2/2: обсудите ночные смены до выхода')
  if (c.shift.level === 'day') risks.push('Хочет только дневные смены: предложите лабораторию или склад 2/2 день')
  if (topics.some((x) => x.topic === 'dorm')) risks.push('Иногородний: важно заселение в общежитие в первый день')
  if (topics.some((x) => x.topic === 'military')) risks.push('Вопрос военкомата: проговорите порядок отпуска на медкомиссию')
  if (comp.safety != null && comp.safety < 60) risks.push('Ошибки в выборе СИЗ: усиленный инструктаж по ТБ')
  if ((t.skipped || []).length) risks.push(`Мини-игры пропущены в демо-режиме: ${t.skipped.length}`)
  if (/присматриваюсь/i.test(c.readiness || '')) risks.push('Пока присматривается: нужен прогрев (экскурсия, мерч)')

  const probationRisk = Math.round(clamp(100 - c.retention_score, 3, 70) * 0.55)
  const matches = vacancyMatches(comp)
  const archetype = archetypeFor(comp)

  return {
    candidate: c,
    competencies: COMPETENCY_META.map((m) => ({ ...m, value: comp[m.key] })),
    retention_score: c.retention_score,
    probation_dropout_risk: probationRisk,
    shift_readiness: c.shift,
    asked_topics: topics,
    mentor: { ...mentor, block: c.block, bridge: `${c.age ?? '20+'} + ${mentor.age} лет` },
    matches: matches.slice(0, 3),
    archetype,
    risks,
    why_cards: t.why_ochakovo_cards_viewed || [],
    calculator: t.calculator || null,
    mirapolis_courses: MIRAPOLIS_COURSES[c.block] || MIRAPOLIS_COURSES.line,
    summary:
      `${c.fio.split(' ').slice(0, 2).join(' ')}, ${c.age ?? '—'} лет, ${c.university}. Архетип: ${archetype.name}. ` +
      `Лучший мэтч: «${matches[0].title}» ${matches[0].match}%. Прогноз удержания ${c.retention_score}/100, ` +
      `риск ухода на испытательном/практике ≈ ${probationRisk}%. ` +
      (topics.length ? `Волнует: ${topics.slice(0, 3).map((x) => x.label.toLowerCase()).join(', ')}.` : 'Вопросов маскоту не задавал.'),
    source: 'local',
  }
}

/* ----------------------------------------------------------------- аналитика */

// Демо-воронка за сезон (до появления реальной статистики после пилота)
const DEMO_FUNNEL = { visitors: 1840, started: 1236, ppe: 1012, all_stations: 584, capsule: 512, forms: 118 }

export function analytics() {
  const list = allCandidates()
  const live = list.filter((c) => c.is_live).length
  const byBlock = Object.keys(BLOCKS).map((k) => ({
    block: k,
    label: BLOCKS[k].label,
    color: BLOCKS[k].color,
    count: list.filter((c) => c.block === k).length,
  }))
  const byUni = {}
  for (const c of list) byUni[c.university] = (byUni[c.university] || 0) + 1
  const topics = {}
  for (const c of list) for (const [k, n] of Object.entries(c.telemetry?.asked_topics || {})) topics[k] = (topics[k] || 0) + n
  const funnel = [
    { step: 'Открыли игру (QR/ВК)', value: DEMO_FUNNEL.visitors + live },
    { step: 'Начали квест', value: DEMO_FUNNEL.started + live },
    { step: 'Прошли ТБ', value: DEMO_FUNNEL.ppe + live },
    { step: 'Прошли 4 станции', value: DEMO_FUNNEL.all_stations + live },
    { step: 'Открыли капсулу', value: DEMO_FUNNEL.capsule + live },
    { step: 'Отправили анкету', value: DEMO_FUNNEL.forms + list.length },
  ]
  const avgRet = Math.round(list.reduce((a, c) => a + c.retention_score, 0) / (list.length || 1))
  return {
    total_candidates: list.length,
    live_candidates: live,
    funnel,
    conversion_to_form: +((funnel[5].value / funnel[0].value) * 100).toFixed(1),
    baseline_conversion: 0.02,
    probation_dropout: { current: 38, forecast: 9 },
    avg_retention: avgRet,
    avg_age: Math.round((list.reduce((a, c) => a + (c.age || 0), 0) / (list.length || 1)) * 10) / 10,
    company_avg_age: 52,
    by_block: byBlock,
    by_university: Object.entries(byUni)
      .map(([university, count]) => ({ university, count }))
      .sort((a, b) => b.count - a.count),
    top_topics: Object.entries(topics)
      .map(([k, n]) => ({ topic: k, label: TOPIC_LABELS[k] || k, count: n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    source: 'local',
  }
}

/* ----------------------------------------------------------------------- CSV */

export function toCSV(list) {
  const cols = [
    ['id', (c) => c.id],
    ['ФИО', (c) => c.fio],
    ['Дата рождения', (c) => c.birth_date],
    ['Возраст', (c) => c.age],
    ['Телефон', (c) => c.phone],
    ['Telegram', (c) => c.telegram],
    ['Email', (c) => c.email],
    ['Вуз/колледж', (c) => c.university],
    ['Курс', (c) => c.study_level],
    ['Вакансия', (c) => c.vacancy],
    ['Блок', (c) => c.block_label],
    ['Готовность', (c) => c.readiness],
    ['Баллы', (c) => c.points],
    ['Retention', (c) => c.retention_score],
    ['ТБ', (c) => c.competencies?.safety],
    ['Лаб. точность', (c) => c.competencies?.lab],
    ['Скорость', (c) => c.competencies?.speed],
    ['Системность', (c) => c.competencies?.systems],
    ['СДО', (c) => c.competencies?.lms],
    ['Архетип', (c) => c.archetype],
    ['Лучший мэтч', (c) => (c.top_match ? `${c.top_match.title} ${c.top_match.match}%` : '')],
    ['Темы вопросов', (c) => Object.keys(c.telemetry?.asked_topics || {}).map((k) => TOPIC_LABELS[k] || k).join(', ')],
    ['Создан', (c) => c.created_at],
  ]
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = [cols.map((c) => c[0]).join(';'), ...list.map((c) => cols.map(([, f]) => esc(f(c))).join(';'))]
  return '﻿' + rows.join('\n')
}

/* ------------------------------------------------------------ телеметрия, мерч */

export function logEvent(evt) {
  const events = lsGet(LS_EVENTS, [])
  events.push({ ...evt, ts: new Date().toISOString() })
  lsSet(LS_EVENTS, events.slice(-500))
  return { ok: true, stored: 'local' }
}

export function buyTicket({ session_id, item_id }) {
  const all = lsGet(LS_TICKETS, {})
  const mine = all[session_id] || {}
  mine[item_id] = (mine[item_id] || 0) + 1
  all[session_id] = mine
  lsSet(LS_TICKETS, all)
  return { ok: true, tickets: mine, ticket_no: `OCH-${Math.floor(100000 + Math.random() * 899999)}` }
}

export function mirapolisExport(candidateOrId) {
  const d = buildDossier(candidateOrId)
  return {
    status: 'queued',
    candidate_id: d.candidate.id,
    courses: d.mirapolis_courses,
    message: `Профиль передан в СДО Mirapolis: назначено ${d.mirapolis_courses.length} курса, наставник ${d.mentor.name}.`,
    source: 'local',
  }
}

/* ------------------------------------------------------------ маскот «Крафти» */

const FAQ = [
  {
    topic: 'dorm',
    re: /общаг|общежит|жиль|жить|комнат|засел|фен|комендант|утюг|бель[её]|душ|кухн/i,
    a: 'Общежитие на ул. Рябиновой, 36к2, в паре минут от главного офиса (Рябиновая, 44). Для студентов 3 400 ₽ за койко-место, половину компенсирует завод. В комнате 4–6 человек, на этаже кухня с плитами, холодильниками и микроволновкой. Есть всё, кроме фена, так что его бери с собой! Заселение до 14:00 или после 16:00, вход закрыт с 23:00 до 6:00.',
  },
  {
    topic: 'salary',
    re: /зарплат|з\/п|деньг|оплат|сколько.*(плат|получ)|аванс|доход|руб|₽|выплат|прем/i,
    a: 'На оплачиваемой практике: лаборатория от 60 000 ₽, цех розлива и технологический цех от 70 000 ₽, склад 56 000–60 000 ₽ (суммы до вычета НДФЛ). Ночные смены оплачиваются по повышенному коэффициенту, переработка отдельно. Выплаты дважды в месяц: 12 и 27 числа, расчётный лист приходит на почту. Хочешь посчитать свой доход? В финале квеста есть калькулятор!',
  },
  {
    topic: 'session',
    re: /сесси|экзамен|зач[её]т|учеб|учёб|пар[ыа]|диплом|универ|колледж/i,
    a: 'Учёба не мешает! Заранее скажи руководителю дату зачёта или экзамена, и на это время тебе не поставят смену. А в высокий сезон (март–сентябрь) экзамены можно сдавать прямо на территории предприятия. Если нужно уехать надолго, согласуй с руководителем за 2 недели.',
  },
  {
    topic: 'military',
    re: /военкомат|повестк|арми|медкомисс|призыв|отсрочк/i,
    a: 'Если вызывают на медкомиссию в военкомат: напиши заявление в отделе кадров и согласуй его с непосредственным руководителем. Обязательно возьми оригинал повестки. Отдел кадров: 8 800 100 77 77, доб. 1234.',
  },
  {
    topic: 'schedule',
    re: /график|смен|ноч|2\/2|выходн|отсыпн|сколько час|12 час/i,
    a: 'График сменный 2/2: смены с 8:00 до 20:00 или с 20:00 до 8:00 (день — ночь — отсыпной — выходной). В лаборатории и на складе бывают только дневные 2/2. Ночные оплачиваются дороже. График составляет руководитель, поменяться сменой можно в исключительных случаях по согласованию.',
  },
  {
    topic: 'contract',
    re: /испытат|договор|трудов|оформ|официальн|тк рф|уволь|увольн/i,
    a: 'Для студентов нет испытательного срока: вместо него производственная практика. С тобой заключают срочный трудовой договор по ТК РФ, трудовая книжка электронная. Потом можно перейти на постоянную работу.',
  },
  {
    topic: 'food',
    re: /еда|ед[уы]|столов|обед|ужин|питан|кормят|поесть/i,
    a: 'В заводской столовой обед в будни с 11:30 до 14:30, ужин каждый день с 20:30 до 22:00. Половину стоимости оплачивает компания, а наличные не нужны: всё списывается с карты сотрудника и вычитается из зарплаты в конце месяца.',
  },
  {
    topic: 'transport',
    re: /добрат|доехат|автобус|метро|адрес|где наход|как доех|маршрут|озёрн|озерн|кунцев|говоро/i,
    a: 'Главный офис: Москва, ул. Рябиновая, 44. Корпоративный автобус ходит от м. Озёрная. Ещё варианты: автобусы 275 и 610 от м. Кунцевская, 259, 275 и 221 от м. Говорово, 259 от ст. Рабочий посёлок.',
  },
  {
    topic: 'uniform',
    re: /форм[ау]|спецодеж|одежд|обув|ботин|стирк|прачеч|беруш|перчат/i,
    a: 'Спецодежду и обувь выдают бесплатно. Правило простое: закрытая фиксирующаяся обувь, никаких свисающих рукавов и развевающихся элементов, при необходимости перчатки, очки и беруши. Стирать можно в прачечной завода (будни 8:30–16:30), забираешь через 1–2 дня.',
  },
  {
    topic: 'mentor',
    re: /наставн|обуч|научат|mirapolis|мираполис|курс|не умею|опыт/i,
    a: 'К каждому новичку прикрепляют наставника: это опытные сотрудники, прошедшие обучение в Учебном центре (каб. 525). Теорию закрепляешь в мобильном СДО Mirapolis прямо с телефона. Вопросы по работе к наставнику, по быту к коменданту.',
  },
  {
    topic: 'health',
    re: /боле|заболел|больнич|здравпункт|врач|поликлин|плохо/i,
    a: 'Если стало плохо в смену, сообщи руководителю и иди в здравпункт: он работает круглосуточно, доб. 1370 или 1303. С паспортом и полисом можно в поликлинику на Большой Очаковской, 38. Пропуск по болезни подтверждается больничным листом.',
  },
  {
    topic: 'pass',
    re: /пропуск|проходн|охран/i,
    a: 'На территории пропускная система. Пропуск выдаёт отдел кадров. Если потерял, нужно получить новый и оплатить штраф 500 ₽, так что береги его!',
  },
  {
    topic: 'practice_docs',
    re: /практик|дневник|характеристик|отч[её]т|приказ|документ/i,
    a: 'Для практики нужны договор от вуза/колледжа, приказ от «Очаково», дневник или отчёт и характеристика от компании. Документы готовишь сам, распечатываешь и приносишь в Учебный центр (каб. 525). Характеристику выдают после практики.',
  },
  {
    topic: 'brands',
    re: /квас|бренд|напит|coolcola|кулкол|kern|керн|мохито|лимонтел|limontel|продукц|вкус|лэп/i,
    a: 'Самый известный бренд «Очаково» — квас «Очаковский» (с 1998 года, лидер рынка натурального кваса). Ещё CoolCola, KERN No Alco, Limontel, лимонады «Очаковский»: Ситро-апельсин, Тархун-мята, Таёжная кола. Новые вкусы сначала варят в ЛЭП, Лаборатории экспериментального пивоварения.',
  },
  {
    topic: 'history',
    re: /истори|1978|олимпиад|основ|музей|перв(ые|ый) в мире|пэт|банк/i,
    a: 'Комбинат запустили в 1978 году к Олимпиаде-80: он был задуман как самое мощное отраслевое предприятие Европы и СССР. В 1994-м «Очаково» первым в мире начало розлив пива в ПЭТ, в 1995-м выпустило первое российское пиво в алюминиевой банке, а в 1996-м первым воспроизвело двойное брожение кваса в промышленных масштабах. У компании есть свой музей!',
  },
  {
    topic: 'vacancies',
    re: /ваканс|кем|профес|работ[аы]|долж|куда бер|стажир|лаборант|оператор|склад|инженер|технолог/i,
    a: 'На оплачиваемую практику берут в 4 подразделения: лаборатория (лаборанты), цех розлива (операторы линий), технологический цех (операторы варки, работа с сырьём) и склад (операторы и кладовщики). Ещё есть бесплатная практика: дизайн, IT, оцифровка линии, оптимизация производства. Пройди станции квеста, и ИИ подберёт вакансию под тебя!',
  },
]

export function mascotReply(message = '') {
  const text = message.trim()
  const hit = FAQ.find((f) => f.re.test(text))
  if (hit) {
    return {
      reply: hit.a,
      topic: hit.topic,
      topic_label: TOPIC_LABELS[hit.topic],
      suggestions: suggestionsAfter(hit.topic),
      source: 'local',
    }
  }
  if (/привет|здравств|хай|добр(ый|ое)/i.test(text)) {
    return {
      reply: 'Привет! Я Крафти, медведь-наставник «Очаково». Спрашивай про практику, зарплату, общежитие, сессию, военкомат или график 2/2, отвечу честно и по делу.',
      topic: 'other',
      topic_label: TOPIC_LABELS.other,
      suggestions: ['Сколько платят?', 'Как с общежитием?', 'А если сессия?'],
      source: 'local',
    }
  }
  return {
    reply: `Хороший вопрос! Точного ответа у меня нет, но его знают в отделе подбора: ${FIRST_DAY.contacts[0].phone}, ${FIRST_DAY.contacts[0].ext}. А пока могу рассказать про зарплату, общежитие, сессию, военкомат, график или наставников.`,
    topic: 'other',
    topic_label: TOPIC_LABELS.other,
    suggestions: ['Сколько платят?', 'Есть испытательный срок?', 'Что с военкоматом?'],
    source: 'local',
  }
}

function suggestionsAfter(topic) {
  const s = {
    dorm: ['Как добраться до офиса?', 'Чем кормят?', 'Сколько платят?'],
    salary: ['Какой график?', 'Есть испытательный срок?', 'Как с общежитием?'],
    session: ['Что с военкоматом?', 'Какой график?', 'Кто будет учить?'],
    military: ['А если сессия?', 'Что если заболею?', 'Сколько платят?'],
    schedule: ['Сколько платят за ночь?', 'Как с общежитием?', 'А если сессия?'],
  }
  return s[topic] || ['Сколько платят?', 'Как с общежитием?', 'А если сессия?']
}
