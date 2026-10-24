import { motion } from 'framer-motion'
import { Ticket, Coins, Lock } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { MERCH } from '../../data/content.js'
import { Button, Sticker, cx } from '../../components/ui.jsx'
import Krafty from '../../components/Krafty.jsx'

function MerchArt({ id }) {
  if (id === 'hoodie')
    return (
      <svg viewBox="0 0 200 150" className="h-full w-full">
        <path d="M70 18 q30 -14 60 0 l34 22 14 64 -18 6 -8 -24 v54 h-104 v-54 l-8 24 -18 -6 14 -64z" fill="#D50032" stroke="#4A4A4A" strokeWidth="3" strokeLinejoin="round" />
        <path d="M78 20 q22 24 44 0" fill="#AB2328" stroke="#4A4A4A" strokeWidth="3" />
        <text x="100" y="78" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">Я ДЕЛАЮ</text>
        <text x="100" y="92" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">НАТУРАЛЬНЫЕ</text>
        <text x="100" y="104" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="Montserrat, Arial">НАПИТКИ</text>
        <rect x="80" y="112" width="40" height="18" rx="3" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="94" cy="124" r="4" fill="none" stroke="#fff" strokeWidth="2.6" />
      </svg>
    )
  if (id === 'box')
    return (
      <svg viewBox="0 0 200 150" className="h-full w-full">
        {[
          ['#6DBE3A', 46],
          ['#575757', 72],
          ['#F5C400', 98],
          ['#E8456B', 124],
          ['#D50032', 150],
        ].map(([c, x], i) => (
          <rect key={i} x={x - 10} y={30 + (i % 2) * 6} width="22" height="60" rx="4" fill={c} stroke="#4A4A4A" strokeWidth="2.5" />
        ))}
        <path d="M24 76 h152 l-8 62 h-136z" fill="#C9CED0" stroke="#4A4A4A" strokeWidth="3" strokeLinejoin="round" />
        <path d="M24 76 l18 -14 h116 l18 14" fill="#E8EBEC" stroke="#4A4A4A" strokeWidth="3" strokeLinejoin="round" />
        <text x="100" y="112" textAnchor="middle" fontSize="13" fontWeight="900" fill="#4A4A4A" fontFamily="Montserrat, Arial">КРАФТ-БОКС</text>
        <text x="100" y="127" textAnchor="middle" fontSize="8" fontWeight="700" fill="#626262" fontFamily="JetBrains Mono, monospace">LIMITED · 1978</text>
      </svg>
    )
  if (id === 'stickers')
    return (
      <div className="relative grid h-full w-full place-items-center">
        <div className="absolute left-[18%] top-[14%] rotate-[-12deg] rounded-full border border-line bg-paper p-1.5 shadow-pop-sm">
          <Krafty size={64} mood="wink" />
        </div>
        <div className="absolute right-[16%] top-[18%] grid h-16 w-16 rotate-[10deg] place-items-center rounded-full border border-line bg-brand font-display text-[10px] font-extrabold leading-tight text-white shadow-pop-sm">
          ЛЭП
          <br />
          1978
        </div>
        <div className="absolute bottom-[10%] left-[38%] rotate-[4deg] rounded-sm border border-line bg-malt-light px-2 py-1 font-display text-[11px] font-extrabold shadow-pop-sm">ПЕРВЫЕ В МИРЕ</div>
      </div>
    )
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full">
      <path d="M20 40 h160 v22 a12 12 0 0 0 0 26 v22 h-160 v-22 a12 12 0 0 0 0 -26z" fill="#4A4A4A" stroke="#4A4A4A" strokeWidth="3" />
      <path d="M26 46 h148 v14 a16 16 0 0 0 0 34 v14 h-148 v-14 a16 16 0 0 0 0 -34z" fill="none" stroke="#E8EBEC" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="100" y="72" textAnchor="middle" fontSize="20" fontWeight="900" fill="#E8EBEC" fontFamily="Montserrat, Arial">VIP</text>
      <text x="100" y="90" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Montserrat, Arial">МУЗЕЙ + ПРОИЗВОДСТВО</text>
      <text x="100" y="102" textAnchor="middle" fontSize="7" fill="#fff" opacity=".7" fontFamily="JetBrains Mono, monospace">№ 0001978 · ДЕГУСТАЦИЯ</text>
    </svg>
  )
}

export default function MerchShop({ onForm }) {
  const { state, balance, actions } = useGame()
  const totalTickets = Object.values(state.tickets).reduce((a, b) => a + b, 0)
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-sm border border-line bg-malt-light px-4 py-2 font-extrabold shadow-pop-sm">
          <Coins className="h-5 w-5" /> Баланс: <span className="font-mono">{balance.toLocaleString('ru-RU')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Ticket className="h-5 w-5 text-brand" /> Твоих билетов: {totalTickets}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {MERCH.map((m, i) => {
          const can = balance >= m.price
          const mine = state.tickets[m.id] || 0
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex flex-col overflow-hidden rounded-sm border border-line bg-paper shadow-pop">
              <div className="relative h-44 border-b-2 border-brand bg-kraft-light p-3">
                <div className="halftone absolute inset-0 opacity-40" />
                <div className="relative h-full">
                  <MerchArt id={m.id} />
                </div>
                {mine > 0 && (
                  <Sticker className="absolute right-2 top-2" color="bg-brand text-white" rotate={6}>
                    ×{mine} билет
                  </Sticker>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="font-display text-base font-extrabold leading-tight">{m.title}</div>
                <div className="mt-1 flex-1 text-xs text-ink-soft">{m.sub}</div>
                <div className="mt-2 font-mono text-[11px] font-bold text-ink-mute">{m.stock}</div>
                <Button className="mt-3 w-full" variant={can ? 'primary' : 'light'} disabled={!can} onClick={() => actions.buy(m)}>
                  {can ? <Ticket className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  Билет за {m.price}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className={cx('mt-6 flex flex-col items-start gap-3 rounded-sm border-2 border-dashed p-4 sm:flex-row sm:items-center', state.candidate ? 'border-lime bg-lime/10' : 'border-brand bg-brand-50')}>
        <Krafty size={48} mood={state.candidate ? 'happy' : 'think'} />
        <p className="flex-1 text-sm font-semibold">
          {state.candidate
            ? 'Анкета отправлена — твои билеты участвуют в розыгрыше. Победителей объявим в сообществе ОЧАКОВО и напишем по контактам из анкеты.'
            : 'Билеты активируются после отправки анкеты (18+): так мы сможем связаться с победителем и вручить мерч.'}
        </p>
        {!state.candidate && (
          <button
            type="button"
            onClick={onForm}
            className="shrink-0 rounded-sm bg-[#E30613] hover:bg-red-700 text-white font-bold py-2.5 px-5 shadow-lg shadow-red-600/30 border border-red-400 uppercase text-xs tracking-wider transition active:scale-95"
          >
            Заполнить анкету 18+
          </button>
        )}
      </div>
    </div>
  )
}
