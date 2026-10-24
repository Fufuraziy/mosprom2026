# VK Mini App: рабочие материалы для переделки фронтенда

Рабочие заметки для перевода игры «Секретный код 1978» из сайта в мини-приложение ВКонтакте.
Собрано 24.10.2026 по первоисточникам: документация dev.vk.ru, правила размещения, исходники VKUI 8.4,
vk-mini-apps-router 1.8.6, vk-bridge 3.0.2 и официальный шаблон `create-vk-mini-app` (клоны GitHub от 23.10.2026).
Это пока только исследование, код приложения не менялся.

## Файлы

| Файл | Зачем открывать |
|---|---|
| [`01-requirements.md`](01-requirements.md) | Что требует ВК (правила размещения с номерами пунктов) и где наш фронт им сейчас не соответствует. Чек-лист перед модерацией. |
| [`02-vkui-router-cheatsheet.md`](02-vkui-router-cheatsheet.md) | Готовые куски кода: провайдеры, маршруты, View со свайпом назад, модалки, попауты, Snackbar, Tabbar, брендовые токены. |
| [`03-screen-map.md`](03-screen-map.md) | Карта: каждый наш экран и блок становится панелью, модалкой или вкладкой, плюс таблица маршрутов. |
| [`04-bridge-methods.md`](04-bridge-methods.md) | Какие методы vk-bridge нужны, на каких платформах они работают, параметры и лимиты. |
| [`05-migration-plan.md`](05-migration-plan.md) | Пошаговый план переделки, зависимости, риски, как тестировать без VK Tunnel. |
| `reference/create-vk-mini-app-js-router/` | Официальный JS-шаблон «VKUI + Bridge + Router» как эталон структуры. |
| `reference/router-example/` | Официальный пример роутера: модалки, попапы, блокировка ухода, вкладки, несколько Root. |
| `reference/vkui-docs/` | Копии нужных страниц документации VKUI 8 (mdx). Читать, если нет интернета. |

## Главный вывод: чем мини-приложение отличается от сайта

1. Экраны, а не прокрутка. Приложение устроено как стек панелей `Panel` внутри `View`. Переход на новый экран
   анимирован так же, как в приложении ВК. «Назад» возвращает на предыдущую панель: кнопка в шапке, свайп на iOS,
   аппаратная кнопка на Android (она вызывает `history.back`). Длинная лента с якорями и `scrollIntoView`: так устроены сайты, а не приложения.
2. Шапка `PanelHeader` на каждом экране: слева кнопка «Назад» там, где она нужна, а в центре или слева название экрана.
   Правый угол занят нативной капсулой ВК с кнопками меню и закрытия. Ширина этой зоны около 90 px
   (`hasCustomPanelHeaderAfter`). Наши баллы и переключатель режимов туда класть нельзя.
3. Никакого «подвала» сайта, фиксированных шапок со ссылками и бургер-меню. Разделы переключает нижний `Tabbar`
   (Epic), детальные экраны открываются переходом вглубь, второстепенное открывается в модальных шторках `ModalPage`
   (на мобильном выезжают снизу).
4. Используем нативные элементы платформы: подтверждения через `Alert`, а не `window.confirm`; уведомления через
   `Snackbar`; спиннеры и скелетоны при загрузке; заглушки `Placeholder` для пустых экранов и ошибок; формы на
   `FormItem` и `Input`. Правило 3.3.1: «дизайн на основе VKUI должен повторять нативные интерфейсы ВКонтакте».
5. Нужно учитывать платформу: тему (светлая или тёмная из настроек ВК), безопасные зоны (`insets`), ширину
   (на vk.com приложение открывается в iframe, а не во весь экран). Всё это приходит из vk-bridge.
6. Данные хранить в ВК: localStorage в WebView может не работать, а прогресс по правилу 2.3.8 должен
   совпадать на разных устройствах. Для этого есть `VKWebAppStorageSet/Get`.
7. Бренд сохраняется: VKUI отвечает за каркас (шапка, вкладки, списки, формы, модалки),
   а игровые поля, иллюстрации и пиктограммы ОЧАКОВО остаются нашими внутри панелей. Фирменный красный
   задаётся через токены акцента VKUI (см. шпаргалку, раздел 9).

## Источники

Официальные:
- Первые шаги: https://dev.vk.ru/ru/mini-apps/getting-started
- Правила размещения: https://dev.vk.ru/ru/mini-apps-rules
- Как попасть в каталог (модерация): https://dev.vk.ru/ru/mini-apps/catalog/moderation · https://dev.vk.ru/ru/mini-apps/settings/moderation
- Советы по созданию: https://dev.vk.ru/ru/mini-apps/catalog/advice
- Оформление (иконки, сниппет, скриншоты): https://dev.vk.ru/ru/mini-apps/settings/general/design
- Размещение и режим разработки: https://dev.vk.ru/ru/mini-apps/settings/general/placement
- Параметры запуска: https://dev.vk.ru/ru/mini-apps/development/launch-params
- iframe и WebView: https://dev.vk.ru/ru/mini-apps/development/iframe-webview
- VKUI и VK Mini Apps: https://vkui.io/integrations/vk-mini-apps · навигация: https://vkui.io/overview/navigation
- Роутер: https://dev.vk.ru/ru/libraries/router · https://github.com/VKCOM/vk-mini-apps-router
- Шаблон: https://github.com/VKCOM/create-vk-mini-app (templates/javascript/vkui-bridge-router)
- Методы Bridge: https://dev.vk.ru/ru/bridge/VKWebAppShowSlidesSheet, …/VKWebAppSetSwipeSettings,
  …/VKWebAppStorageSet, …/VKWebAppSetViewSettings, …/VKWebAppResizeWindow

Сторонние источники (конкретики мало, относиться к ним нужно осторожно):
- https://habr.com/ru/companies/vk/articles/771772/ (VK о превращении веб-приложения в мини-приложение)
- https://habr.com/ru/companies/vk/articles/674572/ (опыт прохождения модерации)
- https://spark.ru/user/261378/blog/276937/dizajn-gajd-vk-mini-apps-tehnicheskij-podhod-k-ux

## Чего в документации нет

- Отдельного «дизайн-гайда» с размерами для мини-приложений у ВК нет. Ориентироваться можно на VKUI (компоненты,
  токены, макеты в Figma: https://www.figma.com/@vk) и на требования раздела 3 правил.
- Размеры iframe на vk.com: известно только, что `VKWebAppResizeWindow` принимает ширину 600–1000 px
  и высоту 500–10000 px.
- VK Tunnel недоступен с 02.10.2025. На странице «Первые шаги» написано, что причина в технических работах.
  Для проверки на телефоне нужен деплой на хостинг ВК (`npm run deploy`) или другой HTTPS-туннель.
