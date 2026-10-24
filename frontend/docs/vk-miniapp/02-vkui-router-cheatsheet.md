# Шпаргалка: VKUI 8 + vk-mini-apps-router 1.8 + vk-bridge 3

Код ниже на JS (как наш проект). Эталон структуры: `reference/create-vk-mini-app-js-router/`.
Если поведение кажется странным, смотрите исходники роутера в `reference/router-example/` и типы
навигатора `reference/router-example/RouteNavigator.type.ts`.

## 0. Пакеты (как в официальном шаблоне)

```bash
npm i @vkontakte/vkui@^8 @vkontakte/vk-mini-apps-router@^1.8.6 @vkontakte/vk-bridge@^3 @vkontakte/vk-bridge-react@^2 @vkontakte/icons@^3
npm i -D eruda          # консоль на телефоне, только в dev
```

- vk-bridge 3 поставляется только как ESM, API тот же, что у 2.15. vk-bridge-react 2 нужен для хуков `useAppearance`, `useInsets`, `useAdaptivity`.
- Браузеры VKUI 8: iOS ≥ 15, Chrome/Android WebView ≥ 84, Safari ≥ 15.
- В шаблоне есть плагин Vite, который вырезает `"use-client"` из `@vkontakte/icons` (см. `reference/.../vite.config.js`), и `@vitejs/plugin-legacy`. Плагин legacy нужен для старых WebView, у нас его нет.
- `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover">`. Без `viewport-fit=cover` не работают безопасные зоны.

## 1. Точка входа

```jsx
// main.jsx
import { createRoot } from 'react-dom/client'
import bridge from '@vkontakte/vk-bridge'
import { AppConfig } from './AppConfig.jsx'

bridge.send('VKWebAppInit')                 // до рендера; правило 2.2.1
createRoot(document.getElementById('root')).render(<AppConfig />)
if (import.meta.env.DEV) import('eruda').then((m) => m.default.init())
```

```jsx
// AppConfig.jsx
import bridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge'
import { useAdaptivity, useAppearance, useInsets } from '@vkontakte/vk-bridge-react'
import { AdaptivityProvider, ConfigProvider, AppRoot } from '@vkontakte/vkui'
import { RouterProvider } from '@vkontakte/vk-mini-apps-router'
import '@vkontakte/vkui/dist/vkui.css'
import './brand-tokens.css'                    // ПОСЛЕ vkui.css (см. раздел 9)
import { transformVKBridgeAdaptivity } from './utils/transformVKBridgeAdaptivity'
import { router } from './routes'
import { App } from './App'

export const AppConfig = () => {
  const colorScheme = useAppearance() || undefined   // 'light' | 'dark' из настроек ВК
  const insets = useInsets() || undefined            // безопасные зоны
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity())
  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search)
  return (
    <ConfigProvider
      colorScheme={colorScheme}
      platform={vk_platform === 'desktop_web' ? 'vkcom' : undefined}
      isWebView={bridge.isWebView()}
      hasCustomPanelHeaderAfter   // правый угол шапки — под капсулу ВК (≈90 px, customPanelHeaderAfterMinWidth)
    >
      <AdaptivityProvider {...adaptivity}>
        <AppRoot mode="full" safeAreaInsets={insets}>
          <RouterProvider router={router}>
            <App />
          </RouterProvider>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  )
}
```

```js
// utils/transformVKBridgeAdaptivity.js — версия для VKUI 8 (density вместо устаревших sizeX/sizeY)
import { getViewWidthByViewportWidth, getViewHeightByViewportHeight, ViewWidth } from '@vkontakte/vkui'
export const transformVKBridgeAdaptivity = ({ type, viewportWidth, viewportHeight }) => {
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
```

> В JS-шаблоне ещё стоят устаревшие `sizeX/sizeY`. В VKUI 8 они работают, но помечены deprecated.

## 2. Маршруты

Иерархия: `Root → View → Panel → (Modal | Tab)`. Каждой панели нужен путь, параметры пишутся как `:id`.

```js
// routes.js
import { createHashRouter, createPanel, createModal, createRoot, createView, RoutesConfig } from '@vkontakte/vk-mini-apps-router'

export const routes = RoutesConfig.create([
  createRoot('root', [
    createView('quest', [
      createPanel('home', '/', [
        createModal('age_gate', '/age'),
      ]),
      createPanel('station', '/station/:id', [], ['id']),
    ]),
  ]),
])
export const router = createHashRouter(routes.getRoutes())
// Обращение к описаниям: routes.root.quest.station (для push с параметрами)
```

- `createHashRouter` держит адрес после `#`, как принято в мини-приложениях: прямая ссылка
  `https://vk.com/app<ID>#/station/lab` открывает станцию. Роутер сам синхронизирует адрес с ВК
  (`VKWebAppSetLocation`) и слушает `VKWebAppChangeFragment`.
- Одну `panel` можно повесить на два пути (например, `/station/:id` и `/station/:id/quiz`); так
  сделано в примере с Персиком.
- Для 404: `<RouterProvider notFound={<NotFound/>}>` или `notFoundRedirectPath="/"`.
- `hierarchy` + параметр `?inflate=1` (см. пример) достраивают историю при входе по глубокой ссылке.

## 3. App: View с историей и свайпом назад

```jsx
import { SplitLayout, SplitCol, View, PanelHeader, usePlatform } from '@vkontakte/vkui'
import { useActiveVkuiLocation, useGetPanelForView, usePopout, useRouteNavigator } from '@vkontakte/vk-mini-apps-router'

export const App = () => {
  const platform = usePlatform()
  const navigator = useRouteNavigator()
  const popout = usePopout()                      // Alert / ScreenSpinner, показанные через navigator.showPopout
  const { view = 'quest', modal, panelsHistory } = useActiveVkuiLocation()
  const questPanel = useGetPanelForView('quest')
  const history = modal || popout ? [] : panelsHistory   // пока открыта модалка, свайп назад выключен

  return (
    <SplitLayout header={platform !== 'vkcom' && <PanelHeader delimiter="none" />}>
      {popout}
      {/* {modalRoot} — раздел 5 */}
      <SplitCol stretchedOnMobile autoSpaced>
        <View nav="quest" activePanel={questPanel || 'home'} history={history} onSwipeBack={() => navigator.back()}>
          <Home nav="home" />
          <Station nav="station" />
        </View>
      </SplitCol>
    </SplitLayout>
  )
}
```

- Порядок `Panel` внутри `View` задаёт порядок переходов, иначе анимация пойдёт «не в ту сторону».
- Переход: `navigator.push('/station/lab')` или `navigator.push(routes.root.quest.station, { id: 'lab' })`.
  Замена без записи в историю: `replace`. Назад: `back()`; в самое начало: `backToFirst()`.
- На первом экране нужно разрешить нативный свайп, который закрывает мини-приложение. Для этого в первой
  панели вызывается хук `useEnableSwipeBack()`: он сам шлёт `VKWebAppSetSwipeSettings {history:true}` и
  `VKWebAppEnableSwipeBack`. `SetSwipeSettings` работает только на iOS.
- Кнопка «Назад» в шапке при входе по прямой ссылке:
  ```jsx
  const isFirst = useFirstPageCheck()
  <PanelHeader before={<PanelHeaderBack onClick={() => (isFirst ? navigator.push('/') : navigator.back())} />}>Лаборатория</PanelHeader>
  ```
- Android: аппаратная кнопка «Назад» вызывает `history.back`. Роутер на hash-истории обрабатывает её сам;
  если вернуться некуда, ВК закроет приложение.
- Скролл каждой панели VKUI запоминает сам (роутер ставит `history.scrollRestoration = 'manual'`).
  Не трогать `window.scrollTo` при смене экрана.

## 4. Панель

```jsx
import { Panel, PanelHeader, PanelHeaderBack, PanelHeaderContent, Group, Header, Cell, Div, Button, Box } from '@vkontakte/vkui'

export const Station = ({ nav }) => {
  const navigator = useRouteNavigator()
  const { id } = useParams({ panel: nav }) ?? {}
  return (
    <Panel nav={nav}>
      <PanelHeader before={<PanelHeaderBack onClick={() => navigator.back()} />}>
        <PanelHeaderContent subtitle="1 250 баллов">Лаборатория</PanelHeaderContent>
      </PanelHeader>
      <Group>{/* игровое поле: наш брендовый компонент */}</Group>
      <Box position="sticky" insetBlockEnd={0}>{/* закреплённая кнопка снизу (замена FixedLayout) */}
        <Div><Button size="l" stretched mode="primary">Проверить</Button></Div>
      </Box>
    </Panel>
  )
}
```

- Заголовок у каждого экрана свой (совет ВК: не дублировать одно название на всех экранах).
- `after` у `PanelHeader` не использовать: там капсула ВК.
- `PanelHeader` по умолчанию фиксируется сверху на мобильных, а на vkcom лежит в потоке.
- `FixedLayout` в VKUI 8 устарел (удалят в v10), вместо него используйте `Box position="sticky"` и сохраняйте порядок в DOM.

## 5. Модальные окна

Через роутер (адрес меняется, «назад» закрывает шторку, можно дать прямую ссылку):

```jsx
const { modal } = useActiveVkuiLocation()
const isFirst = useFirstPageCheck()
const modalRoot = (
  <ModalRoot activeModal={modal} onClose={() => navigator.hideModal(false, { replace: isFirst })}>
    <ModalPage id="story" header={<ModalPageHeader>История ВК</ModalPageHeader>}>…</ModalPage>
    <ModalCard id="age_gate" title="Только 18+" description="…" actions={<Button size="l" stretched>Мне есть 18</Button>} />
  </ModalRoot>
)
// открыть: navigator.push('/age') (если описан createModal) или navigator.showModal('story')
```

- `ModalRoot` в VKUI 8 помечен deprecated, но роутер 1.8.6 и его официальный пример работают именно с ним.
  Для модалок без адреса можно взять `useModalManager()` (`api.openModalPage({...})` + `contextHolder` в JSX).
- На мобильном `ModalPage`: шторка снизу, а на ширине ≥ 768 px диалог. С `hasCustomPanelHeaderAfter`
  шторка не залезает под капсулу ВК.
- `ModalCard` подходит для короткого сообщения с 1–2 кнопками (подтверждение 18+, «цифра кода получена»).

## 6. Попауты: Alert и ScreenSpinner

```jsx
navigator.showPopout(
  <Alert
    title="Начать заново?" description="Прогресс на этом устройстве сбросится."
    actions={[{ title: 'Отмена', mode: 'cancel' }, { title: 'Сбросить', mode: 'destructive', action: reset }]}
    onClosed={() => navigator.hidePopout()}
  />,
)
navigator.showPopout(<ScreenSpinner state="loading" />)   // загрузка при старте
```

`Alert` заменяет `window.confirm`: внутри WebView системные диалоги работают плохо и выглядят как в браузере.

## 7. Уведомления: Snackbar

```jsx
const [snackbar, holder] = useSnackbarManager()
snackbar.open({ children: '+100 баллов за станцию', before: <Icon28CoinsOutline />, duration: 3000 })
// {holder} — один раз в разметке App
```

Если не использовать менеджер, `Snackbar` нужно убирать из DOM в `onClosed`, иначе он мешает следующему показу.
Позиция: `placement` и `offsetY`, чтобы не перекрывать Tabbar.

## 8. Разделы: Epic + Tabbar

```jsx
<Epic activeStory={activeStory} tabbar={showTabbar && (
  <Tabbar>
    <TabbarItem label="Квест" selected={activeStory === 'quest'} onClick={() => navigator.push('/')}><Icon28GameOutline /></TabbarItem>
    <TabbarItem label="Награды" selected={activeStory === 'rewards'} onClick={() => navigator.push('/rewards')}><Icon28GiftOutline /></TabbarItem>
    <TabbarItem label="Крафти" selected={activeStory === 'mascot'} onClick={() => navigator.push('/mascot')}><Icon28MessageOutline /></TabbarItem>
  </Tabbar>
)}>
  <View id="quest" …/> <View id="rewards" …/> <View id="mascot" …/>
</Epic>
```

- `Epic` переключает разделы без анимации, а `View` внутри них переключает панели с анимацией.
- В роутере разделы описываются как разные `createView` внутри одного `createRoot`, тогда `activeStory = view`.
- `indicator` у `TabbarItem`: бейдж или `Counter` (например, «новая награда»).
- На ширине планшета и больше Tabbar принято заменять боковым меню (`useAdaptivityConditionalRender`),
  пример в `reference/vkui-docs/navigation.mdx`, раздел «Интерактивный пример».
- Таббар над игрой можно прятать: `tabbar={showTabbar && …}`.

## 9. Бренд ОЧАКОВО поверх VKUI

Тема VKUI состоит из CSS-переменных `--vkui--*`, которые висят на классах `vkui--vkBase--light`, `vkui--vkIOS--dark`
и других. Цвета кнопок, вкладок, ссылок и переключателей берутся из «акцентных» токенов. Минимальное
переопределение (файл подключать после `vkui.css`):

```css
/* brand-tokens.css */
.vkui--vkBase--light, .vkui--vkIOS--light, .vkui--vkCom--light {
  --vkui--color_background_accent: #D50032;
  --vkui--color_background_accent_themed: #D50032;
  --vkui--color_background_accent_themed--hover: #C2002E;
  --vkui--color_background_accent_themed--active: #AB2328;
  --vkui--color_text_accent: #D50032;
  --vkui--color_text_accent_themed: #D50032;
  --vkui--color_icon_accent: #D50032;
  --vkui--color_icon_accent_themed: #D50032;
  --vkui--color_stroke_accent: #D50032;
  --vkui--color_stroke_accent_themed: #D50032;
}
/* для .--dark — свои оттенки (красный светлее, чтобы был контраст на тёмном) */
```

Акцентные токены, которые реально используют компоненты (найдены поиском по исходникам VKUI 8.4):
`color_background_accent(_themed)`, `color_text_accent(_themed)`, `color_icon_accent(_themed)`,
`color_stroke_accent(_themed)`, `color_text_contrast_themed` (текст на акцентной кнопке),
`color_background_accent_tint(_themed)`, `color_background_accent_alternative`.

Официально рекомендован другой путь: своя тема на `@vkontakte/vkui-tokens` и `ConfigProvider tokensClassNames`.
Переопределять классы проще, и для прототипа этого достаточно.

- Шрифт интерфейса VKUI: системный (`--vkui--font_family_base`). Montserrat оставить для крупных
  заголовков и игровых экранов, а шапки, списки и формы не трогать: этого требует правило 3.3.1 про нативный вид.
- В своих компонентах брать цвета фона и текста из токенов (`var(--vkui--color_background_content)`,
  `var(--vkui--color_text_primary)`), тогда тёмная тема заработает сама. Жёсткие `bg-white` и `text-ink`
  в тёмной теме дадут белые пятна.
- `useColorScheme()` подскажет, когда подменять картинки для тёмной темы.

## 10. Мелочи

- Виброотклик: `runTapticImpactOccurred('light')` из `@vkontakte/vk-bridge-react` сам проверяет поддержку.
- `PullToRefresh` пригодится для списка в HR, игре он не нужен.
- Заглушка ошибки (3.5.1): `Placeholder icon={<Icon56…/>} action={<Button>Повторить</Button>}>Текст ошибки</Placeholder>`.
- Для загрузки (3.5.2) есть `Skeleton`, `Spinner` и `PanelSpinner`.
- Иконки ВК: https://vkcom.github.io/icons, импорт вида `import { Icon28GameOutline } from '@vkontakte/icons'`.
- MCP-сервер VKUI (`npx -y @vkontakte/vkui-mcp`) отдаёт свойства компонентов и примеры для текущей версии.
