import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Tag } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { api } from '../services/api.js'
import Krafty from './Krafty.jsx'
import { cx } from './ui.jsx'

const QUICK = ['Сколько платят?', 'Как с общежитием?', 'А если сессия?', 'Что с военкоматом?', 'Какой график 2/2?', 'Есть испытательный срок?']

export default function MascotChat() {
  const { state, actions } = useGame()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [suggest, setSuggest] = useState(QUICK)
  const [nudge, setNudge] = useState(false)
  const listRef = useRef(null)
  const msgs = state.chatHistory

  useEffect(() => {
    const t = setTimeout(() => setNudge(true), 9000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs.length, typing, open])

  const send = async (raw) => {
    const m = (raw ?? text).trim()
    if (!m || typing) return
    setText('')
    actions.chatPush([{ role: 'user', text: m }])
    setTyping(true)
    const started = Date.now()
    const r = await api.chat(state.sessionId, m, msgs)
    const wait = Math.max(0, 650 - (Date.now() - started))
    setTimeout(() => {
      actions.chatPush([{ role: 'bot', text: r.reply, topic: r.topic_label && r.topic !== 'other' ? r.topic_label : null }])
      actions.topic(r.topic)
      api.track(state.sessionId, 'asked_topics', { topic: r.topic, message: m.slice(0, 200) })
      if (r.suggestions?.length) setSuggest(r.suggestions)
      setTyping(false)
    }, wait)
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => {
              setOpen(true)
              setNudge(false)
            }}
            className="fixed bottom-4 right-4 z-50 flex items-end gap-2 sm:bottom-6 sm:right-6"
            aria-label="Открыть чат с наставником Крафти"
          >
            <AnimatePresence>
              {nudge && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="mb-6 hidden max-w-[200px] rounded-sm rounded-br-none border border-line bg-white px-3 py-2 text-left text-xs font-bold text-ink shadow-pop-sm sm:block">
                  Есть вопрос про общагу, зарплату или сессию? Спроси меня!
                </motion.span>
              )}
            </AnimatePresence>
            <span className="relative grid h-16 w-16 place-items-center rounded-full border border-line bg-brand shadow-pop transition hover:-translate-y-1">
              <Krafty size={54} mood="happy" />
              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-line bg-malt-light font-display text-xs font-extrabold">?</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(640px,calc(100vh-80px))] flex-col overflow-hidden rounded-sm border border-line bg-paper shadow-pop-lg sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[390px]"
            role="dialog"
            aria-label="Чат с наставником Крафти"
          >
            <div className="relative flex items-center gap-3 bg-brand px-4 py-3 text-white">
              <div className="halftone-white absolute inset-0 opacity-40" />
              <div className="relative rounded-full border border-line bg-white p-0.5">
                <Krafty size={44} mood="wink" />
              </div>
              <div className="relative flex-1">
                <div className="font-display text-lg font-extrabold leading-none">Крафти</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-white/85">
                  <span className="h-2 w-2 rounded-full bg-lime" /> ИИ-наставник · отвечает 24/7
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="relative grid h-9 w-9 place-items-center rounded-full border-2 border-white/70 hover:bg-white/15" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#F5F6F7,#fff)] p-4">
              <Bubble role="bot">
                Привет! Я Крафти, медведь-наставник из ЛЭП 🐻 Отвечу про практику, зарплату, общежитие, сессию на заводе, военкомат и график. Спрашивай!
              </Bubble>
              {msgs.map((m, i) => (
                <Bubble key={i} role={m.role} topic={m.topic}>
                  {m.text}
                </Bubble>
              ))}
              {typing && (
                <div className="flex items-center gap-1 pl-2">
                  {[0, 1, 2].map((k) => (
                    <motion.span key={k} className="h-2 w-2 rounded-full bg-ink/40" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: k * 0.12 }} />
                  ))}
                </div>
              )}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto border-t-2 border-ink/10 bg-white px-3 py-2">
              {suggest.map((q) => (
                <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border-2 border-ink/20 bg-cream px-3 py-1 text-xs font-bold hover:border-brand">
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2 border-t-2 border-brand bg-white p-3"
            >
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Спроси про практику…" className="min-w-0 flex-1 rounded-sm border-2 border-ink/20 px-3 py-2 text-sm font-semibold outline-none focus:border-brand" />
              <button type="submit" disabled={!text.trim() || typing} className="grid h-10 w-10 place-items-center rounded-sm border border-line bg-brand text-white disabled:opacity-40" aria-label="Отправить">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Bubble({ role, children, topic }) {
  const bot = role === 'bot'
  return (
    <div className={cx('flex', bot ? 'justify-start' : 'justify-end')}>
      <div className={cx('max-w-[86%] rounded-sm border-2 px-3 py-2 text-sm leading-snug', bot ? 'rounded-bl-none border-line bg-white' : 'rounded-br-none border-graphite bg-graphite text-white')}>
        {children}
        {topic && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
            <Tag className="h-3 w-3" /> тема: {topic}
          </div>
        )}
      </div>
    </div>
  )
}
