import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, ShieldCheck, Loader2, BadgeCheck } from 'lucide-react'
import { getVKProfile } from '../../services/vk.js'
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
  cx('w-full rounded-sm border-2 bg-white px-3 py-2.5 text-[15px] font-semibold outline-none transition focus:border-brand focus:shadow-glow', err ? 'border-brand' : 'border-ink/25')

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
    vk_user_id: null,
    vk_source: null,
  })
  const [vk, setVk] = useState(null) // { source, profile, note }
  const [vkLoading, setVkLoading] = useState(false)

  const fillFromVK = async () => {
    setVkLoading(true)
    const r = await getVKProfile()
    setVkLoading(false)
    if (r.source === 'error') {
      setVk({ source: 'error', note: 'ВКонтакте не дал доступ к профилю. Заполни поля вручную.' })
      return
    }
    const p = r.profile
    setForm((f) => ({
      ...f,
      fio: [p.last_name, p.first_name].filter(Boolean).join(' '),
      birth_date: p.bdate_iso || f.birth_date,
      university: p.university || f.university,
      study_level: p.study_level || f.study_level,
      specialty: p.specialty || f.specialty,
      vk_user_id: p.id,
      vk_source: r.source,
    }))
    setErrors({})
    actions.setVkProfile(p, r.source)
    setVk({
      source: r.source,
      profile: p,
      note: !p.bdate_iso && r.source === 'vk' ? 'Год рождения скрыт в профиле ВК — укажи дату рождения вручную.' : null,
    })
  }
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
      const c = await api.submitCandidate({
        form,
        telemetry: { ...state.telemetry, tickets: state.tickets },
        tickets: state.tickets,
        points: state.points,
        session_id: state.sessionId,
      })
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-brand bg-graphite px-5 py-3 text-white">
        <div className="font-display font-extrabold uppercase">Анкета кандидата · 18+</div>
        <span className="font-mono text-xs text-white/70">приложим твой игровой профиль: {balance} баллов</span>
      </div>
      <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          {!vk || vk.source === 'error' ? (
            <button type="button" onClick={fillFromVK} disabled={vkLoading} className="flex w-full items-center justify-center gap-3 rounded-lg bg-vk px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-vk-dark disabled:opacity-60">
              {vkLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-[11px] font-extrabold text-vk">VK</span>}
              Заполнить анкету через ВКонтакте в 1 клик
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-vk/30 bg-vk-light px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-vk text-white">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#2C2D2E]">Данные синхронизированы через VK ID</div>
                <div className="text-xs text-vk-gray">
                  {vk.profile.first_name} {vk.profile.last_name}
                  {vk.profile.bdate_iso ? `, ${ageFrom(vk.profile.bdate_iso)} лет` : ''}
                  {vk.profile.university ? ` · ${vk.profile.university}` : vk.profile.city ? ` · ${vk.profile.city}` : ''}
                  {vk.source === 'vk' ? ` · vk.com/id${vk.profile.id}` : ' · демо-профиль вне ВКонтакте'}
                </div>
              </div>
              <button type="button" onClick={() => setVk(null)} className="text-xs font-semibold text-vk hover:underline">
                Изменить
              </button>
            </div>
          )}
          {vk?.note && <div className="mt-2 text-xs font-semibold text-brand-700">{vk.note}</div>}
          <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
            <span className="h-px flex-1 bg-line" /> или вручную <span className="h-px flex-1 bg-line" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Field label="ФИО" required error={errors.fio}>
            <input className={inputCls(errors.fio)} value={form.fio} onChange={set('fio')} placeholder="Иванова Мария Сергеевна" autoComplete="name" />
          </Field>
        </div>
        <Field label="Телефон" error={errors.phone} hint={form.vk_user_id ? 'контакт ВК уже есть' : 'хотя бы один контакт'}>
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
          <label className={cx('flex cursor-pointer items-start gap-3 rounded-sm border-2 p-3 text-sm', errors.consent ? 'border-brand bg-brand-50' : 'border-ink/15')}>
            <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 h-4 w-4 accent-brand" />
            <span>
              Даю согласие АО МПБК «ОЧАКОВО» на обработку персональных данных (152-ФЗ) для подбора на практику и стажировку, включая результаты игры. Подтверждаю, что мне есть 18 лет.
            </span>
          </label>
          {errors.consent && <span className="mt-1 block text-xs font-bold text-brand-700">{errors.consent}</span>}
        </div>
        {errors.form && <div className="text-sm font-bold text-brand-700 sm:col-span-2">{errors.form}</div>}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Отправить анкету в ОЧАКОВО
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-sm border border-line bg-lime/15 p-5">
      <div className="font-display text-xl font-extrabold">Анкета у HR! Номер: {candidate.id.slice(-6).toUpperCase()}</div>
      <p className="mt-1 text-sm">
        Отдел подбора свяжется с тобой. Ниже — интерактивный справочник первого дня: маршрут, чек-лист заселения и все телефоны.
      </p>
    </motion.div>
  )
}
