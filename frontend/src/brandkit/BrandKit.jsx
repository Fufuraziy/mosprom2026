// «Бренд-Кит и материалы кейса»: витрина для руководства ОЧАКОВО и жюри.
// Листовки А4 с рабочими QR, паспорт маскота Крафти, лукбук мерча PURE CRAFT 1978, раскадровка ролика 0:45.
// В браузере кнопка печати сохраняет всё в PDF (по листу А4 на макет); внутри ВКонтакте — открывает brandkit.html.
import { useEffect, useState } from 'react'
import { Pause, Play, Printer, ExternalLink } from 'lucide-react'
import { MERCH, MENTORS, BRAND_PLATFORM } from '../data/content.js'
import { MASCOT_VARIANTS } from '../data/mascot.js'
import { MascotFigure, MascotHead } from '../components/MascotStoryteller.jsx'
import { MerchCard } from '../components/MerchCard.jsx'
import { Button, Picto, cx } from '../components/ui.jsx'
import { isInsideVK } from '../services/vk.js'
import { LEAFLETS, LEAFLET_COMPONENTS } from './Leaflets.jsx'
import { FONT, MONO, PictoAt, Quarter } from './svgkit.jsx'

const SECTIONS = [
  ['leaflets', 'Листовки А4'],
  ['mascot', 'Паспорт маскота'],
  ['merch', 'Лукбук мерча'],
  ['video', 'Раскадровка ролика'],
  ['brand', 'Идея HR-бренда'],
]

function Kicker({ children, light = false }) {
  return (
    <div className={cx('flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em]', light ? 'text-white/80' : 'text-brand')}>
      <span className={cx('h-px w-6', light ? 'bg-white/70' : 'bg-brand')} />
      {children}
    </div>
  )
}

function SectionHead({ id, n, title, sub, className = '' }) {
  return (
    <header id={`bk-${id}`} className={cx('bk-section mb-5 scroll-mt-4 border-t border-ink/80 pt-4', className)}>
      <Kicker>{n}</Kicker>
      <h2 className="mt-2 font-display text-[26px] font-light uppercase leading-none tracking-tight text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">{sub}</p>}
    </header>
  )
}

/* ---------------------------------------------------------------- листовки */
function LeafletsSection() {
  return (
    <section>
      <SectionHead className="bk-noprint" id="leaflets" n="Полиграфия · 3 макета А4" title="Листовки для вузов и колледжей" sub="Модульная сетка с полями 12 мм, красная заливка, разбавленная белым (брендбук, стр. 56), квадратные модули (стр. 57) и фирменные пиктограммы. QR-коды рабочие и ведут прямо в нужный экран VK Mini App." />
      <div className="bk-leaflets grid gap-5 md:grid-cols-3">
        {LEAFLETS.map((l) => {
          const L = LEAFLET_COMPONENTS[l.id]
          return (
            <figure key={l.id} className="min-w-0">
              <div className="bk-sheet-wrap border border-line shadow-pop">
                <L />
              </div>
              <figcaption className="bk-noprint mt-2 text-xs leading-snug text-ink-soft">
                <b className="block font-bold uppercase text-ink">{l.title}</b>
                {l.audience}
                <span className="mt-1 block break-all font-mono text-[10px] text-ink-mute">QR → {l.url}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- маскот */
const PALETTE = [
  ['#D50032', 'Красный', 'Pantone 199', 'кепка, куртка, худи'],
  ['#AB2328', 'Тёмно-красный', 'Pantone 7621', 'козырёк, тени ткани'],
  ['#A2AAAD', 'Серый', 'Pantone 429', 'мех'],
  ['#626262', 'Тёмно-серый', 'Cool Gray 10', 'контуры, приборы'],
  ['#FFFFFF', 'Белый', 'белила', 'халат, принт, светодиоды'],
]

function MascotSection() {
  const mentorAges = Object.values(MENTORS).map((m) => m.age)
  return (
    <section className="bk-page">
      <SectionHead id="mascot" n="Маскот · паспорт персонажа" title="Крафти — сторителлер и наставник" sub="Оригинальный персонаж: медвежонок Лаборатории экспериментального пивоварения в кепке с фирменным квадратом ОЧАКОВО, умных очках-визоре и с бейджем 1978. Плоская геометрия, только цвета брендбука." />
      <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {MASCOT_VARIANTS.map((v, i) => (
          <article key={v.id} className="flex min-w-0 flex-col bg-paper">
            <div className="och-light flex h-[188px] items-end justify-center bg-[#F2F3F4] pt-3">
              <MascotFigure variant={v.id} size={170} idle={false} />
            </div>
            <div className="flex-1 p-3">
              <div className="font-mono text-[10px] font-bold text-brand">0{i + 1} · {v.id}</div>
              <h3 className="mt-0.5 font-display text-sm font-extrabold uppercase">{v.name}</h3>
              <p className="mt-1 text-[12px] leading-snug text-ink-soft">{v.role}</p>
              <p className="mt-2 text-[11px] leading-snug text-ink-2">
                <b>Экипировка:</b> {v.kit}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-ink-2">
                <b>Где:</b> {v.where}
              </p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="border border-line bg-paper p-4 sm:p-5">
          <Kicker>Связь поколений</Kicker>
          <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="text-center">
              <div className="font-display text-4xl font-extrabold text-brand">20</div>
              <div className="text-[10px] font-bold uppercase text-ink-soft">лет · студент</div>
            </div>
            <div className="relative h-px bg-ink/30">
              <MascotHead size={44} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper" />
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-extrabold text-graphite">52</div>
              <div className="text-[10px] font-bold uppercase text-ink-soft">года · средний возраст</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Крафти говорит на языке 20-летних — игра, короткие реплики, шутка про фен в общежитии, — но каждая его подсказка взята из опыта наставников
            {` ${Math.min(...mentorAges)}–${Math.max(...mentorAges)} лет`}: нормы Brix, правила охраны труда, история 1978 года. Он не заменяет наставника, а знакомит с ним: в финале
            студент видит своего наставника, а HR — вопросы студента в досье. Так «переводчик» снимает барьер первого разговора между поколениями.
          </p>
          <ul className="mt-3 space-y-1.5 text-[12px] leading-snug text-ink-2">
            <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-brand" />Говорит на «ты», коротко и по делу; никогда не стыдит за ошибку — «Наставники всегда помогут!».</li>
            <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-brand" />Только в контексте найма 18+: не держит и не рекламирует продукцию с алкоголем.</li>
            <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-brand" />Логотип не меняется: фирменный квадрат на кепке — та же пропорция, что в брендбуке.</li>
          </ul>
        </div>
        <div className="border border-line bg-paper p-4 sm:p-5">
          <Kicker>Цвета персонажа · брендбук, стр. 58</Kicker>
          <ul className="mt-3 divide-y divide-line">
            {PALETTE.map(([hex, name, code, use]) => (
              <li key={hex} className="flex items-center gap-3 py-2">
                <span className="h-9 w-9 shrink-0 border border-line" style={{ background: hex }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold">{name}</div>
                  <div className="font-mono text-[10px] text-ink-mute">{code} · {hex}</div>
                </div>
                <div className="hidden text-right text-[11px] text-ink-soft sm:block">{use}</div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-mute">Жёлтый — только беруши: это реальный цвет СИЗ из справочника студента.</p>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- мерч */
function MerchSection() {
  return (
    <section className="bk-page">
      <SectionHead id="merch" n="Мерч · капсульная коллекция" title="Лукбук PURE CRAFT 1978" sub="Пять предметов, у каждого есть повод из реальной жизни стажёра: лозунг со спецовки, шевроны цехов, банка KERN со станции дизайна, штраф 500 ₽ за пропуск и единственная вещь, которой нет в общежитии." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MERCH.map((m) => (
          <MerchCard key={m.id} item={m} showSpec />
        ))}
        <div className="border border-line bg-brand p-5 text-white">
          <Kicker light>Обоснование для руководства</Kicker>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-snug">
            <li><b>Мерч конвертирует в анкеты.</b> Билеты покупаются за Крафт-баллы игры и активируются только после анкеты 18+.</li>
            <li><b>Носитель HR-бренда.</b> Лозунг «Я ДЕЛАЮ НАТУРАЛЬНЫЕ НАПИТКИ» уходит с завода в кампусы.</li>
            <li><b>Польза, а не сувенир.</b> Ретрактор снижает потери пропусков, фен закрывает бытовой пробел общежития.</li>
            <li><b>Тираж под контролем.</b> Лимиты 15–100 штук, призы разыгрываются, а не раздаются всем.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- раскадровка */
const FRAMES = [
  {
    tc: '00:00–00:06',
    title: 'Архив 1978',
    shot: 'Хроника стройки комбината на Рябиновой. Камера наезжает на металлический ящик — в него кладут Капсулу Мастерства.',
    sound: 'Шум стройки, метроном. Тишина на щелчке замка.',
    caption: '1978. Москва. До Олимпиады-80 — два года',
    ref: 'Архивная хроника, match cut на щелчке',
  },
  {
    tc: '00:06–00:14',
    title: 'Из чего',
    shot: 'Макро: колосья ячменя, солод из Липецкой области, капля натурального кваса. Переход по форме круга — кольцо логотипа.',
    sound: 'Ветер в поле, в кадр входит бит.',
    caption: 'Натуральные — значит настоящие',
    ref: 'Фотостиль брендбука «Из чего», стр. 65',
  },
  {
    tc: '00:14–00:22',
    title: 'Лаборатория',
    shot: 'Студентка на рефрактометре ATAGO, рядом наставник-технолог. На дисплее 6.52 °Bx — она поднимает большой палец.',
    sound: 'Щелчок прибора совпадает с долей бита.',
    caption: 'Лаборант · от 60 000 ₽ · без испытательного срока',
    ref: 'Фотостиль «Кто», стр. 67: реальные сотрудники',
  },
  {
    tc: '00:22–00:30',
    title: 'Масштаб',
    shot: 'Пролёт над ЦКТ ЛЭП, затем линия SMI SK 500 P: банки идут потоком, оператор снимает мятую.',
    sound: 'Ритм линии собирает трек, удар на снятой банке.',
    caption: 'Первые в мире ПЭТ · 10 заводов с нуля · от 70 000 ₽',
    ref: 'Фотостиль «Как», стр. 66: детали оборудования',
  },
  {
    tc: '00:30–00:38',
    title: 'Жизнь вокруг смены',
    shot: 'Автобус от м. Озёрная, обед в столовой, общежитие 36к2. Сосед ищет фен — ему протягивают красный фен из welcome-набора.',
    sound: 'Смех, бит становится легче.',
    caption: 'Общежитие 3 400 ₽ · обеды −50% · фен теперь есть',
    ref: 'Мем из справочника студента',
  },
  {
    tc: '00:38–00:45',
    title: 'Капсула открыта',
    shot: 'Крафти вводит 4 цифры, капсула открывается — внутри худи «МАНИФЕСТ 1978». Финальный кадр: QR и логотип.',
    sound: 'Щелчок замка из первого кадра, финальный аккорд.',
    caption: 'Секретный код 1978 · VK Mini App · 18+',
    ref: 'Закольцовка с кадром 1',
  },
]

function FrameArt({ i }) {
  const W = 160
  const H = 90
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block aspect-video w-full" role="img" aria-label={FRAMES[i].title}>
      {i === 0 && (
        <g>
          <rect width={W} height={H} fill="#3A3A3C" />
          <path d="M20 90 V30 h4 V90 M22 30 L70 22 M22 34 L60 26" stroke="#8A9194" strokeWidth="1.4" fill="none" />
          <path d="M60 26 v20" stroke="#8A9194" strokeWidth="0.8" />
          <rect x="54" y="46" width="12" height="9" fill="#626262" />
          <rect x="88" y="52" width="44" height="26" fill="#626262" stroke="#A2AAAD" strokeWidth="0.8" />
          <rect x="102" y="58" width="16" height="9" rx="4.5" fill="#D50032" />
          <text x="110" y="74.5" textAnchor="middle" fontSize="5" fontWeight="800" fill="#FFFFFF" fontFamily={MONO}>1978</text>
          <text x="10" y="14" fontSize="7" fontWeight="300" fill="#FFFFFF" fontFamily={FONT}>1978</text>
        </g>
      )}
      {i === 1 && (
        <g>
          <rect width={W} height={H} fill="#F2F3F4" />
          <circle cx="128" cy="24" r="12" fill="#A2AAAD" opacity=".5" />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <PictoAt key={k} name={k % 2 ? 'barley' : 'wheat'} x={8 + k * 21} y={44 + (k % 2) * 6} size={22} color={k === 3 ? '#D50032' : '#A2AAAD'} />
          ))}
          <circle cx="80" cy="30" r="6" fill="none" stroke="#D50032" strokeWidth="2.6" />
        </g>
      )}
      {i === 2 && (
        <g>
          <rect width={W} height={H} fill="#FFFFFF" />
          <rect x="18" y="20" width="62" height="48" rx="5" fill="#F2F3F4" stroke="#626262" strokeWidth="0.8" />
          <rect x="24" y="26" width="38" height="24" rx="1.5" fill="#2E2E30" />
          <text x="28" y="43" fontSize="11" fontWeight="700" fill="#FFFFFF" fontFamily={MONO}>6.52</text>
          <circle cx="71" cy="38" r="5" fill="none" stroke="#626262" strokeWidth="0.8" />
          <circle cx="71" cy="38" r="2" fill="#D50032" />
          <circle cx="112" cy="40" r="13" fill="#A2AAAD" />
          <rect x="99" y="54" width="26" height="30" rx="8" fill="#FFFFFF" stroke="#C9CED0" />
          <path d="M106 54 l6 9 l6 -9" fill="#D50032" />
          <circle cx="140" cy="44" r="10" fill="#626262" />
          <rect x="130" y="56" width="20" height="28" rx="7" fill="#FFFFFF" stroke="#C9CED0" />
        </g>
      )}
      {i === 3 && (
        <g>
          <rect width={W} height={H} fill="#F2F3F4" />
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${10 + k * 22} 10 q8 -6 16 0 v34 l-8 8 l-8 -8 z`} fill="#FFFFFF" stroke="#626262" strokeWidth="0.7" />
          ))}
          <rect x="70" y="66" width="86" height="3" fill="#626262" />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <rect key={k} x={74 + k * 11.5} y="52" width="7" height="13" rx="1" fill={k === 4 ? '#FFFFFF' : '#D50032'} stroke="#D50032" strokeWidth="0.5" />
          ))}
          <path d="M76 44 h20 M84 40 h20" stroke="#A2AAAD" strokeWidth="0.8" />
        </g>
      )}
      {i === 4 && (
        <g>
          <rect width={W} height={H} fill="#FFFFFF" />
          <rect x="10" y="22" width="44" height="56" fill="#F2F3F4" stroke="#C9CED0" />
          {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={16 + c * 18} y={28 + r * 15} width="12" height="9" fill="#A2AAAD" />))}
          <text x="14" y="18" fontSize="5" fontWeight="800" fill="#626262" fontFamily={MONO}>36К2</text>
          <rect x="62" y="48" width="44" height="22" rx="4" fill="#D50032" />
          <path d="M66 54 h36" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="70" cy="72" r="3.4" fill="#2E2E30" />
          <circle cx="98" cy="72" r="3.4" fill="#2E2E30" />
          <circle cx="128" cy="40" r="10" fill="#D50032" />
          <rect x="134" y="34" width="16" height="10" rx="2" fill="#D50032" />
          <rect x="122" y="46" width="7" height="22" rx="3.5" fill="#AB2328" transform="rotate(-14 125 46)" />
        </g>
      )}
      {i === 5 && (
        <g>
          <rect width={W} height={H} fill="#D50032" />
          <Quarter x={160} y={90} r={40} rot={180} fill="#AB2328" />
          <rect x="20" y="22" width="40" height="40" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="40" cy="42" r="9" fill="none" stroke="#FFFFFF" strokeWidth="4" />
          <text x="72" y="40" fontSize="8" fontWeight="300" fill="#FFFFFF" fontFamily={FONT}>СЕКРЕТНЫЙ</text>
          <text x="72" y="50" fontSize="8" fontWeight="800" fill="#FFFFFF" fontFamily={FONT}>КОД 1978</text>
          <text x="72" y="60" fontSize="4.4" fontWeight="700" fill="#FFFFFF" fontFamily={MONO}>VK MINI APP · 18+</text>
        </g>
      )}
    </svg>
  )
}

function StoryboardSection() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      if (active >= FRAMES.length - 1) setPlaying(false)
      else setActive(active + 1)
    }, 2600)
    return () => clearTimeout(t)
  }, [playing, active])
  const f = FRAMES[active]
  return (
    <section className="bk-page">
      <SectionHead id="video" n="Видеоролик · пункт 06" title="Раскадровка «Секретный код 1978» · 0:45" sub="Вертикальная и горизонтальная версии для VK Клипов и экранов в вузах. Ролик закольцован: щелчок замка капсулы открывает и закрывает историю." />
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0 border border-line bg-paper">
          <div className="och-light relative">
            <FrameArt i={active} />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 text-center text-[12px] font-bold text-white">{f.caption}</div>
          </div>
          <div className="h-1 bg-line">
            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${((active + 1) / FRAMES.length) * 100}%` }} />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-[11px] font-bold text-brand">{f.tc}</div>
              <Button
                size="sm"
                variant={playing ? 'light' : 'primary'}
                className="bk-noprint"
                onClick={() => {
                  if (!playing && active === FRAMES.length - 1) setActive(0)
                  setPlaying(!playing)
                }}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? 'Пауза' : 'Аниматик'}
              </Button>
            </div>
            <h3 className="mt-2 font-display text-lg font-extrabold uppercase">{f.title}</h3>
            <dl className="mt-2 grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px] leading-snug">
              <dt className="font-bold text-ink-soft">Кадр</dt>
              <dd>{f.shot}</dd>
              <dt className="font-bold text-ink-soft">Звук</dt>
              <dd>{f.sound}</dd>
              <dt className="font-bold text-ink-soft">Титр</dt>
              <dd className="font-semibold">{f.caption}</dd>
              <dt className="font-bold text-ink-soft">Референс</dt>
              <dd className="text-ink-soft">{f.ref}</dd>
            </dl>
          </div>
        </div>
        <ol className="grid grid-cols-2 gap-2 self-start sm:grid-cols-3 lg:grid-cols-2">
          {FRAMES.map((fr, k) => (
            <li key={fr.tc}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false)
                  setActive(k)
                }}
                className={cx('block w-full border bg-paper text-left transition', k === active ? 'border-brand ring-2 ring-brand/20' : 'border-line')}
                aria-current={k === active}
              >
                <div className="och-light">
                  <FrameArt i={k} />
                </div>
                <div className="p-2">
                  <div className="font-mono text-[10px] font-bold text-brand">{fr.tc}</div>
                  <div className="text-[12px] font-bold leading-tight">{fr.title}</div>
                </div>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- HR-бренд */
function BrandSection() {
  const pillars = [
    ['wheat', 'Натуральное', 'Квас двойного брожения, солод из Липецка: работа про настоящий продукт, а не про «химию».'],
    ['pump-gauge', 'Технологичное', 'ATAGO, мнемосхемы, линия SMI SK 500 P, 10 заводов с нуля — высокотехнологичное производство.'],
    ['bottles-crate', 'Своё', '100% российский капитал, наставник с первого дня, экзамены прямо на заводе.'],
  ]
  return (
    <section className="bk-page">
      <SectionHead id="brand" n="Концепция HR-бренда" title="«Я делаю натуральные напитки»" sub={`Призвание бренда — «${BRAND_PLATFORM.calling}». Мы переносим лозунг со спецовки в обещание работодателя: молодой специалист не «идёт на завод», а делает продукт, который знает вся страна.`} />
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        {pillars.map(([p, t, d]) => (
          <div key={t} className="bg-paper p-4">
            <span className="grid h-12 w-12 place-items-center bg-brand text-white">
              <Picto name={p} className="h-8 w-8" />
            </span>
            <h3 className="mt-3 font-display text-base font-extrabold uppercase">{t}</h3>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- страница */
export default function BrandKit({ standalone = false }) {
  const print = () => {
    // внутри ВКонтакте печать недоступна — открываем отдельную страницу в браузере
    if (isInsideVK && !standalone) {
      window.open('./brandkit.html', '_blank', 'noopener')
      return
    }
    window.print()
  }
  return (
    <div className="bk-root mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="bk-noprint mb-6 border border-line bg-paper">
        <div className="grid sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="p-4 sm:p-5">
            <Kicker>Материалы кейса · пункты 02–07</Kicker>
            <h1 className="mt-2 font-display text-[28px] uppercase leading-[0.95] tracking-tight sm:text-5xl">
              <span className="font-light">Бренд-Кит</span> <span className="font-extrabold text-brand">и листовки</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">Готово к печати и к слайдам презентации: каждый макет собран по брендбуку ОЧАКОВО. Кнопка ниже сохраняет листовки А4 и разделы в PDF.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={print}>
                <Printer className="h-4 w-4" /> Печать / Сохранить макеты в PDF
              </Button>
              {!standalone && (
                <Button as="a" variant="light" href="./brandkit.html" target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4" /> Открыть отдельно
                </Button>
              )}
            </div>
          </div>
          <div className="och-light hidden items-end justify-center border-l border-line bg-[#F2F3F4] px-4 pt-3 sm:flex">
            <MascotFigure variant="storyteller" size={170} />
          </div>
        </div>
        <nav className="no-scrollbar flex gap-px overflow-x-auto border-t border-line bg-line" aria-label="Разделы Бренд-Кита">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#bk-${id}`} onClick={(e) => (e.preventDefault(), document.getElementById(`bk-${id}`)?.scrollIntoView({ behavior: 'smooth' }))} className="shrink-0 bg-paper px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-ink-soft hover:text-brand">
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="space-y-12">
        <LeafletsSection />
        <MascotSection />
        <MerchSection />
        <StoryboardSection />
        <BrandSection />
      </div>
      <p className="bk-noprint mt-10 text-[11px] text-ink-mute">
        Фирменная гарнитура ОЧАКОВО — Proxima Nova (лицензия ParaType). В макетах используется открытая замена Montserrat; при печати в типографии подставьте Proxima Nova. Палитра — Pantone 199, 7621, 429, Cool Gray 10.
      </p>
    </div>
  )
}

