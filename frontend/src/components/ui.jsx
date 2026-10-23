import { useMemo } from 'react'
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
// Реконструкция фирменного знака: красный квадрат-рамка + кольцо «О» + «ОЧАКОВО».
// Рисуется inline, чтобы использовать загруженный Montserrat.
export function Logo({ className = '', inverse = false, compact = false }) {
  const c = inverse ? '#FFFFFF' : '#EC1A42'
  const bg = inverse ? '#EC1A42' : '#FFFFFF'
  if (compact) {
    return (
      <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Очаково">
        <rect x="5" y="5" width="54" height="54" fill="none" stroke={c} strokeWidth="5" />
        <circle cx="34" cy="40" r="11" fill={bg} stroke={c} strokeWidth="8.5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 480 240" className={className} role="img" aria-label="ОЧАКОВО — натуральные напитки">
      <rect x="8" y="8" width="226" height="222" fill="none" stroke={c} strokeWidth="11" />
      <rect x="196" y="128" width="60" height="58" fill={bg} />
      <circle cx="150" cy="156" r="38" fill="none" stroke={c} strokeWidth="29" />
      <text x="203" y="172" fontFamily="Montserrat, 'Arial Black', Arial, sans-serif" fontWeight="800" fontSize="47" fill={c} letterSpacing="0.5">
        ОЧАКОВО
      </text>
      <text x="246" y="204" fontFamily="Montserrat, Arial, sans-serif" fontWeight="600" fontSize="19" fill={c}>
        НАТУРАЛЬНЫЕ
      </text>
      <text x="246" y="228" fontFamily="Montserrat, Arial, sans-serif" fontWeight="600" fontSize="19" fill={c}>
        НАПИТКИ
      </text>
    </svg>
  )
}

/* -------------------------------------------------------- рваная бумага */
function rng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Рваный край между секциями. color — цвет «бумаги», которая наползает. */
export function TornEdge({ color = '#FBF6EE', flip = false, seed = 7, height = 28, className = '' }) {
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
      <div className="relative h-full w-full bg-ink" style={{ clipPath: clip, WebkitClipPath: clip }}>
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
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest',
        dark ? 'bg-ink/80 text-white' : 'bg-white text-ink',
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-brand animate-blink" />
      {label}
    </span>
  )
}

/* ---------------------------------------------------------- поп-арт бейдж */
export function Burst({ children, color = '#EC1A42', text = '#fff', size = 96, className = '', spin = false }) {
  const pts = useMemo(() => {
    const n = 14
    const a = []
    for (let i = 0; i < n * 2; i++) {
      const ang = (Math.PI * i) / n - Math.PI / 2
      const rad = i % 2 ? 38 : 50
      a.push(`${50 + Math.cos(ang) * rad},${50 + Math.sin(ang) * rad}`)
    }
    return a.join(' ')
  }, [])
  return (
    <div className={cx('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className={cx('absolute inset-0 h-full w-full', spin && 'animate-spinslow')} aria-hidden>
        <polygon points={pts} fill="#17110F" transform="translate(3 3)" />
        <polygon points={pts} fill={color} stroke="#17110F" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <div className="relative z-10 px-2 text-center font-display font-black leading-[0.95]" style={{ color: text, fontSize: size * 0.13 }}>
        {children}
      </div>
    </div>
  )
}

export function Sticker({ children, className = '', color = 'bg-malt-light', rotate = -3 }) {
  return (
    <span
      className={cx('inline-block rounded-md border-2 border-ink px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-ink shadow-pop-sm', color, className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  )
}

/** Плашка-глагол как в роликах: «НАДЕНЬ ФОРМУ», «СЛЕДИ ЗА РАБОТОЙ». */
export function VerbTag({ children, className = '' }) {
  return (
    <span className={cx('inline-block bg-gradient-to-r from-brand to-brand-600 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm', className)}>
      {children}
    </span>
  )
}

/* --------------------------------------------------------------- кнопки */
export function Button({ as: Tag = 'button', variant = 'primary', size = 'md', className = '', children, ...p }) {
  const base =
    'group relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-extrabold tracking-tight transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
  const sizes = { sm: 'px-3 py-2 text-sm', md: 'px-5 py-3 text-[15px]', lg: 'px-7 py-4 text-base sm:text-lg' }
  const variants = {
    primary: 'border-2 border-ink bg-brand text-white shadow-pop hover:bg-brand-600',
    dark: 'border-2 border-ink bg-ink text-white shadow-pop-red hover:bg-ink-2',
    light: 'border-2 border-ink bg-white text-ink shadow-pop hover:bg-cream',
    malt: 'border-2 border-ink bg-malt-light text-ink shadow-pop hover:bg-malt',
    ghost: 'border-2 border-transparent bg-transparent text-ink hover:border-ink/15 hover:bg-ink/5 shadow-none active:translate-x-0 active:translate-y-0',
  }
  return (
    <Tag className={cx(base, sizes[size], variants[variant], className)} {...p}>
      {children}
    </Tag>
  )
}

export function Card({ className = '', children, ...p }) {
  return (
    <div className={cx('rounded-2xl border-2 border-ink bg-paper shadow-pop', className)} {...p}>
      {children}
    </div>
  )
}

export function SectionTitle({ kicker, title, sub, className = '', light = false }) {
  return (
    <div className={cx('mb-6', className)}>
      {kicker && (
        <div className={cx('mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em]', light ? 'text-white/80' : 'text-brand')}>{kicker}</div>
      )}
      <h2 className={cx('font-display text-2xl font-black leading-[1.05] tracking-tight sm:text-4xl', light ? 'text-white' : 'text-ink')}>{title}</h2>
      {sub && <p className={cx('mt-2 max-w-2xl text-sm sm:text-base', light ? 'text-white/85' : 'text-ink-soft')}>{sub}</p>}
    </div>
  )
}

export function Progress({ value, className = '', color = '#EC1A42', track = 'bg-kraft' }) {
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full', track, className)}>
      <motion.div
        className="h-full rounded-full"
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
          <div className={cx('h-1.5 rounded-full transition-colors', i < current ? 'bg-ink' : i === current ? 'bg-brand' : 'bg-ink/15')} />
          <span className={cx('truncate text-[10px] font-bold uppercase tracking-wide sm:text-[11px]', i === current ? 'text-brand' : 'text-ink-mute')}>
            {s}
          </span>
        </li>
      ))}
    </ol>
  )
}

export const fmtRub = (n) => `${Math.round(n).toLocaleString('ru-RU')} ₽`
