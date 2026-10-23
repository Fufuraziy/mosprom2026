import { motion } from 'framer-motion'
import { ArrowRight, Check, Lock, Play, KeyRound } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { STATIONS, PHOTO } from '../data/content.js'
import { Button, Icon, RecBadge, SectionTitle, Sticker, cx } from '../components/ui.jsx'
import Krafty from '../components/Krafty.jsx'

export default function Hub() {
  const { state, actions } = useGame()
  const st = state.telemetry.stations
  const done = Object.keys(st).length
  const nextId = STATIONS.find((s) => !st[s.id])?.id

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          kicker={`Карта расследования · пройдено ${done}/4`}
          title="От идеи до полки"
          sub="Станции можно проходить в любом порядке, но мы советуем путь напитка: лаборатория → варка → розлив → упаковка и бренд."
          className="mb-0"
        />
        {!state.ppeDone && (
          <Button variant="malt" onClick={() => actions.go('locker')}>
            Сначала допуск по ТБ <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="relative mt-8">
        {/* линия маршрута */}
        <svg className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-10 w-full -translate-y-1/2 lg:block" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden>
          <path d="M20 20 C 200 -10, 300 50, 500 20 S 800 -10, 980 20" stroke="#4A4A4A" strokeWidth="3" strokeDasharray="10 10" fill="none" />
        </svg>
        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATIONS.map((s, i) => {
            const ok = !!st[s.id]
            const isNext = s.id === nextId
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => actions.go('station', s.id)}
                className={cx(
                  'group relative flex flex-col overflow-hidden rounded-sm border border-line bg-paper text-left shadow-pop transition hover:-translate-y-1 hover:shadow-pop-lg',
                  isNext && 'ring-2 ring-brand',
                )}
              >
                <div className="relative h-40 overflow-hidden border-b-2 border-brand">
                  <img src={PHOTO(s.photo)} alt="" className={cx('h-full w-full object-cover transition duration-500 group-hover:scale-105', ok && 'grayscale-[40%]')} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  <RecBadge label={`СТАНЦИЯ ${s.n}`} className="absolute left-3 top-3" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                    <span className="grid h-9 w-9 place-items-center rounded-sm border-2 border-white" style={{ background: s.color }}>
                      <Icon name={s.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold">{s.salary}</span>
                  </div>
                  <span
                    className={cx(
                      'absolute right-3 top-3 grid h-12 w-10 place-items-center rounded-sm border-2 font-mono text-2xl font-extrabold',
                      ok ? 'border-white bg-brand text-white' : 'border-dashed border-white/70 bg-ink/40 text-white/70',
                    )}
                  >
                    {ok ? s.digit : '?'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="font-display text-lg font-extrabold leading-tight">{s.title}</div>
                  <div className="mt-0.5 text-xs font-bold text-ink-mute">{s.role}</div>
                  <p className="mt-2 flex-1 text-sm leading-snug text-ink-soft">{s.teaser}</p>
                  <div className="mt-4 flex items-center justify-between">
                    {ok ? (
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-lime">
                        <Check className="h-4 w-4" strokeWidth={3} /> +{st[s.id].score} баллов
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-brand">
                        <Play className="h-4 w-4 fill-brand" /> до +250 баллов
                      </span>
                    )}
                    {isNext && <Sticker rotate={4}>Следующая</Sticker>}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* капсула */}
      <div className="mt-10 grid items-center gap-6 rounded-sm border border-line bg-graphite p-6 text-white shadow-pop sm:p-8 md:grid-cols-[auto_1fr_auto]">
        <div className="relative grid h-24 w-24 place-items-center rounded-full border-4 border-white/80 bg-graphite-2">
          {done >= 4 ? <KeyRound className="h-10 w-10 text-malt-light" /> : <Lock className="h-10 w-10 text-white/70" />}
          <span className="absolute -bottom-2 rounded bg-brand px-2 font-mono text-xs font-bold">ЛЭП</span>
        </div>
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-white/60">Цифровая капсула мастерства</div>
          <div className="mt-1 font-display text-2xl font-extrabold">
            {done >= 4 ? 'Код собран. Капсула ждёт!' : `Нужно ещё ${4 - done} ${4 - done === 1 ? 'цифра' : 'цифры'}`}
          </div>
          <div className="mt-3 flex gap-2">
            {state.digits.map((d, i) => (
              <span key={i} className={cx('grid h-12 w-10 place-items-center rounded-sm border-2 font-mono text-2xl font-extrabold', d ? 'border-white bg-brand' : 'border-dashed border-white/40 text-white/40')}>
                {d || '?'}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <Krafty size={64} mood={done >= 4 ? 'wink' : 'think'} />
          <Button variant="primary" size="lg" disabled={done < 4} onClick={() => actions.go('finale')}>
            Открыть капсулу <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-ink-mute">
        <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-ink/15 bg-white px-3 py-2 font-semibold">
          <input type="checkbox" checked={state.demoFast} onChange={(e) => actions.setDemo(e.target.checked)} className="accent-brand" />
          Демо-ускорение для жюри (кнопка «Пропустить мини-игру»)
        </label>
      </div>
    </div>
  )
}
