import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Minus, Plus, ArrowRight, AlertTriangle, Search, CheckCircle2, TriangleAlert } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { QUIZZES } from '../../data/content.js'
import { StationShell, Quiz, StationReward } from '../../components/StationKit.jsx'
import { Button, Card, VerbTag, cx } from '../../components/ui.jsx'

const STEPS = ['Пульт мнемосхемы', 'Обход оборудования', 'Мини-квиз', 'Цифра кода']
const DURATION = 24 // c
const TICK = 100 // мс
const LOW = 1.8
const HIGH = 2.2

function Gauge({ value }) {
  // 1.0 .. 3.0 бар → -120..120 град
  const ang = Math.max(-120, Math.min(120, ((value - 2) / 1) * 120))
  const zone = value >= LOW && value <= HIGH ? 'ok' : value >= 1.6 && value <= 2.4 ? 'warn' : 'bad'
  const arc = (a1, a2, r) => {
    const p = (a) => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)]
    const [x1, y1] = p(a1)
    const [x2, y2] = p(a2)
    return `M${x1} ${y1} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`
  }
  return (
    <svg viewBox="0 0 200 130" className="w-full">
      <path d={arc(-120, -48, 78)} stroke="#D50032" strokeWidth="14" fill="none" />
      <path d={arc(-48, -24, 78)} stroke="#FFD21F" strokeWidth="14" fill="none" />
      <path d={arc(-24, 24, 78)} stroke="#3DD6A0" strokeWidth="14" fill="none" />
      <path d={arc(24, 48, 78)} stroke="#FFD21F" strokeWidth="14" fill="none" />
      <path d={arc(48, 120, 78)} stroke="#D50032" strokeWidth="14" fill="none" />
      {[-120, -60, 0, 60, 120].map((a, i) => (
        <text key={a} x={100 + 58 * Math.sin((a * Math.PI) / 180)} y={104 - 58 * Math.cos((a * Math.PI) / 180)} fontSize="10" fill="#9FB3C2" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
          {(1 + i * 0.5).toFixed(1)}
        </text>
      ))}
      <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: '100px 100px', transition: 'transform .12s linear' }}>
        <path d="M97 100 L100 30 L103 100z" fill="#fff" />
      </g>
      <circle cx="100" cy="100" r="8" fill="#fff" stroke="#4A4A4A" strokeWidth="2" />
      <text x="100" y="126" textAnchor="middle" fontSize="15" fontWeight="700" fill={zone === 'ok' ? '#3DD6A0' : zone === 'warn' ? '#FFD21F' : '#FF4D6D'} fontFamily="JetBrains Mono, monospace">
        {value.toFixed(2)} бар
      </text>
    </svg>
  )
}

function Mnemo({ pressure, meaAlarm, valveOpen, onValve, inspect, onInspect, inspected, running }) {
  const flow = running ? 'animate-[dash_1s_linear_infinite]' : ''
  const zone = pressure >= LOW && pressure <= HIGH ? '#3DD6A0' : pressure >= 1.6 && pressure <= 2.4 ? '#FFD21F' : '#FF4D6D'
  const Node = ({ id, x, y, w, h, children, label }) => {
    const can = inspect && INSPECT[id]
    return (
    <g
      onClick={can ? () => onInspect(id) : undefined}
      style={{ cursor: can ? 'pointer' : 'default' }}
      className={can && !inspected[id] ? 'animate-pulse' : ''}
    >
      {children}
      {can && (
        <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx="10" fill="none" stroke={inspected[id] ? '#3DD6A0' : '#FFD21F'} strokeWidth="2.5" strokeDasharray={inspected[id] ? '0' : '6 4'} />
      )}
      <text x={x + w / 2} y={y + h + 22} textAnchor="middle" fontSize="12" fill="#CFE0EA" fontWeight="700" fontFamily="Montserrat, Arial">
        {label}
      </text>
    </g>
    )
  }
  return (
    <svg viewBox="0 0 820 380" className="w-full">
      <style>{`@keyframes dash{to{stroke-dashoffset:-24}}`}</style>
      {/* трубы */}
      <path d="M150 300 H360" stroke="#FFD21F" strokeWidth="9" fill="none" />
      <path d="M150 300 H360" stroke="#4A4A4A" strokeWidth="3" strokeDasharray="8 16" fill="none" className={flow} />
      <path d="M150 90 H260 V60 H560 V150" stroke="#3DD6A0" strokeWidth="9" fill="none" />
      <path d="M150 90 H260 V60 H560 V150" stroke="#0E1A24" strokeWidth="3" strokeDasharray="8 16" fill="none" className={flow} />
      <path d="M440 260 H520 M620 260 H680" stroke="#7FB6C9" strokeWidth="9" fill="none" />
      <path d="M40 200 H90" stroke={meaAlarm ? '#FF4D6D' : '#B48CFF'} strokeWidth="9" fill="none" />
      <path d="M40 200 H90" stroke="#0E1A24" strokeWidth="3" strokeDasharray="6 12" fill="none" className={valveOpen ? flow : ''} />
      <text x="56" y="238" textAnchor="middle" fontSize="12" fill="#B48CFF" fontWeight="800" fontFamily="Montserrat, Arial">МЭА</text>
      <text x="56" y="252" textAnchor="middle" fontSize="8" fill="#B48CFF" fontFamily="Montserrat, Arial">моноэтаноламин</text>

      {/* вентиль МЭА */}
      <g onClick={onValve} style={{ cursor: meaAlarm ? 'pointer' : 'default' }}>
        <circle cx="64" cy="200" r="20" fill={meaAlarm ? '#FF4D6D33' : 'transparent'} className={meaAlarm ? 'animate-ping' : ''} style={{ transformOrigin: '64px 200px' }} />
        <g style={{ transform: `rotate(${valveOpen ? 90 : 0}deg)`, transformOrigin: '64px 200px', transition: 'transform .35s' }}>
          <rect x="44" y="196" width="40" height="8" rx="4" fill="#D50032" stroke="#fff" strokeWidth="1.5" />
          <circle cx="64" cy="200" r="7" fill="#D50032" stroke="#fff" strokeWidth="2" />
        </g>
      </g>

      {/* абсорбер */}
      <Node id="absorber" x={95} y={60} w={60} h={250} label="Абсорбер К-1">
        <rect x="95" y="60" width="60" height="250" rx="28" fill="#1B3346" stroke="#9FB3C2" strokeWidth="3" />
        <rect x="103" y={300 - (pressure - 1) * 110} width="44" height={(pressure - 1) * 110} rx="8" fill={zone} opacity=".35" />
        {[110, 150, 190, 230, 270].map((y) => (
          <path key={y} d={`M103 ${y} h44`} stroke="#9FB3C2" strokeWidth="1.5" strokeDasharray="4 4" />
        ))}
      </Node>

      {/* барботёр */}
      <Node id="barboter" x={330} y={200} w={110} h={100} label="Барботёр №1 · KMnO₄">
        <rect x="330" y="200" width="110" height="100" rx="14" fill="#1B3346" stroke="#9FB3C2" strokeWidth="3" />
        <rect x="338" y="236" width="94" height="56" rx="8" fill={inspected.barboter ? '#E7A6D6' : '#A23BAE'} opacity=".85" />
        {[350, 375, 400, 420].map((x, i) => (
          <circle key={x} cx={x} cy={270 - (i % 2) * 10} r="4" fill="#fff" opacity=".6" />
        ))}
      </Node>

      {/* SCHENK */}
      <Node id="schenk" x={520} y={150} w={100} h={150} label="Резервуары SCHENK">
        <rect x="520" y="150" width="44" height="150" rx="18" fill="#1B3346" stroke="#9FB3C2" strokeWidth="3" />
        <rect x="576" y="150" width="44" height="150" rx="18" fill="#1B3346" stroke="#9FB3C2" strokeWidth="3" />
        <rect x="526" y="185" width="32" height="108" rx="10" fill="#A2AAAD" opacity=".7" />
        <rect x="582" y="200" width="32" height="93" rx="10" fill="#A2AAAD" opacity=".7" />
      </Node>

      {/* ЛЭП */}
      <Node id="lep" x={680} y={180} w={110} h={120} label="ЛЭП · Затор. чан №1">
        <path d="M680 200 q55 -40 110 0 v80 q0 20 -20 20 h-70 q-20 0 -20 -20z" fill="#1B3346" stroke="#9FB3C2" strokeWidth="3" />
        <text x="735" y="250" textAnchor="middle" fontSize="16" fontWeight="900" fill="#CFE0EA" fontFamily="Montserrat, Arial">ЛЭП</text>
        <text x="735" y="272" textAnchor="middle" fontSize="12" fill="#3DD6A0" fontFamily="JetBrains Mono, monospace">63.2 °C</text>
      </Node>
      <text x="290" y="48" fontSize="11" fill="#7FB6C9" fontFamily="JetBrains Mono, monospace">CO₂ → очистка → танки</text>
    </svg>
  )
}

const INSPECT = {
  barboter: {
    title: 'Барботёр №1 · раствор KMnO₄',
    reading: 'Раствор перманганата посветлел до бледно-розового: поглотительная способность падает.',
    correct: 'bad',
  },
  schenk: { title: 'Резервуары SCHENK', reading: 'Уровень 72% и 63%, давление 0,4 бар, утечек нет.', correct: 'ok' },
  lep: { title: 'ЛЭП · Заторноварочный чан №1', reading: 'Температура 63,2 °C при регламенте паузы 62–64 °C, мешалка в работе.', correct: 'ok' },
}

function Panel({ onDone, onPhase }) {
  const [phase, setPhase] = useState('idle') // idle | run | inspect
  const [pressure, setPressure] = useState(2.0)
  const [t, setT] = useState(0)
  const [meaAlarm, setMeaAlarm] = useState(false)
  const [valveOpen, setValveOpen] = useState(true)
  const sim = useRef({ drift: 0, green: 0, ticks: 0, alarmAt: 0, alarmStart: 0, reaction: null, handled: false })
  const [inspected, setInspected] = useState({})
  const [open, setOpen] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (phase !== 'run') return
    const s = sim.current
    s.alarmAt = 7000 + Math.random() * 5000
    const start = Date.now()
    const id = setInterval(() => {
      const el = Date.now() - start
      setT(el)
      if (Math.random() < 0.035) s.drift = (Math.random() - 0.5) * 0.034
      if (!s.handled && !s.alarmStart && el > s.alarmAt) {
        s.alarmStart = Date.now()
        setMeaAlarm(true)
        setValveOpen(false)
      }
      let surge = 0
      if (s.alarmStart && !s.handled) {
        surge = 0.03
        if (Date.now() - s.alarmStart > 6000) {
          s.handled = true
          s.reaction = null
          setMeaAlarm(false)
          setValveOpen(true)
        }
      }
      setPressure((p) => {
        const np = Math.max(1.0, Math.min(3.0, p + s.drift + surge + (Math.random() - 0.5) * 0.02))
        s.ticks++
        if (np >= LOW && np <= HIGH) s.green++
        return np
      })
      if (el >= DURATION * 1000) {
        clearInterval(id)
        const stability = Math.round((s.green / Math.max(1, s.ticks)) * 100)
        setResult({ pressure_stability: stability, mea_reaction_ms: s.reaction })
        setPhase('inspect')
        onPhase?.('inspect')
        setMeaAlarm(false)
      }
    }, TICK)
    return () => clearInterval(id)
  }, [phase])

  // приложение свернули (VKWebAppViewHide) посреди смены — смена прерывается, её можно начать заново
  useEffect(() => {
    if (phase !== 'run') return
    const onPause = () => {
      sim.current = { drift: 0, green: 0, ticks: 0, alarmAt: 0, alarmStart: 0, reaction: null, handled: false }
      setMeaAlarm(false)
      setValveOpen(true)
      setPressure(2.0)
      setT(0)
      setPhase('idle')
    }
    window.addEventListener('och:pause', onPause)
    return () => window.removeEventListener('och:pause', onPause)
  }, [phase])

  useEffect(() => {
    if (phase !== 'run') return
    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', ' ', '+', '-'].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === 'ArrowUp' || e.key === '+') adjust(0.08)
      if (e.key === 'ArrowDown' || e.key === '-') adjust(-0.08)
      if (e.key === ' ' || e.key === 'Enter') turnValve()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, meaAlarm])

  const adjust = (d) => setPressure((p) => Math.max(1, Math.min(3, p + d)))
  const turnValve = () => {
    const s = sim.current
    if (!meaAlarm || s.handled) return
    s.handled = true
    s.reaction = Date.now() - s.alarmStart
    setMeaAlarm(false)
    setValveOpen(true)
    setPressure((p) => p - 0.1)
  }

  const allAnswered = Object.keys(INSPECT).every((k) => answers[k])
  const finishInspect = () => {
    const correct = Object.keys(INSPECT).filter((k) => answers[k] === INSPECT[k].correct).length
    onDone({ ...result, inspections_correct: correct, inspections_total: 3 })
  }

  const left = Math.max(0, DURATION - t / 1000)
  const zone = pressure >= LOW && pressure <= HIGH ? 'ok' : pressure >= 1.6 && pressure <= 2.4 ? 'warn' : 'bad'

  return (
    <div>
      {/* Условие смены строго НАВЕРХУ */}
      <div className="mb-5 rounded-sm border-2 border-brand/40 bg-kraft-light p-4 text-ink shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand">
            ⚠️ Регламент смены · SCADA техцеха ОЧАКОВО
          </span>
          <span className="rounded bg-brand px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-sm">
            Норма давления: 1,8 – 2,2 бар
          </span>
        </div>
        <p className="mt-1.5 text-xs sm:text-sm font-semibold leading-relaxed text-ink-soft">
          Твоя задача — удерживать давление в абсорбере в зелёной зоне кнопками <b>«+ ПОДАЧА»</b> и <b>«− СБРОС»</b> (или клавишами ↑/↓). При падении потока МЭА (красный сигнал тревоги) моментально нажимай кнопку <b>«ПЕРЕКЛЮЧИТЬ ВЕНТИЛЬ»</b>!
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-sm border border-line bg-[#0E1A24] shadow-pop">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#13283A] px-4 py-2 font-mono text-xs text-[#9FB3C2]">
          <span>SCADA · Участок получения CO₂ · Мнемосхема</span>
          <span className="flex items-center gap-3">
            {phase === 'run' && <span className="text-white">T−{left.toFixed(1)} c</span>}
            <span className={cx('flex items-center gap-1', meaAlarm ? 'text-[#FF4D6D]' : 'text-[#3DD6A0]')}>
              <span className={cx('h-2 w-2 rounded-full', meaAlarm ? 'animate-blink bg-[#FF4D6D]' : 'bg-[#3DD6A0]')} />
              {meaAlarm ? 'АВАРИЯ: падение потока МЭА' : 'НОРМА'}
            </span>
          </span>
        </div>
        <div className="scanlines relative p-2 sm:p-4">
          <Mnemo
            pressure={pressure}
            meaAlarm={meaAlarm}
            valveOpen={valveOpen}
            onValve={turnValve}
            running={phase === 'run'}
            inspect={phase === 'inspect'}
            inspected={inspected}
            onInspect={(id) => {
              if (!INSPECT[id]) return
              setInspected((x) => ({ ...x, [id]: true }))
              setOpen(id)
            }}
          />
          {meaAlarm && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={turnValve}
              className="absolute left-3 top-3 flex items-center gap-2 rounded-sm border-2 border-white bg-[#FF4D6D] px-3 py-2 text-xs font-extrabold text-white shadow-lg sm:text-sm"
            >
              <AlertTriangle className="h-4 w-4" /> Поверни красный вентиль МЭА!
            </motion.button>
          )}
          {phase === 'idle' && (
            <div className="absolute inset-0 grid place-items-center bg-[#0E1A24]/80 p-4 text-center backdrop-blur-[2px]">
              <div className="max-w-md">
                <VerbTag>Контролируй и управляй</VerbTag>
                <p className="mt-3 text-sm text-[#CFE0EA]">
                  24 секунды смены. Держи давление в абсорбере в <b className="text-[#3DD6A0]">зелёной зоне 1,8–2,2 бар</b> крупными кнопками на экране или клавишами ↑↓.
                </p>
                <Button className="mt-4" size="lg" onClick={() => setPhase('run')}>
                  <Play className="h-5 w-5" /> Принять смену
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Крупные кнопки управления на экране: Подача / Сброс / Вентиль */}
        {phase === 'run' && (
          <div className="border-t border-white/10 bg-[#13283A] p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => adjust(0.08)}
                className="flex items-center justify-center gap-2 rounded-sm border-2 border-emerald-400 bg-[#3DD6A0] py-3.5 px-4 font-mono text-sm sm:text-base font-extrabold text-slate-950 shadow-md transition active:scale-95 hover:bg-emerald-300"
              >
                <Plus className="h-5 w-5 stroke-[3]" /> [ + ПОДАЧА ]
              </button>
              <button
                type="button"
                onClick={() => adjust(-0.08)}
                className="flex items-center justify-center gap-2 rounded-sm border-2 border-rose-400 bg-[#FF4D6D] py-3.5 px-4 font-mono text-sm sm:text-base font-extrabold text-white shadow-md transition active:scale-95 hover:bg-rose-600"
              >
                <Minus className="h-5 w-5 stroke-[3]" /> [ − СБРОС ]
              </button>
              <button
                type="button"
                onClick={turnValve}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-sm border-2 py-3.5 px-4 font-mono text-sm sm:text-base font-extrabold shadow-md transition active:scale-95',
                  meaAlarm
                    ? 'border-white bg-[#FFD21F] text-slate-950 animate-bounce ring-4 ring-[#FF4D6D]'
                    : 'border-white/30 bg-[#1B3346] text-white hover:bg-[#25455E]'
                )}
              >
                ⚙️ [ ПЕРЕКЛЮЧИТЬ ВЕНТИЛЬ ]
              </button>
            </div>
            <div className="mt-2 text-center text-[11px] font-mono text-[#9FB3C2]">
              Горячие клавиши: [↑] Подача · [↓] Сброс · [Пробел] Вентиль
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-sm border border-line bg-[#0E1A24] p-4 text-white shadow-pop">
          <div className="font-mono text-xs text-[#9FB3C2]">PI-101 · давление в абсорбере</div>
          <Gauge value={pressure} />
          {phase === 'run' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => adjust(-0.08)} className="flex items-center justify-center gap-1 rounded-sm border-2 border-white/80 bg-[#1B3346] py-3 font-extrabold active:scale-95">
                <Minus className="h-5 w-5" /> Сброс
              </button>
              <button onClick={() => adjust(0.08)} className="flex items-center justify-center gap-1 rounded-sm border-2 border-white/80 bg-[#1B3346] py-3 font-extrabold active:scale-95">
                <Plus className="h-5 w-5" /> Подача
              </button>
            </div>
          )}
          <div className={cx('mt-3 rounded-sm px-3 py-2 text-center text-xs font-bold', zone === 'ok' ? 'bg-[#3DD6A0]/15 text-[#3DD6A0]' : zone === 'warn' ? 'bg-[#FFD21F]/15 text-[#FFD21F]' : 'bg-[#FF4D6D]/20 text-[#FF8FA3]')}>
            {zone === 'ok' ? 'Режим в норме' : zone === 'warn' ? 'Отклонение: корректируй' : 'Критично! Срочно корректируй'}
          </div>
        </div>

        {phase === 'inspect' && result && (
          <Card className="p-4">
            <div className="font-mono text-xs font-bold uppercase text-ink-mute">Итог смены на пульте</div>
            <div className="mt-1 text-sm">
              Стабильность давления: <b>{result.pressure_stability}%</b>
              <br />
              Реакция на аварию МЭА: <b>{result.mea_reaction_ms != null ? `${(result.mea_reaction_ms / 1000).toFixed(1)} с` : 'не успел, перекрыл наставник'}</b>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-sm bg-malt-light/50 p-3 text-sm font-semibold">
              <Search className="mt-0.5 h-4 w-4 shrink-0" />
              Теперь обход: нажми на подсвеченные узлы на мнемосхеме (барботёр, SCHENK, чан ЛЭП) и прими решение.
            </div>
            {open && (
              <div className="mt-3 rounded-sm border border-line p-3">
                <div className="font-extrabold">{INSPECT[open].title}</div>
                <p className="mt-1 text-sm text-ink-soft">{INSPECT[open].reading}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAnswers((a) => ({ ...a, [open]: 'ok' }))}
                    className={cx('flex items-center justify-center gap-1 rounded-sm border border-line px-2 py-2 text-xs font-extrabold', answers[open] === 'ok' ? 'bg-lime text-white' : 'bg-paper')}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Норма
                  </button>
                  <button
                    onClick={() => setAnswers((a) => ({ ...a, [open]: 'bad' }))}
                    className={cx('flex items-center justify-center gap-1 rounded-sm border border-line px-2 py-2 text-xs font-extrabold', answers[open] === 'bad' ? 'bg-brand text-white' : 'bg-paper')}
                  >
                    <TriangleAlert className="h-4 w-4" /> Отклонение
                  </button>
                </div>
              </div>
            )}
            <div className="mt-3 text-xs font-semibold text-ink-mute">Проверено: {Object.keys(answers).length}/3</div>
            <Button className="mt-3 w-full" disabled={!allAnswered} onClick={finishInspect}>
              Записать в журнал смены <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}
        {phase !== 'inspect' && (
          <Card className="p-4 text-sm text-ink-soft">
            <b className="text-ink">Как в реальном цехе:</b> машинист следит за мнемосхемой из операторской, ведёт журнал показаний и вручную управляет арматурой: вентилями и задвижками.
          </Card>
        )}
      </div>
    </div>
    </div>
  )
}

export default function EngineeringStation() {
  const { state, actions } = useGame()
  const saved = state.telemetry.stations.engineering
  const [step, setStep] = useState(saved ? 3 : 0)
  const [res, setRes] = useState(null)

  const finish = (qc, skipped = false) => {
    const r = skipped ? { pressure_stability: 72, mea_reaction_ms: 2500, inspections_correct: 2, inspections_total: 3 } : res
    const q = skipped ? 1 : qc
    const ms = r.mea_reaction_ms
    const meaPts = ms == null ? 0 : ms <= 1500 ? 50 : Math.max(15, Math.round(50 - ((ms - 1500) / 4500) * 35))
    const breakdown = [
      { label: `Стабильность давления: ${r.pressure_stability}%`, points: Math.round(r.pressure_stability), max: 100 },
      { label: `Реакция на аварию МЭА: ${ms != null ? (ms / 1000).toFixed(1) + ' с' : 'пропущена'}`, points: meaPts, max: 50 },
      { label: `Обход: верных решений ${r.inspections_correct}/3`, points: r.inspections_correct * 10, max: 30 },
      { label: `Мини-квиз: ${q}/${QUIZZES.engineering.length}`, points: q * 35, max: 70 },
    ]
    const total = breakdown.reduce((a, b) => a + b.points, 0)
    actions.stationDone('engineering', total, { ...r, quiz_correct: q, quiz_total: QUIZZES.engineering.length, breakdown }, skipped)
    setStep(3)
  }

  return (
    <StationShell
      id="engineering"
      steps={STEPS}
      step={step}
      onSkip={() => finish(1, true)}
      tip={step === 0 ? 'Это реальный участок получения CO₂ для газирования напитков. Не дёргай давление резко — лучше маленькие поправки.' : step === 1 ? 'Барботёр с раствором KMnO₄ очищает газ. Посветлевший раствор = пора менять.' : null}
    >
      {step <= 1 && (
        <Panel
          onPhase={() => setStep(1)}
          onDone={(r) => {
            setRes(r)
            setStep(2)
          }}
        />
      )}
      {step === 2 && <Quiz station="engineering" questions={QUIZZES.engineering} onDone={(c) => finish(c)} />}
      {step === 3 && <StationReward id="engineering" breakdown={saved?.breakdown || []} total={saved?.score || 0} />}
    </StationShell>
  )
}
