import { Coins, Ticket } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { MERCH } from '../../data/content.js'
import { Button, cx } from '../../components/ui.jsx'
import { MerchCard, MerchTicketsBadge } from '../../components/MerchCard.jsx'
import { MascotHead } from '../../components/MascotStoryteller.jsx'
import { InviteFriendCard } from '../../components/InviteFriend.jsx'

/** Витрина капсульной коллекции «PURE CRAFT 1978»: мокапы, цвет, идея предмета, обмен баллов на билет. */
export default function MerchShop({ onForm }) {
  const { state, balance, actions } = useGame()
  const colors = state.merchColors || {}
  const totalTickets = Object.values(state.tickets).reduce((a, b) => a + b, 0)
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 border border-line bg-paper">
        <div className="border-r border-line p-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-mute">Баланс</div>
          <div className="mt-0.5 flex items-center gap-1.5 font-display text-xl font-extrabold">
            <Coins className="h-5 w-5 text-brand" strokeWidth={1.8} />
            {balance.toLocaleString('ru-RU')}
          </div>
        </div>
        <div className="p-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-mute">Твои билеты</div>
          <div className="mt-0.5 flex items-center gap-1.5 font-display text-xl font-extrabold">
            <Ticket className="h-5 w-5 text-brand" strokeWidth={1.8} />
            {totalTickets}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <InviteFriendCard />
      </div>
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
        <span className="h-px w-5 bg-brand" />
        Капсульная коллекция PURE CRAFT 1978
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MERCH.map((m) => (
          <MerchCard
            key={m.id}
            item={m}
            color={colors[m.id] || m.color}
            onColor={(c) => actions.setMerchColor(m.id, c)}
            owned={state.tickets[m.id] || 0}
            canBuy={balance >= m.price}
            onBuy={(item) => actions.buy(item)}
          />
        ))}
      </div>
      {totalTickets > 0 && (
        <div className="mt-5">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-mute">Твои билеты в розыгрыше</div>
          <MerchTicketsBadge tickets={state.tickets} colors={colors} />
        </div>
      )}
      <div className={cx('mt-5 flex flex-col items-start gap-3 border p-4 sm:flex-row sm:items-center', state.candidate ? 'border-leaf bg-leaf/10' : 'border-brand bg-brand/5')}>
        <MascotHead size={48} mood={state.candidate ? 'happy' : 'think'} />
        <p className="flex-1 text-sm font-semibold">
          {state.candidate
            ? 'Анкета отправлена — твои билеты участвуют в розыгрыше. Победителей объявим в сообществе ОЧАКОВО и напишем по контактам из анкеты.'
            : 'Билеты активируются после отправки анкеты (18+): так мы сможем связаться с победителем и вручить мерч.'}
        </p>
        {!state.candidate && (
          <Button size="sm" onClick={onForm} className="shrink-0">
            Заполнить анкету 18+
          </Button>
        )}
      </div>
    </div>
  )
}
