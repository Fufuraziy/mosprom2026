import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronLeft, MoreHorizontal, Smartphone } from 'lucide-react'

/** Верхняя панель мини-приложения, как в клиенте ВКонтакте (только для предпросмотра в рамке). */
export function VkMiniAppBar({ onBack }) {
  return (
    <div className="relative z-50 flex h-11 items-center gap-2 border-b border-[#E7E8EC] bg-white px-2">
      <button onClick={onBack} className="grid h-8 w-8 place-items-center text-vk" aria-label="Назад">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div className="flex-1 truncate text-center text-[15px] font-semibold text-[#2C2D2E]">Секретный код 1978</div>
      <div className="flex h-8 items-center gap-2 rounded-full border border-[#DCE1E6] px-2.5 text-[#2C2D2E]">
        <MoreHorizontal className="h-4 w-4" />
        <span className="h-4 w-px bg-[#DCE1E6]" />
        <X className="h-4 w-4" />
      </div>
    </div>
  )
}

/** Предпросмотр VK Mini App на десктопе: то же приложение в iframe шириной телефона. */
export default function PhoneFrame({ onClose }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const src = `${window.location.pathname}?vk_frame=1`
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center gap-10 bg-graphite/90 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="hidden max-w-xs text-white xl:block" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
          <Smartphone className="h-4 w-4" /> VK Mini App · предпросмотр
        </div>
        <div className="mt-3 font-display text-3xl uppercase leading-tight">
          <span className="font-light">Так игра выглядит </span>
          <span className="font-extrabold">во ВКонтакте</span>
        </div>
        <p className="mt-3 text-sm text-white/80">
          Это то же приложение в ширине телефона. Прогресс общий: пройдите станцию в рамке — баллы и цифры кода обновятся и в основном окне. Внутри ВК сработают VKWebAppGetUserInfo и VKWebAppShowStoryBox, здесь — их демо-версии.
        </p>
        <button onClick={onClose} className="mt-6 border border-white/70 px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-white/10">
          Закрыть (Esc)
        </button>
      </div>
      <motion.div
        initial={{ y: 30, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative h-[min(844px,calc(100vh-48px))] w-[min(390px,calc(100vw-32px))] shrink-0 overflow-hidden rounded-[46px] border-[10px] border-[#1d1d1f] bg-white shadow-2xl"
      >
        <div className="absolute left-1/2 top-1.5 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-[#1d1d1f]" />
        <iframe title="VK Mini App: Секретный код 1978" src={src} className="absolute inset-x-0 bottom-0 top-8 h-[calc(100%-32px)] w-full" />
      </motion.div>
      <button onClick={onClose} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/60 text-white xl:hidden" aria-label="Закрыть">
        <X className="h-5 w-5" />
      </button>
    </motion.div>,
    document.body,
  )
}
