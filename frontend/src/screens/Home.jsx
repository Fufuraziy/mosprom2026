import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, Plus, MapPin, Lock, Clock, Gift, Layers } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { STORY, WHY_CARDS, STATIONS, PHOTO, BRAND_VALUES, BRAND_PLATFORM } from '../data/content.js'
import { Button, Icon, LogoSquare, Module, Picto, RecBadge, SectionTitle, Sticker, TornPhoto, cx } from '../components/ui.jsx'
import Krafty from '../components/Krafty.jsx'

const TIMELINE = [
  { y: '1978', t: 'Запуск МПБК к Олимпиаде-80', d: 'Самое мощное отраслевое предприятие Европы и СССР' },
  { y: '1993', t: 'Бренд ОЧАКОВО', d: '«Очаковское» получает имя ОЧАКОВО' },
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
    <motion.div layout className={cx('relative overflow-hidden border transition-colors', isOpen ? 'border-brand bg-brand text-white' : 'border-line bg-paper hover:border-brand/50')}>
      <button
        className="flex w-full items-start gap-4 p-5 text-left"
        onClick={() => {
          if (!opened) onOpen()
          setExpanded((e) => !e || !opened)
        }}
        aria-expanded={isOpen}
      >
        <div className={cx('grid h-12 w-12 shrink-0 place-items-center', isOpen ? 'bg-paper text-brand' : 'bg-brand text-white')}>
          <Icon name={card.icon} className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cx('text-[11px] font-bold uppercase tracking-[0.16em]', isOpen ? 'text-white/75' : 'text-ink-soft')}>Причина {card.num}</div>
          <div className="mt-1 font-display text-base font-bold uppercase leading-tight sm:text-[17px]">{card.title}</div>
          <div className={cx('mt-1.5 text-sm', isOpen ? 'text-white/90' : 'text-ink-soft')}>{card.short}</div>
        </div>
        <div className="shrink-0">
          {!opened ? (
            <span className="flex items-center gap-0.5 border border-brand px-1.5 py-0.5 text-[11px] font-bold text-brand">
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              20
            </span>
          ) : (
            <ChevronDown className={cx('h-5 w-5 transition-transform', isOpen && 'rotate-180')} />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
            <ul className="space-y-2 px-5 pb-4 pl-[84px]">
              {card.body.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-paper" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="px-5 pb-5 pl-[84px]">
              <Sticker color="bg-paper text-brand border-white">{card.badge}</Sticker>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** Главный экран: детективная завязка (красный блок + квадратные модули). onWhy — переход к «5 причин». */
export function HomeHero({ onWhy }) {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          {/* красная заливка с текстом */}
          <div className="relative bg-brand px-5 pb-8 pt-7 text-white sm:px-10 sm:pb-12 sm:pt-10 lg:pb-16 lg:pt-14">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <RecBadge label="REC · ДЕЛО № 1978" />
              <span className="border border-white/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em]">18+ · практика и стажировки</span>
            </div>
            <h1 className="font-display uppercase leading-[0.92] tracking-tight">
              <span className="block text-[40px] font-extralight sm:text-7xl">Секретный</span>
              <span className="block text-[48px] font-extrabold sm:text-[88px]">код 1978</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">{STORY.lead}</p>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed sm:text-base">{STORY.mission}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="dark" size="lg" onClick={start}>
                {started ? 'Продолжить расследование' : 'Начать расследование'}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-white/90">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" strokeWidth={1.6} /> 12–15 минут</span>
              <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" strokeWidth={1.6} /> 4 станции · 4 профессии</span>
              <span className="flex items-center gap-1.5"><Gift className="h-4 w-4" strokeWidth={1.6} /> мерч за баллы</span>
            </div>
          </div>

          {/* квадратные модули (брендбук, стр. 57) */}
          <div className="relative grid grid-cols-3 grid-rows-3">
            <div className="relative col-span-2 row-span-2 aspect-square overflow-hidden">
              <img src={PHOTO('hq-building.jpg')} alt="Главный офис ОЧАКОВО, Рябиновая, 44" className="h-full w-full object-cover" />
              <RecBadge label="REC 1978" className="absolute left-3 top-3" />
            </div>
            <Module tone="red">
              <Picto name="can" className="h-1/2 w-1/2 text-white" />
            </Module>
            <Module tone="light" className="p-2 text-center">
              <div>
                <div className="font-display text-2xl font-extrabold leading-none text-brand sm:text-4xl">60+30</div>
                <div className="mt-1 text-[9px] font-bold uppercase leading-tight tracking-wider text-ink-soft sm:text-[11px]">регионов РФ<br />и стран мира</div>
              </div>
            </Module>
            <div className="aspect-square">
              <LogoSquare className="h-full w-full" withText />
            </div>
            <div className="aspect-square overflow-hidden">
              <img src={PHOTO('cat-conveyor.jpg')} alt="Линия розлива" className="h-full w-full object-cover" />
            </div>
            <Module tone="white" className="border-l border-t border-line">
              <Picto name="wheat" className="h-1/2 w-1/2 text-brand" />
            </Module>
            <motion.div className="absolute bottom-[31%] right-[30%] flex items-end gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
              <Krafty size={76} mood="wink" className="animate-floaty drop-shadow-md" />
              <div className="mb-12 hidden max-w-[150px] border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink shadow-pop sm:block">
                Я Крафти, наставник. Код соберём вместе!
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </>
  )
}

export function BrandEssence() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* ------------------------------------------------------- ПЛАТФОРМА БРЕНДА */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">Призвание ОЧАКОВО</div>
            <div className="mt-2 font-display text-3xl uppercase leading-tight text-brand sm:text-4xl">
              <span className="font-light">Натуральные —</span>
              <br />
              <span className="font-extrabold">значит настоящие</span>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            {BRAND_PLATFORM.essence} <b className="text-brand">{BRAND_PLATFORM.mission}</b>
          </p>
        </div>
      </section>

    </>
  )
}

export function Timeline() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* ---------------------------------------------------------- ЛЕНТА ВРЕМЕНИ */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle kicker="Материалы дела · из архива музея" title={<><span className="font-light">История </span><span className="font-extrabold">первых</span></>} className="mb-0" />
            <span className="border-2 border-brand px-2 py-0.5 font-mono text-xs font-bold uppercase text-brand">Рассекречено</span>
          </div>
          <div className="no-scrollbar -mx-2 mt-6 flex snap-x gap-4 overflow-x-auto px-2 pb-1">
            {TIMELINE.map((x, i) => (
              <div key={x.y} className="w-[200px] shrink-0 snap-start">
                <div className="flex items-center gap-2">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-white">{x.y}</span>
                  {i < TIMELINE.length - 1 && <span className="h-px flex-1 bg-steel" />}
                </div>
                <div className="mt-3 text-sm font-bold uppercase leading-tight text-ink">{x.t}</div>
                <div className="mt-1 text-xs text-ink-soft">{x.d}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-ink-mute">«Первые в мире / в России» — по данным компании (каталог продукции ОЧАКОВО).</p>
        </div>
      </section>

    </>
  )
}

export function WhyCards() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* --------------------------------------------------------- 5 ПРИЧИН */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              kicker="Улика № 1 · открой все карточки"
              title={<><span className="font-light">5 причин: почему именно </span><span className="font-extrabold">ОЧАКОВО?</span></>}
              sub="Каждая открытая карточка = +20 Крафт-баллов. HR видит, какие аргументы тебе важнее всего."
              className="mb-0"
            />
            <div className="flex items-center gap-3 border border-line px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Открыто {viewed.length}/5</span>
              <div className="flex gap-1">
                {WHY_CARDS.map((c) => (
                  <span key={c.id} className={cx('h-2.5 w-2.5', viewed.includes(c.id) ? 'bg-brand' : 'bg-line')} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WHY_CARDS.map((c) => (
              <WhyCard key={c.id} card={c} opened={viewed.includes(c.id)} onOpen={() => actions.viewWhy(c.id, !viewed.includes(c.id))} />
            ))}
            <div className="relative flex flex-col justify-between overflow-hidden bg-brand p-5 text-white">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">Присоединяйся к нам</div>
                <p className="mt-2 font-display text-xl uppercase leading-tight"><span className="font-light">Я делаю </span><span className="font-extrabold">натуральные напитки</span></p>
                <p className="mt-2 text-sm text-white/85">Манифест на спине спецовки каждого сотрудника. Скоро и на твоей.</p>
              </div>
              <Button variant="dark" className="mt-5 self-start" onClick={start}>
                К станциям <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}

export function BrandValues() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* ------------------------------------------------------- ЦЕННОСТИ БРЕНДА */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionTitle kicker="Ценности и характер бренда" title={<><span className="font-light">С кем ты будешь </span><span className="font-extrabold">работать</span></>} sub="Пять ценностей ОЧАКОВО из платформы бренда — по ним мы узнаём «своих»." />
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
            {BRAND_VALUES.map((v, i) => (
              <div key={v.value} className="flex flex-col bg-paper p-5">
                <span className="font-display text-5xl font-extrabold leading-none text-brand">{i + 1}</span>
                <span className="mt-4 text-sm font-extrabold uppercase text-ink">{v.value}</span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand">{v.character}</span>
                <span className="mt-2 text-xs leading-snug text-ink-soft">{v.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}

export function StationsRoute() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* --------------------------------------------------------- МАРШРУТ */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionTitle kicker="Маршрут расследования" title={<><span className="font-light">От идеи до полки: </span><span className="font-extrabold">4 станции</span></>} sub="На каждой станции: мини-игра по реальному оборудованию из цехов, справка из истории и одна цифра кода." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATIONS.map((s, i) => {
              const ok = !!state.telemetry.stations[s.id]
              return (
                <button key={s.id} onClick={start} className="group relative overflow-hidden border border-line bg-paper text-left transition hover:border-brand">
                  <div className="relative h-36 overflow-hidden">
                    <img src={PHOTO(s.photo)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-0 top-0 bg-paper px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">Станция {i + 1}</span>
                    <span className={cx('absolute right-0 top-0 grid h-10 w-10 place-items-center font-mono text-lg font-bold', ok ? 'bg-brand text-white' : 'bg-white/90 text-steel')}>
                      {ok ? state.digits[i] : <Lock className="h-4 w-4" />}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 p-4">
                    <Picto name={s.picto} className="h-10 w-10 shrink-0 text-brand" />
                    <div>
                      <div className="font-display text-[15px] font-bold uppercase leading-tight">{s.title}</div>
                      <div className="mt-1 text-xs text-ink-soft">{s.role}</div>
                      <div className="mt-2 text-xs font-bold text-brand">{s.salary}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

export function BrandsMarquee() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      <section>
        {/* фирменный паттерн — отдельной полосой, не перекрывая текст (стр. 54–55) */}
        <div className="och-pattern-white h-28 w-full bg-paper sm:h-36" style={{ backgroundPosition: 'center bottom', backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }} aria-hidden />
        <div className="overflow-hidden bg-brand py-3 text-white">
          <div className="marquee-track animate-marquee">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span key={i} className="mx-6 flex items-center gap-6 whitespace-nowrap font-display text-base font-light uppercase tracking-wide">
                {b} <span className="h-1.5 w-1.5 bg-paper" />
              </span>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}

export function CapsuleTeaser() {
  const { state, actions } = useGame()
  const viewed = state.telemetry.why_ochakovo_cards_viewed
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  const start = () => actions.go(state.ppeDone ? 'hub' : 'locker')
  return (
    <>
      {/* ------------------------------------------------------------ ФИНАЛ */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-[auto_1fr]">
          <TornPhoto src={PHOTO('lep-tanks.jpg')} alt="Чаны ЛЭП" seed={5} rec recLabel="ЛЭП · 22 с" className="mx-auto h-56 w-72 sm:h-64 sm:w-96" />
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <MapPin className="h-4 w-4 text-brand" /> Москва, ул. Рябиновая, 44 · Лаборатория экспериментального пивоварения
            </div>
            <h3 className="font-display text-3xl uppercase leading-tight text-brand sm:text-4xl">
              <span className="font-light">Капсула ждёт </span>
              <span className="font-extrabold">в отсеке ЛЭП</span>
            </h3>
            <p className="mt-3 max-w-xl text-ink-soft">
              Собери все четыре цифры, открой капсулу и узнай формулу ОЧАКОВО. В финале ИИ-наставник подберёт тебе вакансию, посчитает доход с учётом общежития и ночных смен, а за баллы можно взять билеты на розыгрыш мерча.
            </p>
            <Button className="mt-6" size="lg" onClick={start}>
              {started ? 'Продолжить' : 'Надеть форму и начать'} <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

/** Полная лента (как раньше) — для предпросмотра на странице HR. */
export default function Home() {
  return (
    <div>
      <HomeHero onWhy={() => {}} />
      <BrandEssence />
      <Timeline />
      <WhyCards />
      <BrandValues />
      <StationsRoute />
      <BrandsMarquee />
      <CapsuleTeaser />
    </div>
  )
}
