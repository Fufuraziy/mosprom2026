import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Download, Search, Users, TrendingDown, Percent, Baby, RefreshCw, Database, Wifi, WifiOff, ChevronRight, Sparkles } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { api } from '../../services/api.js'
import { BLOCKS, UNIVERSITIES, TOPIC_LABELS } from '../../data/content.js'
import { Button, Card, cx } from '../../components/ui.jsx'
import Dossier from './Dossier.jsx'
import InviteModal from './InviteModal.jsx'

export function downloadText(name, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Kpi({ icon: I, label, value, sub, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-ink-mute">
        <I className="h-4 w-4" /> {label}
      </div>
      <div className={cx('mt-2 font-display text-3xl font-extrabold leading-none', accent)}>{value}</div>
      {sub && <div className="mt-1.5 text-xs font-semibold text-ink-soft">{sub}</div>}
    </Card>
  )
}

function HBars({ rows, color = '#D50032', format = (v) => v.toLocaleString('ru-RU'), showShare }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label} title={`${r.label}: ${format(r.value)}`}>
          <div className="mb-1 flex justify-between gap-3 text-xs font-bold">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-mono text-ink-soft">
              {format(r.value)}
              {showShare && i > 0 && <span className="ml-1 text-ink-mute">· {Math.round((r.value / rows[0].value) * 100)}%</span>}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-kraft/60">
            <motion.div
              className="h-3 rounded-full"
              style={{ background: r.color || color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HRPanel() {
  const { apiStatus, toast } = useGame()
  const [stats, setStats] = useState(null)
  const [list, setList] = useState([])
  const [filters, setFilters] = useState({ q: '', university: '', block: '', sort: 'created' })
  const [selected, setSelected] = useState(null)
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [a, l] = await Promise.all([api.analytics(), api.listCandidates({})])
    setStats(a)
    setList(l)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const unis = useMemo(() => [...new Set([...list.map((c) => c.university), ...UNIVERSITIES])].sort(), [list])

  const filtered = useMemo(() => {
    let l = [...list]
    if (filters.university) l = l.filter((c) => c.university === filters.university)
    if (filters.block) l = l.filter((c) => c.block === filters.block)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      l = l.filter((c) => [c.fio, c.vacancy, c.university, c.specialty].join(' ').toLowerCase().includes(q))
    }
    if (filters.sort === 'retention') l.sort((a, b) => b.retention_score - a.retention_score)
    else if (filters.sort === 'points') l.sort((a, b) => b.points - a.points)
    else if (filters.sort === 'match') l.sort((a, b) => (b.top_match?.match || 0) - (a.top_match?.match || 0))
    else l.sort((a, b) => (b.is_live ? 1 : 0) - (a.is_live ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at))
    return l
  }, [list, filters])

  const exportCsv = () => {
    downloadText(`ochakovo_candidates_${new Date().toISOString().slice(0, 10)}.csv`, api.csv(filtered))
    toast(`CSV: ${filtered.length} кандидатов`, 'info')
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand">Головной офис · ул. Рябиновая, 44</div>
          <h1 className="mt-1 font-display text-3xl uppercase tracking-tight text-brand sm:text-4xl"><span className="font-light">Панель HR </span><span className="font-extrabold">ОЧАКОВО</span></h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">Аналитика воронки и ИИ-досье по игровой телеметрии. Кандидаты попадают сюда только после анкеты с согласием на обработку данных.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx('flex items-center gap-1.5 rounded-sm border-2 px-2.5 py-1.5 text-xs font-extrabold', apiStatus.online ? 'border-lime bg-lime/10 text-ink' : 'border-malt bg-malt-light/30')}>
            {apiStatus.online ? <Wifi className="h-4 w-4 text-lime" /> : <WifiOff className="h-4 w-4 text-malt-dark" />}
            {apiStatus.online ? `FastAPI онлайн · ${apiStatus.url.replace(/^https?:\/\//, '')}` : 'Автономный режим · встроенный движок'}
          </span>
          <Button variant="light" size="sm" onClick={load}>
            <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} /> Обновить
          </Button>
          <Button size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Скачать CSV
          </Button>
        </div>
      </div>

      {stats && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={Users} label="Кандидатов (анкеты)" value={stats.total_candidates} sub={`из них живых сессий сегодня: ${stats.live_candidates}`} />
            <Kpi icon={Percent} label="Конверсия в анкету" value={`${stats.conversion_to_form}%`} sub={`было ${String(stats.baseline_conversion).replace('.', ',')}% конверсии в найм`} accent="text-brand" />
            <Kpi icon={TrendingDown} label="Отсев на испытательном" value={`${stats.probation_dropout.current}% → ${stats.probation_dropout.forecast}%`} sub="прогноз: честный предпросмотр + наставник + скоринг" accent="text-lime" />
            <Kpi icon={Baby} label="Средний возраст" value={stats.avg_age ? `${String(stats.avg_age).replace('.', ',')} лет` : '—'} sub={`в компании сейчас ${stats.company_avg_age}: омоложение`} />
          </div>

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-extrabold">Воронка сезона</div>
                <span className="rounded bg-kraft px-1.5 py-0.5 font-mono text-[10px] font-bold">демо + живые</span>
              </div>
              <div className="mt-4">
                <HBars rows={stats.funnel.map((f) => ({ label: f.step, value: f.value }))} showShare />
              </div>
            </Card>
            <Card className="p-5">
              <div className="font-display text-lg font-extrabold">Кандидаты по 3 приоритетным блокам</div>
              <div className="mt-1 text-xs text-ink-mute">+ бесплатная практика (IT, дизайн, оцифровка)</div>
              <div className="mt-4">
                <HBars rows={stats.by_block.map((b) => ({ label: b.label, value: b.count, color: b.color }))} />
              </div>
              <div className="mt-5 font-display text-sm font-extrabold">Топ вузов</div>
              <div className="mt-2 space-y-1">
                {stats.by_university.slice(0, 4).map((u) => (
                  <div key={u.university} className="flex justify-between gap-2 text-xs">
                    <span className="truncate font-semibold">{u.university}</span>
                    <span className="font-mono font-bold">{u.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <div className="font-display text-lg font-extrabold">Что волнует кандидатов</div>
              <div className="mt-1 text-xs text-ink-mute">темы вопросов к ИИ-маскоту «Крафти»</div>
              <div className="mt-4">
                <HBars rows={stats.top_topics.map((t) => ({ label: t.label, value: t.count }))} color="#4A4A4A" />
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-sm bg-malt-light/40 p-3 text-xs font-semibold">
                <Sparkles className="h-4 w-4 shrink-0 text-malt-dark" />
                Чаще всего спрашивают про {stats.top_topics[0]?.label.toLowerCase() || 'общежитие'}: вынесите ответ в вакансию и в первое сообщение рекрутера.
              </div>
            </Card>
          </div>
        </>
      )}

      {/* таблица */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-brand bg-kraft-light p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Поиск: ФИО, вакансия, специальность" className="w-full rounded-sm border-2 border-ink/20 bg-paper py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-brand" />
          </div>
          <select value={filters.university} onChange={(e) => setFilters({ ...filters, university: e.target.value })} className="max-w-[240px] rounded-sm border-2 border-ink/20 bg-paper px-3 py-2 text-sm font-semibold">
            <option value="">Все вузы и колледжи</option>
            {unis.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
          <select value={filters.block} onChange={(e) => setFilters({ ...filters, block: e.target.value })} className="rounded-sm border-2 border-ink/20 bg-paper px-3 py-2 text-sm font-semibold">
            <option value="">Все направления</option>
            {Object.entries(BLOCKS).map(([k, b]) => (
              <option key={k} value={k}>
                {b.label}
              </option>
            ))}
          </select>
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="rounded-sm border-2 border-ink/20 bg-paper px-3 py-2 text-sm font-semibold">
            <option value="created">Сначала новые</option>
            <option value="retention">По прогнозу удержания</option>
            <option value="match">По мэтчу вакансии</option>
            <option value="points">По баллам</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-paper text-[11px] font-extrabold uppercase text-ink-mute">
              <tr>
                <th className="px-4 py-3">Кандидат</th>
                <th className="px-3 py-3">Вуз / колледж</th>
                <th className="px-3 py-3">Вакансия</th>
                <th className="px-3 py-3">Направление</th>
                <th className="px-3 py-3 text-right">Баллы</th>
                <th className="px-3 py-3">Удержание</th>
                <th className="px-3 py-3">Вопросы маскоту</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className={cx('cursor-pointer transition hover:bg-brand-50', c.is_live && 'bg-malt-light/25')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-extrabold">
                      {c.fio}
                      {c.is_live && <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-white">новый</span>}
                      {c.vk_user_id && <span className="rounded bg-vk px-1 py-0.5 text-[9px] font-extrabold text-white" title="Анкета заполнена через VK ID">VK</span>}
                    </div>
                    <div className="text-xs text-ink-mute">
                      {c.age} лет · {c.study_level || '—'} · {c.archetype}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-3 py-3 text-xs font-semibold">{c.university}</td>
                  <td className="max-w-[200px] px-3 py-3 text-xs">
                    <div className="font-semibold">{c.vacancy}</div>
                    <div className="text-ink-mute">мэтч {c.top_match?.match}%</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-2 py-0.5 text-[11px] font-bold">
                      <span className="h-2 w-2 rounded-full" style={{ background: BLOCKS[c.block]?.color }} />
                      {c.block_label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold">{c.points}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-kraft">
                        <div className="h-2 rounded-full" style={{ width: `${c.retention_score}%`, background: c.retention_score >= 75 ? '#84BD00' : c.retention_score >= 60 ? '#A2AAAD' : '#D50032' }} />
                      </div>
                      <span className="font-mono text-xs font-bold">{c.retention_score}</span>
                    </div>
                  </td>
                  <td className="max-w-[180px] px-3 py-3 text-[11px] text-ink-soft">
                    {Object.keys(c.telemetry?.asked_topics || {})
                      .filter((k) => c.telemetry.asked_topics[k] > 0)
                      .slice(0, 3)
                      .map((k) => TOPIC_LABELS[k])
                      .join(', ') || '—'}
                  </td>
                  <td className="px-3 py-3 text-ink-mute">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setInvite(c)
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full text-vk transition hover:bg-vk-light"
                        title="Написать кандидату через ВК-бота"
                        aria-label={`Написать ${c.fio} через ВК-бота`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-mute">
                    Никого не нашли по фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t-2 border-ink/10 bg-paper px-4 py-2 text-[11px] text-ink-mute">
          <Database className="h-3.5 w-3.5" /> Показано {filtered.length} из {list.length}. Демо-кандидаты вымышлены; «новый» — анкеты, отправленные из игры.
        </div>
      </Card>

      <AnimatePresence>{selected && <Dossier candidate={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
      {invite && <InviteModal candidate={invite} onClose={() => setInvite(null)} />}
    </div>
  )
}
