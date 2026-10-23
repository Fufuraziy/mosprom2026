import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Bus, CheckSquare, Square, Phone, Coffee, Building2, BedDouble } from 'lucide-react'
import { FIRST_DAY } from '../../data/content.js'
import { Card, SectionTitle, Sticker, cx } from '../../components/ui.jsx'

const LS = 'ochakovo1978_checklist_v1'

// Схема (не масштаб): станции и автобусы до ул. Рябиновой.
const NODES = {
  office: { x: 470, y: 190, label: 'Офис · Рябиновая, 44' },
  dorm: { x: 540, y: 120, label: 'Общежитие · 36к2' },
  'м. Озёрная': { x: 250, y: 60 },
  'м. Кунцевская': { x: 90, y: 170 },
  'м. Говорово': { x: 200, y: 300 },
  'ст. Рабочий посёлок': { x: 420, y: 320 },
}

function RouteMap({ active, setActive }) {
  return (
    <svg viewBox="0 0 640 370" className="w-full">
      <rect x="0" y="0" width="640" height="370" rx="18" fill="#F4F5F6" />
      <path d="M0 250 C 160 220, 260 270, 640 230" stroke="#CFE8FF" strokeWidth="18" fill="none" opacity=".8" />
      {[...Array(9)].map((_, i) => (
        <path key={i} d={`M${i * 80} 0 V370`} stroke="#4A4A4A" strokeOpacity=".05" />
      ))}
      {FIRST_DAY.routes.map((r) => {
        const a = NODES[r.from]
        const b = NODES.office
        const on = active === r.from
        return (
          <g key={r.from} onClick={() => setActive(r.from)} style={{ cursor: 'pointer' }}>
            <path d={`M${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 30} ${b.x} ${b.y}`} stroke={on ? '#D50032' : '#4A4A4A'} strokeOpacity={on ? 1 : 0.25} strokeWidth={on ? 6 : 3} strokeDasharray={on ? '0' : '8 8'} fill="none" />
            <circle cx={a.x} cy={a.y} r={on ? 14 : 11} fill={on ? '#D50032' : '#fff'} stroke="#4A4A4A" strokeWidth="3" />
            <text x={a.x} y={a.y + (a.y > 250 ? 32 : -20)} textAnchor="middle" fontSize="14" fontWeight="800" fill="#4A4A4A" fontFamily="Montserrat, Arial">
              {r.from}
            </text>
          </g>
        )
      })}
      <path d={`M${NODES.office.x} ${NODES.office.y} L${NODES.dorm.x} ${NODES.dorm.y}`} stroke="#A2AAAD" strokeWidth="5" strokeDasharray="2 8" strokeLinecap="round" />
      {['office', 'dorm'].map((k) => (
        <g key={k}>
          <rect x={NODES[k].x - 16} y={NODES[k].y - 16} width="32" height="32" rx="6" fill={k === 'office' ? '#D50032' : '#A2AAAD'} stroke="#4A4A4A" strokeWidth="3" />
          <text x={NODES[k].x + (k === 'office' ? 0 : -6)} y={NODES[k].y + 38} textAnchor={k === 'office' ? 'middle' : 'end'} fontSize="13" fontWeight="900" fill="#4A4A4A" fontFamily="Montserrat, Arial">
            {NODES[k].label}
          </text>
        </g>
      ))}
      <text x="620" y="356" textAnchor="end" fontSize="11" fill="#8A8F92" fontFamily="JetBrains Mono, monospace">схема, не в масштабе</text>
    </svg>
  )
}

export default function FirstDayGuide() {
  const [tab, setTab] = useState('route')
  const [active, setActive] = useState('м. Озёрная')
  const [done, setDone] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(LS) || '{}')
    } catch {
      return {}
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(LS, JSON.stringify(done))
    } catch {
      /* ignore */
    }
  }, [done])
  const route = FIRST_DAY.routes.find((r) => r.from === active)
  const doneCount = FIRST_DAY.checklist.filter((c) => done[c.id]).length
  const TABS = [
    ['route', 'Маршрут', Bus],
    ['check', `Чек-лист ${doneCount}/${FIRST_DAY.checklist.length}`, CheckSquare],
    ['contacts', 'Контакты', Phone],
    ['life', 'Быт', Coffee],
  ]

  return (
    <section>
      <SectionTitle kicker="Интерактивный справочник первого дня" title="Твой первый день в ОЧАКОВО" sub="Всё из справочника студента: как доехать, что взять и куда звонить." />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {TABS.map(([id, label, I]) => (
          <button key={id} onClick={() => setTab(id)} className={cx('flex shrink-0 items-center gap-2 rounded-sm border border-line px-4 py-2 text-sm font-extrabold', tab === id ? 'bg-graphite text-white shadow-pop' : 'bg-white')}>
            <I className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'route' && (
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card className="overflow-hidden p-2">
            <RouteMap active={active} setActive={setActive} />
          </Card>
          <div className="space-y-3">
            {FIRST_DAY.addresses.map((a, i) => (
              <div key={a.label} className="flex items-center gap-3 rounded-sm border border-line bg-white p-3">
                <span className={cx('grid h-10 w-10 place-items-center rounded-sm border border-line text-white', i ? 'bg-malt' : 'bg-brand')}>{i ? <BedDouble className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}</span>
                <div>
                  <div className="text-xs font-bold uppercase text-ink-mute">{a.label}</div>
                  <div className="font-extrabold">{a.addr}</div>
                </div>
              </div>
            ))}
            {FIRST_DAY.routes.map((r) => (
              <button key={r.from} onClick={() => setActive(r.from)} className={cx('flex w-full items-center gap-3 rounded-sm border-2 p-3 text-left', active === r.from ? 'border-brand bg-brand-50' : 'border-ink/15 bg-white')}>
                <MapPin className={cx('h-5 w-5 shrink-0', active === r.from ? 'text-brand' : 'text-ink-mute')} />
                <div className="flex-1">
                  <div className="text-sm font-extrabold">{r.from}</div>
                  <div className="text-xs text-ink-soft">{r.how}</div>
                </div>
                {r.tag && <Sticker rotate={3}>{r.tag}</Sticker>}
              </button>
            ))}
            {route && <p className="text-xs text-ink-mute">До приезда позвони в отдел подбора: 8 800 100 77 77, доб. 1155.</p>}
          </div>
        </div>
      )}

      {tab === 'check' && (
        <Card className="p-4 sm:p-6">
          <ul className="space-y-2">
            {FIRST_DAY.checklist.map((c) => (
              <li key={c.id}>
                <button onClick={() => setDone((d) => ({ ...d, [c.id]: !d[c.id] }))} className={cx('flex w-full items-start gap-3 rounded-sm border-2 p-3 text-left transition', done[c.id] ? 'border-lime bg-lime/10' : 'border-ink/15 bg-white hover:border-ink/40')}>
                  {done[c.id] ? <CheckSquare className="h-5 w-5 shrink-0 text-lime" /> : <Square className="h-5 w-5 shrink-0 text-ink-mute" />}
                  <span className={cx('text-sm font-semibold', done[c.id] && 'line-through opacity-70')}>{c.text}</span>
                </button>
              </li>
            ))}
          </ul>
          {doneCount === FIRST_DAY.checklist.length && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 rounded-sm bg-brand p-3 text-center font-display font-extrabold text-white">
              Готов(а) к первому дню! До встречи на Рябиновой, 44
            </motion.div>
          )}
        </Card>
      )}

      {tab === 'contacts' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIRST_DAY.contacts.map((c) => (
            <a key={c.label} href={`tel:${c.tel}`} className="flex items-center gap-3 rounded-sm border border-line bg-white p-4 shadow-pop-sm transition hover:-translate-y-0.5">
              <span className="grid h-11 w-11 place-items-center rounded-sm bg-brand text-white">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-bold uppercase text-ink-mute">{c.label}</div>
                <div className="font-mono font-bold">{c.phone}</div>
                {c.ext && <div className="text-xs font-semibold text-brand">{c.ext}</div>}
              </div>
            </a>
          ))}
        </div>
      )}

      {tab === 'life' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {FIRST_DAY.life.map((x) => (
            <Card key={x.k} className="p-4">
              <div className="font-display font-extrabold">{x.k}</div>
              <p className="mt-1 text-sm text-ink-soft">{x.v}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
