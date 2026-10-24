import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, RotateCcw, Check, X, Smartphone, Wifi, BatteryFull } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { PANTONE, KERN_FLAVORS, MIRAPOLIS_STEPS, MIRAPOLIS_TOOLS, PHOTO } from '../../data/content.js'
import { StationShell, StationReward } from '../../components/StationKit.jsx'
import { Button, Card, TornPhoto, VerbTag, cx } from '../../components/ui.jsx'

const STEPS = ['Веер Pantone · KERN', 'Тест Mirapolis', 'Цифра кода']
const ROLES = ['Фон банки', 'Акцент', 'Детали']

function KernCan({ colors, flavor }) {
  const [bg, accent, detail] = colors.map((id) => PANTONE.find((p) => p.id === id)?.hex)
  return (
    <svg viewBox="0 0 160 300" className="h-[300px] w-auto drop-shadow-xl">
      <defs>
        <linearGradient id="shine" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".0" />
          <stop offset=".25" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".0" />
          <stop offset=".85" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <rect x="22" y="6" width="116" height="18" rx="6" fill="#C8CDD2" stroke="#4A4A4A" strokeWidth="3" />
      <path d="M14 26 h132 v246 q0 18 -18 18 h-96 q-18 0 -18 -18z" fill={bg || '#E8EBEC'} stroke="#4A4A4A" strokeWidth="3" style={{ transition: 'fill .3s' }} />
      {/* полосы */}
      {[52, 72, 230, 250].map((y) => (
        <rect key={y} x="14" y={y} width="132" height="7" fill={detail || '#C9CED0'} opacity=".8" style={{ transition: 'fill .3s' }} />
      ))}
      <circle cx="80" cy="150" r="54" fill="#FFFFFF" stroke={accent || '#4A4A4A'} strokeWidth="7" style={{ transition: 'stroke .3s' }} />
      <text x="80" y="128" textAnchor="middle" fontSize="11" fontWeight="800" fill="#4A4A4A" fontFamily="Montserrat, Arial">
        MALT DRINK
      </text>
      <text x="80" y="160" textAnchor="middle" fontSize="34" fontWeight="900" fill={accent || '#4A4A4A'} fontFamily="Montserrat, Arial" style={{ transition: 'fill .3s' }}>
        KERN
      </text>
      <text x="80" y="178" textAnchor="middle" fontSize="11" fontWeight="800" fill={detail || '#8A8F92'} fontFamily="Montserrat, Arial" style={{ transition: 'fill .3s' }}>
        NO ALCO
      </text>
      {flavor === 'pineapple' ? (
        <g transform="translate(80 94)">
          <path d="M-6 -6 l-8 -16 10 8 4 -14 4 14 10 -8 -8 16z" fill={accent || '#3BA935'} stroke="#4A4A4A" strokeWidth="1.5" />
          <ellipse cx="0" cy="6" rx="10" ry="13" fill="#F5C400" stroke="#4A4A4A" strokeWidth="1.5" />
          <path d="M-8 0 l16 10 M-8 10 l16 -10" stroke="#A2AAAD" strokeWidth="1.3" />
        </g>
      ) : (
        <g transform="translate(80 96)">
          <path d="M-4 -14 q4 -6 8 0" stroke="#3BA935" strokeWidth="3" fill="none" />
          {[[-5, -6], [5, -6], [0, -2], [-7, 3], [7, 3], [0, 6], [-4, 11], [4, 11]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.6" fill="#D0145A" stroke="#4A4A4A" strokeWidth="1.2" />
          ))}
        </g>
      )}
      <path d="M14 26 h132 v246 q0 18 -18 18 h-96 q-18 0 -18 -18z" fill="url(#shine)" />
    </svg>
  )
}

function PantoneGame({ onDone }) {
  const [flavor, setFlavor] = useState('pineapple')
  const [colors, setColors] = useState([])
  const [result, setResult] = useState(null)
  const pick = (id) => {
    if (result || colors.length >= 3 || colors.includes(id)) return
    setColors((c) => [...c, id])
  }
  const evaluate = () => {
    const ideal = KERN_FLAVORS[flavor].ideal
    const inSet = colors.filter((c) => ideal.includes(c)).length
    const exact = colors.filter((c, i) => ideal[i] === c).length
    const score = Math.round(inSet * 25 + exact * (25 / 3))
    setResult({ score, inSet, exact })
  }
  const comment = !result
    ? null
    : result.score >= 90
      ? 'Арт-директор: «Беру в печать! Палитра читается с полки за 3 метра».'
      : result.score >= 60
        ? 'Арт-директор: «Хорошая база, но вкус считывается не сразу. Поменяй акцент».'
        : 'Арт-директор: «Покупатель не поймёт, какой это вкус. Цвет должен подсказывать фрукт».'

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="p-4 sm:p-6">
        <VerbTag>Создай лицо банки</VerbTag>
        <p className="mt-2 text-sm text-ink-soft">
          Дизайнер ОЧАКОВО подбирает цвета упаковки по вееру Pantone. Выбери вкус, затем по очереди назначь три цвета: фон, акцент и детали 3D-макета банки KERN.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(KERN_FLAVORS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => {
                setFlavor(k)
                setColors([])
                setResult(null)
              }}
              className={cx('rounded-sm border border-line px-3 py-2 text-sm font-extrabold', flavor === k ? 'bg-graphite text-white shadow-pop' : 'bg-paper')}
            >
              {v.label.replace('KERN Malt Drink No Alco · ', '')}
            </button>
          ))}
        </div>

        {/* веер */}
        <div className="relative mx-auto mt-6 h-[230px] max-w-[520px]">
          {PANTONE.map((p, i) => {
            const n = PANTONE.length
            const ang = -64 + (i * 128) / (n - 1)
            const used = colors.indexOf(p.id)
            return (
              <motion.button
                key={p.id}
                onClick={() => pick(p.id)}
                whileHover={{ y: -14 }}
                className={cx('absolute bottom-0 left-1/2 h-[200px] w-[58px] -ml-[29px] hover:z-20 overflow-hidden rounded-sm border border-line bg-paper text-left shadow-pop-sm', used >= 0 && 'ring-4 ring-brand')}
                style={{ transformOrigin: '50% 95%', rotate: ang }}
                aria-label={p.code}
              >
                <div className="h-[150px]" style={{ background: p.hex }} />
                <div className="px-1 pt-1 font-mono text-[8px] font-bold leading-tight">{p.code}</div>
                {used >= 0 && <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-paper font-mono text-[10px] font-extrabold">{used + 1}</span>}
              </motion.button>
            )
          })}
          <div className="absolute bottom-[-6px] left-1/2 z-10 h-5 w-5 -translate-x-1/2 rounded-full border border-line bg-malt" />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {PANTONE.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              disabled={!!result || colors.includes(p.id) || colors.length >= 3}
              className="flex items-center gap-1.5 border border-line bg-paper py-1 pl-1 pr-2 text-[11px] font-semibold disabled:opacity-40"
              aria-label={`Выбрать ${p.code}`}
              title={p.name}
            >
              <span className="h-4 w-4" style={{ background: p.hex }} />
              {p.code.replace('PANTONE ', '')}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {ROLES.map((r, i) => {
            const p = PANTONE.find((x) => x.id === colors[i])
            return (
              <div key={r} className={cx('rounded-sm border-2 p-2 text-center', i === colors.length && !result ? 'border-brand' : 'border-ink/20')}>
                <div className="text-[11px] font-extrabold uppercase text-ink-mute">{r}</div>
                <div className="mx-auto mt-1 h-8 w-full rounded-sm border border-line" style={{ background: p?.hex || 'repeating-linear-gradient(45deg,#fff 0 6px,#eee 6px 12px)' }} />
                <div className="mt-1 truncate text-[11px] font-semibold">{p?.name || '—'}</div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {!result ? (
            <>
              <Button disabled={colors.length < 3} onClick={evaluate}>
                Показать арт-директору
              </Button>
              <Button variant="ghost" onClick={() => setColors([])}>
                <RotateCcw className="h-4 w-4" /> Сбросить
              </Button>
            </>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-3 rounded-sm border border-line bg-cream p-3">
              <div className="font-display text-3xl font-extrabold text-brand">{result.score}%</div>
              <p className="flex-1 text-sm font-semibold">{comment}</p>
              <Button onClick={() => onDone({ pantone_match: result.score, flavor, colors })}>
                В СДО Mirapolis <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#fff,#E8EBEC)] p-6">
          <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink-mute">3D-макет · превью</div>
          <motion.div animate={{ rotate: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 5 }}>
            <KernCan colors={colors} flavor={flavor} />
          </motion.div>
        </Card>
        <TornPhoto src={PHOTO('design-kern3d.jpg')} alt="Дизайн банки KERN в 3D-редакторе" seed={13} rec recLabel="REC · ДИЗАЙН" className="h-36 w-full" />
      </div>
    </div>
  )
}

function Mirapolis({ onDone }) {
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [correct, setCorrect] = useState(0)
  const step = MIRAPOLIS_STEPS[i]

  // Shuffle tools dynamically per question
  const shuffledTools = useMemo(() => {
    const list = [...MIRAPOLIS_TOOLS]
    for (let j = list.length - 1; j > 0; j--) {
      const r = Math.floor(Math.random() * (j + 1));
      [list[j], list[r]] = [list[r], list[j]]
    }
    return list
  }, [i])
  const answer = (t) => {
    if (chosen) return
    setChosen(t)
    if (t === step.answer) setCorrect((c) => c + 1)
  }
  const next = () => {
    if (i + 1 < MIRAPOLIS_STEPS.length) {
      setI(i + 1)
      setChosen(null)
    } else onDone({ mirapolis_correct: correct, mirapolis_total: MIRAPOLIS_STEPS.length })
  }
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* телефон */}
      <div className="mx-auto w-[320px] rounded-[42px] border border-line bg-graphite p-3 shadow-pop">
        <div className="overflow-hidden rounded-[32px] bg-paper">
          <div className="flex items-center justify-between bg-[#1D3B6E] px-5 pb-2 pt-3 text-[11px] font-bold text-white">
            <span>12:27</span>
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3" /> <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="bg-[#1D3B6E] px-5 pb-4 text-white">
            <div className="text-[11px] opacity-80">Mirapolis · Инструменты менеджмента</div>
            <div className="font-extrabold">Финальное тестирование</div>
            <div className="mt-3 flex gap-1.5">
              {MIRAPOLIS_STEPS.map((_, k) => (
                <span key={k} className={cx('h-1.5 flex-1 rounded-full', k < i || (k === i && chosen) ? 'bg-paper' : k === i ? 'bg-white/60' : 'bg-white/25')} />
              ))}
            </div>
          </div>
          <div className="min-h-[360px] p-4">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="text-[11px] font-bold uppercase text-[#1D3B6E]">Вопрос {i + 1} из 4 · сопоставьте цель и метод</div>
                <p className="mt-2 text-sm font-bold leading-snug text-ink">{step.task}</p>
                <div className="mt-3 space-y-2">
                  {shuffledTools.map((t) => {
                    const ok = chosen && t === step.answer
                    const bad = chosen === t && t !== step.answer
                    return (
                      <button
                        key={t}
                        onClick={() => answer(t)}
                        className={cx(
                          'flex w-full items-center justify-between rounded-sm border-2 px-3 py-2.5 text-left text-sm font-bold transition',
                          !chosen && 'border-[#1D3B6E]/20 hover:border-[#1D3B6E]',
                          ok && 'border-lime bg-lime/15',
                          bad && 'border-brand bg-brand-50',
                          chosen && !ok && !bad && 'border-transparent opacity-50',
                        )}
                      >
                        {t}
                        {ok && <Check className="h-4 w-4 text-lime" />}
                        {bad && <X className="h-4 w-4 text-brand" />}
                      </button>
                    )
                  })}
                </div>
                {chosen && (
                  <div className="mt-3">
                    <p className="text-xs text-ink-soft">{step.hint}</p>
                    <button onClick={next} className="mt-3 w-full rounded-sm bg-[#1D3B6E] py-3 text-sm font-extrabold text-white">
                      {i + 1 < MIRAPOLIS_STEPS.length ? 'Далее' : 'Завершить тест'}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Card className="p-5">
          <VerbTag>Обучайся легко и просто</VerbTag>
          <h3 className="mt-3 font-display text-2xl font-extrabold">Это реальный формат обучения ОЧАКОВО</h3>
          <p className="mt-2 text-sm text-ink-soft">
            В вакансионных роликах сотрудники проходят в мобильной СДО Mirapolis курс «Инструменты менеджмента» и финальный тест из 4 шагов: SMART, SWOT, диаграмма Исикавы и «5 почему». Пройди его сейчас, и наставник увидит, что ты готов(а) к обучению с первого дня.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold">
            <Smartphone className="h-4 w-4 text-brand" /> Верных ответов: {correct}/{MIRAPOLIS_STEPS.length}
          </div>
        </Card>
        <TornPhoto src={PHOTO('line-mirapolis.jpg')} alt="Обучение в Mirapolis с телефона" seed={17} rec recLabel="REC · MIRAPOLIS" className="h-48 w-full" />
      </div>
    </div>
  )
}

export default function DesignStation() {
  const { state, actions } = useGame()
  const saved = state.telemetry.stations.design
  const [step, setStep] = useState(saved ? 2 : 0)
  const [pan, setPan] = useState(null)

  const finish = (mira, skipped = false) => {
    const p = skipped ? { pantone_match: 75 } : pan
    const m = skipped ? { mirapolis_correct: 3, mirapolis_total: 4 } : mira
    const breakdown = [
      { label: `Палитра KERN: совпадение ${p.pantone_match}%`, points: p.pantone_match, max: 100 },
      { label: `Тест Mirapolis: ${m.mirapolis_correct}/4`, points: Math.round(m.mirapolis_correct * 37.5), max: 150 },
    ]
    const total = breakdown.reduce((a, b) => a + b.points, 0)
    actions.stationDone('design', total, { ...p, ...m, breakdown }, skipped)
    setStep(2)
  }

  return (
    <StationShell
      id="design"
      steps={STEPS}
      step={step}
      onSkip={() => finish(null, true)}
      tip={step === 0 ? 'Подсказка: покупатель выбирает банку за полсекунды. Фон должен «говорить» вкусом, а акцент — помогать прочитать бренд.' : step === 1 ? 'SMART — для цели, SWOT — для стратегии, Исикава — для группы причин, «5 почему» — для корня одной проблемы.' : null}
    >
      {step === 0 && (
        <PantoneGame
          onDone={(r) => {
            setPan(r)
            setStep(1)
          }}
        />
      )}
      {step === 1 && <Mirapolis onDone={(m) => finish(m)} />}
      {step === 2 && <StationReward id="design" breakdown={saved?.breakdown || []} total={saved?.score || 0} />}
    </StationShell>
  )
}
