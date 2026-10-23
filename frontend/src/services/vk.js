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

/** Вызывается один раз при старте приложения. */
export async function initVK() {
  if (!isInsideVK) return { ok: false, mode: 'browser' }
  try {
    await send('VKWebAppInit')
    return { ok: true, mode: 'vk' }
  } catch (e) {
    return { ok: false, mode: 'vk', error: String(e?.message || e) }
  }
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

export { bridge }
