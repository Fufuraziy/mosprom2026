// Обёртка над @vkontakte/vk-bridge для VK Mini App «Секретный код 1978».
//
// Внутри ВКонтакте (мобильное приложение, vk.com, m.vk.com) методы идут в настоящий VK Bridge.
// В обычном браузере (жюри открыло прямую ссылку) ничего не ломается: методы возвращают
// демо-ответы той же формы, а интерфейс помечает их как демо.
import bridge from '@vkontakte/vk-bridge'

export const VK_APP_ID = import.meta.env?.VITE_VK_APP_ID || ''
export const VK_GROUP_ID = Number(import.meta.env?.VITE_VK_GROUP_ID || 0)
export const VK_APP_URL = VK_APP_ID ? `https://vk.com/app${VK_APP_ID}` : 'https://vk.com/ochakovo'

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

/**
 * Запущены ли мы внутри ВКонтакте.
 * VK всегда передаёт параметры запуска (vk_app_id, vk_user_id, sign) в URL мини-приложения.
 * Одной проверки bridge.isEmbedded() мало: она true и в нашей собственной «рамке телефона» (iframe).
 */
export const isInsideVK = Boolean(params.get('vk_app_id') && params.get('sign')) || Boolean(bridge.isWebView?.())

/**
 * Строка запуска для бэкенда (заголовок X-VK-Launch-Params): бэкенд проверяет подпись sign
 * «Защищённым ключом» приложения и только тогда доверяет vk_user_id. Вне ВК — пусто.
 */
export const launchQuery = params.get('sign') ? window.location.search.replace(/^\?/, '') : ''

export const launchParams = {
  vk_user_id: params.get('vk_user_id'),
  vk_app_id: params.get('vk_app_id'),
  vk_platform: params.get('vk_platform'),
  vk_ref: params.get('vk_ref'),
}

function withTimeout(promise, ms = 4000) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('VK Bridge timeout')), ms))])
}

async function send(method, payload) {
  return withTimeout(bridge.send(method, payload))
}

let initPromise = null

/** VKWebAppInit — один раз при старте (main.jsx вызывает до рендера, повторные вызовы получают тот же результат). */
export function initVK() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    if (!isInsideVK) return { ok: false, mode: 'browser' }
    try {
      await send('VKWebAppInit')
      return { ok: true, mode: 'vk' }
    } catch (e) {
      return { ok: false, mode: 'vk', error: String(e?.message || e) }
    }
  })()
  return initPromise
}

/** «D.M.YYYY» → «YYYY-MM-DD»; «D.M» (год скрыт) → null. */
export function bdateToISO(bdate) {
  if (!bdate) return null
  const [d, m, y] = bdate.split('.')
  if (!y) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function demoBirthDate() {
  // демо-профилю всегда ровно 21 год: дата рождения — 21 год и ~7 месяцев назад
  const d = new Date()
  d.setFullYear(d.getFullYear() - 21)
  d.setMonth(d.getMonth() - 7)
  return d.toISOString().slice(0, 10)
}

export const DEMO_VK_PROFILE = {
  id: 'demo', // вне ВК реального id нет — не показываем ссылку на чужой профиль
  first_name: 'Алексей',
  last_name: 'Смирнов',
  bdate_iso: demoBirthDate(),
  city: 'Москва',
  university: 'Росбиотех (МГУПП)',
  study_level: '4 курс',
  specialty: 'Технология продуктов брожения',
}

/**
 * Данные профиля для автозаполнения анкеты.
 * Возвращает { source: 'vk' | 'demo', profile: {...} }.
 * Через VKWebAppGetUserInfo доступны имя, фамилия, дата рождения и город; вуз в этом методе не приходит,
 * его подставляем только в демо-профиле.
 */
export async function getVKProfile() {
  if (isInsideVK) {
    try {
      const u = await send('VKWebAppGetUserInfo')
      return {
        source: 'vk',
        profile: {
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          bdate_raw: u.bdate || null,
          bdate_iso: bdateToISO(u.bdate),
          city: u.city?.title || '',
          photo: u.photo_200 || u.photo_100 || null,
          university: '',
        },
      }
    } catch (e) {
      return { source: 'error', error: String(e?.message || e) }
    }
  }
  await new Promise((r) => setTimeout(r, 700)) // имитация окна разрешения ВК
  return { source: 'demo', profile: { ...DEMO_VK_PROFILE } }
}

/**
 * Публикация истории. blob — dataURL картинки 1080×1920.
 * Возвращает { source: 'vk' | 'demo', ok }.
 */
export async function shareStory(blob) {
  if (isInsideVK) {
    // VKWebAppShowStoryBox поддерживается только в мобильных приложениях ВК, не на vk.com
    const supported = await withTimeout(bridge.supportsAsync?.('VKWebAppShowStoryBox') ?? Promise.resolve(true), 3000).catch(() => false)
    if (!supported) return { source: 'unsupported', ok: false }
    try {
      await send('VKWebAppShowStoryBox', {
        background_type: 'image',
        blob,
        attachment: { text: 'go_to', type: 'url', url: VK_APP_URL },
      })
      return { source: 'vk', ok: true }
    } catch (e) {
      // пользователь закрыл редактор историй — это не ошибка приложения
      return { source: 'vk', ok: false, error: String(e?.error_data?.error_reason || e?.message || e) }
    }
  }
  return { source: 'demo', ok: true }
}

/** Разрешение сообществу писать пользователю (подписка на пуши ВК-бота). */
export async function allowBotMessages() {
  if (isInsideVK && VK_GROUP_ID) {
    try {
      await send('VKWebAppAllowMessagesFromGroup', { group_id: VK_GROUP_ID, key: 'code1978' })
      return { source: 'vk', ok: true }
    } catch (e) {
      return { source: 'vk', ok: false, error: String(e?.message || e) }
    }
  }
  return { source: 'demo', ok: true }
}

/**
 * Виброотклик (Taptic Engine / вибромотор). kind: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy'.
 * Вне ВК и на платформах без вибрации — тихо ничего не делает.
 */
export function haptic(kind = 'light') {
  if (!isInsideVK) return
  const notify = kind === 'success' || kind === 'error' || kind === 'warning'
  const p = notify ? bridge.send('VKWebAppTapticNotificationOccurred', { type: kind }) : bridge.send('VKWebAppTapticImpactOccurred', { style: kind })
  p.catch(() => {})
}

/**
 * Приложение свернули / развернули: VKWebAppViewHide / VKWebAppViewRestore внутри ВК, visibilitychange в браузере.
 * Мини-игры слушают window-событие 'och:pause' и ставят таймеры на паузу (правило ВК 2.2.5).
 */
let viewEventsOn = false
export function listenViewEvents() {
  if (viewEventsOn || typeof window === 'undefined') return
  viewEventsOn = true
  const fire = (name) => window.dispatchEvent(new Event(name))
  bridge.subscribe(({ detail }) => {
    if (detail?.type === 'VKWebAppViewHide') fire('och:pause')
    if (detail?.type === 'VKWebAppViewRestore') fire('och:resume')
  })
  document.addEventListener('visibilitychange', () => fire(document.hidden ? 'och:pause' : 'och:resume'))
}

/* ------------------------------------------------------------------ VK Storage */
// Прогресс игры хранится в ВК (правило 2.3.8: одинаковый прогресс на всех устройствах; localStorage в WebView ненадёжен).
// Лимиты: значение ≤ 4096 символов (сериализованная строка ≤ 2236), ≤ 1000 ключей, ≤ 1000 вызовов в час.
const ST_PREFIX = 'g1978_'
const ST_CHUNK = 2000
export const vkStorageEnabled = isInsideVK

export async function storageLoad() {
  if (!vkStorageEnabled) return null
  try {
    const meta = await send('VKWebAppStorageGet', { keys: [ST_PREFIX + 'meta'] })
    const raw = meta?.keys?.[0]?.value
    if (!raw) return null
    const { n, savedAt } = JSON.parse(raw)
    const keys = Array.from({ length: n }, (_, i) => ST_PREFIX + i)
    const r = await send('VKWebAppStorageGet', { keys })
    const map = Object.fromEntries((r?.keys || []).map((k) => [k.key, k.value]))
    const json = keys.map((k) => map[k] || '').join('')
    return { state: JSON.parse(json), savedAt }
  } catch {
    return null // новый пользователь (пустая строка) или ошибка — играем с локальным состоянием
  }
}

export async function storageSave(obj) {
  if (!vkStorageEnabled) return
  const json = JSON.stringify(obj)
  const parts = []
  for (let i = 0; i < json.length; i += ST_CHUNK) parts.push(json.slice(i, i + ST_CHUNK))
  try {
    for (let i = 0; i < parts.length; i++) await send('VKWebAppStorageSet', { key: ST_PREFIX + i, value: parts[i] })
    await send('VKWebAppStorageSet', { key: ST_PREFIX + 'meta', value: JSON.stringify({ n: parts.length, savedAt: obj.savedAt || Date.now() }) })
  } catch {
    /* flood control или сеть — сохраним в следующий раз */
  }
}

/* ------------------------------------------------------------------ Приглашение друга (VK Share / Wall / Link) */

export function getReferralLink(refCode) {
  if (typeof window === 'undefined') return ''
  const code = refCode || 'ref_guest'
  if (VK_APP_ID) {
    return `https://vk.com/app${VK_APP_ID}#ref=${encodeURIComponent(code)}`
  }
  const url = new URL(window.location.href)
  url.searchParams.set('ref', code)
  return url.toString()
}

export async function shareInvite(link, text = 'Привет! Пройди квест комбината «Очаково» — получи +50 приветственных Крафт-баллов и выиграй фирменный мерч!') {
  if (isInsideVK) {
    try {
      await send('VKWebAppShare', { link })
      return { ok: true, source: 'vk' }
    } catch (e) {
      return { ok: false, source: 'vk', error: String(e?.message || e) }
    }
  }
  if (typeof navigator !== 'undefined' && navigator?.share) {
    try {
      await navigator.share({ title: 'Очаково: Секретный код 1978', text, url: link })
      return { ok: true, source: 'navigator' }
    } catch (e) {
      if (e?.name === 'AbortError') return { ok: false, canceled: true }
    }
  }
  return copyInviteLink(link)
}

export async function postInviteToWall(link, message = 'Я участвую в квесте «Секретный код 1978» от АО МПБК «Очаково»! 🍻 Переходи по ссылке и забирай +50 Крафт-баллов на старте!') {
  if (isInsideVK) {
    try {
      await send('VKWebAppShowWallPostBox', { message, attachments: link })
      return { ok: true, source: 'vk' }
    } catch (e) {
      return { ok: false, source: 'vk', error: String(e?.message || e) }
    }
  }
  return { ok: true, source: 'demo' }
}

export async function copyInviteLink(link) {
  if (isInsideVK) {
    try {
      await send('VKWebAppCopyText', { text: link })
      return { ok: true, source: 'vk' }
    } catch {
      /* fallback to clipboard */
    }
  }
  if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(link)
      return { ok: true, source: 'clipboard' }
    } catch {
      /* fallback */
    }
  }
  return { ok: true, source: 'fallback' }
}

export { bridge }
