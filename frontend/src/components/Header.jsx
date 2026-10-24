import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValueEvent } from 'framer-motion'
import { Smartphone, MessageCircle, BarChart3, Coins, KeyRound, Eye } from 'lucide-react'
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

const TABS = [
  { id: 'student', Icon: Smartphone, full: 'VK Mini App · Игра', short: 'Игра', active: 'bg-brand text-white' },
  { id: 'bot', Icon: MessageCircle, full: 'ВК-бот ОЧАКОВО', short: 'ВК-бот', active: 'bg-vk text-white' },
  { id: 'hr', Icon: BarChart3, full: 'Панель HR', short: 'HR', active: 'bg-graphite text-white' },
]

export default function Header({ embedded = false, onPhone }) {
  const { state, balance, actions, apiStatus } = useGame()
  const [juryMenuOpen, setJuryMenuOpen] = useState(false)
  const isHR = state.mode !== 'student'
  const unread = Object.values(state.bot.threads).reduce((a, t) => a + (t.unread || 0), 0)

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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {!isHR && <CodeSlots digits={state.digits} />}
          {!isHR && <PointsPill points={balance} />}

          {/* Всегда доступный переключатель: Режим Жюри */}
          <div className="relative">
            {/* Для десктопа — прямые вкладки */}
            <div className="hidden sm:flex items-center border border-line bg-white p-0.5 shadow-sm" role="tablist" aria-label="Режим">
              <span className="px-1.5 text-[10px] font-bold uppercase text-brand tracking-wider hidden xl:inline-flex items-center gap-1 border-r border-line mr-1">
                <Eye className="h-3 w-3" /> Жюри:
              </span>
              {TABS.map(({ id, Icon: I, full, short, active }) => {
                const on = state.mode === id
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => actions.setMode(id)}
                    className={cx(
                      'relative flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold uppercase tracking-wide transition sm:px-2.5',
                      on ? active : 'text-ink hover:bg-cream',
                    )}
                    title={full}
                  >
                    <I className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{short}</span>
                    {id === 'bot' && unread > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-vk px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Для мобильного экрана и внутри VK (embedded) — плавающая кнопка «👁 Режим Жюри» */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setJuryMenuOpen(!juryMenuOpen)}
                className="flex items-center gap-1 border border-brand bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand shadow-sm rounded-sm"
                title="Переключить режим экосистемы для экспертов жюри"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Жюри</span>
              </button>

              {juryMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded border border-line bg-white p-1.5 shadow-pop-lg z-50">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                    Режим демонстрации
                  </div>
                  {TABS.map(({ id, Icon: I, full, active }) => {
                    const on = state.mode === id
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          actions.setMode(id)
                          setJuryMenuOpen(false)
                        }}
                        className={cx(
                          'flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-bold transition text-left my-0.5',
                          on ? active : 'text-ink hover:bg-cream',
                        )}
                      >
                        <I className="h-4 w-4 shrink-0" />
                        <span>{full}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {!embedded && state.mode === 'student' && (
            <button
              onClick={onPhone}
              className="hidden h-9 w-9 place-items-center border border-line text-ink-soft transition hover:border-brand hover:text-brand lg:grid"
              title="Предпросмотр VK Mini App в рамке телефона"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          )}

          <span
            className={cx(
              'h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white',
              apiStatus.online ? 'bg-lime' : 'bg-steel',
            )}
            title={apiStatus.online ? `API онлайн: ${apiStatus.url}` : 'Автономный режим: встроенный движок'}
          />
        </div>
      </div>
    </header>
  )
}
