// Страница для сотрудников и жюри (hr.html): Панель HR, симулятор ВК-бота, предпросмотр мини-приложения.
// Сама игра — VK Mini App (index.html → src/miniapp), здесь она показывается в рамке телефона.
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Ticket, Info } from 'lucide-react'
import { useGame } from './state/GameContext.jsx'
import Header from './components/Header.jsx'
import { Logo } from './components/ui.jsx'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

const HRPanel = lazy(() => import('./screens/hr/HRPanel.jsx'))
const BotScreen = lazy(() => import('./screens/bot/BotScreen.jsx'))
const MapView = lazy(() => import('./screens/map/MapView.jsx'))

function ScreenLoader() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-mute">
        Загрузка модуля ОЧАКОВО…
      </span>
    </div>
  )
}
import { PhoneInline } from './components/PhoneFrame.jsx'

function Toasts() {
  const { toasts } = useGame()
  return (
    <div className="pointer-events-none fixed left-1/2 top-[70px] z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-full border border-line bg-graphite px-4 py-2 text-sm font-bold text-white shadow-pop"
            role="status"
          >
            {t.kind === 'points' ? <Coins className="h-4 w-4 text-malt-light" /> : t.kind === 'ticket' ? <Ticket className="h-4 w-4 text-malt-light" /> : <Info className="h-4 w-4 text-malt-light" />}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Footer() {
  const { apiStatus } = useGame()
  return (
    <footer className="border-t-2 border-brand bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-auto" />
          <div>
            <div className="font-bold text-ink">«Секретный код 1978» · прототип для хакатона «Открой#Моспром» 2026</div>
            <div>Работа, практика и стажировки в ОЧАКОВО — только с 18 лет. Суммы указаны до вычета НДФЛ.</div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className={`h-2 w-2 rounded-full ${apiStatus.online ? 'bg-lime' : 'bg-malt'}`} />
          {apiStatus.online ? `API: ${apiStatus.url}` : 'API недоступен → автономный режим'}
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const { state } = useGame()
  const mode = state.mode
  const screen =
    mode === 'hr' ? (
      <HRPanel />
    ) : mode === 'bot' ? (
      <BotScreen />
    ) : mode === 'map' ? (
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="border-2 border-brand bg-white shadow-xl overflow-hidden rounded-xl">
          <MapView onNavigateToApply={() => actions.setMode('student')} />
        </div>
      </div>
    ) : (
      <PhoneInline />
    )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Toasts />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            <Suspense fallback={<ScreenLoader />}>
              {screen}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
