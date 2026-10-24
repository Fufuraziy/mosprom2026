// Крафти — сквозной рассказчик и наставник игры.
// MascotFigure — плоская геометрическая иллюстрация в цветах брендбука ОЧАКОВО (стр. 58):
//   красный Pantone 199 #D50032, тёмно-красный 7621 #AB2328, серый 429 #A2AAAD, тёмно-серый Cool Gray 10 #626262, белый.
// Оригинальный персонаж: медвежонок ЛЭП в кепке с фирменным квадратом, умный визор, бейдж 1978.
// MascotStoryteller — карточка «Крафти рассказывает» с печатающимся текстом и кнопкой действия.
// MascotNudge — плавающая подсказка при ошибке игрока (nudgeMascot) или 10 с бездействия.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button, cx } from './ui.jsx'
import { onMascotNudge } from '../state/mascotBus.js'
import { MASCOT_IDLE_TIP } from '../data/mascot.js'

const C = {
  red: '#D50032',
  redDark: '#AB2328',
  fur: '#A2AAAD',
  furDark: '#8A9194',
  graphite: '#626262',
  ink: '#2E2E30',
  pants: '#4A4A4C',
  white: '#FFFFFF',
  light: '#F2F3F4',
  steel: '#E3E6E8',
  yellow: '#F5C400', // беруши — цвет реального СИЗ из справочника студента
}

/** Глаза-светодиоды на визоре. */
function VisorEyes({ mood }) {
  const p = { stroke: C.white, strokeWidth: 2.6, strokeLinecap: 'round', fill: 'none' }
  if (mood === 'think') return <><path d="M60 55 h10" {...p} /><path d="M90 53 h10" {...p} /></>
  if (mood === 'wink') return <><path d="M60 57 q5 -5 10 0" {...p} /><path d="M90 55 h10" {...p} /></>
  return <><path d="M60 57 q5 -5 10 0" {...p} /><path d="M90 57 q5 -5 10 0" {...p} /></>
}

/** Голова: уши, морда, визор, кепка с фирменным квадратом. */
function Head({ mood = 'happy', talking = false, earplugs = false }) {
  return (
    <g>
      <circle cx="50" cy="31" r="11" fill={C.fur} />
      <circle cx="50" cy="31" r="5.5" fill={C.furDark} />
      <circle cx="110" cy="31" r="11" fill={C.fur} />
      <circle cx="110" cy="31" r="5.5" fill={C.furDark} />
      <circle cx="80" cy="60" r="34" fill={C.fur} />
      <ellipse cx="80" cy="75" rx="16" ry="12" fill={C.light} />
      <path d="M74 69 q6 -5 12 0 q-6 6 -12 0z" fill={C.ink} />
      {talking ? (
        <ellipse className="och-talk" cx="80" cy="81" rx="4.6" ry="3.4" fill={C.ink} />
      ) : (
        <path d="M73 79 q7 6 14 0" stroke={C.ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      {/* умные очки-визор: две линзы, светодиодная полоска, дужки */}
      <path d="M46 52 h7 M107 52 h7" stroke={C.graphite} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M76 52 q4 -3 8 0" stroke={C.ink} strokeWidth="2.6" fill="none" />
      <rect x="53" y="45" width="24" height="17" rx="6" fill={C.ink} />
      <rect x="83" y="45" width="24" height="17" rx="6" fill={C.ink} />
      <rect x="57" y="47.4" width="16" height="1.6" rx="0.8" fill={C.red} />
      <rect x="87" y="47.4" width="16" height="1.6" rx="0.8" fill={C.red} />
      <VisorEyes mood={mood} />
      {earplugs && (
        <>
          <rect x="41" y="60" width="7" height="9" rx="3.5" fill={C.yellow} />
          <rect x="112" y="60" width="7" height="9" rx="3.5" fill={C.yellow} />
        </>
      )}
      {/* кепка: купол, козырёк, фирменный квадрат с кольцом */}
      <path d="M47 41 C49 13 111 13 113 41 Z" fill={C.red} />
      <path d="M44 42 Q80 51 116 42 L113 38 Q80 46 47 38 Z" fill={C.redDark} />
      <rect x="73.5" y="20" width="13" height="13" fill="none" stroke={C.white} strokeWidth="1.6" />
      <circle cx="80" cy="26.5" r="3.1" fill="none" stroke={C.white} strokeWidth="1.8" />
    </g>
  )
}

const Arm = ({ d, color, hand = true, end }) => (
  <g>
    <path d={d} stroke={color} strokeWidth="13" strokeLinecap="round" fill="none" />
    {hand && end && <circle cx={end[0]} cy={end[1]} r="6.5" fill={C.fur} />}
  </g>
)

const Badge = ({ x = 87, y = 104, dark = false }) => (
  <g>
    <rect x={x} y={y} width="18" height="9" rx="1.5" fill={dark ? C.red : C.white} />
    <text x={x + 9} y={y + 6.7} textAnchor="middle" fontSize="6.2" fontWeight="800" fill={dark ? C.white : C.red} fontFamily="Montserrat, Arial, sans-serif">
      1978
    </text>
  </g>
)

const Legs = () => (
  <g>
    <rect x="62" y="148" width="15" height="32" rx="6" fill={C.pants} />
    <rect x="83" y="148" width="15" height="32" rx="6" fill={C.pants} />
    <rect x="57" y="175" width="22" height="10" rx="5" fill={C.ink} />
    <rect x="81" y="175" width="22" height="10" rx="5" fill={C.ink} />
  </g>
)

const CONFETTI = [
  [18, 30, C.red, 20], [34, 14, C.fur, -30], [140, 26, C.redDark, 40], [128, 8, C.red, -12], [10, 70, C.graphite, 60],
  [150, 64, C.fur, -45], [26, 108, C.red, 15], [144, 104, C.graphite, 30], [60, 6, C.red, 70], [104, 4, C.fur, -60],
]

function Body({ variant }) {
  if (variant === 'lab_mentor') {
    return (
      <g>
        <Legs />
        <Arm d="M56 102 L44 124" color={C.steel} end={[44, 126]} hand={false} />
        <Arm d="M104 102 L116 124" color={C.steel} end={[116, 126]} hand={false} />
        <rect x="48" y="92" width="64" height="72" rx="16" fill={C.white} />
        <path d="M80 112 V163" stroke={C.steel} strokeWidth="1.6" />
        <path d="M64 93 L80 113 L73 93 Z" fill={C.red} />
        <path d="M96 93 L80 113 L87 93 Z" fill={C.red} />
        <rect x="91" y="128" width="12" height="12" rx="1.5" fill="none" stroke={C.steel} strokeWidth="1.6" />
        <path d="M95 124 v8" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
        <Badge x={55} y={116} dark />
        {/* колба */}
        <g>
          <rect x="35" y="106" width="9" height="11" fill={C.white} stroke={C.graphite} strokeWidth="1.4" />
          <path d="M34 117 h11 l10 20 h-31 z" fill={C.white} stroke={C.graphite} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M28.5 128 h22 l4.5 9 h-31 z" fill={C.red} opacity=".85" />
        </g>
        <circle cx="44" cy="126" r="6.5" fill={C.fur} />
        {/* рефрактометр ATAGO */}
        <g>
          <rect x="108" y="118" width="26" height="16" rx="3" fill={C.graphite} />
          <rect x="111" y="121" width="13" height="8" rx="1" fill={C.light} />
          <text x="117.5" y="127.3" textAnchor="middle" fontSize="5.4" fontWeight="800" fill={C.ink} fontFamily="Montserrat, Arial, sans-serif">6.5</text>
          <circle cx="129" cy="125" r="2" fill={C.red} />
        </g>
        <circle cx="116" cy="128" r="6.5" fill={C.fur} />
      </g>
    )
  }
  if (variant === 'ppe_guard') {
    return (
      <g>
        <Legs />
        <Arm d="M55 102 L45 132" color={C.ink} end={[45, 134]} />
        <Arm d="M105 102 L120 76" color={C.ink} end={[121, 73]} />
        <rect x="117" y="60" width="5" height="10" rx="2.5" fill={C.fur} />
        <rect x="50" y="92" width="60" height="64" rx="18" fill={C.red} />
        <path d="M50 126 h60 v12 a18 18 0 0 1 -18 18 h-24 a18 18 0 0 1 -18 -18 z" fill={C.ink} />
        <rect x="50" y="122" width="60" height="4" fill={C.steel} />
        <path d="M72 92 L80 101 L88 92" fill="none" stroke={C.redDark} strokeWidth="3" strokeLinejoin="round" />
        <Badge />
      </g>
    )
  }
  if (variant === 'celebrate') {
    return (
      <g>
        {CONFETTI.map(([x, y, c, r], i) => (
          <rect key={i} className="och-confetti" style={{ animationDelay: `${(i % 5) * 0.35}s` }} x={x} y={y} width="4" height="7" rx="1" fill={c} transform={`rotate(${r} ${x + 2} ${y + 3.5})`} />
        ))}
        <Legs />
        <Arm d="M55 101 L36 74" color={C.red} end={[35, 71]} />
        <Arm d="M105 101 L124 70" color={C.red} end={[125, 67]} />
        {/* билет мерча */}
        <g transform="rotate(-16 128 52)">
          <rect x="112" y="43" width="34" height="18" rx="2" fill={C.white} stroke={C.red} strokeWidth="1.6" />
          <path d="M136 43 v18" stroke={C.red} strokeWidth="1" strokeDasharray="2 2" />
          <text x="124" y="55.5" textAnchor="middle" fontSize="7" fontWeight="800" fill={C.red} fontFamily="Montserrat, Arial, sans-serif">1978</text>
          <circle cx="141" cy="52" r="2.2" fill={C.red} />
        </g>
        <circle cx="125" cy="67" r="6.5" fill={C.fur} />
        <ellipse cx="80" cy="94" rx="27" ry="9" fill={C.redDark} />
        <rect x="50" y="92" width="60" height="64" rx="18" fill={C.red} />
        <rect x="62" y="138" width="36" height="12" rx="3" fill={C.redDark} />
        <g fontFamily="Montserrat, Arial, sans-serif" fontWeight="800" fill={C.white} textAnchor="middle">
          <text x="80" y="111" fontSize="6.2">Я ДЕЛАЮ</text>
          <text x="80" y="119" fontSize="5.2">НАТУРАЛЬНЫЕ</text>
          <text x="80" y="127" fontSize="5.2">НАПИТКИ</text>
        </g>
        <path d="M74 95 v9 M86 95 v9" stroke={C.white} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    )
  }
  if (variant === 'hint') {
    return (
      <g>
        <Legs />
        <Arm d="M55 102 L45 132" color={C.red} end={[45, 134]} />
        <Arm d="M105 104 L118 118 L99 92" color={C.red} end={[97, 88]} />
        <rect x="50" y="92" width="60" height="64" rx="18" fill={C.red} />
        <path d="M68 92 L80 106 L92 92 Z" fill={C.white} />
        <path d="M80 106 V156" stroke={C.redDark} strokeWidth="1.6" />
        <Badge />
        <circle cx="97" cy="88" r="6.5" fill={C.fur} />
        {/* лампочка идеи */}
        <g className="och-bulb">
          <circle cx="132" cy="22" r="17" fill={C.red} opacity=".12" />
          <path d="M132 2 v4 M114 22 h-4 M154 22 h-4 M119 9 l3 3 M145 9 l-3 3" stroke={C.red} strokeWidth="2" strokeLinecap="round" />
          <circle cx="132" cy="21" r="9" fill={C.white} stroke={C.red} strokeWidth="2" />
          <path d="M129 23 l3 -4 l3 4" stroke={C.red} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
          <rect x="127.5" y="29" width="9" height="6" rx="1.5" fill={C.graphite} />
        </g>
      </g>
    )
  }
  // storyteller
  return (
    <g>
      <Legs />
      <Arm d="M55 102 L56 140" color={C.red} hand={false} />
      <Arm d="M105 102 L104 140" color={C.red} hand={false} />
      <rect x="50" y="92" width="60" height="64" rx="18" fill={C.red} />
      <path d="M68 92 L80 106 L92 92 Z" fill={C.white} />
      <Badge x={87} y={100} />
      {/* планшет с цифровой капсулой */}
      <rect x="55" y="116" width="50" height="32" rx="3" fill={C.ink} />
      <rect x="58" y="119" width="44" height="26" rx="1" fill={C.light} />
      <rect x="66" y="122" width="16" height="9" rx="4.5" fill={C.red} />
      <rect x="66" y="122" width="8" height="9" rx="4" fill={C.white} stroke={C.red} strokeWidth="1.2" />
      <text x="86.5" y="129.6" textAnchor="start" fontSize="6.4" fontWeight="800" fill={C.ink} fontFamily="Montserrat, Arial, sans-serif">1978</text>
      <path d="M66 136 h28 M66 140 h20" stroke={C.fur} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="56" cy="146" r="6.5" fill={C.fur} />
      <circle cx="104" cy="146" r="6.5" fill={C.fur} />
    </g>
  )
}

const MOOD = { storyteller: 'happy', ppe_guard: 'happy', lab_mentor: 'wink', hint: 'think', celebrate: 'happy' }

/**
 * Крафти во весь рост. variant: storyteller | ppe_guard | lab_mentor | hint | celebrate.
 * size — высота в px. talking — анимация речи, idle — лёгкое покачивание.
 */
export function MascotFigure({ variant = 'storyteller', size = 160, talking = false, idle = true, mood, className = '', title, ...svgProps }) {
  return (
    <svg
      viewBox="0 0 160 192"
      height={size}
      width={(size * 160) / 192}
      className={cx('shrink-0 overflow-visible', className)}
      {...svgProps}
      role="img"
      aria-label={title || 'Крафти, маскот-наставник ОЧАКОВО'}
    >
      <ellipse cx="80" cy="187" rx="34" ry="4" fill="#000" opacity=".1" />
      <g className={idle ? 'och-bob' : undefined}>
        <Body variant={variant} />
        <Head mood={mood || MOOD[variant]} talking={talking} earplugs={variant === 'ppe_guard'} />
      </g>
    </svg>
  )
}

/** Только голова (аватар в чате, подсказках, досье). */
export function MascotHead({ size = 48, mood = 'happy', talking = false, className = '', earplugs = false }) {
  return (
    <svg viewBox="30 4 100 96" width={size} height={size} className={cx('shrink-0', className)} role="img" aria-label="Крафти">
      <Head mood={mood} talking={talking} earplugs={earplugs} />
    </svg>
  )
}

/* ------------------------------------------------------------------ речь */

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Текст «печатается» (~55 символов/с). Тап по карточке — показать сразу. */
function useTypewriter(text, enabled = true) {
  const [n, setN] = useState(() => (enabled && !reducedMotion() ? 0 : text.length))
  useEffect(() => {
    if (!enabled || reducedMotion()) {
      setN(text.length)
      return
    }
    setN(0)
    const id = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(id), x) : x + 2)), 36)
    return () => clearInterval(id)
  }, [text, enabled])
  return [text.slice(0, n), n < text.length, () => setN(text.length)]
}

/**
 * Карточка-рассказ Крафти (модульная сетка: колонка с иллюстрацией + текст, 1px рамки).
 * action: { label, onClick } и secondary: { label, onClick } — кнопки под текстом.
 */
export default function MascotStoryteller({ variant = 'storyteller', kicker, title, text, chips = [], action, secondary, mood, className = '', typing = true }) {
  const [typed, isTyping, skip] = useTypewriter(text || '', typing)
  return (
    <section className={cx('relative overflow-hidden border border-line bg-paper', className)} onClick={isTyping ? skip : undefined}>
      <div className="grid grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[156px_minmax(0,1fr)]">
        <div className="relative flex items-end justify-center border-r border-line bg-kraft-light pt-3 sm:row-span-2">
          <span className="absolute left-0 top-0 bg-brand px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">Крафти</span>
          <MascotFigure variant={variant} mood={mood} talking={isTyping} size={112} className="sm:hidden" />
          <MascotFigure variant={variant} mood={mood} talking={isTyping} size={184} className="hidden sm:block" />
        </div>
        <div className="min-w-0 self-center px-3 py-3 sm:px-5 sm:pb-2 sm:pt-5">
          {kicker && (
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              <span className="h-px w-5 shrink-0 bg-brand" />
              <span className="min-w-0 truncate">{kicker}</span>
            </div>
          )}
          {title && <h2 className="mt-1.5 font-display text-[17px] font-extrabold uppercase leading-[1.1] tracking-tight text-ink sm:text-2xl">{title}</h2>}
        </div>
        <div className="col-span-2 min-w-0 border-t border-line px-3 pb-4 pt-3 sm:col-span-1 sm:col-start-2 sm:border-t-0 sm:px-5 sm:pb-5 sm:pt-0">
          {text && (
            <p className="relative text-[13.5px] leading-relaxed text-ink-soft sm:text-sm" aria-label={text}>
              <span className="invisible" aria-hidden="true">
                {text}
              </span>
              <span className="absolute inset-0" aria-hidden="true">
                {typed}
                {isTyping && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-blink bg-brand" />}
              </span>
            </p>
          )}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="border border-line px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-2">
                  {c}
                </span>
              ))}
            </div>
          )}
          {(action || secondary) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {action && (
                <Button size="sm" onClick={(e) => (e.stopPropagation(), action.onClick?.())}>
                  {action.label}
                </Button>
              )}
              {secondary && (
                <Button size="sm" variant="light" onClick={(e) => (e.stopPropagation(), secondary.onClick?.())}>
                  {secondary.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Короткая реплика Крафти внутри задания (вместо старой плашки с подсказкой). */
export function MascotTip({ children, variant = 'hint', className = '' }) {
  return (
    <div className={cx('flex items-start gap-3 border-l-2 border-brand bg-paper py-2 pl-2 pr-3', className)}>
      <MascotHead size={40} mood={MOOD[variant] || 'think'} earplugs={variant === 'ppe_guard'} />
      <div className="min-w-0">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Крафти · подсказка</div>
        <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink">{children}</p>
      </div>
    </div>
  )
}

/**
 * Плавающая подсказка Крафти в углу экрана.
 * Появляется: 1) когда игра сообщает об ошибке (nudgeMascot); 2) после idleMs без касаний — один раз на шаг (resetKey).
 */
export function MascotNudge({ tip, active = true, idleMs = 10000, resetKey }) {
  const [msg, setMsg] = useState(null)
  const idleShown = useRef(false)
  const tipRef = useRef(tip)
  tipRef.current = tip

  useEffect(() => {
    idleShown.current = false
    setMsg(null)
  }, [resetKey])

  useEffect(() => onMascotNudge((m) => active && setMsg(m)), [active])

  useEffect(() => {
    if (!active) return
    let t
    const arm = () => {
      clearTimeout(t)
      if (idleShown.current) return
      t = setTimeout(() => {
        idleShown.current = true
        const base = tipRef.current ? `${tipRef.current} ` : ''
        setMsg({ id: Date.now(), variant: 'hint', text: `${base}${MASCOT_IDLE_TIP}`.trim(), idle: true })
      }, idleMs)
    }
    const onAct = () => arm()
    arm()
    const evs = ['pointerdown', 'keydown', 'touchstart', 'wheel']
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }))
    return () => {
      clearTimeout(t)
      evs.forEach((e) => window.removeEventListener(e, onAct))
    }
  }, [active, idleMs, resetKey])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), msg.idle ? 12000 : 9000)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-end px-3" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}>
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto flex w-full max-w-[320px] items-start gap-2.5 border border-line bg-paper p-2.5 shadow-pop-lg"
          >
            <MascotHead size={44} mood="think" talking />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Крафти · подсказка</div>
              <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink">{msg.text}</p>
            </div>
            <button type="button" onClick={() => setMsg(null)} className="-m-1 grid h-8 w-8 shrink-0 place-items-center text-ink-mute" aria-label="Закрыть подсказку">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
