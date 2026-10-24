import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, X, FastForward, Map } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { STATIONS, PHOTO, STATION_HISTORY_FACTS } from '../data/content.js'
import { Button, Card, Picto, RecBadge, Steps, TornPhoto, VerbTag, cx } from './ui.jsx'
import MascotStoryteller, { MascotNudge, MascotTip } from './MascotStoryteller.jsx'
import { MASCOT_STORIES } from '../data/mascot.js'

export function StationShell({ id, steps, step, onSkip, children, tip }) {
  const { state, actions } = useGame()
  const s = STATIONS.find((x) => x.id === id)
  const story = MASCOT_STORIES[id]
  const playing = step < steps.length - 1 // последний шаг — награда
  const gameRef = useRef(null)
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
      {story && step === 0 && (
        <MascotStoryteller
          className="mb-5"
          variant={story.variant}
          kicker={story.kicker}
          title={story.title}
          text={story.text}
          chips={story.chips}
          action={{ label: 'К заданию', onClick: () => gameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
        />
      )}
      {STATION_HISTORY_FACTS?.[id] && step > 0 && playing && (
        <div className="mb-4 flex items-center gap-3 border border-line bg-paper p-3 text-xs font-semibold">
          <span className="rounded bg-brand/10 px-2 py-1 font-mono text-[11px] font-bold uppercase text-brand">
            {STATION_HISTORY_FACTS[id].year}
          </span>
          <span className="flex-1 italic text-ink">{STATION_HISTORY_FACTS[id].quote}</span>
        </div>
      )}
      {tip && playing && (
        <MascotTip className="mb-5" variant={story?.variant === 'lab_mentor' ? 'lab_mentor' : 'hint'}>
          {tip}
        </MascotTip>
      )}
      <div ref={gameRef} className="scroll-mt-16">
        {children}
      </div>
      <MascotNudge active={playing} tip={tip} resetKey={`${id}-${step}`} />
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

  // Fisher-Yates global shuffle of answer options
  const shuffledOptions = useMemo(() => {
    if (!q) return []
    const list = q.options.map((text, origIdx) => ({
      text,
      origIdx,
      isCorrect: origIdx === q.answer,
    }))
    for (let j = list.length - 1; j > 0; j--) {
      const r = Math.floor(Math.random() * (j + 1));
      [list[j], list[r]] = [list[r], list[j]]
    }
    return list
  }, [i, q])

  const choose = (opt) => {
    if (answered) return
    setChosen(opt)
    const ok = opt.isCorrect
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
              {shuffledOptions.map((opt, k) => {
                const isRight = answered && opt.isCorrect
                const isWrong = answered && chosen === opt && !opt.isCorrect
                return (
                  <button
                    key={opt.text}
                    onClick={() => choose(opt)}
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
                    {opt.text}
                  </button>
                )
              })}
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-3 rounded-sm bg-cream p-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm leading-relaxed">
                  <b className={chosen?.isCorrect ? 'text-lime' : 'text-brand'}>{chosen?.isCorrect ? `Верно! +${pointsPer}. ` : 'Не совсем. '}</b>
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
  const digit = state.digits[s.n - 1] ?? '?'
  const left = 4 - doneCount
  return (
    <div className="space-y-6">
    <MascotStoryteller
      variant="celebrate"
      kicker={`Станция ${s.n} пройдена · +${total} Крафт-баллов`}
      title={`Цифра ${digit} — твоя!`}
      text={
        left > 0
          ? `Отличная работа! ${STATION_HISTORY_FACTS?.[id]?.title || s.title} — теперь и твоя история. Держи ${s.n}-ю цифру кода капсулы: до замка осталось ${left} ${left === 1 ? 'станция' : 'станции'}.`
          : `Все 4 цифры у тебя! Капсула Мастерства 1978 ждёт: открой её, и я открою доступ к розыгрышу мерча и анкете стажёра.`
      }
      chips={[`Код: ${state.digits.map((d) => d ?? '•').join(' ')}`, `${doneCount}/4 станций`]}
    />
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
          <div className="font-display text-[150px] font-extrabold leading-none text-white">{state.digits[s.n - 1] ?? '?'}</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">Код капсулы</div>
        </div>
      </motion.div>
      <Card className="p-5 sm:p-6">
        <VerbTag>Твоя точность — наш успех</VerbTag>
        <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Разбор баллов: «{s.title}»</h2>
        <p className="mt-1 text-sm text-ink-soft">Результаты мини-игры ушли в твой профиль компетенций. HR увидит их только если ты сам(а) отправишь анкету.</p>
        {STATION_HISTORY_FACTS?.[id] && (
          <div className="mt-4 rounded-sm border-2 border-brand/30 bg-kraft-light p-4 text-ink shadow-pop-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand">
                📜 Исторический факт ОЧАКОВО · {STATION_HISTORY_FACTS[id].year}
              </span>
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                {STATION_HISTORY_FACTS[id].badge}
              </span>
            </div>
            <div className="mt-1 font-display text-base font-extrabold">{STATION_HISTORY_FACTS[id].title}</div>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{STATION_HISTORY_FACTS[id].fact}</p>
            {STATION_HISTORY_FACTS[id].quote && (
              <div className="mt-2.5 border-t border-brand/20 pt-2 text-[11px] italic font-semibold text-brand">
                {STATION_HISTORY_FACTS[id].quote}
              </div>
            )}
          </div>
        )}
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
    </div>
  )
}
