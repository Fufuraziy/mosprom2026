/**
 * Дизайн-токены «Очаково».
 * Брендбука в материалах хакатона нет, поэтому цвета сняты пипеткой
 * с каталога продукции (стр. 2–6) и титров вакансионных роликов:
 *   основной красно-малиновый  #EC1A42  (плашки каталога, логотип)
 *   тёмный «кинематографичный»  #17110F  (фон ролика «Процесс создания нового вкуса»)
 *   золотисто-солодовый         #C9922E  (колосья, банка KERN)
 *   крафт / бежевый             #E9DCC6  (рваная бумага, дегустационный лист)
 * При получении официального брендбука достаточно заменить значения здесь и в :root (src/index.css).
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#EC1A42',
          50: '#FFF1F4',
          100: '#FFDDE4',
          200: '#FFB8C6',
          300: '#FB869E',
          400: '#F44D6C',
          500: '#EC1A42',
          600: '#CF0F38',
          700: '#AA0B2E',
          800: '#820A25',
          900: '#59071A',
        },
        ink: {
          DEFAULT: '#17110F',
          2: '#2A211D',
          soft: '#4B403B',
          mute: '#7D716B',
        },
        malt: {
          DEFAULT: '#C9922E',
          light: '#EBC779',
          dark: '#8E6418',
        },
        kraft: {
          DEFAULT: '#E9DCC6',
          light: '#F5EEE2',
          dark: '#CDB894',
        },
        cream: '#FBF6EE',
        paper: '#FFFDF9',
        mint: '#1E9E8C',
        lime: '#7DBB2F',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['Montserrat', 'Arial Black', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        pop: '4px 4px 0 0 #17110F',
        'pop-sm': '2px 2px 0 0 #17110F',
        'pop-lg': '7px 7px 0 0 #17110F',
        'pop-red': '4px 4px 0 0 #EC1A42',
        card: '0 18px 40px -22px rgba(23,17,15,.45)',
        glow: '0 0 0 4px rgba(236,26,66,.18)',
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
