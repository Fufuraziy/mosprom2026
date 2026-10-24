// Маршруты VK Mini App (hash-роутер: https://vk.com/app<ID>#/hub открывает карту станций).
// Карта экранов и решения — frontend/docs/vk-miniapp/03-screen-map.md.
import { createHashRouter, createPanel, createRoot, createView, RoutesConfig } from '@vkontakte/vk-mini-apps-router'

export const ROOT = 'root'

/** Разделы нижней панели (Epic → View). */
export const VIEW = {
  QUEST: 'quest',
  REWARDS: 'rewards',
  MASCOT: 'mascot',
  PROFILE: 'profile',
}

/** Экраны (Panel). id уникальны во всём приложении. */
export const PANEL = {
  HOME: 'home',
  STORY: 'story',
  WHY: 'why',
  VALUES: 'values',
  LOCKER: 'locker',
  HUB: 'hub',
  STATION: 'station',
  CAPSULE: 'capsule',
  VERDICT: 'verdict',
  SALARY: 'salary',
  MERCH: 'merch',
  APPLY: 'apply',
  APPLIED: 'applied',
  CHAT: 'chat',
  ME: 'me',
  ABOUT: 'about',
}

/** Модальные окна (без собственного адреса: navigator.showModal(id), «назад» закрывает). */
export const MODAL = {
  AGE: 'age_gate',
  STORY_SHARE: 'story_share',
}

export const PATH = {
  [PANEL.HOME]: '/',
  [PANEL.STORY]: '/story',
  [PANEL.WHY]: '/why',
  [PANEL.VALUES]: '/values',
  [PANEL.LOCKER]: '/locker',
  [PANEL.HUB]: '/hub',
  [PANEL.STATION]: '/station/:id',
  [PANEL.CAPSULE]: '/capsule',
  [PANEL.VERDICT]: '/rewards',
  [PANEL.SALARY]: '/rewards/salary',
  [PANEL.MERCH]: '/rewards/merch',
  [PANEL.APPLY]: '/rewards/apply',
  [PANEL.APPLIED]: '/rewards/applied',
  [PANEL.CHAT]: '/mascot',
  [PANEL.ME]: '/profile',
  [PANEL.ABOUT]: '/profile/about',
}

export const stationPath = (id) => `/station/${id}`

const panel = (id) => createPanel(id, PATH[id], [])

export const routes = RoutesConfig.create([
  createRoot(ROOT, [
    createView(VIEW.QUEST, [
      panel(PANEL.HOME),
      panel(PANEL.STORY),
      panel(PANEL.WHY),
      panel(PANEL.VALUES),
      panel(PANEL.LOCKER),
      panel(PANEL.HUB),
      createPanel(PANEL.STATION, PATH[PANEL.STATION], [], ['id']),
      panel(PANEL.CAPSULE),
    ]),
    createView(VIEW.REWARDS, [panel(PANEL.VERDICT), panel(PANEL.SALARY), panel(PANEL.MERCH), panel(PANEL.APPLY), panel(PANEL.APPLIED)]),
    createView(VIEW.MASCOT, [panel(PANEL.CHAT)]),
    createView(VIEW.PROFILE, [panel(PANEL.ME), panel(PANEL.ABOUT)]),
  ]),
])

export const router = createHashRouter(routes.getRoutes())

/** Порядок панелей внутри View = порядок переходов (нужно для правильной анимации VKUI). */
export const VIEW_PANELS = {
  [VIEW.QUEST]: [PANEL.HOME, PANEL.STORY, PANEL.WHY, PANEL.VALUES, PANEL.LOCKER, PANEL.HUB, PANEL.STATION, PANEL.CAPSULE],
  [VIEW.REWARDS]: [PANEL.VERDICT, PANEL.SALARY, PANEL.MERCH, PANEL.APPLY, PANEL.APPLIED],
  [VIEW.MASCOT]: [PANEL.CHAT],
  [VIEW.PROFILE]: [PANEL.ME, PANEL.ABOUT],
}

/** На этих экранах нижняя панель скрыта: игра, ввод кода, анкета — ничего не должно отвлекать. */
export const NO_TABBAR = new Set([PANEL.LOCKER, PANEL.STATION, PANEL.CAPSULE, PANEL.APPLY])

/**
 * Старый API игры actions.go(screen, stationId) → адрес экрана.
 * finale: до открытия капсулы — ввод кода, после — награды.
 */
export function pathForScreen(screen, stationId, state) {
  switch (screen) {
    case 'locker':
      return PATH[PANEL.LOCKER]
    case 'hub':
      return PATH[PANEL.HUB]
    case 'station':
      return stationPath(stationId)
    case 'finale':
      return state?.capsuleOpened ? PATH[PANEL.VERDICT] : PATH[PANEL.CAPSULE]
    case 'rewards':
      return PATH[PANEL.VERDICT]
    case 'apply':
      return PATH[PANEL.APPLY]
    default:
      return PATH[PANEL.HOME]
  }
}
