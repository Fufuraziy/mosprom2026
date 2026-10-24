import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, ChevronLeft, BellRing, Smartphone, ArrowRight, Users, CheckCheck, QrCode, Bot, BarChart3 } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { useBot } from '../../state/useBot.js'
import { PUSH_SCENARIOS } from '../../services/botEngine.js'
import { PHOTO } from '../../data/content.js'
import { LogoSquare, cx } from '../../components/ui.jsx'

const COMMUNITY = 'ОЧАКОВО: Карьера и практика'
const time = (iso) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

function Avatar({ thread, size = 'h-11 w-11' }) {
  if (thread === 'community') return <LogoSquare withText={false} className={cx(size, 'shrink-0 rounded-full')} />
  const initials = (thread.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return <span className={cx(size, 'grid shrink-0 place-items-center rounded-full bg-vk-light text-sm font-bold text-vk')}>{thread.id === 'me' ? 'Вы' : initials}</span>
}

const KB_COLORS = {
  primary: 'bg-vk text-white hover:bg-vk-dark',
  positive: 'bg-vk-green text-white hover:brightness-95',
  negative: 'bg-vk-red text-white hover:brightness-95',
  secondary: 'bg-[#E5EBF1] text-[#2C2D2E] hover:bg-[#DCE3EB]',
}

function MiniAppCard({ att, onOpen }) {
  return (
    <div className="mt-2 w-full max-w-[300px] overflow-hidden rounded-xl border border-[#DCE1E6] bg-paper">
      <div className="relative h-28">
        <img src={PHOTO('hq-building.jpg')} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-2 left-3 text-sm font-bold text-white">{att.title}</span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-vk-gray">{att.sub}</span>
        <button onClick={onOpen} className="shrink-0 rounded-lg bg-vk px-3 py-1.5 text-xs font-semibold text-white hover:bg-vk-dark">
          Открыть
        </button>
      </div>
    </div>
  )
}

function Message({ m, onOpenApp }) {
  const mine = m.from === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cx('flex gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && <Avatar thread="community" size="h-8 w-8" />}
      <div className={cx('max-w-[78%]', mine && 'flex flex-col items-end')}>
        {m.kind && (
          <div className={cx('mb-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', m.kind === 'invite' ? 'bg-brand text-white' : 'bg-vk-light text-vk')}>
            {m.kind === 'invite' ? <Users className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
            {m.kind === 'invite' ? 'Сообщение от HR ОЧАКОВО' : 'Рассылка сообщества'}
          </div>
        )}
        <div className={cx('whitespace-pre-line rounded-2xl px-3.5 py-2 text-[14px] leading-snug text-[#2C2D2E]', mine ? 'rounded-br-md bg-vk-bubble' : 'rounded-bl-md bg-paper shadow-[0_1px_1px_rgba(0,0,0,.06)]')}>
          {m.text}
          <span className="ml-2 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] text-vk-gray">
            {time(m.ts)}
            {mine && <CheckCheck className="h-3 w-3 text-vk" />}
          </span>
        </div>
        {m.attachment?.type === 'miniapp' && <MiniAppCard att={m.attachment} onOpen={onOpenApp} />}
      </div>
    </motion.div>
  )
}

function Chat({ thread, onBack }) {
  const { actions } = useGame()
  const { userSend } = useBot()
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const last = [...thread.messages].reverse().find((m) => m.from !== 'user' && m.keyboard)
  const keyboard = thread.messages.length ? last?.keyboard : [[{ label: 'Начать', payload: 'start', color: 'primary' }]]

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread.messages.length])

  const openApp = () => {
    actions.go('home')
    actions.track?.('bot_open_miniapp')
  }
  const press = (b) => {
    if (b.payload === 'open_app' || b.payload === 'continue') {
      userSend(thread.id, { payload: b.payload, label: b.label })
      setTimeout(openApp, 900)
      return
    }
    userSend(thread.id, { payload: b.payload, label: b.label })
  }
  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    userSend(thread.id, { text: text.trim() })
    setText('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-[#E7E8EC] bg-paper px-4 py-2.5">
        {onBack && (
          <button onClick={onBack} className="text-vk md:hidden" aria-label="К диалогам">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <Avatar thread="community" size="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-[#2C2D2E]">{COMMUNITY}</div>
          <div className="text-xs text-vk-gray">{thread.id === 'me' ? 'сообщество · бот отвечает мгновенно' : `диалог с кандидатом: ${thread.name}`}</div>
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-vk-bg px-3 py-4 sm:px-5">
        {!thread.messages.length && (
          <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-paper p-5 text-center shadow-[0_1px_1px_rgba(0,0,0,.06)]">
            <LogoSquare withText={false} className="mx-auto h-16 w-16 rounded-full" />
            <div className="mt-3 font-semibold text-[#2C2D2E]">{COMMUNITY}</div>
            <p className="mt-1 text-sm text-vk-gray">Практика и стажировки 18+. Нажмите «Начать», чтобы бот рассказал о вакансиях и открыл мини-игру.</p>
          </div>
        )}
        {thread.messages.map((m) => (
          <Message key={m.id} m={m} onOpenApp={openApp} />
        ))}
      </div>
      {keyboard && (
        <div className="space-y-1.5 border-t border-[#E7E8EC] bg-paper px-3 pt-2">
          {keyboard.map((row, i) => (
            <div key={i} className="flex gap-1.5">
              {row.map((b) => (
                <button key={b.label} onClick={() => press(b)} className={cx('min-h-[36px] flex-1 rounded-lg px-2 py-1.5 text-[13px] font-medium transition', KB_COLORS[b.color] || KB_COLORS.secondary)}>
                  {b.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex items-center gap-2 bg-paper px-3 py-2.5">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите сообщение..." className="min-w-0 flex-1 rounded-full border border-[#DCE1E6] bg-[#F2F3F5] px-4 py-2 text-sm outline-none focus:border-vk" />
        <button type="submit" disabled={!text.trim()} className="grid h-9 w-9 place-items-center rounded-full text-vk disabled:text-vk-gray" aria-label="Отправить">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

export default function BotScreen() {
  const { state, actions } = useGame()
  const { push } = useBot()
  const { threads, order, active } = state.bot
  const [mobileChat, setMobileChat] = useState(false)
  const [q, setQ] = useState('')
  const list = useMemo(() => order.map((id) => threads[id]).filter((t) => t && t.name.toLowerCase().includes(q.toLowerCase())), [order, threads, q])
  const current = threads[active] || threads.me

  useEffect(() => {
    actions.botActive(active)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">Точка входа и пуши · симулятор</div>
          <h1 className="mt-1 font-display text-3xl uppercase text-brand sm:text-4xl">
            <span className="font-light">ВК-бот </span>
            <span className="font-extrabold">ОЧАКОВО</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">Так кандидат видит сообщения сообщества во ВКонтакте. Кнопки работают: бот отвечает, открывает мини-игру, а приглашения из панели HR приходят сюда.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* мессенджер */}
        <div className="grid h-[640px] overflow-hidden rounded-xl border border-[#DCE1E6] bg-paper shadow-card md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className={cx('flex min-h-0 flex-col border-r border-[#E7E8EC]', mobileChat && 'hidden md:flex')}>
            <div className="border-b border-[#E7E8EC] p-3">
              <div className="flex items-center gap-2 rounded-lg bg-[#F2F3F5] px-3 py-2 text-sm text-vk-gray">
                <Search className="h-4 w-4" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" className="min-w-0 flex-1 bg-transparent outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {list.map((t) => {
                const lastMsg = t.messages[t.messages.length - 1]
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      actions.botActive(t.id)
                      setMobileChat(true)
                    }}
                    className={cx('flex w-full items-center gap-3 px-3 py-2.5 text-left transition', t.id === active ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F8]')}
                  >
                    <Avatar thread="community" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[#2C2D2E]">{t.id === 'me' ? COMMUNITY : t.name}</span>
                        {lastMsg && <span className="shrink-0 text-[11px] text-vk-gray">{time(lastMsg.ts)}</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] text-vk-gray">{lastMsg ? (lastMsg.from === 'user' ? 'Вы: ' : '') + lastMsg.text : t.id === 'me' ? 'Нажмите «Начать»' : ''}</span>
                        {t.unread > 0 && <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-vk px-1.5 text-[11px] font-semibold text-white">{t.unread}</span>}
                      </div>
                      {t.id !== 'me' && <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">кандидат · сообщение от HR</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
          <section className={cx('min-h-0', !mobileChat && 'hidden md:block')}>
            <Chat thread={current} onBack={() => setMobileChat(false)} />
          </section>
        </div>

        {/* пульт для жюри */}
        <div className="space-y-4">
          <div className="border border-line bg-paper p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <BellRing className="h-4 w-4 text-brand" /> Сценарии пушей (для жюри)
            </div>
            <div className="mt-3 space-y-2">
              {PUSH_SCENARIOS.map((p) => (
                <button key={p.id} onClick={() => push(p.id)} className="group flex w-full items-center gap-3 border border-line px-3 py-2.5 text-left transition hover:border-brand">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-ink">{p.title}</div>
                    <div className="text-xs text-ink-soft">{p.sub}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
          <div className="bg-brand p-4 text-white">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">Экосистема</div>
            <ol className="mt-3 space-y-3 text-sm">
              {[
                [QrCode, 'QR на банке, в вузе, на ярмарке', 'ведёт в сообщество и бота'],
                [Bot, 'ВК-бот', 'ответы 24/7, запуск игры, пуши'],
                [Smartphone, 'VK Mini App «Код 1978»', 'игра, анкета 18+, VK ID в 1 клик'],
                [BarChart3, 'Панель HR', 'ИИ-досье и приглашение через бота'],
              ].map(([I, t, s], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center bg-paper text-brand">
                    <I className="h-4 w-4" />
                  </span>
                  <span>
                    <b className="block leading-tight">
                      {i + 1}. {t}
                    </b>
                    <span className="text-xs text-white/80">{s}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <button onClick={() => actions.setMode('hr')} className="flex w-full items-center justify-between border border-brand px-4 py-3 text-sm font-bold uppercase tracking-wide text-brand hover:bg-brand hover:text-white">
            Написать кандидату из панели HR <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
