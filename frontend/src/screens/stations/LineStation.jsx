import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, ArrowRight, FileText, OctagonX } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { QUIZZES } from '../../data/content.js'
import { StationShell, Quiz, StationReward } from '../../components/StationKit.jsx'
import { Button, Card, VerbTag, cx } from '../../components/ui.jsx'

const STEPS = ['Линия SMI SK 500 P', 'ТТН на паллету', 'Мини-квиз', 'Цифра кода']
const GAME_MS = 20000
const SPAWN_MS = 640
const TRAVEL_MS = 4300
const TYPES = {
  mohito: { label: 'Мохито Fresh', body: '#6DBE3A', band: '#E9F7D8', text: 'MOJITO' },
  gin: { label: 'Джин & Грейпфрут', body: '#E8456B', band: '#FFE1E8', text: 'GIN&GRP' },
}

function Can({ type, dented, onClick, x, removed }) {
  const t = TYPES[type]
  return (
    <button
      onClick={onClick}
      className="absolute bottom-[34px] -ml-5 w-10 transition-[transform,opacity] duration-300"
      style={{ left: `${x}%`, transform: removed ? 'translateY(70px) rotate(35deg)' : dented ? 'rotate(-7deg)' : undefined, opacity: removed ? 0 : 1 }}
      aria-label={`${t.label}${dented ? ', мятая' : ''}`}
    >
      <svg viewBox="0 0 40 70" className="h-[68px] w-10 drop-shadow">
        <rect x="6" y="2" width="28" height="5" rx="2" fill="#C8CDD2" stroke="#4A4A4A" strokeWidth="1.5" />
        <path
          d={dented ? 'M5 8 h30 v20 l-6 6 6 6 v24 q0 4 -4 4 h-22 q-4 0 -4 -4 v-22 l5 -5 -5 -7z' : 'M5 8 h30 v56 q0 4 -4 4 h-22 q-4 0 -4 -4z'}
          fill={t.body}
          stroke="#4A4A4A"
          strokeWidth="2"
        />
        <rect x="5" y="26" width="30" height="16" fill={t.band} opacity={dented ? 0.7 : 1} />
        <text x="20" y="37" textAnchor="middle" fontSize="6.4" fontWeight="900" fill="#4A4A4A" fontFamily="Montserrat, Arial">
          {t.text}
        </text>
        <text x="20" y="56" textAnchor="middle" fontSize="5" fontWeight="800" fill="#fff" fontFamily="Montserrat, Arial">
          ОЧАКОВО
        </text>
        {dented && <path d="M12 14 l8 6 -4 4 8 4" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />}
      </svg>
    </button>
  )
}

function Light({ color, on }) {
  return <span className="block h-5 w-5 rounded-full border border-line transition" style={{ background: on ? color : '#4A4A4A', boxShadow: on ? `0 0 14px ${color}` : 'none' }} />
}

function LineGame({ onFinish }) {
  const [status, setStatus] = useState('idle') // idle | run | pause | done
  const [cans, setCans] = useState([])
  const [now, setNow] = useState(0)
  const [stats, setStats] = useState({ caught: 0, missed: 0, falseRejects: 0, passed: { mohito: 0, gin: 0 }, estop: 0 })
  const [warn, setWarn] = useState(false)
  const g = useRef({ elapsed: 0, last: 0, lastSpawn: 0, id: 0 })
  const raf = useRef(0)

  useEffect(() => {
    if (status !== 'run') return
    g.current.last = performance.now()
    const loop = (ts) => {
      const s = g.current
      const dt = ts - s.last
      s.last = ts
      s.elapsed += dt
      if (s.elapsed - s.lastSpawn > SPAWN_MS && s.elapsed < GAME_MS - TRAVEL_MS - 250) {
        s.lastSpawn = s.elapsed
        const id = ++s.id
        setCans((c) => [...c, { id, born: s.elapsed, type: Math.random() < 0.55 ? 'mohito' : 'gin', dented: Math.random() < 0.26, state: 'belt' }])
      }
      setNow(s.elapsed)
      if (s.elapsed >= GAME_MS) {
        setStatus('done')
        return
      }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [status])

  // банки, доехавшие до туннеля
  useEffect(() => {
    const arrived = cans.filter((c) => c.state === 'belt' && now - c.born >= TRAVEL_MS)
    if (!arrived.length) return
    setCans((cs) => cs.map((c) => (arrived.find((a) => a.id === c.id) ? { ...c, state: 'tunnel' } : c)))
    setStats((st) => {
      const n = { ...st, passed: { ...st.passed } }
      for (const a of arrived) {
        if (a.dented) n.missed++
        else n.passed[a.type]++
      }
      return n
    })
    if (arrived.some((a) => a.dented)) {
      setWarn(true)
      setTimeout(() => setWarn(false), 700)
    }
  }, [now, cans])

  useEffect(() => {
    if (status === 'done') setCans([])
  }, [status])

  const reject = (can) => {
    if (status !== 'run' || can.state !== 'belt') return
    setCans((cs) => cs.map((c) => (c.id === can.id ? { ...c, state: 'removed' } : c)))
    setStats((st) => (can.dented ? { ...st, caught: st.caught + 1 } : { ...st, falseRejects: st.falseRejects + 1 }))
  }

  const remaining = Math.max(0, (GAME_MS - now) / 1000)
  const visible = cans.filter((c) => c.state === 'belt' || (c.state === 'removed' && now - c.born < TRAVEL_MS + 400))

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="overflow-hidden rounded-sm border border-line bg-[#E9EEF1] shadow-pop">
        <div className="flex items-center justify-between border-b-2 border-brand bg-paper px-4 py-2 font-mono text-xs">
          <span className="font-bold">ЛИНИЯ №3 · SMI SK 500 P · термоусадочный туннель</span>
          <span className="font-bold text-brand">{status === 'run' || status === 'pause' ? `${remaining.toFixed(1)} c` : ''}</span>
        </div>
        <div className="relative h-[230px] overflow-hidden sm:h-[260px]">
          {/* стена цеха */}
          <div className="absolute inset-0 och-light bg-[linear-gradient(180deg,#DDE4E8_0,#C9D2D8_70%,#9AA5AD_100%)]" />
          <div className="absolute left-0 right-0 top-8 h-2 bg-[#7FB6C9]/60" />
          {/* конвейер */}
          <div className="absolute bottom-[22px] left-0 right-[92px] h-[14px] border-y-2 border-brand bg-[#2B6CB0]">
            <div
              className="h-full w-full opacity-60"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg,#4A4A4A 0 3px,transparent 3px 26px)',
                backgroundPositionX: `${(now / 12) % 26}px`,
              }}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-[92px] h-[22px] bg-[repeating-linear-gradient(90deg,#626262_0_10px,#8A8F92_10px_40px)]" />
          {/* туннель */}
          <div className="absolute bottom-[12px] right-0 top-[52px] w-[110px] rounded-tl-sm border border-line bg-[#4A4A4A]">
            <div className="absolute inset-x-2 top-3 rounded bg-[#D50032] py-0.5 text-center font-mono text-[9px] font-bold text-white">185 °C</div>
            <div className="absolute bottom-3 left-0 top-10 w-4 bg-[repeating-linear-gradient(90deg,#D50032_0_3px,#AB2328_3px_6px)]" />
            <div className="absolute bottom-3 left-6 right-2 top-10 rounded bg-[radial-gradient(circle,#ff9a3c55,transparent_70%)]" />
          </div>
          {/* банки */}
          {visible.map((c) => (
            <Can key={c.id} type={c.type} dented={c.dented} x={Math.min(88, ((now - c.born) / TRAVEL_MS) * 88)} removed={c.state === 'removed'} onClick={() => reject(c)} />
          ))}
          {status === 'idle' && (
            <div className="absolute inset-0 grid place-items-center bg-white/75 p-4 text-center backdrop-blur-[2px]">
              <div className="max-w-md">
                <VerbTag>Следи за работой</VerbTag>
                <p className="mt-3 text-sm font-semibold text-ink">
                  Нажми <b className="text-lime">ПУСК</b> на панели. Банки «Мохито Fresh» и «Джин & Грейпфрут» едут в термоусадочный туннель. <b className="text-brand">Тапай по мятым банкам</b>, чтобы отбраковать их, а целые не трогай.
                </p>
              </div>
            </div>
          )}
          {status === 'pause' && <div className="absolute inset-0 grid place-items-center bg-brand/20 font-display text-2xl font-extrabold text-brand">АВАРИЙНЫЙ СТОП</div>}
          {status === 'done' && (
            <div className="absolute inset-0 grid place-items-center bg-white/80 p-4 text-center">
              <div>
                <div className="font-display text-2xl font-extrabold">Смена на линии завершена</div>
                <div className="mt-1 text-sm">
                  Отбраковано {stats.caught} · пропущено {stats.missed} · ложных снятий {stats.falseRejects}
                </div>
                <Button className="mt-3" onClick={() => onFinish(stats)}>
                  Оформить ТТН <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HMI */}
      <div className="rounded-sm border border-line bg-[#575757] p-4 text-white shadow-pop">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-1.5 rounded-sm border border-line bg-[#4A4A4A] p-1.5">
            <Light color="#FF3B57" on={status !== 'run'} />
            <Light color="#FFD21F" on={warn} />
            <Light color="#3DD68C" on={status === 'run'} />
          </div>
          <div className="flex-1">
            <div className="font-mono text-[10px] text-white/60">HMI · SK 500 P</div>
            <div className="mt-1 rounded-sm bg-[#0D2236] p-2 font-mono text-xs leading-relaxed text-[#BFF3FF]">
              <div className="text-[10px] text-[#7FB6C9]">СЧЁТЧИК ТУННЕЛЯ</div>
              <div>MOJITO FRESH: {stats.passed.mohito}</div>
              <div>GIN&GRAPEFRUIT: {stats.passed.gin}</div>
              <div className="mt-1 text-[10px] text-[#7FB6C9]">БРАК</div>
              <div className="text-[#3DD68C]">снято: {stats.caught}</div>
              <div className="text-[#FF8FA3]">пропущено: {stats.missed}</div>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {status === 'idle' || status === 'pause' ? (
            <button onClick={() => setStatus('run')} className="flex items-center justify-center gap-1 rounded-sm border-2 border-white bg-[#3DD68C] py-3 font-extrabold text-ink active:scale-95">
              <Play className="h-5 w-5" /> ПУСК
            </button>
          ) : (
            <button disabled className="flex items-center justify-center gap-1 rounded-sm border-2 border-white/40 bg-white/10 py-3 font-extrabold text-white/50">
              <Pause className="h-5 w-5" /> РАБОТА
            </button>
          )}
          <button
            onClick={() => {
              if (status === 'run') {
                setStatus('pause')
                setStats((s) => ({ ...s, estop: s.estop + 1 }))
              }
            }}
            className="flex items-center justify-center gap-1 rounded-sm border-2 border-white bg-[#FF3B57] py-3 text-xs font-extrabold active:scale-95"
          >
            <OctagonX className="h-5 w-5" /> E-STOP
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-white/60">
          Помни: в цехе розлива обязательны беруши. Аварийный стоп останавливает линию: нажимай при опасности.
        </p>
      </div>
    </div>
  )
}

const RECIPIENTS = [
  'ТОО «Напитки Азии», Казахстан, Алматы (экспорт)',
  'Склад готовой продукции, Москва, Рябиновая, 44',
  'ООО «Магазин у дома», Москва',
]

function TTN({ stats, onDone }) {
  const [form, setForm] = useState({ to: '', mohito: '', gin: '' })
  const [checked, setChecked] = useState(null)
  const number = useRef(`ТТН-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`)
  const submit = () => {
    const res = {
      to: form.to === RECIPIENTS[0],
      mohito: +form.mohito === stats.passed.mohito,
      gin: +form.gin === stats.passed.gin,
    }
    setChecked(res)
  }
  const correct = checked ? Object.values(checked).filter(Boolean).length : 0
  const field = (k) => (checked ? (checked[k] ? 'border-lime bg-lime/10' : 'border-brand bg-brand-50') : 'border-ink/30')
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="paper-grain overflow-hidden bg-paper">
        <div className="flex items-center justify-between border-b-2 border-brand bg-kraft-light px-4 py-3">
          <div className="flex items-center gap-2 font-display font-extrabold uppercase">
            <FileText className="h-5 w-5 text-brand" /> Товарно-транспортная накладная
          </div>
          <span className="font-mono text-xs font-bold">{number.current}</span>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="rounded-sm bg-malt-light/40 p-3 text-sm font-semibold">
            Заявка от отдела логистики: экспортная паллета уходит в Казахстан. Внеси получателя и количество целых банок по счётчику туннеля.
          </div>
          <label className="block">
            <span className="text-xs font-extrabold uppercase text-ink-mute">Грузоотправитель</span>
            <div className="mt-1 rounded-sm border-2 border-ink/15 bg-cream px-3 py-2 text-sm font-semibold">АО МПБК «ОЧАКОВО», Москва, ул. Рябиновая, 44</div>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase text-ink-mute">Грузополучатель</span>
            <select value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className={cx('mt-1 w-full rounded-sm border-2 bg-paper px-3 py-2.5 text-sm font-semibold', field('to'))}>
              <option value="">Выбери получателя…</option>
              {RECIPIENTS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['mohito', 'Мохито Fresh, банок'],
              ['gin', 'Джин & Грейпфрут, банок'],
            ].map(([k, l]) => (
              <label key={k} className="block">
                <span className="text-xs font-extrabold uppercase text-ink-mute">{l}</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className={cx('mt-1 w-full rounded-sm border-2 bg-paper px-3 py-2.5 font-mono text-lg font-bold', field(k))}
                />
              </label>
            ))}
          </div>
          {!checked ? (
            <Button disabled={!form.to || form.mohito === '' || form.gin === ''} onClick={submit}>
              Подписать ТТН
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-paper p-3">
              <span className="text-sm font-bold">
                Верно заполнено полей: {correct}/3.{' '}
                {correct < 3 && (
                  <span className="text-ink-soft">
                    По счётчику: Мохито {stats.passed.mohito}, Джин & Грейпфрут {stats.passed.gin}; получатель — экспорт.
                  </span>
                )}
              </span>
              <Button onClick={() => onDone(correct)}>
                Отправить паллету <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
      <div className="space-y-3">
        <div className="rounded-sm border border-line bg-[#0D2236] p-4 font-mono text-sm text-[#BFF3FF] shadow-pop">
          <div className="text-[10px] text-[#7FB6C9]">СЧЁТЧИК ТУННЕЛЯ (итог смены)</div>
          <div>MOJITO FRESH: {stats.passed.mohito}</div>
          <div>GIN&GRAPEFRUIT: {stats.passed.gin}</div>
        </div>
        <Card className="p-4 text-sm text-ink-soft">
          <b className="text-ink">Склад и логистика.</b> Оператор склада работает с программой, документацией и ТТН, кладовщик управляет комплектовщиками. Продукция ОЧАКОВО уходит в 60 регионов России и 30+ стран.
        </Card>
      </div>
    </div>
  )
}

export default function LineStation() {
  const { state, actions } = useGame()
  const saved = state.telemetry.stations.line
  const [step, setStep] = useState(saved ? 3 : 0)
  const [stats, setStats] = useState(null)
  const [ttn, setTtn] = useState(0)
  const per = Math.round(70 / QUIZZES.line.length)

  const finish = (qc, skipped = false) => {
    const s = skipped ? { caught: 7, missed: 2, falseRejects: 1, passed: { mohito: 12, gin: 9 }, estop: 0 } : stats
    const t = skipped ? 2 : ttn
    const q = skipped ? 2 : qc
    const ratio = s.caught + s.missed ? s.caught / (s.caught + s.missed) : 0
    const linePts = Math.max(0, Math.round(ratio * 120 - s.falseRejects * 5))
    const breakdown = [
      { label: `Отбраковка: снято ${s.caught}, пропущено ${s.missed}, ложных ${s.falseRejects}`, points: linePts, max: 120 },
      { label: `ТТН: верных полей ${t}/3`, points: t * 20, max: 60 },
      { label: `Мини-квиз: ${q}/${QUIZZES.line.length}`, points: q * per, max: per * QUIZZES.line.length },
    ]
    const total = breakdown.reduce((a, b) => a + b.points, 0)
    actions.stationDone(
      'line',
      total,
      {
        defects_caught: s.caught,
        defects_missed: s.missed,
        false_rejects: s.falseRejects,
        cans_passed: s.passed.mohito + s.passed.gin,
        estop_used: s.estop,
        ttn_correct: t,
        quiz_correct: q,
        quiz_total: QUIZZES.line.length,
        breakdown,
      },
      skipped,
    )
    setStep(3)
  }

  return (
    <StationShell
      id="line"
      steps={STEPS}
      step={step}
      onSkip={() => finish(2, true)}
      tip={step === 0 ? 'Мятая банка может разгерметизироваться или застрять в паковщике. Лучше снять лишнюю, чем пропустить одну, но ложные снятия тоже считаются!' : step === 1 ? 'Цифры бери со счётчика туннеля на HMI: только целые банки идут в паллету.' : null}
    >
      {step === 0 && (
        <LineGame
          onFinish={(s) => {
            setStats(s)
            setStep(1)
          }}
        />
      )}
      {step === 1 && (
        <TTN
          stats={stats}
          onDone={(c) => {
            setTtn(c)
            setStep(2)
          }}
        />
      )}
      {step === 2 && <Quiz station="line" questions={QUIZZES.line} pointsPer={per} onDone={(c) => finish(c)} />}
      {step === 3 && <StationReward id="line" breakdown={saved?.breakdown || []} total={saved?.score || 0} />}
    </StationShell>
  )
}
