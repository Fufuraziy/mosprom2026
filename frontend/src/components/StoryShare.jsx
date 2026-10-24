import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Loader2, Check } from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { buildRecommendation } from '../services/localEngine.js'
import { shareStory, isInsideVK, VK_APP_URL } from '../services/vk.js'
import { LOGO } from '../data/logo.js'
import { cx } from './ui.jsx'

const W = 1080
const H = 1920

function wrap(ctx, text, maxW) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  return lines
}

/** Картинка для истории ВКонтакте 1080×1920 в фирменном стиле (красная заливка, квадратный модуль, логотип). */
export async function renderStory({ archetype, points, match }) {
  try {
    await document.fonts?.ready
  } catch {
    /* ignore */
  }
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const F = (w, s) => `${w} ${s}px Montserrat, "Proxima Nova", Arial, sans-serif`
  ctx.fillStyle = '#D50032'
  ctx.fillRect(0, 0, W, H)
  // квадратный модуль логотипа: рамка + кольцо
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 16
  ctx.strokeRect(96, 120, 200, 200)
  ctx.lineWidth = 28
  ctx.beginPath()
  ctx.arc(196, 240, 44, 0, Math.PI * 2)
  ctx.stroke()
  // фирменная надпись (векторные контуры логотипа)
  const [x0, y0, x1] = LOGO.text_bbox
  const k = 300 / (x1 - x0)
  ctx.save()
  ctx.translate(96, 360)
  ctx.scale(k, k)
  ctx.translate(-x0, -y0)
  ctx.fillStyle = '#FFFFFF'
  LOGO.text.forEach((d) => ctx.fill(new Path2D(d)))
  ctx.restore()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = F(200, 96)
  ctx.fillText('Я ОТКРЫЛ(А)', 96, 700)
  ctx.font = F(800, 150)
  ctx.fillText('КАПСУЛУ', 96, 850)
  ctx.fillText('1978', 96, 1000)

  // белый модуль с результатом
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(96, 1100, W - 192, 430)
  ctx.fillStyle = '#626262'
  ctx.font = F(700, 34)
  ctx.fillText('МОЙ АРХЕТИП', 140, 1170)
  ctx.fillStyle = '#D50032'
  ctx.font = F(800, 70)
  wrap(ctx, archetype.toUpperCase(), W - 280).forEach((l, i) => ctx.fillText(l, 140, 1260 + i * 80))
  ctx.fillStyle = '#626262'
  ctx.font = F(600, 40)
  ctx.fillText(`${points} Крафт-баллов · мэтч ${match}%`, 140, 1470)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = F(300, 48)
  ctx.fillText('Пройди квест ОЧАКОВО', 96, 1660)
  ctx.font = F(800, 48)
  ctx.fillText('и выиграй мерч →', 96, 1730)
  ctx.font = F(600, 30)
  ctx.globalAlpha = 0.8
  ctx.fillText('Практика и стажировки 18+ · ' + VK_APP_URL.replace('https://', ''), 96, 1830)
  ctx.globalAlpha = 1
  return c.toDataURL('image/jpeg', 0.9)
}

export default function StoryShare({ className = '' }) {
  const { state, balance, actions } = useGame()
  const [open, setOpen] = useState(false)
  const [img, setImg] = useState(null)
  const [status, setStatus] = useState(null) // null | sending | done | unsupported
  const rec = buildRecommendation(state.telemetry)

  useEffect(() => {
    if (!open) return
    renderStory({ archetype: rec.archetype.name, points: balance, match: rec.matches[0]?.match || 80 }).then(setImg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const publish = async () => {
    setStatus('sending')
    const r = await shareStory(img)
    if (r.ok) {
      if (!state.storyShared) actions.storyShared(r.source)
      setStatus('done')
    } else setStatus(r.source === 'unsupported' ? 'unsupported' : null)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={cx('flex items-center gap-3 rounded-lg bg-vk px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-vk-dark', className)}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-white/80 text-[10px] font-extrabold">VK</span>
        <span>
          Поделиться результатом в Истории ВК
          <span className="block text-xs font-normal text-white/85">{state.storyShared ? 'уже опубликовано · можно ещё раз' : '+100 Крафт-баллов · зови друзей в квест'}</span>
        </span>
      </button>
      {open &&
        createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()} className="relative flex max-h-full w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-paper">
              <div className="flex items-center justify-between border-b border-[#E7E8EC] px-4 py-3">
                <span className="text-[15px] font-semibold text-[#2C2D2E]">История ВКонтакте</span>
                <button onClick={() => setOpen(false)} className="text-vk-gray" aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 justify-center bg-[#F2F3F5] p-4">
                {img ? <img src={img} alt="Превью истории" className="max-h-[56vh] w-auto rounded-xl shadow-lg" /> : <Loader2 className="my-24 h-8 w-8 animate-spin text-vk" />}
              </div>
              <div className="space-y-2 p-4">
                {status === 'unsupported' && (
                  <div className="rounded-lg bg-vk-light px-3 py-2.5 text-sm text-[#2C2D2E]">
                    Истории публикуются из мобильного приложения ВКонтакте. Открой «Секретный код 1978» на телефоне, чтобы поделиться результатом.
                  </div>
                )}
                {status === 'done' ? (
                  <div className="flex items-center gap-2 rounded-lg bg-[#E8F5E8] px-3 py-2.5 text-sm font-semibold text-vk-green">
                    <Check className="h-5 w-5" />
                    {isInsideVK ? 'История опубликована!' : 'Демо: история «опубликована». Во ВКонтакте откроется редактор историй со ссылкой на мини-приложение.'}
                  </div>
                ) : (
                  <button onClick={publish} disabled={!img || status === 'sending' || status === 'unsupported'} className="flex w-full items-center justify-center gap-2 rounded-lg bg-vk py-3 text-[15px] font-semibold text-white hover:bg-vk-dark disabled:opacity-50">
                    {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isInsideVK ? 'Открыть редактор историй' : 'Опубликовать (демо вне ВК)'}
                  </button>
                )}
                <p className="text-center text-[11px] text-vk-gray">В истории — кнопка-ссылка на «Секретный код 1978». Каждый переход друга HR видит в воронке как vk_ref=story.</p>
              </div>
            </motion.div>
          </motion.div>,
          document.body,
        )}
    </>
  )
}
