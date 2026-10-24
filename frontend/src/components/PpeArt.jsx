// Детальные качественные SVG-иллюстрации СИЗ по брендбуку Очаково и стандартам охраны труда
const S = { stroke: '#2A2A2A', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' }

export default function PpeArt({ id, className = 'h-16 w-16' }) {
  switch (id) {
    case 'jacket':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Воротник и плечи спецовки */}
          <path d="M30 18 L16 26 L6 50 L18 54 L22 42 L22 84 L78 84 L78 42 L82 54 L94 50 L84 26 L70 18 Z" fill="#D50032" {...S} />
          {/* Воротник-стойка */}
          <path d="M35 18 Q50 26 65 18 L62 26 Q50 32 38 26 Z" fill="#626262" {...S} />
          {/* Светоотражающие полосы */}
          <rect x="22" y="52" width="56" height="5" fill="#E8EBEC" stroke="#A2AAAD" strokeWidth="1" />
          <rect x="22" y="60" width="56" height="3" fill="#FFD21F" opacity="0.9" />
          {/* Манжеты рукавов */}
          <path d="M7 47 L17 51 L19 46 L9 42 Z" fill="#626262" {...S} />
          <path d="M93 47 L83 51 L81 46 L91 42 Z" fill="#626262" {...S} />
          {/* Молния */}
          <line x1="50" y1="26" x2="50" y2="84" stroke="#4A4A4A" strokeWidth="2.5" strokeDasharray="3 2" />
          {/* Фирменный бейдж / манифест на спине/груди */}
          <rect x="28" y="30" width="44" height="18" rx="2" fill="#FFFFFF" stroke="#D50032" strokeWidth="1.5" />
          <text x="50" y="37" textAnchor="middle" fontSize="5.2" fontWeight="900" fill="#D50032" fontFamily="Montserrat, sans-serif">
            Я ДЕЛАЮ
          </text>
          <text x="50" y="44" textAnchor="middle" fontSize="4.2" fontWeight="900" fill="#2A2A2A" fontFamily="Montserrat, sans-serif">
            НАТУРАЛЬНЫЕ НАПИТКИ
          </text>
        </svg>
      )

    case 'boots':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Протектор и толстая подошва */}
          <path d="M14 74 L86 74 L84 82 L16 82 Z" fill="#2A2A2A" {...S} />
          <line x1="22" y1="82" x2="22" y2="76" stroke="#fff" strokeWidth="2" />
          <line x1="36" y1="82" x2="36" y2="76" stroke="#fff" strokeWidth="2" />
          <line x1="50" y1="82" x2="50" y2="76" stroke="#fff" strokeWidth="2" />
          <line x1="64" y1="82" x2="64" y2="76" stroke="#fff" strokeWidth="2" />
          <line x1="78" y1="82" x2="78" y2="76" stroke="#fff" strokeWidth="2" />
          {/* Основа ботинка */}
          <path d="M22 24 L52 24 L50 48 L76 56 Q88 60 86 74 L16 74 L18 42 Z" fill="#50535A" {...S} />
          {/* Усиленный стальной мыс */}
          <path d="M66 56 Q86 58 86 74 L60 74 Q64 62 66 56 Z" fill="#8C9098" {...S} />
          {/* Мягкий воротничок лодыжки */}
          <rect x="20" y="20" width="34" height="8" rx="3" fill="#D50032" {...S} />
          {/* Шнуровка */}
          <path d="M36 32 L46 34 M34 40 L44 42 M32 48 L42 50" stroke="#FFD21F" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )

    case 'gloves':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Пара пятипалых перчаток: левая и правая */}
          {/* Левая перчатка */}
          <g transform="translate(6, 4) scale(0.9)">
            <path
              d="M18 78 L18 58 Q14 54 8 46 Q5 41 11 38 Q16 41 20 48 L20 28 Q20 22 26 22 Q32 22 32 28 L32 22 Q32 16 38 16 Q44 16 44 22 L44 24 Q44 18 50 18 Q56 18 56 24 L56 32 Q56 26 61 26 Q66 26 66 32 L64 58 Q64 70 54 78 Z"
              fill="#0086D6"
              {...S}
            />
            {/* Резиновый защитный манжет */}
            <rect x="18" y="74" width="38" height="12" rx="3" fill="#D50032" {...S} />
            {/* Нескользящая накладка на ладони */}
            <path d="M22 46 Q38 42 52 48 L50 64 Q36 68 22 62 Z" fill="#0066A4" opacity="0.6" />
          </g>
          {/* Правая перчатка (смещенная) */}
          <g transform="translate(42, 10) scale(0.9) scale(-1, 1) translate(-70, 0)">
            <path
              d="M18 78 L18 58 Q14 54 8 46 Q5 41 11 38 Q16 41 20 48 L20 28 Q20 22 26 22 Q32 22 32 28 L32 22 Q32 16 38 16 Q44 16 44 22 L44 24 Q44 18 50 18 Q56 18 56 24 L56 32 Q56 26 61 26 Q66 26 66 32 L64 58 Q64 70 54 78 Z"
              fill="#3B8FD4"
              {...S}
            />
            <rect x="18" y="74" width="38" height="12" rx="3" fill="#D50032" {...S} />
          </g>
        </svg>
      )

    case 'earplugs':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Соединительный эластичный шнурок */}
          <path d="M26 62 Q50 94 74 62" stroke="#D50032" strokeWidth="3" fill="none" {...S} />
          {/* Левый беруш (конусообразный трехъярусный) */}
          <g transform="translate(14, 20) rotate(-15 15 25)">
            <ellipse cx="14" cy="16" rx="8" ry="6" fill="#FFD21F" {...S} />
            <ellipse cx="14" cy="26" rx="10" ry="7" fill="#FFD21F" {...S} />
            <ellipse cx="14" cy="38" rx="12" ry="8" fill="#FFD21F" {...S} />
            <rect x="11" y="44" width="6" height="8" rx="2" fill="#E8AA00" {...S} />
          </g>
          {/* Правый беруш */}
          <g transform="translate(62, 16) rotate(15 15 25)">
            <ellipse cx="14" cy="16" rx="8" ry="6" fill="#FFD21F" {...S} />
            <ellipse cx="14" cy="26" rx="10" ry="7" fill="#FFD21F" {...S} />
            <ellipse cx="14" cy="38" rx="12" ry="8" fill="#FFD21F" {...S} />
            <rect x="11" y="44" width="6" height="8" rx="2" fill="#E8AA00" {...S} />
          </g>
        </svg>
      )

    case 'goggles':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Ремешок каски/очков */}
          <path d="M12 48 Q50 36 88 48" stroke="#333" strokeWidth="5" fill="none" />
          {/* Оправа защитных очков */}
          <path d="M16 42 Q32 38 48 44 Q64 38 84 42 Q88 64 74 72 Q50 68 48 54 Q46 68 26 72 Q12 64 16 42 Z" fill="#FFFFFF" {...S} />
          {/* Линзы с бликом */}
          <path d="M22 46 Q34 44 45 48 Q43 64 28 66 Q18 60 22 46 Z" fill="#90CAF9" opacity="0.75" />
          <path d="M55 48 Q66 44 78 46 Q82 60 72 66 Q57 64 55 48 Z" fill="#90CAF9" opacity="0.75" />
          <line x1="26" y1="50" x2="32" y2="62" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="59" y1="50" x2="65" y2="62" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )

    case 'scarf':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Петля вязаного шарфа */}
          <path d="M20 28 Q50 14 80 28 Q88 42 74 46 Q50 34 26 46 Q12 42 20 28 Z" fill="#E0829B" {...S} />
          {/* Длинный висящий конец (нарушение ТБ: свисающий элемент!) */}
          <path d="M52 42 L64 82 L42 84 L38 44 Z" fill="#D46A85" {...S} />
          {/* Второй конец шарфа */}
          <path d="M60 42 L72 74 L58 76 L52 44 Z" fill="#E0829B" {...S} />
          {/* Бахрома на концах */}
          <path d="M42 84 L40 94 M46 84 L45 95 M50 84 L51 95 M56 83 L57 94 M62 82 L64 92" stroke="#2A2A2A" strokeWidth="2.5" />
          <path d="M58 76 L59 84 M64 75 L66 84 M70 74 L73 83" stroke="#2A2A2A" strokeWidth="2" />
          {/* Вязаный узор */}
          <path d="M28 32 Q50 24 72 32 M44 54 L58 56 M43 66 L59 68" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      )

    case 'slippers':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Открытые пляжные шлепанцы/сланцы */}
          <ellipse cx="50" cy="62" rx="36" ry="14" fill="#84BD00" {...S} />
          {/* Резиновая перемычка */}
          <path d="M32 60 Q50 34 50 34 Q50 34 68 60" stroke="#D50032" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="34" r="4.5" fill="#D50032" {...S} />
          {/* Открытые пальцы и пятка */}
          <text x="50" y="86" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#D50032" fontFamily="sans-serif">
            ОТКРЫТАЯ СТОПА
          </text>
        </svg>
      )

    case 'headphones':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Оголовье наушников */}
          <path d="M22 50 Q22 16 50 16 Q78 16 78 50" fill="none" stroke="#2A2A2A" strokeWidth="6" strokeLinecap="round" />
          {/* Амбушюры */}
          <rect x="14" y="44" width="16" height="26" rx="8" fill="#7C3AED" {...S} />
          <rect x="70" y="44" width="16" height="26" rx="8" fill="#7C3AED" {...S} />
          {/* Длинный свисающий провод с джеком */}
          <path d="M22 70 Q24 88 38 82 Q54 76 60 92" fill="none" stroke="#D50032" strokeWidth="3" {...S} />
          <rect x="58" y="90" width="8" height="4" rx="1" fill="#4A4A4A" {...S} />
          <line x1="66" y1="92" x2="72" y2="92" stroke="#FFD21F" strokeWidth="2.5" />
        </svg>
      )

    case 'baggy':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Свободная оверсайз толстовка со свисающими рукавами */}
          <path d="M30 18 Q50 26 70 18 L86 28 L94 72 L82 74 L76 46 L76 86 L24 86 L24 46 L18 74 L6 72 L14 28 Z" fill="#9CA3AF" {...S} />
          {/* Капюшон со шнурками */}
          <path d="M36 20 Q50 30 64 20" fill="none" stroke="#4B5563" strokeWidth="2.5" />
          <line x1="44" y1="26" x2="42" y2="46" stroke="#D50032" strokeWidth="2" strokeLinecap="round" />
          <line x1="56" y1="26" x2="58" y2="48" stroke="#D50032" strokeWidth="2" strokeLinecap="round" />
          {/* Свисающие манжеты ниже кистей */}
          <rect x="4" y="70" width="16" height="7" rx="2" fill="#6B7280" {...S} />
          <rect x="80" y="70" width="16" height="7" rx="2" fill="#6B7280" {...S} />
        </svg>
      )

    case 'jewelry':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
          {/* Кольца на пальцах и свисающие браслеты */}
          <circle cx="50" cy="45" r="22" fill="none" stroke="#FFD21F" strokeWidth="6" {...S} />
          <polygon points="50,15 58,25 50,32 42,25" fill="#38BDF8" {...S} />
          {/* Висящие цепочки и браслеты */}
          <path d="M22 65 Q50 90 78 65" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeDasharray="3 3" {...S} />
          <circle cx="50" cy="78" r="6" fill="#FFD21F" {...S} />
        </svg>
      )

    default:
      return null
  }
}

/** Манекен (вид со спины), на который «надеваются» выбранные вещи. */
export function Mannequin({ wear = [], className = '' }) {
  const has = (id) => wear.includes(id)
  return (
    <svg viewBox="0 0 200 320" className={className} aria-label="Манекен">
      {/* тело */}
      <circle cx="100" cy="42" r="26" fill="#E8EBEC" stroke="#4A4A4A" strokeWidth="3" />
      <path d="M62 80 q38 -18 76 0 l12 90 -18 4 -6 -40 v120 h-52 v-120 l-6 40 -18 -4z" fill="#F4F5F6" stroke="#4A4A4A" strokeWidth="3" />
      {/* кепка */}
      {has('jacket') && <path d="M74 32 q26 -26 52 0 v4 h-52z" fill="#D50032" stroke="#4A4A4A" strokeWidth="3" />}
      {/* защитные очки */}
      {has('goggles') && (
        <path d="M74 38 Q100 46 126 38" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
      {/* спецовка */}
      {has('jacket') && (
        <g>
          <path d="M60 80 q40 -18 80 0 l12 92 -20 4 -6 -38 v66 h-52 v-66 l-6 38 -20 -4z" fill="#D50032" stroke="#4A4A4A" strokeWidth="3" />
          <path d="M70 152 h60" stroke="#fff" strokeWidth="5" />
          <text x="100" y="112" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">
            Я ДЕЛАЮ
          </text>
          <text x="100" y="126" textAnchor="middle" fontSize="9.6" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">
            НАТУРАЛЬНЫЕ
          </text>
          <text x="100" y="139" textAnchor="middle" fontSize="9.6" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">
            НАПИТКИ
          </text>
        </g>
      )}
      {/* перчатки */}
      {has('gloves') && (
        <g fill="#0086D6">
          <circle cx="48" cy="178" r="11" stroke="#4A4A4A" strokeWidth="2.5" />
          <circle cx="152" cy="178" r="11" stroke="#4A4A4A" strokeWidth="2.5" />
        </g>
      )}
      {/* обувь */}
      {has('boots') && (
        <g fill="#50535A">
          <rect x="74" y="278" width="22" height="18" rx="4" stroke="#4A4A4A" strokeWidth="2.5" />
          <rect x="104" y="278" width="22" height="18" rx="4" stroke="#4A4A4A" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  )
}
