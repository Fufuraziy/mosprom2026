import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Phone, Send, Mail, GraduationCap, Download, MessageCircleQuestion, AlertTriangle, Bot, Handshake, Moon, Loader2, CalendarDays, MessagesSquare } from 'lucide-react'
import { useGame } from '../../state/GameContext.jsx'
import { api } from '../../services/api.js'
import { BLOCKS, WHY_CARDS } from '../../data/content.js'
import { Button, Progress, cx } from '../../components/ui.jsx'
import { downloadText } from './HRPanel.jsx'
import Krafty from '../../components/Krafty.jsx'

function Ring({ value, label, color }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 84 84" className="h-20 w-20 -rotate-90">
        <circle cx="42" cy="42" r={r} stroke="#E8EBEC" strokeWidth="9" fill="none" />
        <motion.circle cx="42" cy="42" r={r} stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 0.8 }} />
      </svg>
      <div>
        <div className="font-display text-3xl font-extrabold leading-none">{value}</div>
        <div className="text-xs font-bold text-ink-mute">{label}</div>
      </div>
    </div>
  )
}

export default function Dossier({ candidate, onClose }) {
  const { toast } = useGame()
  const [d, setD] = useState(null)
  const [contact, setContact] = useState(false)
  const [exporting, setExporting] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    let alive = true
    api.dossier(candidate.id, candidate).then((x) => alive && setD(x))
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id])

  const c = candidate
  const color = d ? (d.retention_score >= 75 ? '#84BD00' : d.retention_score >= 60 ? '#A2AAAD' : '#D50032') : '#A2AAAD'

  const exportMira = async () => {
    setExporting(true)
    const r = await api.exportMirapolis(c.id, c)
    setExporting(false)
    toast(r.message || 'Профиль передан в Mirapolis', 'info')
  }

  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[720px] flex-col border-l-[3px] border-brand bg-cream"
        role="dialog"
        aria-label={`Досье: ${c.fio}`}
      >
        <div className="relative overflow-hidden bg-graphite px-5 py-4 text-white">
          <div className="halftone-red absolute inset-0 opacity-30" />
          <div className="relative flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-brand-300">
                <Bot className="h-4 w-4" /> Глубокое ИИ-досье · по игровой телеметрии
              </div>
              <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">{c.fio}</h2>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/80">
                <span>{c.age} лет</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" /> {c.university}
                  {c.study_level && `, ${c.study_level}`}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {c.readiness}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/60 hover:bg-white/10" aria-label="Закрыть">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!d ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="rounded-sm border border-line bg-white p-4 shadow-pop-sm">
              <div className="mb-1 font-mono text-[11px] font-bold uppercase text-brand">Резюме для рекрутера</div>
              <p className="text-sm leading-relaxed">{d.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full border border-ink/15 px-2 py-0.5" style={{ background: `${BLOCKS[c.block]?.color}22` }}>
                  {c.block_label}
                </span>
                <span className="rounded-full border border-ink/15 bg-cream px-2 py-0.5">Вакансия: {c.vacancy}</span>
                <span className="rounded-full border border-ink/15 bg-cream px-2 py-0.5">{c.points} баллов</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-line bg-white p-4">
                <div className="font-display font-extrabold">Прогноз удержания</div>
                <div className="mt-2">
                  <Ring value={d.retention_score} label="Retention Score / 100" color={color} />
                </div>
                <div className="mt-2 text-xs text-ink-soft">
                  Риск ухода в первые 3 месяца ≈ <b className="text-ink">{d.probation_dropout_risk}%</b> (база по компании 38%)
                </div>
              </div>
              <div className="rounded-sm border border-line bg-white p-4">
                <div className="font-display font-extrabold">Сменный график 2/2</div>
                <div className={cx('mt-3 flex items-center gap-2 rounded-sm p-3 text-sm font-bold', d.shift_readiness.level === 'full' ? 'bg-lime/15' : d.shift_readiness.level === 'day' ? 'bg-malt-light/40' : 'bg-brand-50')}>
                  <Moon className="h-5 w-5 shrink-0" /> {d.shift_readiness.label}
                </div>
                {d.calculator?.last && (
                  <div className="mt-2 text-xs text-ink-soft">
                    Калькулятор: {d.calculator.interactions} изменений, последний выбор — {d.calculator.last.nights} ночных/мес{d.calculator.last.dorm ? ', с общежитием' : ''}.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-line bg-white p-4">
              <div className="font-display font-extrabold">5 шкал компетенций из игры</div>
              <div className="mt-3 space-y-3">
                {d.competencies.map((m) => (
                  <div key={m.key}>
                    <div className="flex justify-between gap-3 text-xs font-bold">
                      <span>{m.label}</span>
                      <span className="font-mono">{m.value ?? 'н/д'}</span>
                    </div>
                    <Progress value={m.value ?? 0} className="mt-1" color={m.value >= 75 ? '#84BD00' : m.value >= 55 ? '#A2AAAD' : '#D50032'} />
                    <div className="mt-0.5 text-[11px] text-ink-mute">{m.source}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-line bg-white p-4">
              <div className="flex items-center gap-2 font-display font-extrabold">
                <MessageCircleQuestion className="h-5 w-5 text-brand" /> Что волнует перед выходом · шпаргалка
              </div>
              {d.asked_topics.length ? (
                <ul className="mt-3 space-y-2">
                  {d.asked_topics.map((t) => (
                    <li key={t.topic} className="rounded-sm bg-cream p-3 text-sm">
                      <div className="flex justify-between font-extrabold">
                        <span>{t.label}</span>
                        <span className="font-mono text-xs text-ink-mute">×{t.count}</span>
                      </div>
                      {t.tip && <div className="mt-0.5 text-xs text-ink-soft">{t.tip}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-mute">Кандидат не задавал вопросов маскоту.</p>
              )}
              {d.why_cards.length > 0 && (
                <div className="mt-3 text-xs text-ink-soft">
                  <b className="text-ink">Открытые аргументы «Почему ОЧАКОВО»:</b> {d.why_cards.map((id) => WHY_CARDS.find((w) => w.id === id)?.title).filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-line bg-kraft-light p-4">
                <div className="flex items-center gap-2 font-display font-extrabold">
                  <Handshake className="h-5 w-5 text-brand" /> Рекомендованный наставник
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Krafty size={46} mood="happy" />
                  <div>
                    <div className="font-extrabold">{d.mentor.name}</div>
                    <div className="text-xs text-ink-soft">
                      {d.mentor.role}, {d.mentor.age} лет · {d.mentor.exp}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-sm bg-white px-3 py-2 text-xs font-bold">Связь поколений: {d.mentor.bridge}</div>
                <div className="mt-1 text-[10px] text-ink-mute">демо-профиль наставника</div>
              </div>
              <div className="rounded-sm border border-line bg-white p-4">
                <div className="font-display font-extrabold">Мэтч вакансий</div>
                <div className="mt-2 space-y-2">
                  {d.matches.map((m) => (
                    <div key={m.id} className="text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="truncate pr-2">{m.title}</span>
                        <span className="font-mono">{m.match}%</span>
                      </div>
                      <Progress value={m.match} className="mt-1 h-1.5" color={BLOCKS[m.block]?.color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {d.risks.length > 0 && (
              <div className="rounded-sm border-2 border-brand bg-brand-50 p-4">
                <div className="flex items-center gap-2 font-display font-extrabold text-brand-700">
                  <AlertTriangle className="h-5 w-5" /> Зоны внимания
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {d.risks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {contact && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2 rounded-sm border border-line bg-white p-4 sm:grid-cols-3">
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 rounded-sm border-2 border-ink/15 p-3 text-sm font-bold hover:border-brand">
                    <Phone className="h-4 w-4 text-brand" /> {c.phone}
                  </a>
                )}
                {c.telegram && (
                  <a href={`https://t.me/${c.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-sm border-2 border-ink/15 p-3 text-sm font-bold hover:border-brand">
                    <Send className="h-4 w-4 text-brand" /> {c.telegram}
                  </a>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}?subject=${encodeURIComponent('Практика в ОЧАКОВО')}&body=${encodeURIComponent(`Здравствуйте, ${c.fio.split(' ')[1] || ''}! Спасибо за прохождение «Секретного кода 1978». Приглашаем вас на собеседование по вакансии «${c.vacancy}».`)}`}
                    className="flex items-center gap-2 rounded-sm border-2 border-ink/15 p-3 text-sm font-bold hover:border-brand"
                  >
                    <Mail className="h-4 w-4 text-brand" /> {c.email}
                  </a>
                )}
              </motion.div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t-[3px] border-brand bg-paper p-4">
          <Button onClick={() => setContact((v) => !v)}>
            <MessagesSquare className="h-4 w-4" /> Связаться с кандидатом
          </Button>
          <Button variant="light" onClick={exportMira} disabled={exporting || !d}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />} Экспорт в СДО Mirapolis
          </Button>
          <Button variant="light" onClick={() => downloadText(`dossier_${c.id}.csv`, api.csv([c]))}>
            <Download className="h-4 w-4" /> Скачать CSV
          </Button>
        </div>
      </motion.aside>
    </>,
    document.body,
  )
}
