import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Delete, Unlock, Leaf, Award, Zap, ArrowRight } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { CODE, PHOTO } from '../../data/content.js'
import { Button, Burst, RecBadge, TornPhoto, cx } from '../../components/ui.jsx'
import Krafty from '../../components/Krafty.jsx'
import StoryShare from '../../components/StoryShare.jsx'

const FORMULA = [
  { icon: Leaf, title: '100% натуральные ингредиенты', text: 'Собственные солодовни, сельхозпредприятия и рецепты «от поля до банки».' },
  { icon: Award, title: 'Опыт Гранд-мастеров', text: 'Наставники с 20–30-летним стажем, которые запускали первые в мире ПЭТ и банку.' },
  { icon: Zap, title: 'Энергия молодых специалистов', text: 'Твои идеи, скорость и цифровые навыки. Без них не будет следующего рекорда.' },
]

export default function Capsule({ onContinue }) {
  const { state, actions } = useGame()
  const [input, setInput] = useState(state.capsuleOpened ? CODE.join('') : '')
  const [error, setError] = useState(0)
  const opened = state.capsuleOpened

  const press = (d) => {
    if (opened || input.length >= 4) return
    const v = input + d
    setInput(v)
    if (v.length === 4) {
      actions.capsuleAttempt(v)
      if (v === CODE.join('')) setTimeout(() => actions.capsuleOpen(), 350)
      else {
        setError((e) => e + 1)
        setTimeout(() => setInput(''), 650)
      }
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-graphite text-white">
      <div className="halftone-red absolute inset-0 opacity-25" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <RecBadge label="REC · ОТСЕК ЛЭП · 1978" />
          <h1 className="mt-4 font-display text-4xl font-light uppercase leading-[0.95] sm:text-6xl">
            {opened ? (
              <>
                Капсула
                <br />
                <span className="font-extrabold">открыта</span>
              </>
            ) : (
              <>
                Введи
                <br />
                код капсулы
              </>
            )}
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            {opened
              ? 'Внутри не чертежи и не рецепт. Главный секрет мировых рекордов ОЧАКОВО — это формула из трёх частей.'
              : 'Четыре цифры, которые ты собрал(а) на станциях. Подсказка: год, когда всё началось.'}
          </p>
          {!opened && (
            <div className="mt-6 flex gap-2">
              {state.digits.map((d, i) => (
                <span key={i} className="grid h-10 w-8 place-items-center rounded border-2 border-white/30 font-mono text-lg font-bold text-white/70">
                  {d || '?'}
                </span>
              ))}
              <span className="ml-2 self-center text-xs text-white/50">собранные цифры</span>
            </div>
          )}
          <TornPhoto src={PHOTO('cat-tank.jpg')} alt="Варочный чан с логотипом" seed={31} className="mt-8 hidden h-48 w-80 lg:block" rotate={-3} />
        </div>

        <div className="relative mx-auto w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {!opened ? (
              <motion.div key="lock" exit={{ scale: 1.2, opacity: 0, rotate: 8 }} transition={{ duration: 0.5 }} className="bg-[#4A4A4A] p-6 shadow-pop-lg">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-[6px] border-white/80 bg-graphite-2">
                  <motion.div animate={{ rotate: input.length * 90 }} transition={{ type: 'spring', stiffness: 120 }} className="relative h-16 w-16 rounded-full border-4 border-brand">
                    {[0, 90, 180, 270].map((a) => (
                      <span key={a} className="absolute left-1/2 top-1/2 h-1 w-9 -translate-y-1/2 bg-brand" style={{ transform: `rotate(${a}deg)`, transformOrigin: '0 50%' }} />
                    ))}
                  </motion.div>
                </div>
                <motion.div key={error} animate={error ? { x: [0, -12, 12, -8, 8, 0] } : {}} className="mt-6 flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cx('grid h-16 w-12 place-items-center rounded-sm border-2 font-mono text-3xl font-extrabold', input[i] ? 'border-white bg-white text-ink' : 'border-white/30 text-white/30', error && input.length === 4 && 'border-brand bg-brand text-white')}>
                      {input[i] || '•'}
                    </span>
                  ))}
                </motion.div>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                    <button key={d} onClick={() => press(d)} className="rounded-sm border-2 border-white/20 bg-white/5 py-3 font-mono text-xl font-bold hover:bg-white/15 active:scale-95">
                      {d}
                    </button>
                  ))}
                  <button onClick={() => setInput((v) => v.slice(0, -1))} className="grid place-items-center rounded-sm border-2 border-white/20 bg-white/5 py-3 hover:bg-white/15" aria-label="Стереть">
                    <Delete className="h-5 w-5" />
                  </button>
                  <button onClick={() => press('0')} className="rounded-sm border-2 border-white/20 bg-white/5 py-3 font-mono text-xl font-bold hover:bg-white/15">
                    0
                  </button>
                  <button onClick={() => setInput(state.digits.every(Boolean) ? CODE.join('') : input)} className="rounded-sm border-2 border-brand bg-brand py-3 text-xs font-extrabold" title="Подставить собранный код">
                    <Unlock className="mx-auto h-5 w-5" />
                  </button>
                </div>
                {error > 0 && <p className="mt-3 text-center text-xs text-brand-300">Неверный код. Попыток: {state.telemetry.capsule_attempts}</p>}
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ scale: 0.6, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 12 }}>
                <div className="relative bg-paper p-6 text-ink shadow-pop-lg">
                  <Burst className="absolute -right-6 -top-8" size={96} color="#E8EBEC" text="#4A4A4A">
                    +150
                    <br />
                    баллов
                  </Burst>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand">Формула ОЧАКОВО</div>
                  <div className="mt-3 space-y-3">
                    {FORMULA.map((f, i) => (
                      <motion.div key={f.title} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.25 }} className="flex gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-line bg-brand text-white">
                          <f.icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="font-display font-extrabold leading-tight">
                            {i > 0 && <span className="mr-1 text-brand">+</span>}
                            {f.title}
                          </div>
                          <div className="text-xs text-ink-soft">{f.text}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-4 rounded-sm bg-graphite p-3 text-center font-display text-lg font-extrabold text-white">
                    = «Я ДЕЛАЮ НАТУРАЛЬНЫЕ НАПИТКИ»
                  </motion.div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Krafty size={60} mood="wink" />
                  <Button size="lg" onClick={onContinue}>
                    Забрать награды <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
                <StoryShare className="mt-4 w-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
