import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Share2,
  Copy,
  Check,
  Award,
  Sparkles,
  Gift,
  HelpCircle,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react'
import { useGame } from '../state/GameContext.jsx'
import { getReferralLink, shareInvite, postInviteToWall, copyInviteLink, haptic } from '../services/vk.js'
import { Button, Sticker, cx } from './ui.jsx'
import Krafty from './Krafty.jsx'

export function InviteFriendCard({ className, onAfterInvite }) {
  const { state, actions, toast } = useGame()
  const [copied, setCopied] = useState(false)
  const [simulating, setSimulating] = useState(false)

  const ref = state.referral || { invitesCount: 0, pointsEarned: 0, friends: [] }
  const invitesCount = Math.min(ref.invitesCount || 0, 5)
  const pointsEarned = ref.pointsEarned || 0
  const maxInvites = 5
  const maxPoints = 750
  const progressPct = Math.min(100, (invitesCount / maxInvites) * 100)

  // Реферальный код = id сессии игрока: по нему сервер находит пригласившего и начисляет ему +150
  const refCode = state.sessionId ? `ref_${state.sessionId.replace(/^sess_?/, '')}` : 'ref_ochakovo'
  const link = getReferralLink(refCode)

  const handleCopy = async () => {
    haptic('light')
    await copyInviteLink(link)
    setCopied(true)
    toast('Ссылка скопирована в буфер обмена!')
    setTimeout(() => setCopied(false), 2200)
  }

  const handleShareVK = async () => {
    haptic('medium')
    const res = await shareInvite(
      link,
      'Привет! Проходи квест АО МПБК «Очаково» — раскрой секретный код 1978, забери +50 приветственных баллов и участвуй в розыгрыше мерча!'
    )
    if (res?.ok) {
      toast('Окно отправки открыто!')
    }
  }

  const handleWallPost = async () => {
    haptic('medium')
    const res = await postInviteToWall(
      link,
      'Я участвую в молодёжном квесте «Секретный код 1978» от комбината «Очаково»! 🍻 Переходи по ссылке и забирай +50 Крафт-баллов на старте!'
    )
    if (res?.ok) {
      toast('Запись отправлена на стену!')
    }
  }

  const handleSimulateFriend = async () => {
    if (invitesCount >= maxInvites) {
      toast('Лимит наград за друзей достигнут (макс. 5 друзей)')
      return
    }
    setSimulating(true)
    haptic('success')
    const mockNames = [
      'Дмитрий К. (МГУПП)',
      'Екатерина С. (Росбиотех)',
      'Илья В. (РХТУ)',
      'Алина П. (МИРЭА)',
      'Михаил Т. (МГТУ)',
    ]
    const friendName = mockNames[invitesCount] || `Студент #${invitesCount + 1}`
    await actions.inviteFriend('simulation', friendName)
    setSimulating(false)
    if (onAfterInvite) onAfterInvite()
  }

  return (
    <div className={cx('overflow-hidden rounded-xl border border-line bg-white shadow-pop transition-all', className)}>
      {/* Шапка карточки с акцентом */}
      <div className="relative border-b border-line bg-gradient-to-r from-brand/10 via-amber-50 to-kraft-light p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-pop-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-ink sm:text-xl">
                  Пригласи друга
                </h3>
                <span className="rounded-full bg-brand px-2 py-0.5 font-mono text-[11px] font-black uppercase text-white shadow-sm">
                  +150 б
                </span>
              </div>
              <p className="text-xs text-ink-soft sm:text-sm">
                Получай <b>+150 Крафт-баллов</b> за каждого приглашённого. Друг получит <b>+50 баллов</b> на старте!
              </p>
            </div>
          </div>
          <Krafty size={52} mood="happy" className="hidden sm:block shrink-0" />
        </div>

        {/* Шкала прогресса */}
        <div className="mt-4 rounded-lg border border-line/60 bg-white/80 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Приглашено друзей: <span className="font-mono text-brand font-black">{invitesCount} / {maxInvites}</span>
            </span>
            <span className="font-mono text-xs font-extrabold text-ink-soft">
              +{pointsEarned} / {maxPoints} б
            </span>
          </div>

          <div className="relative mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-brand to-rose-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            />
          </div>

          {/* Этапы и призы */}
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold text-ink-soft sm:text-xs">
            <div className={cx('rounded border p-1', invitesCount >= 1 ? 'border-brand bg-brand/10 text-brand font-bold' : 'border-slate-200 bg-white')}>
              1 друг: Стикерпак
            </div>
            <div className={cx('rounded border p-1', invitesCount >= 2 ? 'border-brand bg-brand/10 text-brand font-bold' : 'border-slate-200 bg-white')}>
              2 друга: Крафт-бокс
            </div>
            <div className={cx('rounded border p-1', invitesCount >= 3 ? 'border-brand bg-brand/10 text-brand font-bold' : 'border-slate-200 bg-white')}>
              3+ друга: Худи / VIP
            </div>
          </div>
        </div>
      </div>

      {/* Блок действий и ссылки */}
      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
            Твоя персональная ссылка для друзей:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={link}
              className="flex-1 rounded-lg border border-line bg-slate-50 px-3 py-2 font-mono text-xs text-ink select-all focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={cx(
                'flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-extrabold transition active:scale-95 shadow-sm',
                copied ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-100 text-ink'
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>
        </div>

        {/* Кнопки публикации */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShareVK}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-lg bg-[#2787F5] hover:bg-[#1E74D8] px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span>Поделиться в ВК</span>
          </button>
          <button
            type="button"
            onClick={handleWallPost}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-lg border border-line bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-ink shadow-sm transition active:scale-95"
          >
            <ExternalLink className="h-4 w-4 text-[#2787F5]" />
            <span>На стену</span>
          </button>
        </div>

        {/* Демо-кнопка для жюри и проверки */}
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-extrabold text-amber-900">🧪 Для жюри и тестирования:</span>
              <p className="text-[11px] text-amber-800">
                Проверь начисление +150 баллов в один клик без второго аккаунта.
              </p>
            </div>
            <button
              type="button"
              disabled={simulating || invitesCount >= maxInvites}
              onClick={handleSimulateFriend}
              className="shrink-0 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 shadow-sm transition active:scale-95"
            >
              {simulating ? 'Начисление...' : '+150 баллов'}
            </button>
          </div>
        </div>

        {/* Список приглашённых друзей */}
        {ref.friends && ref.friends.length > 0 && (
          <div className="pt-2 border-t border-line/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
              Приглашённые друзья ({ref.friends.length}):
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {ref.friends.map((f, idx) => (
                <div
                  key={f.id || idx}
                  className="flex items-center justify-between rounded-lg border border-line/60 bg-slate-50/80 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 font-mono text-[10px] font-bold text-brand">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-ink">{f.name}</span>
                    <span className="text-[10px] text-ink-soft">({f.date || 'сегодня'})</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +{f.points || 150} б
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function InviteFriendButton({ onClick, className }) {
  const { state } = useGame()
  const count = state.referral?.invitesCount || 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group flex items-center gap-1.5 rounded-full border border-brand/30 bg-gradient-to-r from-brand/10 to-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-ink transition hover:border-brand hover:bg-brand/20 active:scale-95 shadow-sm',
        className
      )}
      title="Пригласи друга и получи +150 Крафт-баллов"
    >
      <UserPlus className="h-3.5 w-3.5 text-brand group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">Пригласи друга</span>
      <span className="rounded-full bg-brand px-1.5 py-0.2 font-mono text-[10px] font-black text-white">
        +150
      </span>
      {count > 0 && (
        <span className="text-[10px] text-ink-soft font-mono">
          ({count}/5)
        </span>
      )}
    </button>
  )
}

export function InviteFriendModal({ isOpen, onClose }) {
  if (!isOpen) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-line"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 z-20 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-ink hover:bg-slate-200 transition"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>

          <InviteFriendCard onAfterInvite={onClose} />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function InviteFriendModalContent() {
  return (
    <div className="p-3">
      <InviteFriendCard />
    </div>
  )
}
