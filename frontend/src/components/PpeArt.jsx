// Простые иллюстрации СИЗ в поп-арт стиле (толстый контур, плоские цвета).
const S = { stroke: '#17110F', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }

export default function PpeArt({ id, className = 'h-16 w-16' }) {
  switch (id) {
    case 'jacket':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M26 12 l-14 8 -6 22 10 3 2 -8 v33 h44 v-33 l2 8 10 -3 -6 -22 -14 -8 q-14 8 -28 0z" fill="#EC1A42" {...S} />
          <path d="M18 44 h44" stroke="#fff" strokeWidth="4" />
          <text x="40" y="58" textAnchor="middle" fontSize="6.4" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">Я ДЕЛАЮ</text>
          <text x="40" y="65" textAnchor="middle" fontSize="5" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">НАТУРАЛЬНЫЕ</text>
          <text x="40" y="71" textAnchor="middle" fontSize="5" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">НАПИТКИ</text>
        </svg>
      )
    case 'boots':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M18 14 h22 v30 l20 8 q8 4 8 12 v4 h-50z" fill="#2A211D" {...S} />
          <path d="M18 62 h50 v6 h-50z" fill="#C9922E" {...S} />
          <path d="M22 22 h14 M22 30 h14 M22 38 h14" stroke="#EBC779" strokeWidth="3" />
          <path d="M50 50 q8 2 12 10" stroke="#fff" strokeWidth="2" fill="none" opacity=".5" />
        </svg>
      )
    case 'gloves':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M26 70 v-14 l-10 -16 q-2 -6 4 -6 l8 10 v-26 q0 -5 5 -5 t5 5 v18 v-22 q0 -5 5 -5 t5 5 v22 v-18 q0 -5 5 -5 t5 5 v20 v-12 q0 -5 5 -5 t4 5 v22 q0 14 -10 22 v6z" fill="#3B8FD4" {...S} />
          <path d="M26 64 h28" stroke="#fff" strokeWidth="3" opacity=".7" />
        </svg>
      )
    case 'earplugs':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M14 46 q26 26 52 0" stroke="#17110F" strokeWidth="3" fill="none" strokeDasharray="1 5" />
          <rect x="10" y="22" width="16" height="26" rx="8" fill="#FFD21F" {...S} transform="rotate(-18 18 35)" />
          <rect x="54" y="22" width="16" height="26" rx="8" fill="#FFD21F" {...S} transform="rotate(18 62 35)" />
          <path d="M14 30 l6 -2 M58 28 l6 2" stroke="#C9922E" strokeWidth="2" />
        </svg>
      )
    case 'slippers':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M12 54 q0 -12 16 -12 h34 q8 0 8 8 v4 q0 6 -8 6 h-42 q-8 0 -8 -6z" fill="#7DBB2F" {...S} />
          <path d="M40 42 l-6 -14 M40 42 l8 -14" stroke="#EC1A42" strokeWidth="5" strokeLinecap="round" />
          <circle cx="40" cy="28" r="3" fill="#EC1A42" {...S} />
        </svg>
      )
    case 'hoodie':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M28 10 q12 -6 24 0 l14 10 8 40 -8 4 -4 -8 v12 h-44 v-12 l-4 8 -8 -4 8 -40z" fill="#8C8F96" {...S} />
          <path d="M66 60 q8 10 2 18 M14 60 q-8 10 -2 18" stroke="#17110F" strokeWidth="3" fill="none" />
          <path d="M32 12 q8 12 16 0" fill="#6B6E75" {...S} />
          <path d="M36 22 v14 M44 22 v14" stroke="#fff" strokeWidth="2" />
        </svg>
      )
    case 'headphones':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M16 48 v-8 q0 -24 24 -24 t24 24 v8" fill="none" {...S} strokeWidth="5" />
          <rect x="10" y="44" width="14" height="22" rx="6" fill="#4B1E8C" {...S} />
          <rect x="56" y="44" width="14" height="22" rx="6" fill="#4B1E8C" {...S} />
          <path d="M30 70 q4 -6 8 0 q4 6 8 0" stroke="#EC1A42" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'scarf':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M18 22 q22 12 44 0 l2 10 q-24 14 -48 0z" fill="#E8B7C4" {...S} />
          <path d="M44 30 q4 18 -2 42 l10 2 q8 -22 2 -44z" fill="#E8B7C4" {...S} />
          <path d="M44 70 l-4 6 M50 72 l0 7 M55 72 l4 6" stroke="#17110F" strokeWidth="2.5" />
          <path d="M24 26 l8 4 M36 30 l8 2" stroke="#EC1A42" strokeWidth="2.5" />
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
      <circle cx="100" cy="42" r="26" fill="#E9DCC6" {...S} />
      <path d="M62 80 q38 -18 76 0 l12 90 -18 4 -6 -40 v120 h-52 v-120 l-6 40 -18 -4z" fill="#F5EEE2" {...S} />
      {/* кепка всегда (часть формы) */}
      {has('jacket') && <path d="M74 32 q26 -26 52 0 v4 h-52z" fill="#EC1A42" {...S} />}
      {/* спецовка */}
      {has('jacket') && (
        <g>
          <path d="M60 80 q40 -18 80 0 l12 92 -20 4 -6 -38 v66 h-52 v-66 l-6 38 -20 -4z" fill="#EC1A42" {...S} />
          <path d="M70 152 h60" stroke="#fff" strokeWidth="5" />
          <text x="100" y="112" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">Я ДЕЛАЮ</text>
          <text x="100" y="126" textAnchor="middle" fontSize="9.6" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">НАТУРАЛЬНЫЕ</text>
          <text x="100" y="139" textAnchor="middle" fontSize="9.6" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">НАПИТКИ</text>
        </g>
      )}
      {has('hoodie') && (
        <g>
          <path d="M58 80 q42 -20 84 0 l16 96 -10 6 -14 -40 v58 h-52 v-58 l-14 40 -10 -6z" fill="#8C8F96" {...S} />
          <path d="M156 176 q8 18 -2 34 M44 176 q-8 18 2 34" stroke="#17110F" strokeWidth="3" fill="none" />
        </g>
      )}
      {has('scarf') && <path d="M80 70 q20 10 40 0 l2 8 q-14 8 -12 70 l-10 2 q-2 -60 -22 -72z" fill="#E8B7C4" {...S} />}
      {/* ноги */}
      <path d="M76 254 v42 M124 254 v42" stroke="#17110F" strokeWidth="3" />
      {has('boots') && (
        <g>
          <path d="M64 282 h28 v26 h-34 q-2 -10 6 -14z" fill="#2A211D" {...S} />
          <path d="M108 282 h28 v12 q8 4 6 14 h-34z" fill="#2A211D" {...S} />
        </g>
      )}
      {has('slippers') && (
        <g>
          <path d="M60 300 h36 v8 h-36z M104 300 h36 v8 h-36z" fill="#7DBB2F" {...S} />
        </g>
      )}
      {has('gloves') && (
        <g>
          <circle cx="44" cy="180" r="12" fill="#3B8FD4" {...S} />
          <circle cx="156" cy="180" r="12" fill="#3B8FD4" {...S} />
        </g>
      )}
      {has('earplugs') && (
        <g>
          <circle cx="73" cy="44" r="5" fill="#FFD21F" {...S} strokeWidth="2" />
          <circle cx="127" cy="44" r="5" fill="#FFD21F" {...S} strokeWidth="2" />
        </g>
      )}
      {has('headphones') && (
        <g>
          <path d="M70 44 q30 -44 60 0" fill="none" stroke="#4B1E8C" strokeWidth="6" />
          <rect x="62" y="36" width="12" height="18" rx="5" fill="#4B1E8C" {...S} />
          <rect x="126" y="36" width="12" height="18" rx="5" fill="#4B1E8C" {...S} />
        </g>
      )}
    </svg>
  )
}
