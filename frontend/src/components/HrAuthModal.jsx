import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, ShieldCheck, X, AlertCircle, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react'
import { LogoPlate } from './ui.jsx'

/** Корпоративный ключ доступа HR (backend: HR_ACCESS_KEY). Для жюри хакатона он публичный — указан в README. */
export const HR_ACCESS_KEY = 'Ochakovo#HR525!'

export default function HrAuthModal({ isOpen, onClose, onSuccess, targetMode = 'hr' }) {
  const [login, setLogin] = useState('hr-kab1155@ochakovo.ru')
  const [key, setKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutTimer, setLockoutTimer] = useState(0)
  const inputRef = useRef(null)

  // Таймер защиты от брутфорса (30 секунд после 5 неверных попыток)
  useEffect(() => {
    let interval = null
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [lockoutTimer])

  useEffect(() => {
    if (isOpen) {
      setKey('')
      setError('')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLogin = async (keyToTry) => {
    if (lockoutTimer > 0) return

    const code = (keyToTry ?? key).trim()
    if (!code) {
      setError('Введите корпоративный ключ доступа')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onSuccess(code, login)
      setFailedAttempts(0)
    } catch (err) {
      const nextFails = failedAttempts + 1
      setFailedAttempts(nextFails)
      if (nextFails >= 5) {
        setLockoutTimer(30)
        setError('Превышено число неверных попыток (5). Защита активна: подождите 30 секунд.')
      } else {
        setError(
          err?.detail ||
            err?.errors?.key ||
            `Неверный корпоративный ключ доступа (${nextFails}/5 попыток)`
        )
      }
      setLoading(false)
    }
  }

  const handleQuickJuryLogin = () => {
    if (lockoutTimer > 0) return
    setLogin('hr-kab1155@ochakovo.ru')
    setKey('Ochakovo#HR525!')
    handleLogin('Ochakovo#HR525!')
  }

  const isLocked = lockoutTimer > 0

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Затемнение фона */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-graphite/80 backdrop-blur-sm"
        />

        {/* Окно авторизации */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg overflow-hidden border-2 border-brand bg-paper p-6 shadow-2xl sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-ink-soft hover:bg-paper hover:text-ink transition"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Заголовок */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex items-center gap-3">
              <LogoPlate className="h-10 w-auto" />
              <div className="h-8 w-px bg-line" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Lock className="h-5 w-5" />
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Служебный защищённый контур ОЧАКОВО
            </div>
            <h2 className="mt-1 text-lg font-bold leading-tight text-ink sm:text-xl">
              Корпоративный доступ: Отдел подбора и Учебный центр Очаково (Рябиновая, 44)
            </h2>
            <p className="mt-2 text-xs text-ink-soft sm:text-sm">
              Панель управления вакансиями, воронка кандидатов и аналитика наставничества защищены для сохранения персональных данных.
            </p>
          </div>

          {/* Предупреждение о блокировке брутфорса */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg border border-red-500 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2.5 font-bold"
            >
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                Включена защита от подбора ключей! Повторная попытка будет доступна через{' '}
                <span className="font-mono text-sm underline">{lockoutTimer}</span> сек.
              </div>
            </motion.div>
          )}

          {/* Форма входа */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="mt-5 space-y-3.5"
          >
            {/* Поле логина */}
            <div>
              <label htmlFor="hr-login" className="block text-xs font-bold uppercase tracking-wider text-ink">
                Корпоративный логин / email
              </label>
              <input
                id="hr-login"
                type="text"
                disabled={isLocked || loading}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="mt-1 w-full border-2 border-line bg-paper px-3.5 py-2 text-sm font-semibold text-ink focus:border-brand focus:bg-white focus:outline-none disabled:opacity-50"
              />
              <span className="text-[10px] text-ink-mute mt-0.5 block">
                Отдел подбора и Учебный центр (каб. 525)
              </span>
            </div>

            {/* Поле корпоративного ключа */}
            <div>
              <label htmlFor="hr-key" className="block text-xs font-bold uppercase tracking-wider text-ink">
                Корпоративный ключ безопасности
              </label>
              <div className="relative mt-1">
                <input
                  id="hr-key"
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLocked || loading}
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value)
                    setError('')
                  }}
                  placeholder="Введите ключ доступа..."
                  className="w-full border-2 border-line bg-paper pl-3.5 pr-10 py-2.5 font-mono text-sm font-bold text-ink focus:border-brand focus:bg-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-soft hover:text-ink transition"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

            {/* Кнопка войти */}
            <button
              type="submit"
              disabled={isLocked || loading || !key.trim()}
              className="w-full bg-graphite py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-ink active:scale-[0.99] disabled:opacity-40 rounded"
            >
              {loading ? 'Проверка ключа безопасности...' : 'Войти в защищённый контур'}
            </button>
          </form>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-line" />
            <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-ink-mute">
              Демо-режим для жюри
            </span>
          </div>

          {/* Плашка и кнопка 1-клик для экспертов жюри */}
          <div className="rounded-lg border border-brand/20 bg-malt-light/25 p-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-graphite">
              <KeyRound className="h-4 w-4 text-brand shrink-0" />
              <span>
                Для экспертов жюри «Открой#Моспром»: ключ доступа{' '}
                <strong className="font-mono text-brand select-all">Ochakovo#HR525!</strong>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-soft">
              (каб. 525 Учебного центра комбината Очаково, указан в README.md)
            </p>
          </div>

          <button
            type="button"
            onClick={handleQuickJuryLogin}
            disabled={isLocked || loading}
            className="mt-3 group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-brand via-brand-dark to-brand px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            <Zap className="h-4 w-4 text-malt-light transition group-hover:scale-125" />
            <span>⚡ Быстрый вход для Эксперта Жюри (1 клик)</span>
          </button>

          <div className="flex items-center justify-between pt-3">
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
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
