// Капсульная коллекция мерча «PURE CRAFT 1978»: векторные мокапы 5 предметов в 3 цветах.
// Принт, фурнитура и шевроны — цвета брендбука ОЧАКОВО (стр. 58). Фон мокапа всегда светлый, как у предметной съёмки.
import { useState } from 'react'
import { Check, Lock, Ticket } from 'lucide-react'
import { MERCH, MERCH_COLORS, MERCH_LEGACY } from '../data/content.js'
import { Button, cx } from './ui.jsx'

const FONT = 'Montserrat, Arial, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'

const PAL = {
  red: { base: '#D50032', shade: '#AB2328', print: '#FFFFFF', trim: '#2E2E30', patch: '#2E2E30', patchText: '#FFFFFF', sleeve: '#2E2E30' },
  graphite: { base: '#3A3A3C', shade: '#2A2A2C', print: '#FFFFFF', trim: '#D50032', patch: '#D50032', patchText: '#FFFFFF', sleeve: '#D50032' },
  milk: { base: '#EEE8DC', shade: '#DCD3C2', print: '#D50032', trim: '#626262', patch: '#626262', patchText: '#FFFFFF', sleeve: '#626262' },
}

/** Фирменный квадрат с кольцом (логотип без надписи) для принтов. */
const LogoMark = ({ x, y, s, c }) => (
  <g>
    <rect x={x} y={y} width={s} height={s} fill="none" stroke={c} strokeWidth={s * 0.11} />
    <circle cx={x + s / 2} cy={y + s / 2} r={s * 0.22} fill="none" stroke={c} strokeWidth={s * 0.14} />
  </g>
)

function Hoodie({ p }) {
  const body = 'M30 28 Q60 16 90 28 L112 44 L120 104 L104 108 L98 70 L98 136 L22 136 L22 70 L16 108 L0 104 L8 44 Z'
  return (
    <g>
      <ellipse cx="62" cy="160" rx="38" ry="3.5" fill="#000" opacity=".08" />
      <ellipse cx="164" cy="160" rx="54" ry="4" fill="#000" opacity=".1" />
      {/* перед */}
      <g transform="translate(14 46) scale(0.8)">
        <path d={body} fill={p.base} />
        <path d="M40 30 Q60 52 80 30 Q60 36 40 30 Z" fill={p.shade} />
        <path d="M55 40 v16 M65 40 v16" stroke={p.print} strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
        <path d="M36 98 h48 l6 26 h-60 z" fill={p.shade} />
        <rect x="22" y="128" width="76" height="8" fill={p.shade} />
        <LogoMark x={76} y={50} s={10} c={p.print} />
        <text x="81" y="68" textAnchor="middle" fontSize="3.8" fontWeight="700" fill={p.print} fontFamily={MONO}>EST. 1978</text>
      </g>
      {/* спина с манифестом */}
      <g transform="translate(104 14)">
        <path d={body} fill={p.base} />
        <path d="M38 30 Q60 4 82 30 Q60 40 38 30 Z" fill={p.shade} />
        <rect x="22" y="128" width="76" height="8" fill={p.shade} />
        <g fontFamily={FONT} fontWeight="800" fill={p.print} textAnchor="middle">
          <text x="60" y="64" fontSize="11">Я ДЕЛАЮ</text>
          <text x="60" y="77" fontSize="8.6">НАТУРАЛЬНЫЕ</text>
          <text x="60" y="89" fontSize="8.6">НАПИТКИ</text>
        </g>
        <path d="M34 98 h52" stroke={p.print} strokeWidth="0.8" opacity=".8" />
        <text x="60" y="108" textAnchor="middle" fontSize="4.6" fontWeight="700" fill={p.print} fontFamily={MONO}>РЯБИНОВАЯ, 44 · EST. 1978</text>
      </g>
    </g>
  )
}

function Bomber({ p }) {
  const rib = p.trim
  return (
    <g>
      <ellipse cx="120" cy="164" rx="66" ry="4" fill="#000" opacity=".1" />
      <path d="M84 34 L62 44 L44 122 L64 128 L80 66 Z" fill={p.sleeve} />
      <path d="M156 34 L178 44 L196 122 L176 128 L160 66 Z" fill={p.sleeve} />
      <path d="M44 122 L64 128 L62 137 L42 131 Z" fill={rib} />
      <path d="M196 122 L176 128 L178 137 L198 131 Z" fill={rib} />
      <path d="M84 34 Q120 24 156 34 L160 50 L160 150 L80 150 L80 50 Z" fill={p.base} />
      <rect x="80" y="146" width="80" height="12" fill={rib} />
      <path d="M80 150 h80 M80 154 h80" stroke="#FFFFFF" strokeWidth="1" opacity=".85" />
      <path d="M96 30 Q120 44 144 30 L140 23 Q120 35 100 23 Z" fill={rib} />
      <path d="M120 38 V146" stroke="#C9CED0" strokeWidth="2" />
      <rect x="117.5" y="40" width="5" height="8" rx="1" fill="#C9CED0" />
      {/* шевроны цехов */}
      <circle cx="100" cy="64" r="11" fill="#FFFFFF" />
      <circle cx="100" cy="64" r="9" fill="none" stroke="#D50032" strokeWidth="0.8" />
      <text x="100" y="63" textAnchor="middle" fontSize="3.7" fontWeight="800" fill="#D50032" fontFamily={FONT}>ATAGO</text>
      <text x="100" y="68.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="#2E2E30" fontFamily={MONO}>LAB</text>
      <rect x="127" y="58" width="27" height="11" fill={p.patch} stroke="#FFFFFF" strokeWidth="0.8" />
      <text x="140.5" y="65.6" textAnchor="middle" fontSize="3.9" fontWeight="800" fill={p.patchText} fontFamily={MONO}>LINE SMI 500</text>
      <circle cx="61" cy="88" r="9" fill="#FFFFFF" />
      <text x="61" y="87.5" textAnchor="middle" fontSize="4.2" fontWeight="800" fill="#509E2F" fontFamily={FONT}>100%</text>
      <text x="61" y="92.5" textAnchor="middle" fontSize="2.9" fontWeight="800" fill="#509E2F" fontFamily={FONT}>NATURAL</text>
      <text x="140" y="138" textAnchor="middle" fontSize="4.2" fontWeight="800" fill={p.print} fontFamily={FONT}>ЛЭП × ОЧАКОВО</text>
    </g>
  )
}

const KERN_PANTONE = ['#F5C400', '#E5A823', '#3BA935', '#D0145A', '#D50032']

function Tumbler({ p }) {
  const line = p.print
  return (
    <g>
      <ellipse cx="120" cy="164" rx="36" ry="3.6" fill="#000" opacity=".12" />
      <path d="M90 44 Q90 38 96 36 L144 36 Q150 38 150 44 L150 150 Q150 158 142 160 L98 160 Q90 158 90 150 Z" fill={p.base} />
      <rect x="98" y="44" width="6" height="108" rx="3" fill="#FFFFFF" opacity=".16" />
      {[62, 86, 110, 134].map((y) => (
        <path key={y} d={`M90 ${y} Q120 ${y + 9} 150 ${y}`} stroke={line} strokeWidth="0.7" fill="none" opacity=".45" />
      ))}
      {[104, 112, 120, 128, 136].map((x) => (
        <path key={x} d={`M${x} 44 V152`} stroke={line} strokeWidth="0.5" opacity=".3" />
      ))}
      <text x="120" y="100" textAnchor="middle" fontSize="15" fontWeight="800" fill={line} fontFamily={FONT} letterSpacing="1">KERN</text>
      <text x="120" y="108" textAnchor="middle" fontSize="4.4" fontWeight="700" fill={line} fontFamily={MONO}>3D WIREFRAME · 0,45 Л</text>
      {KERN_PANTONE.map((c, i) => (
        <rect key={c} x={99 + i * 8.8} y="138" width="7.6" height="9" fill={c} stroke={p.base === '#EEE8DC' ? '#DCD3C2' : '#FFFFFF'} strokeWidth="0.6" />
      ))}
      <ellipse cx="120" cy="37" rx="28" ry="6.5" fill="#C9CED0" />
      <ellipse cx="120" cy="36" rx="21" ry="4.4" fill="#A2AAAD" />
      <rect x="128" y="33.5" width="9" height="3" rx="1.5" fill="#626262" />
      {/* разлетающиеся чертёжные выноски */}
      <path d="M152 70 h18 M170 70 l6 -6" stroke="#A2AAAD" strokeWidth="0.8" fill="none" />
      <text x="178" y="62" fontSize="4.6" fontWeight="700" fill="#626262" fontFamily={MONO}>Ø 66 мм</text>
      <path d="M152 120 h18 M170 120 l6 6" stroke="#A2AAAD" strokeWidth="0.8" fill="none" />
      <text x="178" y="131" fontSize="4.6" fontWeight="700" fill="#626262" fontFamily={MONO}>H 168 мм</text>
    </g>
  )
}

function Holder({ p }) {
  return (
    <g>
      <ellipse cx="120" cy="168" rx="76" ry="3.5" fill="#000" opacity=".08" />
      <rect x="57" y="24" width="18" height="16" rx="3" fill="#C9CED0" />
      <rect x="62" y="16" width="8" height="12" rx="3" fill="none" stroke="#A2AAAD" strokeWidth="2.4" />
      <circle cx="66" cy="66" r="28" fill={p.base} />
      <circle cx="66" cy="66" r="21" fill="none" stroke={p.print} strokeWidth="0.8" opacity=".7" />
      <text x="66" y="62" textAnchor="middle" fontSize="8" fontWeight="800" fill={p.print} fontFamily={FONT}>АНТИ</text>
      <text x="66" y="74" textAnchor="middle" fontSize="9" fontWeight="800" fill={p.print} fontFamily={FONT}>500 ₽</text>
      <path d="M52 71 L80 66" stroke={p.print} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M86 84 Q110 112 132 96" stroke="#626262" strokeWidth="1.4" fill="none" />
      <g transform="rotate(7 170 106)">
        <rect x="128" y="78" width="86" height="56" rx="5" fill="#FFFFFF" stroke="#D9DCDE" />
        <path d="M128 83 a5 5 0 0 1 5 -5 h76 a5 5 0 0 1 5 5 v8 h-86 z" fill="#D50032" />
        <text x="134" y="88.5" fontSize="6" fontWeight="800" fill="#FFFFFF" fontFamily={FONT}>ПРОПУСК</text>
        <LogoMark x={197} y={80.5} s={8} c="#FFFFFF" />
        <rect x="134" y="97" width="18" height="22" fill="#E3E6E8" />
        <path d="M158 100 h40 M158 106 h30 M158 112 h36" stroke="#C9CED0" strokeWidth="2" strokeLinecap="round" />
        <text x="134" y="129" fontSize="5.4" fontWeight="800" fill="#D50032" fontFamily={FONT}>−50% СТОЛОВАЯ</text>
        <circle cx="171" cy="80.5" r="2.2" fill="#FFFFFF" stroke="#C9CED0" />
      </g>
      <text x="120" y="160" textAnchor="middle" fontSize="9" fontWeight="800" fill="#2E2E30" fontFamily={FONT}>«Пропуск всегда со мной»</text>
    </g>
  )
}

function DormKit({ p }) {
  return (
    <g>
      <ellipse cx="120" cy="164" rx="84" ry="3.8" fill="#000" opacity=".08" />
      <path d="M58 64 Q58 30 76 30 Q94 30 94 64" stroke={p.shade} strokeWidth="5" fill="none" />
      <rect x="30" y="58" width="92" height="100" fill={p.base} stroke={p.base === '#EEE8DC' ? '#DCD3C2' : 'none'} />
      <LogoMark x={40} y={70} s={14} c={p.print} />
      <g fontFamily={FONT} fontWeight="800" fill={p.print}>
        <text x="40" y="104" fontSize="9">ВСЁ ЕСТЬ.</text>
        <text x="40" y="116" fontSize="9">И ФЕН ТОЖЕ.</text>
      </g>
      <path d="M40 126 h72" stroke={p.print} strokeWidth="0.8" opacity=".7" />
      <text x="40" y="136" fontSize="5" fontWeight="700" fill={p.print} fontFamily={MONO}>РЯБИНОВАЯ, 36К2</text>
      <text x="40" y="145" fontSize="5" fontWeight="700" fill={p.print} fontFamily={MONO}>3 400 ₽ / МЕС</text>
      {/* дорожный фен — всегда фирменный красный */}
      <g>
        <rect x="160" y="96" width="15" height="52" rx="7" fill="#AB2328" transform="rotate(-14 167 96)" />
        <circle cx="168" cy="84" r="24" fill="#D50032" />
        <rect x="184" y="74" width="34" height="20" rx="3" fill="#D50032" />
        <rect x="214" y="72" width="7" height="24" rx="2" fill="#AB2328" />
        <circle cx="168" cy="84" r="13" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity=".85" />
        {[0, 60, 120].map((a) => (
          <path key={a} d="M168 84 l0 -11" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${a} 168 84)`} opacity=".85" />
        ))}
        <LogoMark x={190} y={79} s={9} c="#FFFFFF" />
        <path d="M226 78 h10 M226 84 h13 M226 90 h10" stroke="#A2AAAD" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </g>
  )
}

const ART = { hoodie: Hoodie, bomber: Bomber, tumbler: Tumbler, holder: Holder, dormkit: DormKit }

/** Мокап предмета мерча. Неизвестный (старый) приз — карточка-билет с названием. */
export function MerchArt({ id, color, className = '', ...svgProps }) {
  const item = MERCH.find((m) => m.id === id)
  const A = ART[id]
  const p = PAL[color || item?.color || 'red'] || PAL.red
  return (
    <svg viewBox="0 0 240 176" className={className} {...svgProps} role="img" aria-label={item?.title || MERCH_LEGACY[id] || 'Мерч ОЧАКОВО'}>
      {A ? (
        <A p={p} />
      ) : (
        <g>
          <rect x="40" y="48" width="160" height="80" fill="#D50032" />
          <LogoMark x={54} y={66} s={22} c="#FFFFFF" />
          <text x="88" y="84" fontSize="9" fontWeight="800" fill="#FFFFFF" fontFamily={FONT}>БИЛЕТ</text>
          <text x="88" y="98" fontSize="6" fontWeight="700" fill="#FFFFFF" fontFamily={FONT}>{(MERCH_LEGACY[id] || id).slice(0, 26)}</text>
        </g>
      )}
    </svg>
  )
}

/** Квадратное превью предмета (бейджи, карусель, досье HR). */
export function MerchThumb({ id, color, size = 64, className = '' }) {
  return (
    <div className={cx('och-light shrink-0 overflow-hidden border border-line bg-[#F2F3F4]', className)} style={{ width: size, height: size }}>
      <MerchArt id={id} color={color} className="h-full w-full" />
    </div>
  )
}

/** Переключатель цвета: 3 свотча. */
export function ColorSwatches({ value, onChange, className = '' }) {
  return (
    <div className={cx('flex items-center gap-1.5', className)} role="radiogroup" aria-label="Цвет">
      {MERCH_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          aria-label={c.label}
          title={c.label}
          onClick={() => onChange(c.id)}
          className={cx('grid h-7 w-7 place-items-center rounded-full border transition', value === c.id ? 'border-brand ring-2 ring-brand/25' : 'border-line')}
        >
          <span className="block h-5 w-5 rounded-full border border-black/10" style={{ background: c.hex }} />
        </button>
      ))}
    </div>
  )
}

/**
 * Карточка витрины: крупный мокап, цвета, идея предмета, обмен баллов на билет.
 * onBuy отсутствует — режим лукбука (без кнопки).
 */
export function MerchCard({ item, color, onColor, owned = 0, canBuy = false, onBuy, showIdea = true, showSpec = false, className = '' }) {
  const [localColor, setLocalColor] = useState(item.color)
  const c = color || localColor
  const setC = onColor || setLocalColor
  const label = MERCH_COLORS.find((x) => x.id === c)?.label
  return (
    <article className={cx('flex min-w-0 flex-col border border-line bg-paper', className)}>
      <div className="och-light relative border-b border-line bg-[#F2F3F4]">
        <MerchArt id={item.id} color={c} className="aspect-[240/176] w-full" />
        {owned > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 bg-brand px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
            <Check className="h-3 w-3" strokeWidth={3} /> {owned} билет{owned > 1 ? 'а' : ''}
          </span>
        )}
        <span className="absolute left-2 top-2 bg-paper/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-soft">{item.stock}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-[15px] font-extrabold uppercase leading-tight">{item.title}</h3>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{item.sub}</p>
        {showIdea && (
          <p className="mt-2 border-l-2 border-brand pl-2 text-[12px] leading-snug text-ink-2">
            <b className="font-bold">Идея: </b>
            {item.idea}
          </p>
        )}
        {showSpec && (
          <p className="mt-2 font-mono text-[10.5px] leading-snug text-ink-soft">
            <b className="text-ink">Спецификация: </b>
            {item.spec}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <ColorSwatches value={c} onChange={setC} />
          <span className="truncate font-mono text-[10px] font-bold uppercase text-ink-mute">{label}</span>
        </div>
        <div className="flex-1" />
        {onBuy && (
          <Button className="mt-4 w-full" variant={canBuy ? 'primary' : 'light'} disabled={!canBuy} onClick={() => onBuy(item, c)}>
            {canBuy ? <Ticket className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Билет за {item.price} баллов
          </Button>
        )}
      </div>
    </article>
  )
}

/** Бейдж билетов розыгрыша: превью выбранных предметов с количеством. */
export function MerchTicketsBadge({ tickets = {}, colors = {}, className = '', empty = 'Билетов пока нет — обменяй Крафт-баллы в разделе «Награды».' }) {
  const ids = Object.keys(tickets).filter((k) => tickets[k] > 0)
  if (!ids.length) return empty ? <p className={cx('text-xs text-ink-mute', className)}>{empty}</p> : null
  return (
    <div className={cx('flex flex-wrap gap-2', className)}>
      {ids.map((id) => {
        const m = MERCH.find((x) => x.id === id)
        return (
          <div key={id} className="flex items-center gap-2 border border-line bg-paper py-1 pl-1 pr-2.5">
            <MerchThumb id={id} color={colors[id]} size={40} className="border-0" />
            <div className="min-w-0">
              <div className="max-w-[150px] truncate text-[12px] font-bold leading-tight">{m?.short || MERCH_LEGACY[id] || id}</div>
              <div className="font-mono text-[10px] font-bold text-brand">× {tickets[id]} билет</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Тизер на главной: горизонтальная лента дропа. */
export function MerchTeaser({ onOpen }) {
  return (
    <section className="border-y border-line bg-paper py-4">
      <div className="flex items-end justify-between gap-3 px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            <span className="h-px w-5 bg-brand" />
            Лимитированный дроп · PURE CRAFT 1978
          </div>
          <h2 className="mt-1 font-display text-[17px] font-extrabold uppercase leading-tight">Пройди квест — забери мерч ОЧАКОВО</h2>
        </div>
      </div>
      <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
        {MERCH.map((m) => (
          <button key={m.id} type="button" onClick={onOpen} className="w-[136px] shrink-0 snap-start border border-line bg-paper text-left">
            <div className="och-light border-b border-line bg-[#F2F3F4]">
              <MerchArt id={m.id} className="aspect-[240/176] w-full" />
            </div>
            <div className="p-2">
              <div className="line-clamp-2 text-[12px] font-bold leading-tight">{m.short}</div>
              <div className="mt-1 font-mono text-[10px] font-bold text-brand">{m.price} баллов</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

/** Справочник первого дня: Welcome-Pack стажёра (ретрактор + набор для общежития). */
export function WelcomePackCard() {
  const pack = ['holder', 'dormkit'].map((id) => MERCH.find((m) => m.id === id))
  return (
    <section className="border border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
          <span className="h-px w-5 bg-brand" />
          Welcome-Pack стажёра
        </div>
        <h3 className="mt-1 font-display text-lg font-extrabold uppercase leading-tight">Выдаём в первую смену</h3>
        <p className="mt-1 text-[13px] leading-snug text-ink-soft">Пропуск теряется чаще всего в первую неделю, а фен — единственное, чего нет в общежитии. Закрываем обе проблемы сразу.</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-line">
        {pack.map((m) => (
          <div key={m.id} className="min-w-0">
            <div className="och-light border-b border-line bg-[#F2F3F4]">
              <MerchArt id={m.id} className="aspect-[240/176] w-full" />
            </div>
            <div className="p-3 text-[12px] font-bold leading-tight">{m.short}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
