// Провайдеры VKUI для мини-приложения: тема и платформа из ВКонтакте, безопасные зоны, адаптивность, роутер.
// Эталон — официальный шаблон create-vk-mini-app (frontend/docs/vk-miniapp/reference/create-vk-mini-app-js-router).
import { useEffect } from 'react'
import bridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge'
import { useAdaptivity, useAppearance, useInsets } from '@vkontakte/vk-bridge-react'
import { AdaptivityProvider, AppRoot, ConfigProvider, getViewHeightByViewportHeight, getViewWidthByViewportWidth, useColorScheme, ViewWidth } from '@vkontakte/vkui'
import { RouterProvider } from '@vkontakte/vk-mini-apps-router'
import { router } from './routes.js'
import MiniApp from './MiniApp.jsx'
import { isInsideVK } from '../services/vk.js'

const launch = parseURLSearchParamsForGetLaunchParams(window.location.search)
const forcedScheme = new URLSearchParams(window.location.search).get('scheme') // ?scheme=dark — проверка тёмной темы в браузере

/** Данные VK Bridge → свойства AdaptivityProvider (VKUI 8: density вместо устаревших sizeX/sizeY). */
function transformVKBridgeAdaptivity({ type, viewportWidth, viewportHeight }) {
  switch (type) {
    case 'adaptive':
      return { viewWidth: getViewWidthByViewportWidth(viewportWidth), viewHeight: getViewHeightByViewportHeight(viewportHeight) }
    case 'force_mobile':
    case 'force_mobile_compact':
      return { viewWidth: ViewWidth.MOBILE, density: type === 'force_mobile_compact' ? 'compact' : 'regular' }
    default:
      return {}
  }
}

/**
 * Синхронизирует тему VKUI с нашими CSS-переменными (index.css, :root[data-scheme='dark'])
 * и цветом иконок статус-бара в приложении ВК.
 */
function SchemeSync() {
  const scheme = useColorScheme()
  useEffect(() => {
    document.documentElement.dataset.scheme = scheme
    if (isInsideVK) {
      bridge.send('VKWebAppSetViewSettings', { status_bar_style: scheme === 'dark' ? 'light' : 'dark' }).catch(() => {})
    }
  }, [scheme])
  return null
}

export default function AppConfig() {
  const vkScheme = useAppearance() || undefined
  const insets = useInsets() || undefined
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity())
  return (
    <ConfigProvider
      colorScheme={forcedScheme === 'dark' || forcedScheme === 'light' ? forcedScheme : vkScheme}
      platform={launch.vk_platform === 'desktop_web' ? 'vkcom' : undefined}
      isWebView={bridge.isWebView()}
      hasCustomPanelHeaderAfter // правый угол шапки занят капсулой ВК (меню и «закрыть»)
    >
      <SchemeSync />
      <AdaptivityProvider {...adaptivity}>
        <AppRoot mode="full" safeAreaInsets={insets}>
          <RouterProvider router={router}>
            <MiniApp />
          </RouterProvider>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  )
}
