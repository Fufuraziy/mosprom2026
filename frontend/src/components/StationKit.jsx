import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, X, FastForward, Map } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { STATIONS, PHOTO } from '../data/content.js'
import { Button, Card, Icon, RecBadge, Steps, TornPhoto, VerbTag, cx } from './ui.jsx'
import Krafty from './Krafty.jsx'

export function StationShell({ id, steps, step, onSkip, children, tip }) {
  const { state, actions } = useGame()
  const s = STATIONS.find((x) => x.id === id)
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <button onClick={() => actions.go('hub')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Карта станций
      </button>
      <div className="mb-6 grid items-end gap-5 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded border-2 border-ink bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white">СТАНЦИЯ {s.n}/4</span>
            <span className="rounded border-2 border-ink px-2 py-0.5 text-xs font-extrabold" style={{ background: s.color, color: '#fff' }}>
              {s.salary}
            </span>
            <RecBadge label={`REC · ${s.role.toUpperCase()}`} className="max-w-full truncate" />
          </div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-black leading-none tracking-tight sm:text-5xl">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink text-white shadow-pop-sm sm:h-14 sm:w-14" style={{ background: s.color }}>
              <Icon name={s.icon} className="h-7 w-7" />
            </span>
            {s.title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-ink-soft sm:text-base">{s.game}</p>
        </div>
        <TornPhoto src={PHOTO(s.photo)} alt={s.title} seed={s.n * 7} className="hidden h-28 w-48 md:block" rotate={2} />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Steps steps={steps} current={step} className="min-w-[260px] flex-1" />
        {state.demoFast && onSkip && step < steps.length - 1 && (
          <Button variant="malt" size="sm" onClick={onSkip}>
            <FastForward className="h-4 w-4" /> Пропустить мини-игру (демо)
          </Button>
        )}
      </div>
      {tip && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-ink bg-white p-3 shadow-pop-sm">
          <Krafty size={44} mood="think" className="shrink-0" />
          <p className="pt-1 text-sm font-semibold leading-snug">{tip}</p>
        </div>
      )}
      {children}
    </div>
  )
}

export function Quiz({ station, questions, onDone, pointsPer = 35 }) {
  const { actions } = useGame()
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [correct, setCorrect] = useState(0)
  const q = questions[i]
  const answered = chosen !== null

  const choose = (k) => {
    if (answered) return
    setChosen(k)
    const ok = k === q.answer
    if (ok) setCorrect((c) => c + 1)
    actions.quiz(station, i, ok)
  }
  const next = () => {
    if (i + 1 < questions.length) {
      setI(i + 1)
      setChosen(null)
    } else onDone(correct)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-ink bg-kraft-light px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-display text-sm font-black uppercase sm:text-base">
          <BookOpen className="h-5 w-5 text-brand" /> Историческая справка · мини-квиз
        </div>
        <span className="font-mono text-sm font-bold">
          {i + 1}/{questions.length}
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <p className="font-display text-lg font-black leading-snug sm:text-xl">{q.q}</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {q.options.map((o, k) => {
                const isRight = answered && k === q.answer
                const isWrong = answered && k === chosen && k !== q.answer
                return (
                  <button
                    key={k}
                    onClick={() => choose(k)}
                    disabled={answered}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition',
                      !answered && 'border-ink/25 bg-white hover:border-ink hover:shadow-pop-sm',
                      isRight && 'border-ink bg-lime text-white shadow-pop-sm',
                      isWrong && 'border-ink bg-brand text-white',
                      answered && !isRight && !isWrong && 'border-ink/10 bg-white opacity-60',
                    )}
                  >
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 font-mono text-xs', isRight || isWrong ? 'border-white' : 'border-ink/30')}>
                      {isRight ? <Check className="h-4 w-4" /> : isWrong ? <X className="h-4 w-4" /> : 'АБВГ'[k]}
                    </span>
                    {o}
                  </button>
                )
              })}
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-3 rounded-xl bg-cream p-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm leading-relaxed">
                  <b className={chosen === q.answer ? 'text-lime' : 'text-brand'}>{chosen === q.answer ? `Верно! +${pointsPer}. ` : 'Не совсем. '}</b>
                  {q.fact}
                </p>
                <Button onClick={next}>
                  {i + 1 < questions.length ? 'Дальше' : 'Открыть цифру кода'} <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  )
}

/** Финальный экран станции: открытие цифры, разбор баллов, переход дальше. */
export function StationReward({ id, breakdown, total }) {
  const { state, actions } = useGame()
  const s = STATIONS.find((x) => x.id === id)
  const doneCount = Object.keys(state.telemetry.stations).length
  const next = STATIONS.find((x) => !state.telemetry.stations[x.id])
  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <motion.div
        initial={{ rotateY: 180, scale: 0.6 }}
        animate={{ rotateY: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        className="relative mx-auto grid h-64 w-52 place-items-center rounded-3xl border-[3px] border-ink bg-ink shadow-pop-red"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="halftone-red absolute inset-0 rounded-3xl opacity-40" />
        <div className="relative text-center">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-white/70">Цифра {s.n} из 4</div>
          <div className="font-display text-[150px] font-black leading-none text-white">{s.digit}</div>
          <div className="font-mono text-xs font-bold text-brand-300">КОД КАПСУЛЫ</div>
        </div>
      </motion.div>
      <Card className="p-5 sm:p-6">
        <VerbTag>Твоя точность — наш успех</VerbTag>
        <h2 className="mt-3 font-display text-2xl font-black sm:text-3xl">Станция «{s.title}» пройдена!</h2>
        <p className="mt-1 text-sm text-ink-soft">Результаты мини-игры ушли в твой профиль компетенций. HR увидит их только если ты сам(а) отправишь анкету.</p>
        <ul className="mt-4 divide-y-2 divide-dashed divide-ink/10">
          {breakdown.map((b) => (
            <li key={b.label} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="font-semibold">{b.label}</span>
              <span className="font-mono font-bold">
                +{b.points}
                <span className="text-ink-mute">/{b.max}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between py-3 text-base">
            <span className="font-extrabold">Итого</span>
            <span className="rounded-lg bg-malt-light px-2 font-mono text-lg font-black">+{total}</span>
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          {doneCount >= 4 ? (
            <Button size="lg" onClick={() => actions.go('finale')}>
              Открыть капсулу 1978 <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            next && (
              <Button size="lg" onClick={() => actions.go('station', next.id)}>
                Станция {next.n}: {next.title} <ArrowRight className="h-5 w-5" />
              </Button>
            )
          )}
          <Button variant="light" onClick={() => actions.go('hub')}>
            <Map className="h-4 w-4" /> К карте
          </Button>
        </div>
      </Card>
    </div>
  )
}
