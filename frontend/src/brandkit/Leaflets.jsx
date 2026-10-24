// Три листовки А4 (210 × 297 мм) для печати и презентации. Вёрстка — модульная сетка 12 мм полей,
// цвета и стилеобразующие элементы брендбука: красная заливка, разбавленная белым (стр. 56), квадратные модули (стр. 57),
// пиктограммы (стр. 50), серые фигуры паттерна (стр. 52). QR-коды рабочие: ведут в VK Mini App.
import { BRAND, Bullet, FONT, LogoBlock, Lines, MONO, PictoAt, QrAt, Quarter } from './svgkit.jsx'
import { MerchArt } from '../components/MerchCard.jsx'
import { MascotFigure } from '../components/MascotStoryteller.jsx'

const APP_ID = import.meta.env?.VITE_VK_APP_ID || '54849953'
export const APP_URL = `https://vk.com/app${APP_ID}`

export const LEAFLETS = [
  { id: 'lab', title: 'Алхимия натурального вкуса', audience: 'Химики-лаборанты и технологи 4 курса', url: `${APP_URL}#/station/lab` },
  { id: 'eng', title: 'Инженерный масштаб 1978–2026', audience: 'Наладчики, машинисты, IT-практиканты', url: `${APP_URL}#/station/engineering` },
  { id: 'start', title: 'Твой старт в Москве', audience: 'Операторы линий и склада, иногородние студенты', url: `${APP_URL}#/rewards/merch` },
]

function Footer({ dark = false }) {
  const c = dark ? BRAND.white : BRAND.graphite
  return (
    <g>
      <path d="M12 272 H198" stroke={dark ? 'rgba(255,255,255,.5)' : BRAND.gray} strokeWidth="0.3" />
      <Lines x={12} y={280} lines={['АО МПБК «ОЧАКОВО» · Москва, ул. Рябиновая, 44', 'Отдел подбора: 8 800 100 77 77, доб. 1155']} size={3.2} lh={4.4} weight={600} fill={c} />
      <rect x="182" y="275" width="16" height="10" fill="none" stroke={c} strokeWidth="0.5" />
      <text x="190" y="282.2" textAnchor="middle" fontSize="5" fontWeight="800" fill={c} fontFamily={FONT}>18+</text>
    </g>
  )
}

function QrBlock({ x, y, url, caption }) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width="50" height="61" fill={BRAND.white} stroke={BRAND.gray} strokeWidth="0.3" />
      <QrAt value={url} x={x} y={y} size={44} />
      <Lines x={x} y={y + 50} lines={caption} size={2.9} lh={3.8} weight={700} fill={BRAND.ink} />
    </g>
  )
}

/* ------------------------------------------------------------------ №1 лаборатория */
export function LeafletLab() {
  return (
    <svg viewBox="0 0 210 297" className="bk-sheet block h-auto w-full bg-white" role="img" aria-label="Листовка «Алхимия натурального вкуса»">
      <rect width="210" height="297" fill={BRAND.white} />
      {/* красная заливка, разбавленная белым */}
      <rect width="210" height="124" fill={BRAND.red} />
      <LogoBlock x={12} y={12} size={30} />
      <text x="198" y="18" textAnchor="end" fontSize="3.2" fontWeight="700" fill={BRAND.white} fontFamily={MONO} letterSpacing="0.6">ПРАКТИКА · СТАЖИРОВКА · 2026</text>
      <text x="12" y="66" fontSize="17" fontWeight="300" fill={BRAND.white} fontFamily={FONT}>АЛХИМИЯ</text>
      <text x="12" y="84" fontSize="17" fontWeight="800" fill={BRAND.white} fontFamily={FONT}>НАТУРАЛЬНОГО</text>
      <text x="12" y="102" fontSize="17" fontWeight="800" fill={BRAND.white} fontFamily={FONT}>ВКУСА</text>
      <text x="12" y="115" fontSize="4.2" fontWeight="600" fill={BRAND.white} fontFamily={FONT}>Для химиков-лаборантов и технологов 4 курса</text>
      <Quarter x={210} y={124} r={34} rot={180} fill={BRAND.redDark} />
      <Quarter x={176} y={124} r={20} rot={180} fill={BRAND.gray} opacity={0.6} />

      {/* иллюстрация: лаборатория, рефрактометр ATAGO, колба */}
      <g>
        <rect x="12" y="134" width="110" height="74" fill={BRAND.light} />
        {/* колба */}
        <path d="M34 146 h10 v14 l14 30 h-38 l14 -30 z" fill="none" stroke={BRAND.red} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M24.5 182 h29 l4.5 8 h-38 z" fill={BRAND.red} opacity=".85" />
        <path d="M32 146 h14" stroke={BRAND.red} strokeWidth="1.2" />
        <circle cx="37" cy="176" r="1.2" fill={BRAND.red} />
        <circle cx="42" cy="172" r="0.9" fill={BRAND.red} />
        {/* рефрактометр */}
        <rect x="64" y="148" width="50" height="40" rx="5" fill={BRAND.white} stroke={BRAND.graphite} strokeWidth="0.8" />
        <rect x="68" y="152" width="30" height="20" rx="1.5" fill={BRAND.ink} />
        <text x="70.5" y="157" fontSize="2.4" fontWeight="700" fill={BRAND.gray} fontFamily={MONO}>Brix % · 20 °C</text>
        <text x="70.5" y="167.5" fontSize="8.4" fontWeight="700" fill={BRAND.white} fontFamily={MONO}>6.52</text>
        <text x="94.5" y="167.5" textAnchor="end" fontSize="2.6" fontWeight="700" fill={BRAND.gray} fontFamily={MONO}>°Bx</text>
        <circle cx="106" cy="160" r="4.5" fill="none" stroke={BRAND.graphite} strokeWidth="0.8" />
        <circle cx="106" cy="160" r="1.8" fill={BRAND.red} />
        <text x="68" y="182" fontSize="3.4" fontWeight="800" fill={BRAND.graphite} fontFamily={FONT}>ATAGO RX-7000i</text>
        <text x="16" y="203" fontSize="3" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO}>НОРМА «ОЧАКОВСКОГО» 6,2–6,8 °Bx</text>
      </g>
      {/* модули с пиктограммами */}
      {[
        ['citrus', BRAND.red, BRAND.white],
        ['apple', BRAND.white, BRAND.red],
        ['raspberry', BRAND.white, BRAND.red],
        ['wheat', BRAND.redDark, BRAND.white],
      ].map(([n, bg, fg], i) => (
        <g key={n}>
          <rect x={128 + (i % 2) * 35} y={134 + Math.floor(i / 2) * 37} width="35" height="37" fill={bg} stroke={BRAND.gray} strokeWidth={bg === BRAND.white ? 0.3 : 0} />
          <PictoAt name={n} x={137 + (i % 2) * 35} y={144 + Math.floor(i / 2) * 37} size={17} color={fg} />
        </g>
      ))}

      {/* оффер */}
      <text x="12" y="222" fontSize="3.4" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO} letterSpacing="0.4">ДОХОД ДО ВЫЧЕТА НДФЛ</text>
      <text x="12" y="235" fontSize="11" fontWeight="800" fill={BRAND.red} fontFamily={FONT}>от 60 000 – 70 000 ₽</text>
      <Bullet x={12} y={247} text="Без испытательного срока" />
      <Bullet x={12} y={255} text="Квас «Очаковский» — экспорт в 30+ стран" />
      <Bullet x={12} y={263} text="Наставник-технолог с первого дня" />
      <QrBlock x={151} y={208} url={LEAFLETS[0].url} caption={['Сканируй: квест', '«Секретный код 1978»']} />
      <Footer />
    </svg>
  )
}

/* ------------------------------------------------------------------ №2 инженерия */
function Tank({ x, y, h = 52 }) {
  return (
    <g>
      <path d={`M${x} ${y + 8} q12 -10 24 0 v${h} l-12 12 l-12 -12 z`} fill={BRAND.white} stroke={BRAND.graphite} strokeWidth="0.8" />
      <rect x={x} y={y + 22} width="24" height="4" fill={BRAND.red} />
      <path d={`M${x + 4} ${y + h + 20} v10 M${x + 20} ${y + h + 20} v10`} stroke={BRAND.graphite} strokeWidth="0.8" />
      <circle cx={x + 12} cy={y + 40} r="3" fill="none" stroke={BRAND.graphite} strokeWidth="0.6" />
    </g>
  )
}

export function LeafletEngineering() {
  return (
    <svg viewBox="0 0 210 297" className="bk-sheet block h-auto w-full bg-white" role="img" aria-label="Листовка «Инженерный масштаб 1978–2026»">
      <rect width="210" height="297" fill={BRAND.white} />
      <rect width="10" height="297" fill={BRAND.red} />
      <LogoBlock x={170} y={12} size={28} fg={BRAND.white} bg={BRAND.red} />
      <text x="22" y="20" fontSize="3.2" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO} letterSpacing="0.6">ТЕХЦЕХ · ЛЭП · ЛИНИЯ SMI SK 500 P</text>
      <text x="22" y="56" fontSize="17" fontWeight="800" fill={BRAND.red} fontFamily={FONT}>ИНЖЕНЕРНЫЙ</text>
      <text x="22" y="74" fontSize="17" fontWeight="300" fill={BRAND.red} fontFamily={FONT}>МАСШТАБ</text>
      <text x="22" y="88" fontSize="9" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO}>1978–2026</text>
      <text x="22" y="98" fontSize="4.2" fontWeight="600" fill={BRAND.graphite} fontFamily={FONT}>Для наладчиков, машинистов и IT-практикантов</text>

      {/* иллюстрация: ЦКТ ЛЭП и линия розлива */}
      <rect x="22" y="106" width="176" height="96" fill={BRAND.light} />
      <Quarter x={198} y={106} r={30} rot={90} fill={BRAND.gray} opacity={0.5} />
      <Tank x={34} y={112} />
      <Tank x={64} y={112} />
      <Tank x={94} y={112} h={44} />
      <path d="M58 124 h6 M88 124 h6 M118 126 h16 v40" stroke={BRAND.red} strokeWidth="1" fill="none" />
      <text x="34" y="198" fontSize="3" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO}>ЦКТ ЛЭП · АБСОРБЕР · МЭА</text>
      {/* конвейер */}
      <rect x="128" y="176" width="66" height="4" fill={BRAND.graphite} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={131 + i * 10.5} y="160" width="7" height="15.5" rx="1.2" fill={i === 3 ? BRAND.white : BRAND.red} stroke={BRAND.red} strokeWidth="0.6" />
          <rect x={131.5 + i * 10.5} y="161" width="6" height="1.2" fill={BRAND.gray} />
        </g>
      ))}
      <circle cx="132" cy="184" r="2.4" fill="none" stroke={BRAND.graphite} strokeWidth="0.6" />
      <circle cx="190" cy="184" r="2.4" fill="none" stroke={BRAND.graphite} strokeWidth="0.6" />
      <path d="M140 152 h12 M144 148 h12" stroke={BRAND.gray} strokeWidth="0.8" />
      <text x="128" y="198" fontSize="3" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO}>ЛИНИЯ SMI SK 500 P</text>

      {/* оффер: квадратный модуль */}
      <rect x="22" y="210" width="62" height="56" fill={BRAND.red} />
      <text x="27" y="222" fontSize="3" fontWeight="700" fill={BRAND.white} fontFamily={MONO}>ДО ВЫЧЕТА НДФЛ</text>
      <text x="27" y="238" fontSize="7.8" fontWeight="800" fill={BRAND.white} fontFamily={FONT}>от 70 000 ₽</text>
      <text x="27" y="250" fontSize="5.4" fontWeight="300" fill={BRAND.white} fontFamily={FONT}>+ ночные смены</text>
      <text x="27" y="259" fontSize="3" fontWeight="600" fill={BRAND.white} fontFamily={FONT}>по повышенному тарифу</text>
      <Bullet x={90} y={219} text="Экзамены — прямо на заводе" size={3.6} />
      <Bullet x={90} y={227} text="Оцифровка линий под диплом" size={3.6} />
      <Bullet x={90} y={235} text="10 заводов с нуля, 100% РФ" size={3.6} />
      <QrAt value={LEAFLETS[1].url} x={90} y={240} size={28} />
      <Lines x={121} y={249} lines={['Сканируй: станция', '«Инженерия» в VK', 'Mini App']} size={2.9} lh={3.8} weight={700} fill={BRAND.ink} />
      <Footer />
    </svg>
  )
}

/* ------------------------------------------------------------------ №3 старт в Москве */
export function LeafletStart() {
  return (
    <svg viewBox="0 0 210 297" className="bk-sheet block h-auto w-full bg-white" role="img" aria-label="Листовка «Твой старт в Москве»">
      <rect width="210" height="297" fill={BRAND.white} />
      <LogoBlock x={12} y={12} size={28} fg={BRAND.white} bg={BRAND.red} />
      <text x="198" y="18" textAnchor="end" fontSize="3.2" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO} letterSpacing="0.6">СЕЗОН МАРТ–СЕНТЯБРЬ</text>
      <text x="12" y="62" fontSize="19" fontWeight="800" fill={BRAND.red} fontFamily={FONT}>ТВОЙ СТАРТ</text>
      <text x="12" y="81" fontSize="19" fontWeight="300" fill={BRAND.red} fontFamily={FONT}>В МОСКВЕ</text>
      <text x="12" y="92" fontSize="4.2" fontWeight="600" fill={BRAND.graphite} fontFamily={FONT}>Для операторов линий, склада и иногородних студентов</text>
      <MascotFigure variant="celebrate" size={58} idle={false} x={150} y={28} />

      {/* инфографика: квадратные модули 2 × 2 */}
      <g>
        <rect x="12" y="100" width="92" height="66" fill={BRAND.red} />
        <path d="M84 118 l8 -8 l8 8 v10 h-16 z M89.5 128 v-5 h5 v5" fill="none" stroke={BRAND.white} strokeWidth="1" strokeLinejoin="round" />
        <text x="18" y="132" fontSize="13" fontWeight="800" fill={BRAND.white} fontFamily={FONT}>3 400 ₽</text>
        <Lines x={18} y={143} lines={['в месяц · общежитие', 'Рябиновая, 36к2 · −50%']} size={3.6} lh={4.6} weight={600} fill={BRAND.white} />

        <rect x="106" y="100" width="92" height="66" fill={BRAND.white} stroke={BRAND.gray} strokeWidth="0.4" />
        <text x="112" y="132" fontSize="15" fontWeight="800" fill={BRAND.red} fontFamily={FONT}>−50%</text>
        <Lines x={112} y={143} lines={['обеды в столовой', 'по карте сотрудника']} size={3.6} lh={4.6} weight={600} fill={BRAND.ink} />

        <rect x="12" y="168" width="92" height="66" fill={BRAND.graphite} />
        <g transform="translate(18 176)">
          <rect width="26" height="14" rx="2.5" fill="none" stroke={BRAND.white} strokeWidth="1" />
          <path d="M3 4 h20 M3 8 h20" stroke={BRAND.white} strokeWidth="0.8" />
          <circle cx="6" cy="15" r="2" fill={BRAND.white} />
          <circle cx="20" cy="15" r="2" fill={BRAND.white} />
        </g>
        <text x="18" y="212" fontSize="7.4" fontWeight="800" fill={BRAND.white} fontFamily={FONT}>м. Озёрная</text>
        <text x="18" y="222" fontSize="3.6" fontWeight="600" fill={BRAND.white} fontFamily={FONT}>корпоративный автобус</text>

        <rect x="106" y="168" width="92" height="66" fill={BRAND.light} />
        <Quarter x={198} y={168} r={24} rot={90} fill={BRAND.gray} opacity={0.6} />
        <text x="112" y="200" fontSize="13" fontWeight="800" fill={BRAND.ink} fontFamily={FONT}>12 и 27</text>
        <Lines x={112} y={211} lines={['зарплата 2 раза в месяц', 'от 56 000 до 70 000+ ₽']} size={3.6} lh={4.6} weight={600} fill={BRAND.ink} />
      </g>

      {/* розыгрыш худи */}
      <rect x="12" y="238" width="132" height="30" fill={BRAND.light} />
      <MerchArt id="hoodie" x={14} y={239} width={46} height={28} />
      <Lines x={64} y={248} lines={['Пройди квест — выиграй', 'худи «МАНИФЕСТ 1978»']} size={4} lh={5} weight={800} fill={BRAND.ink} />
      <text x="64" y="262" fontSize="2.9" fontWeight="700" fill={BRAND.graphite} fontFamily={MONO}>БИЛЕТЫ ЗА КРАФТ-БАЛЛЫ</text>
      <QrAt value={LEAFLETS[2].url} x={150} y={234} size={36} />
      <text x="168" y="270.5" textAnchor="middle" fontSize="2.6" fontWeight="700" fill={BRAND.ink} fontFamily={FONT}>Сканируй и играй</text>
      <Footer />
    </svg>
  )
}

export const LEAFLET_COMPONENTS = { lab: LeafletLab, eng: LeafletEngineering, start: LeafletStart }
