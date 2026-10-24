import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { PPE_ITEMS, VALUES, PHOTO } from '../data/content.js'
import { Button, Card, RecBadge, SectionTitle, TornPhoto, VerbTag, cx } from '../components/ui.jsx'
import PpeArt, { Mannequin } from '../components/PpeArt.jsx'
import Krafty from '../components/Krafty.jsx'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Locker() {
  const { state, actions } = useGame()
  const [items] = useState(() => shuffleArray(PPE_ITEMS))
  const [picked, setPicked] = useState(state.ppeDone ? PPE_ITEMS.filter((i) => i.ok).map((i) => i.id) : [])
  const [feedback, setFeedback] = useState(null) // {wrong:[], missing:[]}
  const [shake, setShake] = useState(0)
  const done = state.ppeDone
  const attempts = state.telemetry.ppe_attempts

  const toggle = (id) => {
    if (done) return
    setFeedback(null)
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const check = () => {
    const wrong = picked.filter((id) => !PPE_ITEMS.find((i) => i.id === id).ok)
    const missing = PPE_ITEMS.filter((i) => i.ok && !picked.includes(i.id)).map((i) => i.id)
    actions.ppeAttempt(wrong, missing)
    if (!wrong.length && !missing.length) {
      actions.ppeDone()
      setFeedback(null)
    } else {
      setFeedback({ wrong, missing })
      setShake((s) => s + 1)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand">Этап 0 · Допуск к смене</span>
        <RecBadge label="REC · раздевалка" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionTitle
            title={
              <>
                <VerbTag className="mb-3 text-base">Надень форму</VerbTag>
                <br />
                Раздевалка и техника безопасности
              </>
            }
            sub="Перед входом в цех выбери ровно то, что разрешено правилами охраны труда. Безопасность — приоритет ОЧАКОВО: в цехе шумно, вокруг движущиеся механизмы и химия."
          />

          <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {items.map((it) => {
              const on = picked.includes(it.id)
              const isWrong = feedback?.wrong.includes(it.id)
              return (
                <button
                  key={it.id}
                  onClick={() => toggle(it.id)}
                  disabled={done}
                  className={cx(
                    'relative flex flex-col items-center gap-2 rounded-sm border-2 p-3 text-center transition-all',
                    on ? 'border-brand bg-paper shadow-pop -translate-y-0.5' : 'border-ink/20 bg-paper hover:border-ink/60',
                    isWrong && 'border-brand bg-brand-50',
                    done && !it.ok && 'opacity-40',
                  )}
                  aria-pressed={on}
                >
                  {on && (
                    <span className={cx('absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border border-line text-white', isWrong ? 'bg-brand' : 'bg-graphite')}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                    </span>
                  )}
                  <PpeArt id={it.id} className="h-16 w-16 sm:h-20 sm:w-20" />
                  <span className="text-xs font-extrabold leading-tight sm:text-sm">{it.label}</span>
                  {(isWrong || (done && it.ok)) && <span className={cx('text-[11px] leading-tight', isWrong ? 'text-brand-700' : 'text-ink-mute')}>{it.note}</span>}
                </button>
              )
            })}
          </motion.div>

          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex gap-3 rounded-sm border-2 border-brand bg-brand-50 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-brand" />
                <div>
                  <div className="font-extrabold text-brand-700">Охрана труда не пропускает в цех</div>
                  {feedback.wrong.length > 0 && <div className="mt-1">Сними то, что нарушает правила: {feedback.wrong.map((id) => PPE_ITEMS.find((i) => i.id === id).label.toLowerCase()).join(', ')}.</div>}
                  {feedback.missing.length > 0 && <div className="mt-1">Не хватает ещё {feedback.missing.length} обязательн{feedback.missing.length === 1 ? 'ой вещи' : 'ых вещей'}.</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!done && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={check} disabled={!picked.length}>
                <ShieldCheck className="h-5 w-5" /> Пройти контроль СИЗ
              </Button>
              <Button variant="ghost" onClick={() => { setPicked([]); setFeedback(null) }}>
                <RotateCcw className="h-4 w-4" /> Снять всё
              </Button>
              <span className="text-xs font-semibold text-ink-mute">Попыток: {attempts}</span>
            </div>
          )}

          <AnimatePresence>
            {done && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-6">
                <div className="relative overflow-hidden rounded-sm border border-line bg-brand p-6 text-white shadow-pop-lg">
                  <div className="halftone-white absolute inset-0 opacity-50" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Krafty size={88} mood="happy" />
                    <div className="flex-1">
                      <div className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
                        Допуск получен · +100 баллов · {attempts === 1 ? 'с первой попытки!' : `попыток: ${attempts}`}
                      </div>
                      <div className="mt-1 font-display text-2xl font-light uppercase">Принципы работы <b className="font-extrabold">ОЧАКОВО</b></div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {VALUES.map((v, i) => (
                          <motion.span
                            key={v}
                            initial={{ opacity: 0, y: 10, rotate: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 * i + 0.2 }}
                            className="rounded-sm border border-line bg-paper px-3 py-1.5 font-display text-sm font-extrabold text-ink shadow-pop-sm"
                          >
                            {v}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                    <Button variant="dark" size="lg" onClick={() => actions.go('hub')}>
                      К станциям <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-4">
          <Card className="relative overflow-hidden bg-kraft-light p-4">
            <div className="halftone absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="mb-1 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-ink-mute">Вид со спины</div>
              <Mannequin wear={picked} className="mx-auto h-[300px] w-auto" />
            </div>
          </Card>
          <TornPhoto src={PHOTO('line-mentors.jpg')} alt="Наставник и стажёр у машины" seed={8} className="h-40 w-full" rec recLabel="ЦЕХ РОЗЛИВА" />
          <p className="text-xs leading-relaxed text-ink-soft">
            Из справочника студента: одежда без сползающих брюк и рукавов, без развевающихся элементов; обувь закрытая, с закрытым мысом и пяткой. При необходимости: перчатки, очки, беруши.
          </p>
        </aside>
      </div>
    </div>
  )
}
