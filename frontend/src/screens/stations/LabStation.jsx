import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplet, Droplets, Hand, ArrowRight, Star, ScanLine } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { LAB_SAMPLES, QUIZZES } from '../../data/content.js'
import { StationShell, Quiz, StationReward } from '../../components/StationKit.jsx'
import { Button, Card, VerbTag, cx } from '../../components/ui.jsx'

const STEPS = ['Титрование', 'ATAGO + дегустация', 'Мини-квиз', 'Цифра кода']

const lerp = (a, b, t) => a + (b - a) * t
function mix(c1, c2, t) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const a = p(c1)
  const b = p(c2)
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], Math.max(0, Math.min(1, t))))).join(',')})`
}

function titrationAccuracy(drops, endpoint) {
  const d = drops - endpoint
  if (d === 0) return 100
  if (d < 0) return Math.max(10, 55 - Math.abs(d) * 12)
  return [100, 82, 62, 45][d] ?? 30
}

/* ------------------------------------------------------------- титрование */
function Titration({ onDone }) {
  const [endpoint] = useState(() => 16 + Math.floor(Math.random() * 9))
  const [drops, setDrops] = useState(0)
  const [flash, setFlash] = useState(0)
  const [falling, setFalling] = useState([])
  const [stopped, setStopped] = useState(false)

  const over = drops - endpoint
  const base = over >= 0 ? ['#F7C3D3', '#EF86AB', '#DF4A84', '#B5175C'][Math.min(over, 3)] : null
  const flaskColor = base || mix('#FFF6DA', '#F7C3D3', flash)

  const addDrops = (n) => {
    if (stopped) return
    const next = drops + n
    setDrops(next)
    setFalling((f) => [...f.slice(-6), Date.now() + Math.random()])
    if (next < endpoint) {
      const closeness = Math.pow(next / endpoint, 3)
      setFlash(closeness)
      setTimeout(() => setFlash(0), 250 + closeness * 1100)
    }
  }
  const stop = () => {
    setStopped(true)
  }
  const acc = titrationAccuracy(drops, endpoint)
  const level = Math.max(8, 100 - drops * 2.2)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="relative overflow-hidden bg-[linear-gradient(180deg,rgb(var(--och-paper)),rgb(var(--och-kraft-light)))] p-4 sm:p-6">
        <VerbTag>Контролируй процесс</VerbTag>
        <div className="mt-2 text-sm text-ink-soft">
          Индикатор — фенолфталеин. Добавляй титрант по каплям: розовый «всплеск» исчезает, пока точка не достигнута. Остановись на <b>первой устойчивой бледно-розовой</b> окраске.
        </div>
        <div className="relative mx-auto mt-4 h-[360px] w-[260px]">
          <svg viewBox="0 0 260 360" className="absolute inset-0 h-full w-full">
            {/* штатив */}
            <rect x="196" y="10" width="8" height="330" fill="#8A8F92" />
            <rect x="150" y="336" width="100" height="12" rx="3" fill="#626262" />
            <rect x="120" y="70" width="84" height="8" fill="#8A8F92" />
            {/* бюретка */}
            <rect x="112" y="10" width="20" height="190" rx="4" fill="#ffffffcc" stroke="#4A4A4A" strokeWidth="2.5" />
            <rect x="115" y={13 + (190 - 6) * (1 - level / 100)} width="14" height={(190 - 6) * (level / 100)} fill="#CFE8FF" />
            {[...Array(10)].map((_, i) => (
              <line key={i} x1="112" x2={i % 2 ? 120 : 124} y1={24 + i * 17} y2={24 + i * 17} stroke="#4A4A4A" strokeWidth="1.2" />
            ))}
            <rect x="104" y="200" width="36" height="10" rx="3" fill="#D50032" stroke="#4A4A4A" strokeWidth="2" />
            <path d="M118 210 h8 l-2 26 h-4z" fill="#ffffffcc" stroke="#4A4A4A" strokeWidth="2" />
            {/* колба */}
            <path d="M104 250 h36 v26 l40 60 q4 8 -6 8 h-104 q-10 0 -6 -8 l42 -60z" fill="#ffffff99" stroke="#4A4A4A" strokeWidth="2.5" />
            <path d="M84 300 l-28 40 q-3 5 4 5 h124 q7 0 4 -5 l-28 -40z" fill={flaskColor} style={{ transition: 'fill .35s' }} />
            <ellipse cx="122" cy="300" rx="38" ry="4" fill="#ffffff66" />
          </svg>
          <AnimatePresence>
            {falling.map((k) => (
              <motion.span
                key={k}
                className="absolute left-[118px] top-[234px] h-2.5 w-2 rounded-b-full rounded-t-[40%] bg-sky-300"
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 62, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeIn' }}
              />
            ))}
          </AnimatePresence>
          <div className="absolute right-0 top-0 rounded-sm border border-line bg-graphite px-2 py-1 text-right font-mono text-xs text-white">
            <div className="text-white/60">V титранта</div>
            <div className="text-base font-bold">{(drops * 0.05).toFixed(2)} мл</div>
            <div className="text-white/60">{drops} кап.</div>
          </div>
        </div>
        {!stopped ? (
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button variant="light" onClick={() => addDrops(1)}>
              <Droplet className="h-4 w-4" /> 1 капля
            </Button>
            <Button variant="light" onClick={() => addDrops(3)}>
              <Droplets className="h-4 w-4" /> 3 капли
            </Button>
            <Button onClick={stop} disabled={drops === 0}>
              <Hand className="h-4 w-4" /> Стоп: точка эквивалентности
            </Button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-sm border border-line bg-paper p-4 text-center">
            <div className="font-mono text-xs font-bold uppercase text-ink-mute">Точка эквивалентности: {endpoint} кап. · ты остановился на {drops}</div>
            <div className="mt-1 font-display text-3xl font-extrabold text-brand">Точность {acc}%</div>
            <div className="mt-1 text-sm text-ink-soft">
              {acc === 100 ? 'Идеально — как у ведущего химика!' : over > 0 ? 'Перетитровано: раствор ушёл в малиновый.' : 'Рано остановился: окраска ещё не устойчива.'}
            </div>
            <Button className="mt-3" onClick={() => onDone({ titration_accuracy: acc, drops, endpoint })}>
              К рефрактометру ATAGO <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </Card>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="font-display text-lg font-extrabold">Что происходит</div>
          <ul className="mt-2 space-y-2 text-sm text-ink-soft">
            <li>• Лаборант определяет кислотность напитка: щёлочь из бюретки нейтрализует кислоты образца.</li>
            <li>• В точке эквивалентности индикатор фенолфталеин даёт устойчивую бледно-розовую окраску.</li>
            <li>• Лишняя капля = перетитровка и неверный результат партии.</li>
          </ul>
        </Card>
        <Card className="bg-kraft-light p-4 text-sm">
          <b>В реальной лаборатории</b> пробы берут с каждой партии, результаты вносят в систему, а наставник проверяет первые анализы стажёра.
        </Card>
      </div>
    </div>
  )
}

/* --------------------------------------------------- рефрактометр + дегустация */
function Refractometer({ onDone }) {
  const samples = useMemo(() => LAB_SAMPLES.map((s) => ({ ...s, reading: +(s.value + (Math.random() - 0.5) * 0.06).toFixed(2) })), [])
  const [active, setActive] = useState(null)
  const [measuring, setMeasuring] = useState(false)
  const [measured, setMeasured] = useState({})
  const [verdict, setVerdict] = useState({})
  const [rating, setRating] = useState({})

  const measure = (s) => {
    setActive(s.n)
    if (measured[s.n]) return
    setMeasuring(true)
    setTimeout(() => {
      setMeasured((m) => ({ ...m, [s.n]: s.reading }))
      setMeasuring(false)
    }, 1100)
  }
  const cur = samples.find((s) => s.n === active)
  const ready = samples.every((s) => verdict[s.n] && rating[s.n])

  const finish = () => {
    const correct = samples.filter((s) => (s.reading >= s.min && s.reading <= s.max ? 'ok' : 'bad') === verdict[s.n]).length
    onDone({ brix_correct: correct, brix_total: 4, tasting_done: true, tasting: rating })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      {/* прибор */}
      <div className="self-start rounded-[28px] border border-line och-light bg-[linear-gradient(160deg,#ECEBE8,#C9C7C2)] p-4 shadow-pop">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="font-display text-sm font-extrabold tracking-widest text-ink/70">ATAGO</span>
          <span className="font-mono text-[11px] font-bold text-ink/60">RX-7000i</span>
        </div>
        <div className="scanlines relative h-48 overflow-hidden rounded-sm border border-line bg-[#0D2236] p-3 font-mono text-[#BFF3FF]">
          <div className="flex justify-between text-[10px] text-[#7FB6C9]">
            <span>Brix (%) · nD</span>
            <span>20.00 °C</span>
          </div>
          {measuring ? (
            <div className="mt-10 text-center text-sm">
              Measuring
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                ...
              </motion.span>
            </div>
          ) : cur && measured[cur.n] ? (
            <motion.div key={cur.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mt-2 text-[11px] text-[#7FB6C9]">
                Образец №{cur.n} · {cur.name}
              </div>
              <div className="text-5xl font-bold tracking-tight text-white">{measured[cur.n].toFixed(2)}</div>
              <div className="mt-1 text-[11px]">
                Норма: {cur.min.toFixed(1)}–{cur.max.toFixed(1)} °Bx · nD {(1.3330 + measured[cur.n] * 0.00145).toFixed(4)}
              </div>
            </motion.div>
          ) : (
            <div className="mt-12 text-center text-xs text-[#7FB6C9]">Нанеси образец на призму</div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-line bg-[radial-gradient(circle,#555_0,#222_70%)]">
            <div className="h-8 w-8 rounded-full bg-[radial-gradient(circle,#9fd3ff,#1b3a52)]" />
          </div>
          <div className="text-right text-[11px] font-semibold text-ink/60">
            Призма
            <br />
            сапфир
          </div>
        </div>
      </div>

      {/* дегустационный лист */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-brand bg-kraft-light px-4 py-3">
          <div className="font-display font-extrabold uppercase">Дегустационный лист ОЧАКОВО</div>
          <span className="font-mono text-xs font-bold">образцы №5–8</span>
        </div>
        <div className="divide-y-2 divide-dashed divide-ink/10">
          {samples.map((s) => (
            <div key={s.n} className={cx('grid items-center gap-3 p-3 sm:grid-cols-[auto_1fr_auto]', active === s.n && 'bg-cream')}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-line font-mono text-sm font-extrabold text-white" style={{ background: s.color }}>
                  {s.n}
                </span>
                <div className="sm:hidden">
                  <div className="text-sm font-extrabold">{s.name}</div>
                  <div className="text-xs text-ink-mute">норма {s.min}–{s.max} °Bx</div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-extrabold">{s.name}</div>
                <div className="text-xs text-ink-mute">
                  норма {s.min}–{s.max} °Bx {measured[s.n] != null && <b className="ml-1 text-ink">· изм. {measured[s.n].toFixed(2)}</b>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={measured[s.n] != null ? 'ghost' : 'light'} onClick={() => measure(s)} disabled={measuring}>
                  <ScanLine className="h-4 w-4" /> {measured[s.n] != null ? 'Показать' : 'Измерить'}
                </Button>
                <div className="flex overflow-hidden rounded-sm border border-line text-xs font-extrabold">
                  {[
                    ['ok', 'Норма'],
                    ['bad', 'Брак'],
                  ].map(([k, l]) => (
                    <button
                      key={k}
                      disabled={measured[s.n] == null}
                      onClick={() => setVerdict((v) => ({ ...v, [s.n]: k }))}
                      className={cx('px-2.5 py-1.5 disabled:opacity-30', verdict[s.n] === k ? (k === 'ok' ? 'bg-lime text-white' : 'bg-brand text-white') : 'bg-paper')}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex" title="Органолептика: цвет, аромат, вкус">
                  {[1, 2, 3, 4, 5].map((k) => (
                    <button key={k} onClick={() => setRating((r) => ({ ...r, [s.n]: k }))} aria-label={`Оценка ${k}`}>
                      <Star className={cx('h-5 w-5', (rating[s.n] || 0) >= k ? 'fill-malt text-malt' : 'text-ink/25')} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-brand bg-paper p-4">
          <p className="text-xs text-ink-soft">Измерь Brix, реши «норма / брак» и поставь органолептическую оценку (цвет, аромат, вкус).</p>
          <Button disabled={!ready} onClick={finish}>
            Подписать лист <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function LabStation() {
  const { state, actions } = useGame()
  const saved = state.telemetry.stations.lab
  const [step, setStep] = useState(saved ? 3 : 0)
  const [res, setRes] = useState({})

  const finish = (quizCorrect, skipped = false) => {
    const r = skipped ? { titration_accuracy: 70, drops: 0, endpoint: 0, brix_correct: 3, brix_total: 4, tasting_done: true } : res
    const qc = skipped ? 1 : quizCorrect
    const breakdown = [
      { label: `Титрование: точность ${r.titration_accuracy}%`, points: Math.round(r.titration_accuracy * 0.8), max: 80 },
      { label: `Рефрактометр ATAGO: верных вердиктов ${r.brix_correct}/4`, points: r.brix_correct * 20, max: 80 },
      { label: 'Дегустационный лист заполнен', points: 20, max: 20 },
      { label: `Мини-квиз: ${qc}/${QUIZZES.lab.length}`, points: qc * 35, max: 70 },
    ]
    const total = breakdown.reduce((a, b) => a + b.points, 0)
    actions.stationDone('lab', total, { ...r, quiz_correct: qc, quiz_total: QUIZZES.lab.length, breakdown }, skipped)
    setStep(3)
  }

  return (
    <StationShell
      id="lab"
      steps={STEPS}
      step={step}
      onSkip={() => finish(1, true)}
      tip={
        step === 0
          ? 'Не торопись: у опытного лаборанта рука сама замирает за каплю до точки. Следи, как долго держится розовый всплеск.'
          : step === 1
            ? 'Brix — это содержание сухих веществ (в основном сахара). Если показание вне нормы рецептуры, партия уходит на перепроверку.'
            : null
      }
    >
      {step === 0 && (
        <Titration
          onDone={(r) => {
            setRes((x) => ({ ...x, ...r }))
            setStep(1)
          }}
        />
      )}
      {step === 1 && (
        <Refractometer
          onDone={(r) => {
            setRes((x) => ({ ...x, ...r }))
            setStep(2)
          }}
        />
      )}
      {step === 2 && <Quiz station="lab" questions={QUIZZES.lab} onDone={(c) => finish(c)} />}
      {step === 3 && <StationReward id="lab" breakdown={saved?.breakdown || []} total={saved?.score || 0} />}
    </StationShell>
  )
}

