import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Loader2, Send, Sparkles, Check, ArrowRight, MessageCircle } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { useBot } from '../../state/useBot.js'
import { api } from '../../services/api.js'
import { LogoSquare, cx } from '../../components/ui.jsx'

/** «Написать кандидату через ВК-бота»: персональное ИИ-приглашение по игровой телеметрии. */
export default function InviteModal({ candidate, onClose }) {
  const { actions, toast } = useGame()
  const { hrSend } = useBot()
  const [draft, setDraft] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)

  useEffect(() => {
    api.inviteDraft(candidate).then((d) => {
      setDraft(d)
      setText(d.text)
    })
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id])

  const send = async () => {
    setSending(true)
    const r = await api.botSend(candidate, text)
    // id строки истории бота на сервере (bot_message_id) — тот же, что вернёт GET /api/bot/inbox: без дублей при опросе
    const threadId = hrSend(candidate, text, draft?.keyboard, r?.bot_message_id != null ? `bm_${r.bot_message_id}` : r?.message_id)
    setSending(false)
    setSent({ ...r, threadId })
    toast(`ВК-бот: приглашение отправлено · ${candidate.fio.split(' ').slice(0, 2).join(' ')}`, 'info')
    api.track(null, 'hr_bot_invite', { candidate_id: candidate.id, channel: r.channel })
  }

  const openBot = () => {
    actions.botActive(sent.threadId)
    actions.setMode('bot')
    onClose()
  }

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden bg-paper shadow-pop-lg" role="dialog" aria-label="Приглашение через ВК-бота">
        <div className="flex items-center gap-3 bg-vk px-5 py-3 text-white">
          <MessageCircle className="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold uppercase tracking-wide">Написать через ВК-бота</div>
            <div className="truncate text-xs text-white/85">
              {candidate.fio} · {candidate.vk_user_id ? (candidate.vk_source === 'demo' ? 'VK ID (демо)' : `vk.com/id${candidate.vk_user_id}`) : 'кандидат пока не связан с ВК'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!draft ? (
          <div className="grid place-items-center p-12">
            <Loader2 className="h-7 w-7 animate-spin text-vk" />
            <div className="mt-2 text-sm text-ink-soft">ИИ-агент пишет персональное приглашение…</div>
          </div>
        ) : sent ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-3 text-vk-green">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8F5E8]">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <div className="font-bold text-ink">Сообщение доставлено</div>
                <div className="text-xs text-ink-soft">
                  {sent.channel === 'vk' ? 'Отправлено от имени сообщества ОЧАКОВО во ВКонтакте' : 'Демо-доставка: в проде уйдёт, когда кандидат разрешит сообщения сообщества'}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={openBot} className="flex items-center gap-2 bg-vk px-4 py-2.5 text-sm font-semibold text-white hover:bg-vk-dark">
                Открыть вкладку «ВК-бот» <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink">
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-col">
            <div className="space-y-3 overflow-y-auto p-5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="flex items-center gap-1 font-bold uppercase tracking-wide text-brand">
                  <Sparkles className="h-3.5 w-3.5" /> ИИ учёл:
                </span>
                {draft.based_on?.map((b) => (
                  <span key={b} className="border border-line bg-cream px-1.5 py-0.5 font-semibold text-ink-soft">
                    {b}
                  </span>
                ))}
              </div>
              <div className="rounded-xl bg-vk-bg p-3">
                <div className="flex gap-2">
                  <LogoSquare withText={false} className="h-8 w-8 shrink-0 rounded-full" />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="w-full resize-y rounded-2xl rounded-tl-md border border-transparent bg-paper px-3 py-2 text-[14px] leading-snug text-[#2C2D2E] outline-none focus:border-vk"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-10">
                  {draft.keyboard?.flat().map((b) => (
                    <span key={b.label} className={cx('rounded-lg px-2.5 py-1 text-xs font-medium', b.color === 'positive' ? 'bg-vk-green text-white' : 'bg-[#E5EBF1] text-[#2C2D2E]')}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-ink-mute">Текст можно отредактировать. Кнопки ответа кандидат увидит под сообщением во ВКонтакте.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-line p-4">
              <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink">
                Отмена
              </button>
              <button onClick={send} disabled={sending || !text.trim()} className="flex items-center gap-2 bg-vk px-5 py-2.5 text-sm font-semibold text-white hover:bg-vk-dark disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Отправить
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  )
}
