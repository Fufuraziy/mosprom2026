// Локальная логика ВК-бота сообщества «ОЧАКОВО: Карьера и практика».
// На проде бот живёт на бэкенде (VK Callback API / Long Poll) и отвечает теми же сообщениями;
// здесь — встроенный движок для симулятора и автономного режима.
import { mascotReply, buildRecommendation, buildDossier } from './localEngine.js'
import { STATIONS, TOPIC_LABELS } from '../data/content.js'

// Цвета кнопок клавиатуры ВК-бота: primary | secondary | positive | negative
const B = (label, payload, color = 'secondary') => ({ label, payload, color })

export const MAIN_KEYBOARD = [
  [B('Запустить Mini App «Код 1978»', 'open_app', 'primary')],
  [B('Общежитие за 3 400 ₽', 'dorm'), B('Сессия на заводе', 'session')],
  [B('Зарплата и график', 'salary'), B('Вакансии', 'vacancies')],
  [B('Подписаться на уведомления', 'subscribe', 'positive')],
]

const INVITE_KEYBOARD = [
  [B('Записаться на собеседование', 'iv_yes', 'positive')],
  [B('Задать вопрос HR', 'iv_question'), B('Позже', 'iv_later')],
]

const MINIAPP = { type: 'miniapp', title: 'Секретный код 1978', sub: 'Мини-приложение · 4 станции · мерч за баллы' }

function progressLine(ctx) {
  const done = ctx.stationsDone || 0
  if (!done) return 'Ты ещё не начинал(а) квест — первая станция ждёт.'
  if (done < 4) return `У тебя уже ${done} из 4 цифр кода и ${ctx.points} Крафт-баллов.`
  return ctx.capsuleOpened ? 'Капсула 1978 уже открыта — осталось забрать награды.' : 'Все 4 цифры собраны — открой капсулу!'
}

/**
 * Ответ бота на кнопку (payload) или свободный текст.
 * ctx: { stationsDone, points, capsuleOpened, hasCandidate }
 * Возвращает массив сообщений: { from: 'bot', text, keyboard?, attachment? }.
 */
export function botRespond({ payload, text }, ctx = {}) {
  const p = payload || ''
  if (p === 'start' || /^(начать|старт|привет|start)$/i.test((text || '').trim())) {
    return [
      {
        from: 'bot',
        text:
          'Привет! Это ОЧАКОВО — компания натуральных напитков. Мы берём студентов 18+ на оплачиваемую практику: розлив и техцех от 70 000 ₽, лаборатория от 60 000 ₽, склад от 56 000 ₽. Без испытательного срока, с общежитием в Москве и наставником.\n\nХочешь проверить себя? Запусти мини-игру «Секретный код 1978»: 15 минут, 4 станции, мерч за баллы.',
        attachment: MINIAPP,
        keyboard: MAIN_KEYBOARD,
      },
    ]
  }
  if (p === 'open_app' || p === 'continue') {
    return [{ from: 'bot', text: `Открываю мини-приложение. ${progressLine(ctx)}`, attachment: MINIAPP, keyboard: MAIN_KEYBOARD }]
  }
  if (p === 'subscribe') {
    return [
      {
        from: 'bot',
        text: 'Готово, подписка оформлена ✅ Будем присылать: старт сезонного набора, приглашения на экскурсии, итоги розыгрыша мерча и сообщения от HR. Отписаться можно словом «Стоп».',
        keyboard: MAIN_KEYBOARD,
      },
    ]
  }
  const faqMap = { dorm: 'Как с общежитием?', session: 'А если сессия?', salary: 'Сколько платят и какой график?', vacancies: 'Какие есть вакансии?' }
  if (faqMap[p]) {
    const r = mascotReply(faqMap[p])
    return [{ from: 'bot', text: r.reply, topic: r.topic, keyboard: MAIN_KEYBOARD }]
  }
  if (p === 'iv_yes') {
    return [
      {
        from: 'bot',
        text: 'Записали тебя на собеседование: 28 октября, 11:00, Москва, ул. Рябиновая, 44, Учебный центр (каб. 525). Возьми паспорт — пропуск закажем на проходной. Корпоративный автобус ходит от м. Озёрная. До встречи!',
        keyboard: MAIN_KEYBOARD,
      },
    ]
  }
  if (p === 'iv_question') {
    return [{ from: 'bot', text: 'Напиши свой вопрос одним сообщением — рекрутер ответит в течение рабочего дня. На частые вопросы отвечу сразу: общежитие, сессия, зарплата, военкомат.', keyboard: MAIN_KEYBOARD }]
  }
  if (p === 'iv_later') {
    return [{ from: 'bot', text: 'Хорошо, напомним через неделю. Если появятся вопросы — пиши сюда в любое время.', keyboard: MAIN_KEYBOARD }]
  }
  if (p === 'season_yes' || p === 'excursion_yes') {
    return [{ from: 'bot', text: 'Отлично, записали! За день до даты пришлём напоминание и схему проезда до ул. Рябиновая, 44.', keyboard: MAIN_KEYBOARD }]
  }
  if (p === 'stop') return [{ from: 'bot', text: 'Отписали от рассылки. Вернуться можно кнопкой «Начать».', keyboard: [[B('Начать', 'start', 'primary')]] }]
  if (/^стоп$/i.test((text || '').trim())) return botRespond({ payload: 'stop' }, ctx)

  const r = mascotReply(text || '')
  return [{ from: 'bot', text: r.reply, topic: r.topic, keyboard: MAIN_KEYBOARD }]
}

/** Пуш-сценарии рассылки бота (для демонстрации жюри). */
export const PUSH_SCENARIOS = [
  { id: 'abandoned', title: 'Брошенная игра → напоминание', sub: 'через 24 ч после последнего действия' },
  { id: 'season', title: 'Старт сезонного набора', sub: 'март: кратный рост штата' },
  { id: 'excursion', title: 'Приглашение на экскурсию', sub: 'музей и производство' },
  { id: 'raffle', title: 'Итоги розыгрыша мерча', sub: 'держателям билетов' },
]

export function pushMessage(id, ctx = {}) {
  if (id === 'abandoned') {
    const done = ctx.stationsDone || 0
    const next = STATIONS[Math.min(done, 3)]
    const text =
      done >= 4
        ? `Капсула ждёт! ${ctx.capsuleOpened ? 'Ты уже открыл(а) её — осталось заполнить анкету, чтобы билеты на мерч участвовали в розыгрыше.' : 'Все 4 цифры собраны, осталось ввести код 1978.'}`
        : `Ты остановился(-ась) на станции ${done + 1}: «${next.title}». До капсулы 1978 осталось ${4 - done} ${4 - done === 1 ? 'цифра' : 'цифры'}, а за станцию дают до 250 баллов. Продолжим?`
    return { from: 'bot', kind: 'push', text, keyboard: [[B('Продолжить игру', 'continue', 'primary')], [B('Позже', 'iv_later')]] }
  }
  if (id === 'season') {
    return {
      from: 'bot',
      kind: 'push',
      text: 'С 1 марта стартует набор на оплачиваемую практику! Цех розлива и техцех — от 70 000 ₽, лаборатория — от 60 000 ₽, склад — от 56 000 ₽. Общежитие 3 400 ₽, обед за 50%, сессию можно сдавать прямо на заводе. Записать тебя?',
      keyboard: [[B('Записаться', 'season_yes', 'positive'), B('Вакансии', 'vacancies')]],
    }
  }
  if (id === 'excursion') {
    return {
      from: 'bot',
      kind: 'push',
      text: 'Приглашаем на экскурсию в музей ОЧАКОВО и на производство: ЛЭП, линии розлива, дегустация безалкогольных новинок. Суббота, 12:00, ул. Рябиновая, 44. Только 18+, с паспортом.',
      keyboard: [[B('Иду!', 'excursion_yes', 'positive'), B('Другая дата', 'iv_later')]],
    }
  }
  return {
    from: 'bot',
    kind: 'push',
    text: ctx.tickets
      ? `Итоги розыгрыша мерча 🎁 Твоих билетов: ${ctx.tickets}. Победителей определим в прямом эфире сообщества в пятницу в 18:00 — включай уведомления!`
      : 'Итоги розыгрыша мерча подведём в пятницу в 18:00. Ещё не участвуешь? Пройди «Секретный код 1978» и обменяй баллы на билеты.',
    keyboard: [[B('Открыть Mini App', 'open_app', 'primary')]],
  }
}

/** Персональное ИИ-приглашение от HR на основе игровой телеметрии кандидата. */
export function inviteDraft(candidate) {
  const d = buildDossier(candidate)
  const c = d.candidate
  const name = c.fio.split(' ')[1] || c.fio.split(' ')[0]
  const rec = buildRecommendation(c.telemetry || {})
  const top = d.matches[0]
  const strengths = rec.strengths.length ? `особенно ${rec.strengths.slice(0, 2).join(' и ')}` : 'отличный результат'
  const tips = {
    dorm: 'Ты спрашивал(а) про общежитие — место на Рябиновой, 36к2 за 3 400 ₽ забронируем.',
    session: 'Про сессию не переживай: на дни экзаменов смены не ставим.',
    military: 'Вопрос с военкоматом решаем через отдел кадров — всё расскажем.',
    salary: 'По деньгам: от 70 000 ₽, выплаты 12 и 27 числа.',
    schedule: 'График 2/2 покажем вживую, ночные оплачиваются дороже.',
    transport: 'От м. Озёрная ходит наш корпоративный автобус.',
  }
  const tip = d.asked_topics.map((t) => tips[t.topic]).find(Boolean)
  return {
    text:
      `${name}, привет! Это HR ОЧАКОВО 👋 Ты прошёл(-ла) «Секретный код 1978» на ${c.points} баллов — ${strengths}. ` +
      `ИИ-наставник видит в тебе «${d.archetype.name}», а это ${top.match}% совпадения с вакансией «${top.title}». ` +
      `Приглашаем познакомиться: 28 октября, 11:00, ул. Рябиновая, 44 (Учебный центр, каб. 525). ` +
      (tip ? tip + ' ' : '') +
      `Твоим наставником будет ${d.mentor.name} (${d.mentor.role}). Записать тебя?`,
    based_on: [
      `${c.points} баллов`,
      `архетип «${d.archetype.name}»`,
      `мэтч ${top.match}%`,
      ...d.asked_topics.slice(0, 2).map((t) => `вопрос: ${TOPIC_LABELS[t.topic]?.toLowerCase() || t.topic}`),
    ],
    keyboard: INVITE_KEYBOARD,
    source: 'local',
  }
}

export { INVITE_KEYBOARD }
