import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValueEvent } from 'framer-motion'
import { Gamepad2, BarChart3, Coins, KeyRound } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { LogoPlate, cx } from './ui.jsx'

function AnimatedNumber({ value }) {
  const spring = useSpring(value, { stiffness: 90, damping: 18 })
  const [shown, setShown] = useState(value)
  useEffect(() => {
    spring.set(value)
  }, [value, spring])
  useMotionValueEvent(spring, 'change', (v) => setShown(Math.round(v)))
  return <span className="tabular-nums">{shown.toLocaleString('ru-RU')}</span>
}

function PointsPill({ points }) {
  const prev = useRef(points)
  const [bump, setBump] = useState(0)
  useEffect(() => {
    if (points > prev.current) setBump((b) => b + 1)
    prev.current = points
  }, [points])
  return (
    <motion.div
      key={bump}
      initial={bump ? { scale: 1.18 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      className="flex items-center gap-1.5 border border-line bg-white py-1 pl-1 pr-3"
      title="Крафт-баллы (Очакоины)"
    >
      <span className="grid h-7 w-7 place-items-center bg-brand text-white">
        <Coins className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <span className="font-mono text-sm font-bold text-ink sm:text-base">
        <AnimatedNumber value={points} />
      </span>
      <span className="hidden text-[10px] font-semibold uppercase leading-none text-ink-soft lg:block">
        крафт-
        <br />
        баллов
      </span>
    </motion.div>
  )
}

function CodeSlots({ digits }) {
  return (
    <div className="flex items-center gap-1.5" title="Секретный код капсулы">
      <KeyRound className="hidden h-4 w-4 text-ink-mute sm:block" />
      {digits.map((d, i) => (
        <div
          key={i}
          className={cx(
            'relative grid h-8 w-6 place-items-center overflow-hidden border font-mono text-base font-bold sm:h-9 sm:w-7 sm:text-lg',
            d ? 'border-brand bg-brand text-white' : 'border-dashed border-steel bg-white text-steel',
          )}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={d || 'q'}
              initial={{ y: d ? -24 : 0, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              {d || '?'}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function Header() {
  const { state, balance, actions, apiStatus } = useGame()
  const isHR = state.mode === 'hr'
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
        <button onClick={() => actions.go('home')} className="flex shrink-0 items-center gap-2" aria-label="На главную">
          <LogoPlate className="h-9 w-auto sm:h-11" />
          <span className="hidden border-l border-line pl-3 text-[10px] font-bold uppercase leading-tight tracking-[0.16em] text-ink-soft md:block">
            Крафт-код
            <br />
            <span className="text-brand">1978</span>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {!isHR && <CodeSlots digits={state.digits} />}
          {!isHR && <PointsPill points={balance} />}

          <div className="flex border border-line bg-white p-0.5" role="tablist" aria-label="Режим">
            <button
              role="tab"
              aria-selected={!isHR}
              onClick={() => actions.setMode('student')}
              className={cx('flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold uppercase tracking-wide transition sm:px-3', !isHR ? 'bg-brand text-white' : 'text-ink hover:bg-cream')}
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden xl:inline">Режим студента</span>
              <span className="hidden sm:inline xl:hidden">Студент</span>
            </button>
            <button
              role="tab"
              aria-selected={isHR}
              onClick={() => actions.setMode('hr')}
              className={cx('flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold uppercase tracking-wide transition sm:px-3', isHR ? 'bg-graphite text-white' : 'text-ink hover:bg-cream')}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden xl:inline">Панель HR</span>
              <span className="hidden sm:inline xl:hidden">HR</span>
            </button>
          </div>
          <span
            className={cx('hidden h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white sm:block', apiStatus.online ? 'bg-lime' : 'bg-steel')}
            title={apiStatus.online ? `API онлайн: ${apiStatus.url}` : 'Автономный режим: встроенный движок'}
          />
        </div>
      </div>
    </header>
  )
}
