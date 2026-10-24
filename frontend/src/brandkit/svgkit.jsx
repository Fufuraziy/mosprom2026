// Примитивы для макетов в SVG (листовки А4 в миллиметрах): логотип, пиктограммы, QR, многострочный текст.
import { LOGO } from '../data/logo.js'
import { PICTOS } from '../data/pictograms.js'
import { qrMatrix } from '../services/qr.js'

const [TX0, TY0, TX1] = LOGO.text_bbox
const TW = TX1 - TX0
export const FONT = 'Montserrat, "Proxima Nova", Arial, sans-serif'
export const MONO = '"JetBrains Mono", ui-monospace, monospace'
export const BRAND = { red: '#D50032', redDark: '#AB2328', graphite: '#626262', gray: '#A2AAAD', ink: '#2E2E30', light: '#F2F3F4', white: '#FFFFFF' }

/** Логотип с квадратом (брендбук, «Призвание»): квадрат, кольцо и надпись ОЧАКОВО / натуральные напитки. */
export function LogoBlock({ x, y, size, fg = '#FFFFFF', bg = 'none' }) {
  const k = 62 / TW
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bg} />
      <rect x="15" y="12" width="50" height="50" fill="none" stroke={fg} strokeWidth="4.5" />
      <circle cx="40" cy="42" r="10" fill="none" stroke={fg} strokeWidth="6.5" />
      <g transform={`translate(15 70) scale(${k}) translate(${-TX0} ${-TY0})`}>
        {LOGO.text.map((d, i) => (
          <path key={i} d={d} fill={fg} />
        ))}
      </g>
    </svg>
  )
}

/** Фирменная пиктограмма брендбука (стр. 50) в заданном квадрате. */
export function PictoAt({ name, x, y, size, color = BRAND.red }) {
  const p = PICTOS[name]
  if (!p) return null
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={p.vb}>
      <path d={p.d} fill={color} />
    </svg>
  )
}

/** Рабочий QR-код (уровень коррекции M) с белым полем 4 модуля. */
export function QrAt({ value, x, y, size, color = BRAND.ink }) {
  const m = qrMatrix(value)
  const n = m.length + 8
  let d = ''
  m.forEach((row, r) => row.forEach((v, c) => v && (d += `M${c + 4} ${r + 4}h1v1h-1z`)))
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#FFFFFF" />
      <path d={d} fill={color} />
    </svg>
  )
}

/** Многострочный текст: lines — массив строк, lh — межстрочный интервал (в единицах viewBox). */
export function Lines({ x, y, lines, size, lh, weight = 400, fill = BRAND.ink, family = FONT, anchor = 'start', spacing }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} fontFamily={family} textAnchor={anchor} letterSpacing={spacing}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
          {l}
        </tspan>
      ))}
    </text>
  )
}

/** Маркированный пункт: красный квадрат + текст. */
export function Bullet({ x, y, text, size = 4.2, fill = BRAND.ink, mark = BRAND.red }) {
  return (
    <g>
      <rect x={x} y={y - size * 0.72} width={size * 0.62} height={size * 0.62} fill={mark} />
      <text x={x + size * 1.3} y={y} fontSize={size} fontWeight="700" fill={fill} fontFamily={FONT}>
        {text}
      </text>
    </g>
  )
}

/** Серые геометрические фигуры паттерна (брендбук, стр. 52): четверть круга, полукруг. */
export const Quarter = ({ x, y, r, rot = 0, fill = BRAND.gray, opacity = 1 }) => (
  <path d={`M${x} ${y} h${r} a${r} ${r} 0 0 1 ${-r} ${r} z`} transform={`rotate(${rot} ${x} ${y})`} fill={fill} opacity={opacity} />
)
