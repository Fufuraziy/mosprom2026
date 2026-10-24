# Блок 6. Архитектура, стек, оптимизация, развёртывание

## 6.1. Состав

| Слой | Технологии |
|---|---|
| Фронтенд | React 18, Vite 5, Tailwind CSS 3, VKUI 8.4, `vk-mini-apps-router` 1.8, `@vkontakte/vk-bridge` 3, `vk-bridge-react` 2, Framer Motion 11, Lucide React, Leaflet 1.9, шрифты Montserrat и JetBrains Mono (`@fontsource`) |
| Бэкенд | Python 3.10–3.14, FastAPI (`>=0.115`), SQLAlchemy 2, Pydantic 2, httpx, python-dotenv, uvicorn |
| Данные | SQLite (`ochakovo.db`), режим WAL |
| ИИ | LLM по OpenAI-совместимому API или Gemini (по ключу); без ключа детерминированный движок на базе знаний |
| ВКонтакте | VK Mini App, VK Bridge, Bots Long Poll или Callback API, `messages.send` |
| Развёртывание | Docker (многостадийный образ), docker-compose, GitHub Actions и `vk-miniapps-deploy` (хостинг VK Mini Apps) |

Фронтенд собирается тремя страницами (`vite.config.js`, режим multi-page): `index.html` (мини-приложение), `hr.html` (страница сотрудников) и `brandkit.html` (Бренд-Кит, ветка `design`). Пути относительные (`base: './'`), поэтому сборка работает на хостинге ВК и из подпапки.

## 6.2. Бэкенд по файлам

| Файл | Что делает |
|---|---|
| `main.py` | FastAPI, CORS, все роуты, аналитика, CSV, вход HR |
| `ai_agents.py` | клиент LLM (OpenAI-совместимый и Gemini), фоллбэки, маскот, профайлинг, приглашения |
| `telemetry_engine.py` | телеметрия в компетенции, удержание, мэтч вакансий, архетип, досье (формулы как в `localEngine.js`) |
| `knowledge_base.py` | факты кейса, 28 записей FAQ, справочники (вакансии, архетипы, наставники, мерч) |
| `vk_bot.py` | ответы бота, клавиатуры, Long Poll и Callback, режим симуляции |
| `models.py` | таблицы `game_sessions`, `telemetry_events`, `chat_messages`, `candidates`, `raffle_tickets`, `bot_messages` |
| `database.py` | подключение SQLite, PRAGMA, добавление недостающих колонок и индексов |
| `http_pool.py` | общий `httpx.AsyncClient` для VK API и LLM |
| `seed_data.py` | 12 демо-кандидатов и 53 анонимные сессии |
| `bot.py` | остаток старой версии бэкенда, нигде не подключён |

## 6.3. Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/`, `/api/health`, `/health` | заглушка-страница; статус, режим LLM и ВК-бота |
| POST | `/api/auth/login` | вход HR по ключу, ответ с токеном на 12 часов |
| GET | `/api/auth/check` | проверка токена |
| POST | `/api/mascot/chat`, `/api/ai/mascot-chat` | ИИ-агент №1 |
| POST | `/api/recommendation` | профиль в формате фронта |
| POST | `/api/game/evaluate-telemetry` | профиль и досье в формате ТЗ кейса |
| POST | `/api/game/start-session`, `/api/sessions` | старт сессии, случайный код капсулы |
| POST | `/api/telemetry` | события игры |
| POST | `/api/candidates`, `/api/candidates/submit` | анкета (формат фронта и формат ТЗ) |
| GET | `/api/candidates`, `/api/candidates/{id}`, `/api/candidates/{id}/dossier` | список, карточка, досье |
| DELETE | `/api/candidates/me` | удаление своих данных по подписи запуска ВК |
| POST | `/api/candidates/{id}/mirapolis`, `/api/candidates/{id}/status` | очередь Mirapolis, смена статуса |
| GET | `/api/analytics/summary`, `/api/hr/dashboard` | аналитика (кэш 15 с) |
| GET, POST | `/api/hr/bot-messages`, `/api/hr/contact-candidate`, `/api/hr/export-csv` | история бота, письмо кандидату, CSV |
| POST, GET | `/api/bot/message`, `/api/bot/invite-draft`, `/api/bot/send`, `/api/bot/inbox` | ВК-бот и приглашения |
| POST | `/api/vk/callback` | Callback API ВКонтакте |
| POST, GET | `/api/raffle/tickets` | билеты мерча |

## 6.4. Оптимизация (под слабый сервер и мобильную сеть)

- GZip для ответов больше 500 байт.
- SQLite: `journal_mode=WAL`, `synchronous=NORMAL`, `cache_size=-20000`, `temp_store=MEMORY`; индексы на `candidates` (`session_id`, `created_at`, `target_vacancy`) и `bot_messages` (`session_id`, `created_at`, `sent_by`) создаются при старте, в том числе в старой базе.
- TTL-кэш 15 секунд (`DASHBOARD_CACHE_TTL`) для дашборда и аналитики, сброс при записи.
- Общий `httpx.AsyncClient`; таймаут VK API 4 с (`HTTP_TIMEOUT`), LLM 10 с (`LLM_TIMEOUT`) с откатом на движок на базе знаний.
- Фронт: таймауты запросов 3,5 с (обычные) и 15 с (ИИ), перепроверка доступности бэкенда раз в 20 с, работа без бэкенда на `localEngine.js`.
- Сборка: Vite делит код на чанки (карта выделена в отдельный чанк около 185 КБ). По прошлому измерению JS весит примерно 138 + 220 КБ в gzip, вся папка `dist` около 5,8 МБ вместе с фото, шрифтами и паттернами (по паттернам три файла по 187 КБ). Цифры нужно перемерить после финальной сборки.

## 6.5. Переменные окружения бэкенда (`backend/.env.example`)

| Группа | Переменные |
|---|---|
| Вход HR | `HR_ACCESS_KEY`, `HR_ACCESS_PIN`, `HR_ALLOW_LEGACY_PIN`, `HR_TOKEN_SECRET`, `HR_TOKEN_TTL`, `VK_ADMIN_IDS` (а `HR_ADMIN_TOKEN` читается в коде, но в `.env.example` его нет) |
| LLM | `LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `LLM_TIMEOUT` |
| ВК | `VK_GROUP_TOKEN`, `VK_GROUP_ID`, `VK_BOT_MODE`, `VK_APP_ID`, `VK_MINI_APP_URL`, `VK_APP_SECRET`, `VK_CONFIRMATION_CODE`, `VK_SECRET` |
| Данные | `DATABASE_URL`, `SEED_DEMO_DATA`, `SHOW_DEMO_DATA`, `CONSENT_VERSION`, `DASHBOARD_CACHE_TTL`, `HTTP_TIMEOUT` |

Переменные фронтенда: `VITE_API_URL`, `VITE_VK_APP_ID`, `VITE_VK_GROUP_ID`. Секретные значения хранятся только в `.env` и в секретах GitHub, не в коде.

## 6.6. Развёртывание

- Docker: образ собирает фронт (Node 20) и кладёт `dist` в `/app/frontend/dist`, затем запускает `uvicorn` на порту 8000 с healthcheck `/api/health`. Сервер собранный фронт не раздаёт: `GET /` отдаёт небольшую HTML-заглушку «ОЧАКОВО: Секретный код 1978». Фраза «приложение сразу доступно на :8000» в README не соответствует поведению.
- Хостинг ВК: приложение 54849953 (`vk-hosting-config.json`), ссылка `https://vk.com/app54849953`. Адрес статики на `pages-ac.vk-apps.ru` меняется при каждом деплое.
- CI: `.github/workflows/deploy-vk-mini-app.yml` запускается при push в `main` с изменениями в `frontend/**` и вручную. Шаги: `npm install`, запись `.env.production`, сборка, деплой через `vk-miniapps-deploy`. В `main` добавлены три попытки с паузой 15 секунд, таймаут 10 минут и патч `scripts/patch-deploy.cjs` (коммиты `20e9275`, `6b48b52`); в ветке `design` этих правок пока нет.
- Секрет `VK_MINI_APPS_TOKEN` нужен для деплоя. Деплой падал с ошибкой «invalid access_token»: вероятно, в секрете лежит не сервисный ключ приложения (ключ нужно взять в настройках приложения, раздел «Ключи доступа»). Пока секрет не исправлен, автодеплой не пройдёт. Секреты `VITE_API_URL` и `VITE_VK_GROUP_ID` необязательны.
- Публичного адреса бэкенда нет. Для проверки с телефона нужен HTTPS-адрес (деплой или туннель), иначе мини-приложение работает на встроенном движке.

## 6.7. Безопасность и персональные данные

- Возраст проверяется на клиенте и на сервере (`MIN_AGE = 18`).
- Согласие на обработку данных обязательно в анкете; сервер хранит факт и версию согласия (`consent_at`, `consent_version`).
- Удаление данных по требованию ВК: `DELETE /api/candidates/me` и кнопка в «О приложении».
- Подпись запуска ВК (`X-VK-Launch-Params`) фронт отправляет, а сервер проверяет её только при заданном `VK_APP_SECRET`.
- Ключи LLM и сообщества ВК лежат только на сервере.
- CORS открыт для всех источников (`allow_origins=["*"]`), без cookies.
- Эндпоинты HR работают без токена в режиме `jury_open_fallback` (осознанная демо-страховка). Статический токен `ochakovo-hr-secret-1978` и ключ `Ochakovo#HR525!` записаны в коде и документации, для продакшена их нужно сменить через `HR_ADMIN_TOKEN` и `HR_ACCESS_KEY` и выключить fallback.
