import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, X, FastForward, Map } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { STATIONS, PHOTO } from '../data/content.js'
import { Button, Card, Picto, RecBadge, Steps, TornPhoto, VerbTag, cx } from './ui.jsx'
import Krafty from './Krafty.jsx'

export function StationShell({ id, steps, step, onSkip, children, tip }) {
  const { state, actions } = useGame()
  const s = STATIONS.find((x) => x.id === id)
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)] items-end gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="bg-graphite px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Станция {s.n}/4</span>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: s.color }}>
              {s.salary}
            </span>
            <RecBadge label={`REC · ${s.role.toUpperCase()}`} className="max-w-full truncate" />
          </div>
          <h1 className="flex min-w-0 items-center gap-3 break-words font-display text-[26px] font-light uppercase leading-none tracking-tight text-brand [hyphens:auto] sm:gap-4 sm:text-5xl">
            <span className="grid h-14 w-14 shrink-0 place-items-center text-white sm:h-16 sm:w-16" style={{ background: s.color }}>
              <Picto name={s.picto} className="h-9 w-9 sm:h-10 sm:w-10" />
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
        <div className="mb-5 flex items-start gap-3 rounded-sm border border-line bg-paper p-3 shadow-pop-sm">
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
      <div className="flex items-center justify-between border-b-2 border-brand bg-kraft-light px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-display text-sm font-extrabold uppercase sm:text-base">
          <BookOpen className="h-5 w-5 text-brand" /> Историческая справка · мини-квиз
        </div>
        <span className="font-mono text-sm font-bold">
          {i + 1}/{questions.length}
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <p className="font-display text-lg font-extrabold leading-snug sm:text-xl">{q.q}</p>
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
                      'flex items-center gap-3 rounded-sm border-2 px-4 py-3 text-left text-sm font-bold transition',
                      !answered && 'border-ink/25 bg-paper hover:border-brand hover:shadow-pop-sm',
                      isRight && 'border-brand bg-lime text-white shadow-pop-sm',
                      isWrong && 'border-brand bg-brand text-white',
                      answered && !isRight && !isWrong && 'border-ink/10 bg-paper opacity-60',
                    )}
                  >
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-sm border-2 font-mono text-xs', isRight || isWrong ? 'border-white' : 'border-ink/30')}>
                      {isRight ? <Check className="h-4 w-4" /> : isWrong ? <X className="h-4 w-4" /> : 'АБВГ'[k]}
                    </span>
                    {o}
                  </button>
                )
              })}
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-3 rounded-sm bg-cream p-4 sm:flex-row sm:items-center">
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
        className="relative mx-auto grid h-64 w-52 place-items-center bg-brand"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="halftone-red absolute inset-0 rounded-sm opacity-40" />
        <div className="relative text-center">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-white/70">Цифра {s.n} из 4</div>
          <div className="font-display text-[150px] font-extrabold leading-none text-white">{s.digit}</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">Код капсулы</div>
        </div>
      </motion.div>
      <Card className="p-5 sm:p-6">
        <VerbTag>Твоя точность — наш успех</VerbTag>
        <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Станция «{s.title}» пройдена!</h2>
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
            <span className="rounded-sm bg-malt-light px-2 font-mono text-lg font-extrabold">+{total}</span>
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
