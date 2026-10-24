// Код приглашения из ссылки друга: vk.com/app<ID>#ref=ref_… (или ?ref=ref_… вне ВК).
// Хэш занят роутером мини-приложения: «#ref=…» он принял бы за адрес экрана и показал «Страница не найдена».
// Поэтому при загрузке модуля (до создания роутера) забираем код и возвращаем хэш на главный экран.
const KEY = 'och_pending_ref'

function extract() {
  if (typeof window === 'undefined') return
  try {
    const { hash, search } = window.location
    const fromHash = hash.match(/[#&?]ref=(ref_[^&#/]+)/)
    const fromQuery = new URLSearchParams(search).get('ref')
    const code = fromHash ? decodeURIComponent(fromHash[1]) : fromQuery
    if (code && code.startsWith('ref_')) window.sessionStorage.setItem(KEY, code)
    if (fromHash) {
      // остаток хэша без ref (например, #/hub&ref=…) сохраняем, иначе — главный экран
      const rest = hash.replace(/[&?]?ref=ref_[^&#/]+/, '').replace(/^#$/, '')
      window.history.replaceState(null, '', `${window.location.pathname}${search}${rest.startsWith('#/') ? rest : '#/'}`)
    }
  } catch {
    /* ignore */
  }
}

extract()

/** Код приглашения, с которым открыли приложение (живёт до закрытия вкладки). */
export function getPendingRef() {
  try {
    return window.sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}
