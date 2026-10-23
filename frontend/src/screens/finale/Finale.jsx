import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Gift, ClipboardList, RotateCcw, Map as MapIcon } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { buildRecommendation } from '../../services/localEngine.js'
import { Button, SectionTitle, cx } from '../../components/ui.jsx'
import Capsule from './Capsule.jsx'
import { AIVerdict, SalaryCalculator } from './Verdict.jsx'
import MerchShop from './MerchShop.jsx'
import CandidateForm, { Submitted } from './CandidateForm.jsx'
import FirstDayGuide from './FirstDayGuide.jsx'
import StoryShare from '../../components/StoryShare.jsx'

export default function Finale() {
  const { state, actions } = useGame()
  const [view, setView] = useState(state.capsuleOpened ? 'rewards' : 'capsule')
  const [tab, setTab] = useState(state.candidate ? 'form' : 'verdict')
  const done = Object.keys(state.telemetry.stations).length
  const suggested = useMemo(() => buildRecommendation(state.telemetry).matches[0]?.title, [state.telemetry])

  if (done < 4) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-extrabold">Капсула пока закрыта</h1>
        <p className="mt-2 text-ink-soft">Собери все 4 цифры на станциях: осталось {4 - done}.</p>
        <Button className="mt-6" onClick={() => actions.go('hub')}>
          <MapIcon className="h-4 w-4" /> К карте станций
        </Button>
      </div>
    )
  }

  if (view === 'capsule' || !state.capsuleOpened) {
    return <Capsule onContinue={() => setView('rewards')} />
  }

  const TABS = [
    ['verdict', 'ИИ-вердикт и доход', Bot],
    ['merch', 'Розыгрыш мерча', Gift],
    ['form', state.candidate ? 'Первый день' : 'Анкета 18+', ClipboardList],
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Финал · капсула 1978 открыта" title="Твои награды" className="mb-0" />
        <button onClick={() => setView('capsule')} className="text-sm font-bold text-ink-soft underline-offset-4 hover:text-brand hover:underline">
          ← Формула из капсулы
        </button>
      </div>
      <div className="sticky top-[62px] z-30 -mx-4 mb-6 mt-5 bg-cream/95 px-4 py-2 backdrop-blur sm:top-[66px]">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map(([id, label, I], i) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cx('flex shrink-0 items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-sm font-extrabold transition', tab === id ? 'bg-brand text-white shadow-pop' : 'bg-white hover:bg-paper')}
            >
              <span className={cx('grid h-5 w-5 place-items-center rounded-full font-mono text-[11px]', tab === id ? 'bg-white text-brand' : 'bg-graphite text-white')}>{i + 1}</span>
              <I className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'verdict' && (
            <div className="space-y-6">
              <AIVerdict />
              <SalaryCalculator />
              <div className="flex justify-end">
                <Button size="lg" onClick={() => setTab('merch')}>
                  Дальше: розыгрыш мерча
                </Button>
              </div>
            </div>
          )}
          {tab === 'merch' && <MerchShop onForm={() => setTab('form')} />}
          {tab === 'form' && (
            <div className="space-y-8">
              {state.candidate ? <Submitted candidate={state.candidate} /> : <CandidateForm suggestedVacancy={suggested} onSubmitted={() => window.scrollTo?.({ top: 0, behavior: 'smooth' })} />}
              {state.candidate && <FirstDayGuide />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-ink/15 pt-6 text-sm">
        <StoryShare />
        <Button variant="ghost" size="sm" onClick={() => actions.setMode('hr')}>
          Посмотреть, что увидит HR →
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.confirm?.('Начать игру заново? Прогресс на этом устройстве сбросится.') && actions.reset()}>
          <RotateCcw className="h-4 w-4" /> Пройти заново
        </Button>
      </div>
    </div>
  )
}
