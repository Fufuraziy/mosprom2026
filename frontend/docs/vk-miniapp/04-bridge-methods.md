# Методы vk-bridge для нашего приложения

Типы взяты из `@vkontakte/vk-bridge` 3.0.2 (`packages/core/src/types/data.ts`), описания лежат на dev.vk.ru/ru/bridge/<Метод>.
Сейчас у нас `^2.15.0`. API тот же, v3 отличается только сборкой (ESM, es2020).
Наша обёртка: `src/services/vk.js`. Перед вызовом необязательных методов проверяйте `await bridge.supportsAsync('<Метод>')`.

## Уже используем

| Метод | Где | Платформы и заметки |
|---|---|---|
| `VKWebAppInit` | `initVK()` | Обязателен (2.2.1). Перенести в `main.jsx` до рендера |
| `VKWebAppGetUserInfo` | автозаполнение анкеты | Перед вызовом объяснить, зачем нужны данные (1.1.2); отказ запомнить (1.1.9) |
| `VKWebAppShowStoryBox` | «Поделиться в Истории» | Только в мобильном приложении. На вебе кнопку скрыть или показать заглушку (2.3.6) |
| `VKWebAppAllowMessagesFromGroup` | подписка на бота | Нужен `group_id` (`VITE_VK_GROUP_ID`) |

## Добавить при переделке

| Метод | Зачем | Параметры и лимиты |
|---|---|---|
| `VKWebAppSetSwipeSettings` | Разрешить свайп «закрыть приложение» на первом экране, на остальных выключить | `{history: true/false}`. Только iOS. Роутер делает это в `useEnableSwipeBack()` |
| `VKWebAppEnableSwipeBack` / `DisableSwipeBack` | То же для «внутренних» мини-приложений | Роутер шлёт вместе с предыдущим |
| `VKWebAppSetLocation` / событие `VKWebAppChangeFragment` | Синхронизация `#/путь` с ВК | Роутер делает сам (`useBridge` по умолчанию `true`) |
| `VKWebAppStorageSet` / `Get` / `GetKeys` | Прогресс между устройствами (2.3.8), флаг «18+ показано», отказы в разрешениях | Ключ: `[A-Za-z0-9_-]`, ≤ 100 символов. Значение ≤ 4096 символов, а у сериализованной строки ≤ 2236. ≤ 1000 ключей на пользователя, ≤ 1000 вызовов в час (ошибка 9 flood control). Новый пользователь получает пустую строку, `JSON.parse` оборачивать в try/catch |
| `VKWebAppGetLaunchParams` / `parseURLSearchParamsForGetLaunchParams` | Платформа, язык, `vk_user_id`, `vk_ref`, `vk_is_favorite` и другие | `sign` проверяйте на бэкенде, на клиенте ему доверять нельзя |
| `VKWebAppSetViewSettings` | Цвет иконок статус-бара под тему (`status_bar_style: 'light' | 'dark'`); `action_bar_color` и `navigation_bar_color` работают только на Android | Вызывать при смене темы |
| `VKWebAppShowSlidesSheet` | Нативный онбординг: история капсулы, правила | ≤ 10 слайдов; `title` в 2 строки, `subtitle` в 3; `media.type: 'image'`, `blob` = data URL; картинки 1,5:1, ≥ 832×555, ≤ 500 КБ. Ответ: `action` = `confirm` / `reject` (+`slide_index`) / `cancel`. ОК не поддерживает |
| `VKWebAppTapticImpactOccurred` / `NotificationOccurred` / `SelectionChanged` | Виброотклик: верный ответ, ошибка, «капля» титрования, отбраковка банки | `runTapticImpactOccurred('light' | 'medium' | 'heavy')` из vk-bridge-react сам проверяет поддержку |
| `VKWebAppShare` | Отправить ссылку на игру другу | `{link}`, ссылка `https://vk.com/app<ID>#/` |
| `VKWebAppAddToFavorites` | Ненавязчиво предложить добавить в избранное после 2–3 входов (совет ВК) | Проверять `vk_is_favorite` |
| `VKWebAppAllowNotifications` | Напоминания «вернись и доиграй» | Массовые уведомления доступны только приложениям из каталога. Нам остаётся основной канал: бот |
| `VKWebAppViewHide` / `VKWebAppViewRestore` (события) | Поставить игру на паузу (таймеры, авария МЭА, конвейер), когда приложение свернули | Правило 2.2.5 про звук; для таймеров тоже полезно |
| `VKWebAppResizeWindow` | Высота iframe на vk.com | Только Web; ширина 600–1000, высота 500–10000. Обычно не нужен, если не мешает прокрутка |
| `VKWebAppCopyText` | «Скопировать код / ссылку» | |
| `VKWebAppClose` | Кнопка «Закрыть» после отправки анкеты (необязательно) | Нужен `status` (`success` или `failed`), `payload` по желанию. Без `status` на модерации возникала ошибка |

## События, на которые подписываться

- `VKWebAppUpdateConfig` сообщает тему и платформу (хук `useAppearance` обрабатывает его сам).
- `VKWebAppUpdateInsets` (старое) и `insets` в `VKWebAppUpdateConfig`, хук `useInsets`.
- `VKWebAppViewHide` / `VKWebAppViewRestore` ставят игру на паузу и снимают с паузы.
- `VKWebAppChangeFragment` приходит при переходе по ссылке с `#` (обрабатывает роутер).

## Прямые ссылки и пуши

- Параметры для приложения передаются после `#`: по ссылке `https://vk.com/app<ID>#/station/lab` роутер откроет станцию.
  Знак `?` в прямой ссылке не работает.
- В уведомлениях и сообщениях бота стоит использовать `fragment`: ВК советует сразу открывать то, ради чего человек пришёл.
  Для пушей бота «брошенная игра» это `#/hub`, для приглашения HR `#/rewards/apply`.

## Проверка внутри и вне ВК

- `bridge.isWebView()` возвращает true только в мобильном приложении ВК (WebView). На vk.com и m.vk.com (iframe)
  проверяйте параметры запуска `vk_app_id` и `sign`; так уже сделано в `isInsideVK`.
- Вне ВК `bridge.send` не отвечает или падает. Для локальной отладки ВК советует `vk-bridge-mock`;
  у нас есть свои демо-заглушки в `vk.js` (`DEMO_VK_PROFILE`), их стоит оставить.
