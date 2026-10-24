# Справочные копии (MIT, VK Team)

Скопировано 24.10.2026 из официальных репозиториев, чтобы работать без интернета и не гадать по памяти.

- `create-vk-mini-app-js-router/` — github.com/VKCOM/create-vk-mini-app, `templates/javascript/vkui-bridge-router`
  (VKUI 8, vk-bridge 3, vk-bridge-react 2, router 1.8.6, Vite 8). Картинки удалены.
- `router-example/` — github.com/VKCOM/vk-mini-apps-router, `examples/vk-mini-apps-router-example/src`
  (TypeScript): маршруты с модалками и вкладками, App с Epic/Root/View/ModalRoot, блокировка ухода (`Blocker.tsx`),
  попаут (`OffencePersikPopout.tsx`), а также `RouteNavigator.type.ts` — все методы навигатора.
- `vkui-docs/` — github.com/VKCOM/VKUI, `website/content` (VKUI 8.4.0): интеграция с мини-приложениями, навигация,
  темы, токены, адаптивность, миграция на v8 и страницы компонентов View, PanelHeader, Epic, Tabbar,
  ModalPage, useModalManager, Snackbar, Placeholder, FixedLayout, Alert, ScreenSpinner, FormItem.
- `vk-icons-list.txt` — имена всех компонентов `@vkontakte/icons` 3.78 размеров 20/24/28/36/56
  (собрано из github.com/VKCOM/icons). Искать так: `grep -i gift vk-icons-list.txt`.
