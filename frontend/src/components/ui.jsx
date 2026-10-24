import { useMemo } from 'react'
import { LOGO } from '../data/logo.js'
import { PICTOS } from '../data/pictograms.js'
import { motion } from 'framer-motion'
import {
  Globe, GraduationCap, Wallet, Home, Users, FlaskConical, Gauge, Factory, Palette, Lock, Check, X,
} from 'lucide-react'

export const ICONS = { Globe, GraduationCap, Wallet, Home, Users, FlaskConical, Gauge, Factory, Palette, Lock, Check, X }
export const Icon = ({ name, ...p }) => {
  const C = ICONS[name] || Check
  return <C {...p} />
}

export const cx = (...a) => a.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ логотип */
// Фирменный блок ОЧАКОВО — векторные контуры из брендбука (ЛОГО БЕЗ КВАДРАТА / Лого_без квадрата.pdf).
const [TX0, TY0, TX1, TY1] = LOGO.text_bbox
const TW = TX1 - TX0
const TH = TY1 - TY0

/** Текстовый логотип «ОЧАКОВО / натуральные напитки». */
export function Logo({ className = '', inverse = false }) {
  return (
    <svg viewBox={LOGO.text_vb} className={className} role="img" aria-label="ОЧАКОВО — натуральные напитки">
      {LOGO.text.map((d, i) => (
        <path key={i} d={d} fill={inverse ? '#FFFFFF' : '#D50032'} />
      ))}
    </svg>
  )
}

/** Логотип на красной плашке (основной вариант для шапки). */
export function LogoPlate({ className = '' }) {
  return (
    <svg viewBox={LOGO.plate_vb} className={className} role="img" aria-label="ОЧАКОВО — натуральные напитки">
      <path d={LOGO.plate_bg} fill="#D50032" />
      <g transform={`translate(${+LOGO.plate_vb.split(' ')[0] + 6.1} ${+LOGO.plate_vb.split(' ')[1] + 6.1})`}>
        <g transform={`scale(${96.2 / TW}) translate(${-TX0} ${-TY0})`}>
          {LOGO.text.map((d, i) => (
            <path key={i} d={d} fill="#FFFFFF" />
          ))}
        </g>
      </g>
    </svg>
  )
}

/** Логотип с квадратом: рамка + кольцо «О» + надпись (по образцу брендбука, раздел «Призвание»). */
export function LogoSquare({ className = '', inverse = false, withText = true }) {
  const bg = inverse ? '#FFFFFF' : '#D50032'
  const fg = inverse ? '#D50032' : '#FFFFFF'
  const k = 62 / TW
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="ОЧАКОВО">
      <rect width="100" height="100" fill={bg} />
      <rect x="15" y={withText ? 12 : 19} width={withText ? 50 : 62} height={withText ? 50 : 62} fill="none" stroke={fg} strokeWidth="4.5" />
      <circle cx={withText ? 40 : 50} cy={withText ? 42 : 55} r={withText ? 10 : 12.5} fill="none" stroke={fg} strokeWidth={withText ? 6.5 : 8} />
      {withText && (
        <g transform={`translate(15 70) scale(${k}) translate(${-TX0} ${-TY0})`}>
          {LOGO.text.map((d, i) => (
            <path key={i} d={d} fill={fg} />
          ))}
        </g>
      )}
    </svg>
  )
}

/** Фирменная пиктограмма (брендбук, стр. 50). Цвет — через text-*. */
export function Picto({ name, className = 'h-8 w-8', title }) {
  const p = PICTOS[name]
  if (!p) return null
  return (
    <svg viewBox={p.vb} className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={p.d} fill="currentColor" />
    </svg>
  )
}

/** Квадратный модуль (брендбук, стр. 57): красная/серая/белая заливка, внутри — пиктограмма или текст. */
export function Module({ tone = 'red', className = '', children }) {
  const tones = {
    red: 'bg-brand text-white',
    dark: 'bg-brand-700 text-white',
    gray: 'bg-steel text-white',
    light: 'bg-kraft-light text-brand',
    white: 'bg-paper text-brand',
    graphite: 'bg-graphite text-white',
  }
  return <div className={cx('relative grid aspect-square place-items-center overflow-hidden', tones[tone], className)}>{children}</div>
}

/* -------------------------------------------------------- рваная бумага */
function rng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Рваный край между секциями. color — цвет «бумаги», которая наползает. */
export function TornEdge({ color = '#F5F6F7', flip = false, seed = 7, height = 28, className = '' }) {
  const d = useMemo(() => {
    const r = rng(seed)
    const n = 46
    let p = `M0 ${height} L0 ${height * 0.55}`
    for (let i = 1; i <= n; i++) {
      const x = (i / n) * 1000
      const y = height * (0.18 + r() * 0.62)
      p += ` L${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return p + ` L1000 ${height} Z`
  }, [seed, height])
  return (
    <svg
      viewBox={`0 0 1000 ${height}`}
      preserveAspectRatio="none"
      className={cx('block w-full pointer-events-none', className)}
      style={{ height, transform: flip ? 'scaleY(-1)' : undefined, marginTop: flip ? 0 : -height + 1, marginBottom: flip ? -height + 1 : 0, position: 'relative', zIndex: 2 }}
      aria-hidden
    >
      <path d={d} fill={color} />
    </svg>
  )
}

function tornPolygon(seed, amp = 2.2, steps = 18) {
  const r = rng(seed)
  const pts = []
  for (let i = 0; i <= steps; i++) pts.push([(i / steps) * 100, r() * amp])
  for (let i = 1; i <= steps; i++) pts.push([100 - r() * amp, (i / steps) * 100])
  for (let i = steps - 1; i >= 0; i--) pts.push([(i / steps) * 100, 100 - r() * amp])
  for (let i = steps - 1; i >= 1; i--) pts.push([r() * amp, (i / steps) * 100])
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',')})`
}

/** Фото в рамке «рваной бумаги» с белой контурной обводкой и плашкой REC. */
export function TornPhoto({ src, alt = '', seed = 3, rec = false, recLabel = 'REC', className = '', imgClassName = '', rotate = 0, children }) {
  const clip = useMemo(() => tornPolygon(seed), [seed])
  return (
    <div className={cx('relative outline-white', className)} style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}>
      <div className="relative h-full w-full bg-graphite" style={{ clipPath: clip, WebkitClipPath: clip }}>
        <img src={src} alt={alt} loading="lazy" className={cx('h-full w-full object-cover', imgClassName)} />
        {children}
      </div>
      {rec && <RecBadge label={recLabel} className="absolute left-3 top-3" />}
    </div>
  )
}

export function RecBadge({ label = 'REC', className = '', dark = true }) {
  return (
    <span
      className={cx(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest',
        dark ? 'bg-[#1f1f1f]/80 text-white' : 'bg-paper text-ink',
        className,
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-brand animate-blink" />
      <span className="truncate">{label}</span>
    </span>
  )
}

/* ------------------------------------------------- квадратный бейдж-модуль */
// Вместо поп-арт «звёзд» — квадратный модуль фирменного стиля (брендбук, стр. 57).
export function Burst({ children, color = '#D50032', text = '#fff', size = 96, className = '' }) {
  return (
    <div className={cx('relative inline-grid place-items-center', className)} style={{ width: size, height: size, background: color }}>
      <span className="absolute inset-[8%] border" style={{ borderColor: text, opacity: 0.55 }} />
      <div className="relative z-10 px-2 text-center font-display font-extrabold uppercase leading-[1.05]" style={{ color: text, fontSize: size * 0.13 }}>
        {children}
      </div>
    </div>
  )
}

export function Sticker({ children, className = '', color = 'bg-paper text-brand' }) {
  return (
    <span className={cx('inline-block border border-current px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider', color, className)}>{children}</span>
  )
}

/** Плашка-глагол как в роликах: «НАДЕНЬ ФОРМУ», «СЛЕДИ ЗА РАБОТОЙ» — красная заливка, белый текст. */
export function VerbTag({ children, className = '' }) {
  return <span className={cx('inline-block bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white sm:text-sm', className)}>{children}</span>
}

/* --------------------------------------------------------------- кнопки */
export function Button({ as: Tag = 'button', variant = 'primary', size = 'md', className = '', children, ...p }) {
  const base =
    'group relative inline-flex select-none items-center justify-center gap-2 font-bold uppercase tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40'
  const sizes = { sm: 'px-3.5 py-2 text-xs', md: 'px-5 py-3 text-[13px]', lg: 'px-7 py-4 text-sm sm:text-[15px]' }
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-600',
    dark: 'bg-paper text-brand hover:bg-brand-50',
    light: 'border border-brand bg-transparent text-brand hover:bg-brand hover:text-white',
    malt: 'bg-kraft text-ink hover:bg-kraft-dark',
    ghost: 'bg-transparent px-2 text-ink-soft normal-case tracking-normal hover:text-brand',
  }
  return (
    <Tag className={cx(base, sizes[size], variants[variant], className)} {...p}>
      {children}
    </Tag>
  )
}

export function Card({ className = '', children, ...p }) {
  return (
    <div className={cx('border border-line bg-paper', className)} {...p}>
      {children}
    </div>
  )
}

export function SectionTitle({ kicker, title, sub, className = '', light = false }) {
  return (
    <div className={cx('mb-6', className)}>
      {kicker && (
        <div className={cx('mb-2 text-[11px] font-bold uppercase tracking-[0.18em]', light ? 'text-white/80' : 'text-ink-soft')}>{kicker}</div>
      )}
      <h2 className={cx('font-display text-2xl font-light uppercase leading-[1.08] tracking-tight sm:text-4xl', light ? 'text-white' : 'text-brand')}>{title}</h2>
      {sub && <p className={cx('mt-2 max-w-2xl text-sm sm:text-base', light ? 'text-white/85' : 'text-ink-soft')}>{sub}</p>}
    </div>
  )
}

export function Progress({ value, className = '', color = '#D50032', track = 'bg-kraft' }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden', track, className)}>
      <motion.div
        className="h-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}

export function Steps({ steps, current, className = '' }) {
  return (
    <ol className={cx('flex items-center gap-1.5', className)}>
      {steps.map((s, i) => (
        <li key={s} className="flex min-w-0 flex-1 flex-col gap-1">
          <div className={cx('h-1 transition-colors', i < current ? 'bg-graphite' : i === current ? 'bg-brand' : 'bg-line')} />
          <span className={cx('truncate text-[10px] font-bold uppercase tracking-wide sm:text-[11px]', i === current ? 'text-brand' : 'text-ink-mute')}>
            {s}
          </span>
        </li>
      ))}
    </ol>
  )
}

export const fmtRub = (n) => `${Math.round(n).toLocaleString('ru-RU')} ₽`
