import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, Plus, Sparkles, MapPin, Lock } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { STORY, WHY_CARDS, STATIONS, PHOTO } from '../data/content.js'
import { Button, Burst, Icon, RecBadge, SectionTitle, Sticker, TornEdge, TornPhoto, VerbTag, cx } from '../components/ui.jsx'
import Krafty from '../components/Krafty.jsx'

const TIMELINE = [
  { y: '1978', t: 'Запуск МПБК к Олимпиаде-80', d: 'Самое мощное отраслевое предприятие Европы и СССР' },
  { y: '1993', t: 'Бренд «Очаково»', d: '«Очаковское» становится «Очаково»' },
  { y: '1994', t: 'Первые в мире: ПЭТ', d: 'Розлив пива в пластиковые бутылки' },
  { y: '1995', t: 'Первая банка России', d: 'Первое российское пиво в алюминиевой банке' },
  { y: '1996', t: 'Двойное брожение', d: 'Квас: молочнокислое + дрожжевое брожение' },
  { y: '1998', t: 'Квас «Очаковский»', d: 'Самый известный бренд компании' },
  { y: '2000+', t: '10 предприятий с нуля', d: 'Краснодар, Пенза, Тюмень, солодовни, Тамань' },
]

const BRANDS = ['Квас «Очаковский»', 'CoolCola', 'KERN No Alco', 'Limontel', 'Ситро-апельсин', 'Тархун-мята', 'Таёжная кола', 'Дюшес-Барбарис', 'Мохито Fresh', 'Южная винная компания']

function WhyCard({ card, opened, onOpen }) {
  const [expanded, setExpanded] = useState(false)
  const isOpen = opened && expanded
  return (
    <motion.div
      layout
      className={cx(
        'relative overflow-hidden rounded-2xl border-2 border-ink shadow-pop transition-colors',
        isOpen ? 'bg-brand text-white' : opened ? 'bg-paper' : 'bg-white',
      )}
    >
      <button
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
        onClick={() => {
          if (!opened) onOpen()
          setExpanded((e) => !e || !opened)
        }}
        aria-expanded={isOpen}
      >
        <div className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2', isOpen ? 'border-white bg-white/10' : 'border-ink bg-brand-50 text-brand')}>
          <Icon name={card.icon} className="h-6 w-6" strokeWidth={2.3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cx('font-mono text-xs font-bold', isOpen ? 'text-white/70' : 'text-brand')}>ПРИЧИНА {card.num}</div>
          <div className="mt-0.5 font-display text-base font-black leading-tight sm:text-lg">{card.title}</div>
          <div className={cx('mt-1 text-xs font-semibold sm:text-sm', isOpen ? 'text-white/85' : 'text-ink-soft')}>{card.short}</div>
        </div>
        <div className="shrink-0">
          {!opened ? (
            <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-malt-light px-2 py-1 text-[11px] font-extrabold text-ink shadow-pop-sm">
              <Plus className="h-3 w-3" strokeWidth={3} />
              20
            </span>
          ) : (
            <ChevronDown className={cx('h-5 w-5 transition-transform', isOpen && 'rotate-180')} />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 px-4 pb-5 sm:px-5">
              {card.body.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="halftone-white absolute -bottom-6 -right-6 h-28 w-28 rounded-full" />
            <Sticker className="absolute bottom-3 right-3" color="bg-white" rotate={-6}>
              {card.badge}
            </Sticker>
            <div className="h-8" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Home() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')

  return (
    <div>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-brand text-white">
        <div className="halftone-white absolute inset-0 opacity-60" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full border-[28px] border-white/10" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:pb-24 lg:pt-14">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <RecBadge label="REC · ДЕЛО № 1978" />
              <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest">18+ · практика и стажировки</span>
            </div>
            <h1 className="font-display text-[44px] font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-[88px]">
              Секретный
              <br />
              <span className="text-outline text-white">код</span>{' '}
              <span className="relative inline-block">
                1978
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 8 Q50 1 100 7 T198 5" stroke="#EBC779" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-white/95 sm:text-lg">{STORY.lead}</p>
            <p className="mt-3 max-w-xl text-base font-bold leading-relaxed sm:text-lg">{STORY.mission}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="dark" size="lg" onClick={start}>
                {started ? 'Продолжить расследование' : 'Начать расследование'}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="light" size="lg" onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })}>
                Почему Очаково?
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/90">
              <span>⏱ 12–15 минут</span>
              <span>🧪 4 станции · 4 профессии</span>
              <span>🎁 мерч за баллы</span>
            </div>
          </div>

          {/* коллаж */}
          <div className="relative mx-auto h-[380px] w-full max-w-[520px] sm:h-[460px]">
            <TornPhoto src={PHOTO('hq-building.jpg')} alt="Здание «Очаково»" seed={11} rec recLabel="REC 1978" rotate={-4} className="absolute left-0 top-2 h-[200px] w-[78%] sm:h-[250px]" />
            <div className="absolute bottom-6 right-0 h-48 w-48 overflow-hidden rounded-full border-[6px] border-white shadow-card sm:h-60 sm:w-60">
              <img src={PHOTO('cat-conveyor.jpg')} alt="Линия розлива" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-4 rotate-[-8deg] rounded-xl border-2 border-ink bg-white p-2 shadow-pop sm:left-10">
              <img src={PHOTO('cat-olympic.jpg')} alt="Значки Олимпиады-80" className="h-20 w-auto sm:h-24" />
              <div className="mt-1 text-center font-mono text-[10px] font-bold text-ink">МОСКВА · 1980</div>
            </div>
            <Burst className="absolute right-2 top-0 sm:right-6" size={104} color="#EBC779" text="#17110F" spin>
              4 станции
              <br />
              1 код
            </Burst>
            <motion.div
              className="absolute bottom-[42%] left-[44%] flex items-end gap-1"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              <Krafty size={84} mood="wink" className="animate-floaty drop-shadow-[3px_3px_0_#17110F]" />
              <div className="mb-14 hidden max-w-[150px] rounded-2xl rounded-bl-none border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink shadow-pop-sm sm:block">
                Я Крафти, наставник. Код соберём вместе!
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- ЛЕНТА ВРЕМЕНИ */}
      <section className="relative bg-cream">
        <TornEdge color="#FBF6EE" seed={4} />
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6">
          <div className="paper-grain relative rounded-2xl border-2 border-ink bg-kraft-light p-5 shadow-pop sm:p-7">
            <div className="absolute -top-3 left-6 rotate-[-2deg] bg-ink px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
              Материалы дела · из архива музея
            </div>
            <div className="absolute right-4 top-4 hidden rotate-12 rounded-md border-[3px] border-brand px-2 py-0.5 font-mono text-sm font-black uppercase text-brand opacity-80 sm:block">
              Рассекречено
            </div>
            <div className="no-scrollbar -mx-2 mt-3 flex snap-x gap-3 overflow-x-auto px-2 pb-1">
              {TIMELINE.map((x, i) => (
                <div key={x.y} className="w-[210px] shrink-0 snap-start">
                  <div className="flex items-center gap-2">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand font-display text-base font-black text-white">{x.y}</span>
                    {i < TIMELINE.length - 1 && <span className="h-0.5 flex-1 bg-ink/20" />}
                  </div>
                  <div className="mt-2 text-sm font-extrabold leading-tight">{x.t}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">{x.d}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-ink-mute">«Первые в мире / в России» — по данным компании (каталог продукции «Очаково»).</p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- 5 ПРИЧИН */}
      <section id="why" className="scroll-mt-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              kicker="Улика № 1 · открой все карточки"
              title={
                <>
                  5 причин: почему именно <span className="text-brand">Очаково?</span>
                </>
              }
              sub="Каждая открытая карточка = +20 Крафт-баллов. HR видит, какие аргументы тебе важнее всего."
              className="mb-0"
            />
            <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2 shadow-pop-sm">
              <Sparkles className="h-4 w-4 text-malt" />
              <span className="text-sm font-extrabold">Открыто {viewed.length}/5</span>
              <div className="flex gap-1">
                {WHY_CARDS.map((c) => (
                  <span key={c.id} className={cx('h-2.5 w-2.5 rounded-full border border-ink', viewed.includes(c.id) ? 'bg-brand' : 'bg-white')} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WHY_CARDS.map((c) => (
              <WhyCard key={c.id} card={c} opened={viewed.includes(c.id)} onOpen={() => actions.viewWhy(c.id, !viewed.includes(c.id))} />
            ))}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-ink bg-ink p-5 text-white shadow-pop-red">
              <div className="halftone-red absolute inset-0 opacity-40" />
              <div className="relative">
                <VerbTag>Присоединяйся к нам</VerbTag>
                <p className="mt-3 font-display text-xl font-black leading-tight">«Я делаю натуральные напитки»</p>
                <p className="mt-2 text-sm text-white/80">Манифест на спине спецовки каждого сотрудника. Скоро и на твоей.</p>
              </div>
              <Button variant="primary" className="relative mt-5 self-start" onClick={start}>
                К станциям <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- МАРШРУТ */}
      <section className="relative bg-ink text-white">
        <TornEdge color="#17110F" seed={21} />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionTitle light kicker="Маршрут расследования" title="От идеи до полки: 4 станции" sub="На каждой станции: мини-игра по реальному оборудованию из цехов, справка из истории и одна цифра кода." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATIONS.map((s, i) => {
              const ok = !!state.telemetry.stations[s.id]
              return (
                <button
                  key={s.id}
                  onClick={start}
                  className="group relative overflow-hidden rounded-2xl border-2 border-white/80 bg-ink-2 text-left transition hover:-translate-y-1"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={PHOTO(s.photo)} alt="" className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/20 to-transparent" />
                    <span className="absolute left-3 top-3 font-mono text-xs font-bold text-white/80">СТАНЦИЯ {i + 1}</span>
                    <span className={cx('absolute right-3 top-3 grid h-10 w-9 place-items-center rounded-md border-2 font-mono text-lg font-bold', ok ? 'border-white bg-brand' : 'border-dashed border-white/50 text-white/60')}>
                      {ok ? s.digit : <Lock className="h-4 w-4" />}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="font-display text-lg font-black leading-tight">{s.title}</div>
                    <div className="mt-1 text-xs font-semibold text-white/70">{s.role}</div>
                    <div className="mt-3 inline-block rounded bg-white/10 px-2 py-0.5 text-xs font-bold" style={{ color: s.color === '#EC1A42' ? '#FB869E' : s.color }}>
                      {s.salary}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        {/* бегущая строка брендов */}
        <div className="overflow-hidden border-y-2 border-ink bg-malt-light py-3 text-ink">
          <div className="marquee-track animate-marquee">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span key={i} className="mx-5 flex items-center gap-5 whitespace-nowrap font-display text-lg font-black uppercase">
                {b} <span className="h-2 w-2 rounded-full bg-brand" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ ФИНАЛ */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-[auto_1fr]">
          <TornPhoto src={PHOTO('lep-tanks.jpg')} alt="Чаны ЛЭП" seed={5} rec recLabel="ЛЭП · 22 с" rotate={2} className="mx-auto h-56 w-72 sm:h-64 sm:w-96" />
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand">
              <MapPin className="h-4 w-4" /> Москва, ул. Рябиновая, 44 · Лаборатория экспериментального пивоварения
            </div>
            <h3 className="font-display text-3xl font-black leading-tight sm:text-4xl">Капсула ждёт в отсеке ЛЭП</h3>
            <p className="mt-3 max-w-xl text-ink-soft">
              Собери все четыре цифры, открой капсулу и узнай формулу «Очаково». В финале ИИ-наставник подберёт тебе вакансию, посчитает доход с учётом общежития и ночных смен, а за баллы можно взять билеты на розыгрыш мерча.
            </p>
            <Button className="mt-6" size="lg" onClick={start}>
              {started ? 'Продолжить' : 'Надеть форму и начать'} <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
