/**
 * Дизайн-токены ОЧАКОВО — по брендбуку (папка brandbook/, стр. 58 «Фирменная цветовая палитра»,
 * стр. 59 «Фирменные шрифты», Retail стр. 33–34 «Дополнительные цвета»).
 *   красный       Pantone 199          RGB 213.0.50    #D50032  — основной цвет
 *   белый                               #FFFFFF          — основной цвет
 *   тёмно-серый   Pantone Cool Gray 10 RGB 98.98.98    #626262  — текстовые блоки
 *   серый         Pantone 429          RGB 162.170.173 #A2AAAD  — паттерн, заливки
 *   тёмно-красный Pantone 7621         RGB 171.35.40   #AB2328  — пиктограммы на красном, заливки
 *   Retail: зелёный 376 C #84BD00, голубой 2194 #0086D6, тёмно-зелёный 362 #509E2F
 * Шрифт бренда — Proxima Nova (платный, ставится первым в стеке); открытая замена — Montserrat.
 */
const v = (name) => `rgb(var(--och-${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './hr.html', './brandkit.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D50032',
          50: '#FCEBEF',
          100: '#F9D3DC',
          200: '#F2A6B8',
          300: '#E86F8C',
          400: '#DE3961',
          500: '#D50032',
          600: '#BF002D',
          700: '#AB2328',
          800: '#8C1D21',
          900: '#5F1416',
        },
        // Поверхности и текст — через CSS-переменные (index.css): светлая и тёмная тема VK Mini App.
        ink: {
          DEFAULT: v('ink'),
          2: v('ink-2'),
          soft: v('ink-soft'),
          mute: v('ink-mute'),
        },
        graphite: { DEFAULT: '#626262', 2: '#575757' },
        steel: { DEFAULT: '#A2AAAD', light: v('steel-light') },
        line: v('line'),
        // бывшие «солод» и «крафт» → серая шкала Pantone 429
        malt: { DEFAULT: '#A2AAAD', light: v('malt-light'), dark: v('malt-dark') },
        kraft: { DEFAULT: v('kraft'), light: v('kraft-light'), dark: v('kraft-dark') },
        cream: v('cream'),
        paper: v('paper'),
        mint: '#0086D6',
        lime: '#84BD00',
        leaf: '#509E2F',
        // цвета интерфейса ВКонтакте — только в симуляторе бота и кнопке VK ID
        vk: { DEFAULT: '#0077FF', dark: '#0066DB', light: '#E5F0FF', bubble: '#CCE4FF', bg: '#EBEDF0', gray: '#818C99', green: '#4BB34B', red: '#E64646' },
      },
      fontFamily: {
        sans: ['"Proxima Nova"', 'Montserrat', 'Tahoma', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['"Proxima Nova"', 'Montserrat', 'Tahoma', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // бренд — плоский и «чистый»: мягкие тени вместо поп-арт обводок
        pop: '0 1px 2px rgba(98,98,98,.10), 0 10px 26px -16px rgba(98,98,98,.40)',
        'pop-sm': '0 1px 2px rgba(98,98,98,.14)',
        'pop-lg': '0 2px 4px rgba(98,98,98,.10), 0 22px 44px -22px rgba(98,98,98,.50)',
        'pop-red': '0 12px 30px -14px rgba(213,0,50,.55)',
        card: '0 1px 2px rgba(98,98,98,.10), 0 10px 26px -16px rgba(98,98,98,.40)',
        glow: '0 0 0 4px rgba(213,0,50,.15)',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.15' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        wiggle: { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        spinslow: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        blink: 'blink 1.1s steps(2, start) infinite',
        floaty: 'floaty 3.2s ease-in-out infinite',
        wiggle: 'wiggle 1.4s ease-in-out infinite',
        shake: 'shake .45s ease-in-out',
        marquee: 'marquee 28s linear infinite',
        spinslow: 'spinslow 18s linear infinite',
      },
    },
  },
  plugins: [],
}
