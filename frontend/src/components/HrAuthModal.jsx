import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Zap, ShieldCheck, X, AlertCircle } from 'lucide-react'
import { LogoPlate } from './ui.jsx'

export default function HrAuthModal({ isOpen, onClose, onSuccess, targetMode = 'hr' }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError('')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLogin = async (pinToTry) => {
    const code = (pinToTry ?? pin).trim()
    if (!code) {
      setError('Введите 4-значный код доступа')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSuccess(code)
    } catch (err) {
      setError(err?.detail || err?.errors?.pin || 'Неверный код доступа сотрудника HR Очаково')
      setLoading(false)
    }
  }

  const handleQuickJuryLogin = () => {
    setPin('1978')
    handleLogin('1978')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-graphite/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg overflow-hidden border-2 border-brand bg-white p-6 shadow-2xl sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-ink-soft hover:bg-paper hover:text-ink transition"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex items-center gap-3">
              <LogoPlate className="h-10 w-auto" />
              <div className="h-8 w-px bg-line" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Lock className="h-5 w-5" />
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Служебный защищённый контур
            </div>
            <h2 className="mt-1 text-lg font-bold leading-tight text-ink sm:text-xl">
              Корпоративный доступ: Отдел подбора и Учебный центр Очаково (Рябиновая, 44)
            </h2>
            <p className="mt-2 text-xs text-ink-soft sm:text-sm">
              Панель управления вакансиями, воронка кандидатов и аналитика наставничества защищены для сохранения персональных данных.
            </p>
          </div>

          {/* Prominent Hint for Jury */}
          <div className="mt-5 rounded-lg border border-brand/20 bg-malt-light/20 p-3.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-graphite">
              <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
              <span>🔑 Пин-код для экспертов и жюри «Открой#Моспром»: <strong className="font-mono text-base text-brand">1978</strong></span>
            </div>
            <p className="mt-1 text-[11px] text-ink-soft">
              (1978 — год основания комбината «Очаково» к Олимпиаде-80)
            </p>
          </div>

          {/* Quick Jury 1-Click Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleQuickJuryLogin}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-md bg-gradient-to-r from-brand via-brand-dark to-brand px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-malt-light transition group-hover:scale-125" />
              <span>⚡ Быстрый вход для Эксперта Жюри (1 клик)</span>
            </button>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-line" />
            <span className="absolute bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              или ручной ввод PIN
            </span>
          </div>

          {/* PIN Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="hr-pin" className="block text-xs font-bold uppercase tracking-wider text-ink">
                4-значный PIN сотрудника
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="hr-pin"
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value)
                    setError('')
                  }}
                  placeholder="••••"
                  className="w-full border-2 border-line bg-paper px-4 py-2.5 font-mono text-center text-xl font-bold tracking-[0.4em] text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !pin.trim()}
                  className="shrink-0 bg-graphite px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-ink active:scale-95 disabled:opacity-40"
                >
                  {loading ? 'Проверка...' : 'Войти'}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs font-bold text-brand"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-ink-soft hover:text-ink underline underline-offset-2"
              >
                ← Вернуться в режим студента
              </button>
              <span className="text-[11px] text-ink-mute">
                Очаково 1978 · Инфозащита
              </span>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
