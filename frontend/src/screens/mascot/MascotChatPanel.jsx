// Вкладка «Крафти» в мини-приложении: переписка с ИИ-наставником (ИИ-агент №1).
// Поле ввода — нативный WriteBar ВКонтакте, закреплён над нижней панелью (FixedLayout учитывает Tabbar и безопасную зону).
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button, FixedLayout, HorizontalScroll, Separator, WriteBar, WriteBarIcon } from '@vkontakte/vkui'
import { Bubble, GREETING, useMascot } from '../../components/MascotChat.jsx'
import Krafty from '../../components/Krafty.jsx'

export default function MascotChatPanel() {
  const { msgs, text, setText, typing, suggest, send } = useMascot()
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: msgs.length ? 'smooth' : 'auto' })
  }, [msgs.length, typing])

  return (
    <>
      <div className="space-y-3 px-4 pb-40 pt-4">
        <div className="flex items-center gap-3 rounded-sm border border-line bg-cream p-3">
          <Krafty size={56} mood="wink" className="shrink-0" />
          <p className="text-sm font-semibold leading-snug text-ink">Ответы — по справочнику студента ОЧАКОВО. Темы вопросов видит HR, чтобы подготовить ответы на собеседовании.</p>
        </div>
        <Bubble role="bot">{GREETING}</Bubble>
        {msgs.map((m, i) => (
          <Bubble key={i} role={m.role} topic={m.topic}>
            {m.text}
          </Bubble>
        ))}
        {typing && (
          <div className="flex items-center gap-1 pl-2" aria-label="Крафти печатает">
            {[0, 1, 2].map((k) => (
              <motion.span key={k} className="h-2 w-2 rounded-full bg-ink/40" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: k * 0.12 }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <FixedLayout vertical="bottom" filled>
        <Separator />
        <HorizontalScroll>
          <div className="flex gap-2 px-3 py-2">
            {suggest.map((q) => (
              <Button key={q} mode="secondary" size="s" onClick={() => send(q)} disabled={typing}>
                {q}
              </Button>
            ))}
          </div>
        </HorizontalScroll>
        <WriteBar
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Спроси про практику…"
          after={<WriteBarIcon mode="send" disabled={!text.trim() || typing} onClick={() => send()} />}
        />
      </FixedLayout>
    </>
  )
}
