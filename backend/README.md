# ОЧАКОВО: СЕКРЕТНЫЙ КОД 1978 — backend

FastAPI + SQLite (SQLAlchemy 2) + Pydantic 2 для связки **«ВК-бот + VK Mini App (игра) + Панель HR»**.
Работает без интернета и без ключей: оба ИИ-агента имеют детерминированный движок на базе знаний ОЧАКОВО,
а ВК-бот без токена сообщества переходит в режим симуляции. Форматы ответов совпадают с `frontend/API_CONTRACT.md`,
а компетенции, удержание, мэтч и архетипы считаются по тем же формулам, что `frontend/src/services/localEngine.js`.

## Быстрый старт (Windows / PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # если запрещено: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
copy .env.example .env                # необязательно: ключи LLM и ВК
uvicorn main:app --reload --port 8000
```

macOS / Linux: `source .venv/bin/activate`, `cp .env.example .env`.

Проверка: http://localhost:8000/api/health, Swagger: http://localhost:8000/docs.
Фронт (`cd frontend && npm install && npm run dev`, http://localhost:5173) подхватит бэкенд сам: в шапке зелёная точка,
в панели HR — «FastAPI онлайн · localhost:8000».

При первом старте создаётся `ochakovo.db` и засеваются 12 демо-кандидатов из `frontend/src/data/seedCandidates.js`
+ 53 анонимные сессии (воронка 65 → 12). Пересоздать данные: остановить сервер и удалить `ochakovo.db`.
Новые колонки в старой базе добавляются автоматически при старте.

## ВК-бот «Очаково Старт»

| Режим | Когда | Что происходит |
|---|---|---|
| симуляция | `VK_GROUP_TOKEN` пуст | ответы и приглашения пишутся в консоль (`[VK-СИМУЛЯЦИЯ]`) и в таблицу `bot_messages` |
| Long Poll | токен задан (по умолчанию) | сервер сам опрашивает ВК, публичный адрес не нужен |
| Callback | `VK_BOT_MODE=callback` | ВК шлёт события на `https://<адрес>/api/vk/callback` |

Подключение настоящего бота:
1. Сообщество → Управление → Сообщения: включить; «Возможности ботов» включить, кнопку «Начать» включить.
2. Работа с API → Ключи доступа: создать ключ с правами «сообщения сообщества» и «управление» → `VK_GROUP_TOKEN`.
3. Работа с API → Long Poll API: включить, версия 5.199, тип события «Входящее сообщение».
4. `VK_MINI_APP_URL=https://vk.com/app<ID>` — кнопка «🚀 Запустить игру КРАФТ-КОД 1978» откроет мини-приложение.
5. Перезапустить сервер — в логе появится «ВК-бот: Long Poll подключён».

Бот отвечает на «Начать» / `/start` приветствием Крафти и inline-клавиатурой (игра, зарплата и льготы, общежитие и
дорога, вопрос ИИ-наставнику); любой другой текст обрабатывает ИИ-движок маскота. Писать первым ВК разрешает только тем,
кто сам писал сообществу или разрешил сообщения в мини-приложении (`VKWebAppAllowMessagesFromGroup`), — иначе
`delivered: false` с ошибкой 901. Демо-кандидатам бот по-настоящему не пишет никогда.

## Доступ с телефона / из VK Mini App

Мини-приложение ВК работает по HTTPS, поэтому для тестов на телефоне нужен публичный HTTPS-адрес бэкенда:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
cloudflared tunnel --url http://localhost:8000     # или: ngrok http 8000
```

Адрес пропишите на фронте в `frontend/.env.local` → `VITE_API_URL`. Для проверки подписи `X-VK-Launch-Params`
задайте `VK_APP_SECRET` (защищённый ключ приложения); без него `vk_user_id` принимается без проверки — только для разработки.

## Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` (`/health`) | статус, LLM, режим ВК-бота |
| POST | `/api/mascot/chat` (= `/api/ai/mascot-chat`) | ИИ-агент №1 «Крафти»: ответ + тема (пишется в сессию) |
| POST | `/api/recommendation` | архетип, компетенции, мэтч, удержание, вердикт (формат фронта) |
| POST | `/api/game/evaluate-telemetry` | ИИ-агент №2: профиль студента и HR-досье (контракт ТЗ) |
| POST | `/api/candidates` | анкета фронта `{form, telemetry, points, session_id}` → 201; ошибки 422 `{"errors": {...}}` |
| POST | `/api/candidates/submit` | анкета контракта ТЗ (+ `vk_user_id`, `vk_profile_url`), до 18 лет → 400 |
| GET | `/api/candidates` | список с `telemetry` и досье; фильтры `university`, `block`, `q`, `sort` |
| DELETE | `/api/candidates/me` | удаление своих данных по `X-VK-Launch-Params` (правило ВК 1.1.10) |
| GET | `/api/candidates/{id}/dossier` | досье (формат `buildDossier` + ИИ-досье, вопросы маскоту, сообщения бота) |
| POST | `/api/candidates/{id}/mirapolis` | передать профиль в СДО Mirapolis → `{status: "queued", courses}` |
| POST | `/api/candidates/{id}/status` | статус: new, invited, invited_vk, interview, hired, rejected |
| GET | `/api/analytics/summary` | KPI, воронка по событиям, блоки, вузы, темы вопросов |
| GET | `/api/hr/dashboard` | то же + кандидаты + последние сообщения бота |
| POST | `/api/hr/contact-candidate` | написать кандидату во ВК (шаблон или свой текст) → статус «Приглашён в ВК» + превью |
| GET | `/api/hr/bot-messages` | история сообщений ВК-бота (реальных и симулированных) |
| GET | `/api/hr/export-csv` | CSV (UTF-8 с BOM, разделитель `;`) |
| POST | `/api/sessions`, `/api/telemetry` | игровая сессия и события `{session_id, event, payload, ts}` |
| POST | `/api/bot/message` | симулятор ВК-бота во фронте → `{messages: [...]}` (тот же движок, что у настоящего бота) |
| POST | `/api/bot/invite-draft` | персональное ИИ-приглашение (500–700 символов) |
| POST | `/api/bot/send` | отправка кандидату → `{ok, delivered, channel: vk | vk_demo, message_id, bot_message_id, is_from_hr}` |
| GET | `/api/bot/inbox` | сообщения бота для вкладки «ВК-бот»: `session_id`, `candidate_id`, `since` (ISO), `limit`; id вида `bm_<n>` |
| POST | `/api/auth/login` | вход HR / Режима жюри: `{key: "Ochakovo#HR525!"}` → `{authenticated, token, role}`, иначе 401 |
| GET | `/api/auth/check` | проверка токена из заголовка `X-HR-Token` |
| POST | `/api/vk/callback` | VK Callback API |
| POST/GET | `/api/raffle/tickets` | билеты мерча `{session_id, item_id}` → `{ok, tickets, ticket_no}` |

Списки и аналитика принимают `?include_demo=false`, чтобы скрыть демо-данные.

## Вход HR

Корпоративный ключ: **`Ochakovo#HR525!`** (`HR_ACCESS_KEY` в `.env`). Ключ сравнивается за постоянное время,
в ответ выдаётся токен HMAC-SHA256 на 12 часов (`HR_TOKEN_SECRET`, `HR_TOKEN_TTL`). Запасные входы: старый PIN `1978`
(пока `HR_ALLOW_LEGACY_PIN=1`) и VK ID из `VK_ADMIN_IDS`.

## Производительность

- GZip для ответов больше 500 байт.
- SQLite: `journal_mode=WAL`, `synchronous=NORMAL`, `cache_size=-20000`, `temp_store=MEMORY`; индексы из
  `database.INDEXES` досоздаются при старте.
- TTL-кэш 15 с (`DASHBOARD_CACHE_TTL`) для `/api/hr/dashboard` и `/api/analytics/summary`, заголовок `X-Cache`.
  Сброс — при анкете, сообщении HR, смене статуса, удалении данных.
- `http_pool.py`: общий `httpx.AsyncClient` для VK API и LLM, таймаут VK API 4 с (`HTTP_TIMEOUT`), LLM — `LLM_TIMEOUT`.

Тесты: `python -m pytest test_perf_auth_inbox.py -q` (из папки `backend`, своя временная база).

## Структура

```
main.py              FastAPI, CORS, все роуты, аналитика, CSV
vk_bot.py            ВК-бот: ответы, клавиатуры, messages.send, Long Poll, режим симуляции
ai_agents.py         LLM-клиент (OpenAI-совместимый / Gemini) + фоллбэки: маскот, профайлинг, приглашения
telemetry_engine.py  телеметрия → компетенции, удержание, мэтч, архетип, досье (как localEngine.js) + блоки контракта
knowledge_base.py    факты кейса, FAQ маскота, справочники фронта (вакансии, архетипы, наставники, мерч)
models.py            таблицы: game_sessions, telemetry_events, chat_messages, candidates, raffle_tickets, bot_messages
schemas.py           Pydantic-схемы
database.py          подключение SQLite (WAL), автодобавление новых колонок и индексов
http_pool.py         общий httpx.AsyncClient для VK API и LLM
seed_data.py         демо-кандидаты и анонимные сессии
```

## Допущения калькулятора

В материалах кейса нет точных чисел для части расчётов, поэтому они вынесены в константы `knowledge_base.py`
и показываются в ответе (`financial_summary.assumptions`): надбавка за ночные +15%, средний чек обеда 400 ₽,
сезон 6 месяцев, 15 смен в месяц. Для студентов испытательного срока нет — `probation_*` означает прогноз
удержания и риска ухода в период практики.
