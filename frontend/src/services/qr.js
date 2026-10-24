// Генератор QR-кодов без зависимостей (ISO/IEC 18004): байтовый режим, уровень коррекции M, версии 1–10.
// Используется в листовках Бренд-Кита: qrMatrix('https://vk.com/app…') → двумерный массив true/false.

// [данные (кодовых слов), EC на блок, блоков в группе 1, размер блока 1, блоков в группе 2, размер блока 2] — уровень M
const SPEC_M = [
  null,
  [16, 10, 1, 16, 0, 0],
  [28, 16, 1, 28, 0, 0],
  [44, 26, 1, 44, 0, 0],
  [64, 18, 2, 32, 0, 0],
  [86, 24, 2, 43, 0, 0],
  [108, 16, 4, 27, 0, 0],
  [124, 18, 4, 31, 0, 0],
  [154, 22, 2, 38, 2, 39],
  [182, 22, 3, 36, 2, 37],
  [216, 26, 4, 43, 1, 44],
]
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]]

/* ---------------------------------------------------------------- GF(256) и Рида–Соломона */
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0)

function rsGenerator(n) {
  let g = [1]
  for (let i = 0; i < n; i++) {
    const next = new Array(g.length + 1).fill(0)
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j]
      next[j + 1] ^= mul(g[j], EXP[i])
    }
    g = next
  }
  return g
}

function rsRemainder(data, n) {
  const gen = rsGenerator(n)
  const res = new Array(n).fill(0)
  for (const b of data) {
    const factor = b ^ res[0]
    res.shift()
    res.push(0)
    for (let i = 0; i < n; i++) res[i] ^= mul(gen[i + 1], factor)
  }
  return res
}

/* ---------------------------------------------------------------- кодирование данных */
function utf8(text) {
  return Array.from(new TextEncoder().encode(text))
}

function encodeData(bytes, version) {
  const [total] = SPEC_M[version]
  const bits = []
  const push = (v, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1)
  }
  push(0b0100, 4) // байтовый режим
  push(bytes.length, version < 10 ? 8 : 16)
  bytes.forEach((b) => push(b, 8))
  const cap = total * 8
  push(0, Math.min(4, cap - bits.length))
  while (bits.length % 8) bits.push(0)
  const out = []
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0))
  for (let pad = 0; out.length < total; pad++) out.push(pad % 2 ? 0x11 : 0xec)
  return out
}

function interleave(data, version) {
  const [, ec, b1, s1, b2, s2] = SPEC_M[version]
  const blocks = []
  let k = 0
  for (let i = 0; i < b1; i++, k += s1) blocks.push(data.slice(k, k + s1))
  for (let i = 0; i < b2; i++, k += s2) blocks.push(data.slice(k, k + s2))
  const ecBlocks = blocks.map((b) => rsRemainder(b, ec))
  const out = []
  const maxLen = Math.max(s1, s2)
  for (let i = 0; i < maxLen; i++) for (const b of blocks) if (i < b.length) out.push(b[i])
  for (let i = 0; i < ec; i++) for (const b of ecBlocks) out.push(b[i])
  return out
}

/* ---------------------------------------------------------------- матрица */
function bch(value, poly, polyBits) {
  let v = value << (polyBits - 1)
  for (let i = 31 - Math.clz32(v); i >= polyBits - 1; i--) if ((v >>> i) & 1) v ^= poly << (i - (polyBits - 1))
  return v
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

function baseMatrix(version) {
  const n = version * 4 + 17
  const m = Array.from({ length: n }, () => new Array(n).fill(null))
  const finder = (r0, c0) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r
        const cc = c0 + c
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue
        const on = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        m[rr][cc] = on
      }
  }
  finder(0, 0)
  finder(0, n - 7)
  finder(n - 7, 0)
  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0
    m[i][6] = i % 2 === 0
  }
  const pos = ALIGN[version]
  const last = pos.length - 1
  pos.forEach((r, i) =>
    pos.forEach((c, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return // поисковые узоры
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
    }),
  )
  m[n - 8][8] = true // тёмный модуль
  // резерв под формат и версию
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = false
    if (m[i][8] === null) m[i][8] = false
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][n - 1 - i] === null) m[8][n - 1 - i] = false
    if (m[n - 1 - i][8] === null) m[n - 1 - i][8] = false
  }
  if (version >= 7) {
    const v = (version << 12) | bch(version, 0x1f25, 13)
    for (let i = 0; i < 18; i++) {
      const bit = ((v >>> i) & 1) === 1
      const a = Math.floor(i / 3)
      const b = (i % 3) + n - 11
      m[a][b] = bit
      m[b][a] = bit
    }
  }
  return m
}

function placeData(base, codewords) {
  const n = base.length
  const m = base.map((row) => row.slice())
  const isData = base.map((row) => row.map((v) => v === null))
  const bits = []
  codewords.forEach((b) => {
    for (let i = 7; i >= 0; i--) bits.push((b >>> i) & 1)
  })
  let k = 0
  let up = true
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let i = 0; i < n; i++) {
      const r = up ? n - 1 - i : i
      for (let d = 0; d < 2; d++) {
        const c = col - d
        if (!isData[r][c]) continue
        m[r][c] = k < bits.length ? bits[k] === 1 : false
        k++
      }
    }
    up = !up
  }
  return { m, isData }
}

function applyFormat(m, mask) {
  const n = m.length
  const data = (0b00 << 3) | mask // уровень M = 00
  const f = ((data << 10) | bch(data, 0x537, 11)) ^ 0x5412
  const bit = (i) => ((f >>> i) & 1) === 1
  // первая копия — вокруг левого верхнего поискового узора
  for (let i = 0; i <= 5; i++) m[i][8] = bit(i)
  m[7][8] = bit(6)
  m[8][8] = bit(7)
  m[8][7] = bit(8)
  for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i)
  // вторая копия — у правого верхнего и левого нижнего узоров
  for (let i = 0; i < 8; i++) m[8][n - 1 - i] = bit(i)
  for (let i = 8; i < 15; i++) m[n - 15 + i][8] = bit(i)
  m[n - 8][8] = true // тёмный модуль
}

function penalty(m) {
  const n = m.length
  let p = 0
  for (let r = 0; r < n; r++) {
    for (const line of [m[r], m.map((row) => row[r])]) {
      let run = 1
      for (let i = 1; i < n; i++) {
        if (line[i] === line[i - 1]) run++
        else {
          if (run >= 5) p += run - 2
          run = 1
        }
      }
      if (run >= 5) p += run - 2
      for (let i = 0; i + 10 < n; i++) {
        const s = line.slice(i, i + 11).map((v) => (v ? 1 : 0)).join('')
        if (s === '10111010000' || s === '00001011101') p += 40
      }
    }
  }
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (m[r][c] === m[r + 1][c] && m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c + 1]) p += 3
  const dark = m.flat().filter(Boolean).length
  p += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10
  return p
}

/** Матрица QR-кода для строки (UTF-8). Возвращает массив строк из true/false (true — тёмный модуль). */
export function qrMatrix(text) {
  const bytes = utf8(text)
  let version = 1
  while (version <= 10 && SPEC_M[version][0] < bytes.length + (version < 10 ? 2 : 3)) version++
  if (version > 10) throw new Error('QR: строка слишком длинная')
  const codewords = interleave(encodeData(bytes, version), version)
  const base = baseMatrix(version)
  const { m: raw, isData } = placeData(base, codewords)
  let best = null
  for (let mask = 0; mask < 8; mask++) {
    const m = raw.map((row, r) => row.map((v, c) => (isData[r][c] && MASKS[mask](r, c) ? !v : v)))
    applyFormat(m, mask)
    const score = penalty(m)
    if (!best || score < best.score) best = { m, score }
  }
  return best.m
}
