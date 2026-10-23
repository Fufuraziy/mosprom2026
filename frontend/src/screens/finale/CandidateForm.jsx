import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, ShieldCheck, Loader2 } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { api } from '../../services/api.js'
import { validateCandidate, ageFrom } from '../../services/localEngine.js'
import { VACANCY_OPTIONS, READINESS, UNIVERSITIES, STUDY_LEVELS } from '../../data/content.js'
import { Button, Card, cx } from '../../components/ui.jsx'

const today = new Date()
const max18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().slice(0, 10)

function Field({ label, error, required, children, hint }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-xs font-extrabold uppercase text-ink-mute">
        <span>
          {label} {required && <span className="text-brand">*</span>}
        </span>
        {hint && <span className="font-semibold normal-case">{hint}</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs font-bold text-brand-700">{error}</span>}
    </label>
  )
}

const inputCls = (err) =>
  cx('w-full rounded-xl border-2 bg-white px-3 py-2.5 text-[15px] font-semibold outline-none transition focus:border-ink focus:shadow-glow', err ? 'border-brand' : 'border-ink/25')

export default function CandidateForm({ suggestedVacancy, onSubmitted }) {
  const { state, balance, actions } = useGame()
  const [form, setForm] = useState({
    fio: '',
    phone: '',
    telegram: '',
    email: '',
    birth_date: '',
    vacancy: suggestedVacancy || '',
    readiness: '',
    university: '',
    study_level: '',
    specialty: '',
    consent: false,
  })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const age = ageFrom(form.birth_date)

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateCandidate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSending(true)
    try {
      const c = await api.submitCandidate({ form, telemetry: state.telemetry, points: state.points, session_id: state.sessionId })
      actions.setCandidate(c)
      onSubmitted?.(c)
    } catch (err) {
      setErrors(err.errors || { form: 'Не получилось отправить. Попробуй ещё раз.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-ink px-5 py-3 text-white">
        <div className="font-display font-black uppercase">Анкета кандидата · 18+</div>
        <span className="font-mono text-xs text-white/70">приложим твой игровой профиль: {balance} баллов</span>
      </div>
      <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <Field label="ФИО" required error={errors.fio}>
            <input className={inputCls(errors.fio)} value={form.fio} onChange={set('fio')} placeholder="Иванова Мария Сергеевна" autoComplete="name" />
          </Field>
        </div>
        <Field label="Телефон" error={errors.phone} hint="хотя бы один контакт">
          <input className={inputCls(errors.phone || errors.contact)} value={form.phone} onChange={set('phone')} placeholder="+7 900 000-00-00" inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Telegram" error={errors.telegram}>
          <input className={inputCls(errors.contact)} value={form.telegram} onChange={set('telegram')} placeholder="@username" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email" error={errors.email || errors.contact}>
            <input className={inputCls(errors.email || errors.contact)} value={form.email} onChange={set('email')} placeholder="name@mail.ru" inputMode="email" autoComplete="email" />
          </Field>
        </div>
        <Field label="Дата рождения" required error={errors.birth_date} hint={age != null && age >= 0 ? `${age} лет` : ''}>
          <input type="date" max={max18} className={inputCls(errors.birth_date)} value={form.birth_date} onChange={set('birth_date')} />
        </Field>
        <Field label="Интересующая вакансия" required error={errors.vacancy}>
          <select className={inputCls(errors.vacancy)} value={form.vacancy} onChange={set('vacancy')}>
            <option value="">Выбери…</option>
            {VACANCY_OPTIONS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Готовность выйти на работу" required error={errors.readiness}>
          <select className={inputCls(errors.readiness)} value={form.readiness} onChange={set('readiness')}>
            <option value="">Когда?</option>
            {READINESS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Курс / уровень">
          <select className={inputCls()} value={form.study_level} onChange={set('study_level')}>
            <option value="">—</option>
            {STUDY_LEVELS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Вуз или колледж" required error={errors.university}>
          <input className={inputCls(errors.university)} list="unis" value={form.university} onChange={set('university')} placeholder="Начни вводить…" />
          <datalist id="unis">
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
        <Field label="Специальность">
          <input className={inputCls()} value={form.specialty} onChange={set('specialty')} placeholder="Например, технология продуктов брожения" />
        </Field>
        <div className="sm:col-span-2">
          <label className={cx('flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-sm', errors.consent ? 'border-brand bg-brand-50' : 'border-ink/15')}>
            <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 h-4 w-4 accent-brand" />
            <span>
              Даю согласие АО «МПБК „Очаково“» на обработку персональных данных (152-ФЗ) для подбора на практику и стажировку, включая результаты игры. Подтверждаю, что мне есть 18 лет.
            </span>
          </label>
          {errors.consent && <span className="mt-1 block text-xs font-bold text-brand-700">{errors.consent}</span>}
        </div>
        {errors.form && <div className="text-sm font-bold text-brand-700 sm:col-span-2">{errors.form}</div>}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Отправить анкету в «Очаково»
          </Button>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
            <ShieldCheck className="h-4 w-4 text-lime" /> Принимаем на работу и практику строго с 18 лет
          </span>
        </div>
      </form>
    </Card>
  )
}

export function Submitted({ candidate }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-2 border-ink bg-lime/15 p-5">
      <div className="font-display text-xl font-black">Анкета у HR! Номер: {candidate.id.slice(-6).toUpperCase()}</div>
      <p className="mt-1 text-sm">
        Отдел подбора свяжется с тобой. Ниже — интерактивный справочник первого дня: маршрут, чек-лист заселения и все телефоны.
      </p>
    </motion.div>
  )
}
