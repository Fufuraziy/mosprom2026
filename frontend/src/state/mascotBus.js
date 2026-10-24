// Шина подсказок Крафти: игра сообщает об ошибке игрока → плавающая подсказка MascotNudge.
// Отдельный модуль, чтобы GameContext и компоненты не импортировали друг друга по кругу.
const listeners = new Set()
let last = { text: '', at: 0 }

/** Показать подсказку Крафти (повтор того же текста чаще раза в 4 с игнорируется). */
export function nudgeMascot(text, variant = 'hint') {
  const now = Date.now()
  if (!text || (text === last.text && now - last.at < 4000)) return
  last = { text, at: now }
  listeners.forEach((fn) => fn({ text, variant, id: now }))
}

export function onMascotNudge(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
