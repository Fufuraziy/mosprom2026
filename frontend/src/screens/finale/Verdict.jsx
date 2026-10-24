import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Moon, Home, UtensilsCrossed, Info, Bot } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { api } from '../../services/api.js'
import { COMPETENCY_META } from '../../services/localEngine.js'
import { DEPARTMENTS, BLOCKS } from '../../data/content.js'
import { Card, Icon, Progress, fmtRub, cx } from '../../components/ui.jsx'
import Krafty from '../../components/Krafty.jsx'

const THINKING = ['Читаю телеметрию 4 станций…', 'Сравниваю с профилями успешных стажёров…', 'Считаю мэтч с вакансиями…']

export function AIVerdict() {
  const { state } = useGame()
  const [rec, setRec] = useState(null)
  const [line, setLine] = useState(0)
  useEffect(() => {
    let alive = true
    const timer = setInterval(() => setLine((l) => Math.min(l + 1, THINKING.length - 1)), 500)
    const started = Date.now()
    api.recommendation(state.sessionId, state.telemetry).then((r) => {
      const wait = Math.max(0, 1500 - (Date.now() - started))
      setTimeout(() => alive && setRec(r), wait)
    })
    return () => {
      alive = false
      clearInterval(timer)
    }
    // пересчитываем только при входе на экран
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!rec) {
    return (
      <Card className="flex items-center gap-4 p-6">
        <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Krafty size={64} mood="think" />
        </motion.div>
        <div>
          <div className="font-mono text-xs font-bold uppercase text-brand">ИИ-агент №2 · рекомендация</div>
          <div className="mt-1 font-display text-lg font-extrabold">{THINKING[line]}</div>
        </div>
      </Card>
    )
  }

  const comp = rec.competencies || {}
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative overflow-hidden rounded-sm border border-line bg-brand p-6 text-white shadow-pop-lg">
        <div className="halftone-white absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            <Bot className="h-4 w-4" /> ИИ-агент №2 · твой архетип
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-sm border border-line bg-paper text-brand shadow-pop">
              <Icon name={rec.archetype?.icon || 'Sparkles'} className="h-8 w-8" />
            </span>
            <div className="font-display text-3xl font-extrabold leading-none sm:text-4xl">{rec.archetype?.name}</div>
          </div>
          <p className="mt-4 text-sm font-medium leading-relaxed text-white/95">{rec.verdict}</p>
          <div className="mt-5 flex items-center gap-3 rounded-sm bg-white/15 p-3">
            <div className="font-display text-3xl font-extrabold">{rec.retention_score}</div>
            <div className="text-xs font-semibold leading-tight text-white/90">
              индекс «Я останусь»: насколько вероятно, что тебе понравится работа и ты задержишься после практики
            </div>
          </div>
        </div>
      </div>
      <Card className="p-5">
        <div className="font-display text-lg font-extrabold">Профиль из игры</div>
        <div className="mt-3 space-y-3">
          {COMPETENCY_META.map((m) => (
            <div key={m.key}>
              <div className="flex justify-between text-xs font-bold">
                <span>{m.label}</span>
                <span className="font-mono">{comp[m.key] ?? '—'}</span>
              </div>
              <Progress value={comp[m.key] ?? 0} className="mt-1" />
            </div>
          ))}
        </div>
        <div className="mt-5 font-display text-lg font-extrabold">Рекомендованные вакансии</div>
        <div className="mt-2 space-y-2">
          {(rec.matches || []).slice(0, 3).map((m, i) => (
            <div key={m.id || m.title} className={cx('flex items-center gap-3 rounded-sm border-2 p-3', i === 0 ? 'border-brand bg-malt-light/40' : 'border-ink/15')}>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line font-mono text-sm font-extrabold" style={{ background: `conic-gradient(${BLOCKS[m.block]?.color || '#D50032'} ${m.match * 3.6}deg, #fff 0)` }}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-paper text-[11px]">{m.match}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold">{m.title}</div>
                <div className="text-xs text-ink-mute">
                  {m.dept} · {m.salary}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

const MARKET_RENT = 33000
const DORM = 3400
const SHIFTS = 15
const MEAL = 450

export function SalaryCalculator() {
  const { state, actions } = useGame()
  const last = state.telemetry.calculator.last
  const [dept, setDept] = useState(last?.dept || 'bottling')
  const [nights, setNights] = useState(last?.nights ?? 7)
  const [dorm, setDorm] = useState(last?.dorm ?? true)
  const [meals, setMeals] = useState(last?.meals ?? true)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => actions.calc({ dept, nights, dorm, meals }), 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, nights, dorm, meals])

  const d = DEPARTMENTS.find((x) => x.id === dept)
  const calc = useMemo(() => {
    const hourly = d.base / (SHIFTS * 12)
    const nightBonus = nights * 8 * hourly * 0.2 // 8 ночных часов (22–06) × минимум +20% по ТК РФ
    const gross = d.base + nightBonus
    const net = gross * 0.87
    const saveDorm = dorm ? MARKET_RENT - DORM : 0
    const saveMeals = meals ? SHIFTS * MEAL * 0.5 : 0
    const saveUniform = 1500
    const savings = saveDorm + saveMeals + saveUniform
    return { gross, net, nightBonus, saveDorm, saveMeals, saveUniform, savings, total: net + savings }
  }, [d, nights, dorm, meals])

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b-2 border-brand bg-kraft-light px-5 py-3 font-display font-extrabold uppercase">
        <Calculator className="h-5 w-5 text-brand" /> Калькулятор выгоды
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-5">
          <label className="block">
            <span className="text-xs font-extrabold uppercase text-ink-mute">Подразделение</span>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2.5 font-semibold">
              {DEPARTMENTS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}: от {x.base.toLocaleString('ru-RU')} ₽
                </option>
              ))}
            </select>
          </label>
          <div>
            <div className="flex items-center justify-between text-xs font-extrabold uppercase text-ink-mute">
              <span className="flex items-center gap-1">
                <Moon className="h-4 w-4" /> Ночных смен в месяц (20:00–8:00)
              </span>
              <span className="font-mono text-base text-ink">{nights}</span>
            </div>
            <input type="range" min="0" max="8" value={nights} onChange={(e) => setNights(+e.target.value)} className="och-range mt-3 w-full" />
            <div className="mt-1 flex justify-between text-[11px] text-ink-mute">
              <span>только дни</span>
              <span>2/2 день-ночь ≈ 7–8</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle on={dorm} set={setDorm} icon={Home} label="Живу в общежитии" sub="3 400 ₽ вместо ~33 000 ₽" />
            <Toggle on={meals} set={setMeals} icon={UtensilsCrossed} label="Обедаю в столовой" sub="компания платит 50%" />
          </div>
        </div>
        <div className="rounded-sm border border-line bg-graphite p-5 text-white">
          <div className="text-xs font-bold uppercase text-white/60">Начислено (до НДФЛ)</div>
          <div className="font-display text-4xl font-extrabold">{fmtRub(calc.gross)}</div>
          <div className="mt-1 text-xs text-white/70">
            оклад {fmtRub(d.base)} + ночные ≈ {fmtRub(calc.nightBonus)} · на руки ≈ {fmtRub(calc.net)}
          </div>
          <div className="mt-4 space-y-1.5 text-sm">
            <Row k="Экономия на жилье" v={calc.saveDorm} />
            <Row k="Экономия на питании" v={calc.saveMeals} />
            <Row k="Спецодежда и прачечная" v={calc.saveUniform} />
          </div>
          <div className="mt-4 rounded-sm bg-brand p-3">
            <div className="text-xs font-bold uppercase text-white/80">Экономишь в месяц ≈</div>
            <div className="font-display text-3xl font-extrabold">{fmtRub(calc.savings)}</div>
            <div className="mt-1 text-xs text-white/90">Итого эквивалент дохода ≈ {fmtRub(calc.total)} в месяц</div>
          </div>
          <p className="mt-3 flex gap-1.5 text-[11px] leading-snug text-white/55">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Оценка: ночные часы посчитаны по минимуму ТК РФ (+20%), на заводе коэффициент может быть выше. Точные цифры — в отделе подбора. Твои настройки анонимно видит HR, чтобы предложить подходящий график.
          </p>
        </div>
      </div>
    </Card>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-1">
      <span className="text-white/75">{k}</span>
      <span className="font-mono font-bold">{v ? `+${fmtRub(v)}` : '—'}</span>
    </div>
  )
}

function Toggle({ on, set, icon: I, label, sub }) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      className={cx(
        'flex items-start gap-2.5 rounded-sm border-2 p-3.5 text-left transition',
        on
          ? 'bg-red-950/80 text-white border-red-500 ring-1 ring-red-500 shadow-sm'
          : 'bg-zinc-800/90 text-zinc-100 border-zinc-700 hover:border-zinc-500'
      )}
      aria-pressed={on}
    >
      <span className={cx('mt-0.5 grid h-5 w-9 shrink-0 items-center rounded-full border border-zinc-600 px-0.5 transition', on ? 'bg-red-600' : 'bg-zinc-700')}>
        <span className={cx('block h-3.5 w-3.5 rounded-full bg-white transition', on && 'translate-x-3.5')} />
      </span>
      <span>
        <span className="flex items-center gap-1.5 text-sm font-extrabold text-white">
          <I className="h-4 w-4 text-red-400" /> {label}
        </span>
        <span className="block text-xs text-zinc-300 mt-0.5 leading-snug">{sub}</span>
      </span>
    </button>
  )
}

