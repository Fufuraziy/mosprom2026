# API-контракт фронтенда «Секретный код 1978»

Фронтенд обращается к FastAPI по адресу `VITE_API_URL` (по умолчанию `http://localhost:8000`).
Если бэкенд не отвечает, каждый метод автоматически выполняется во встроенном движке
`src/services/localEngine.js` с теми же структурами данных. Поэтому бэкенд можно
реализовывать постепенно: эндпоинт, отвечающий `404/405/501`, тихо подменяется локальной логикой.

Все тела запросов и ответов: JSON, поля в `snake_case`. Таймауты фронта: 3,5 с на обычные запросы, 15 с на ИИ-эндпоинты (`/api/mascot/chat`, `/api/recommendation`, `/api/bot/message`, `/api/bot/invite-draft`). Приоритеты и подводные камни для бэкенда описаны в [`../BACKEND_HANDOFF.md`](../BACKEND_HANDOFF.md). Нужен CORS для `http://localhost:5173`.

## Проверка доступности

`GET /api/health` (или `GET /health`) → `200 {"status": "ok", "version": "..."}`

Фронт перепроверяет доступность раз в 20 секунд и показывает статус в шапке и в панели HR.

## Аутентификация HR и Режим Жюри

Панель HR головного офиса «Очаково» и персональные данные кандидатов закрыты входом.

### `POST /api/auth/login`
- Тело запроса:
```json
{"pin": "1978", "vk_user_id": "optional"}
```
- Ответ (`200 OK`):
```json
{"authenticated": true, "token": "ochakovo-hr-secret-1978", "role": "hr_admin"}
```
- Ответ (`401 Unauthorized` при неверном PIN):
```json
{"detail": "Неверный код доступа сотрудника HR Очаково"}
```

### Защита HR-эндпоинтов и демо-страховка
- Заголовки: `X-HR-Token` или `Authorization: Bearer ...`.
- Если токен валиден, бэкенд возвращает заголовок `X-HR-Auth-Mode: hr_admin` и поле `"auth_mode": "hr_admin"`.
- Страховка для демо: если токен не передан, бэкенд не блокирует эксперта ошибкой 401, а отдаёт `200 OK` с `auth_mode: "jury_open_fallback"`.
- Бесшовный вход: переход по ссылке с параметром `?jury=1978` или `?role=hr` автоматически авторизует эксперта без показа модалки.
- Вход в 1 клик: в модальном окне есть подсказка `🔑 Пин-код для экспертов и жюри «Открой#Моспром»: 1978` и кнопка `«⚡ Быстрый вход для Эксперта Жюри (1 клик)»`.

## Игровая сессия и телеметрия

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| POST | `/api/sessions` | `{started_at}` | `{session_id}` |
| POST | `/api/telemetry` | `{session_id, event, payload, ts}` | `{ok: true}` |

Основные `event`: `session_open`, `navigate`, `points`, `why_ochakovo_cards_viewed` (`{id}`), `map_location_viewed` (`{id, name}`), `map_workshop_selected` (`{id, vacancy}`),
`ppe_attempt` (`{wrong:[], missing:[]}`), `ppe_done`, `quiz_answer` (`{station, idx, correct}`),
`station_done` (`{id, points, result, skipped}`), `capsule_attempt` (`{code}`), `capsule_open`,
`raffle_ticket` (`{item, price}`), `calculator` (`{dept, nights, dorm, meals}`),
`asked_topics` (`{topic, message}`), `candidate_submitted` (`{id}`).

### Объект `telemetry` (снимок, отправляется с анкетой и в рекомендацию)

```json
{
  "why_ochakovo_cards_viewed": ["giant", "noprobation", "money", "dorm", "mentors"],
  "ppe_attempts": 1,
  "ppe_wrong_picks": ["headphones"],
  "stations": {
    "lab": {"titration_accuracy": 82, "drops": 21, "endpoint": 20, "brix_correct": 4, "brix_total": 4, "tasting_done": true, "quiz_correct": 2, "quiz_total": 2, "score": 226},
    "engineering": {"pressure_stability": 87, "mea_reaction_ms": 1900, "inspections_correct": 3, "inspections_total": 3, "quiz_correct": 2, "quiz_total": 2, "score": 233},
    "line": {"defects_caught": 8, "defects_missed": 1, "false_rejects": 0, "cans_passed": 15, "estop_used": 0, "ttn_correct": 3, "quiz_correct": 3, "quiz_total": 3, "score": 236},
    "design": {"pantone_match": 92, "flavor": "pineapple", "colors": ["p109", "p7406", "p361"], "mirapolis_correct": 4, "mirapolis_total": 4, "score": 242}
  },
  "quiz": {"correct": 7, "total": 7},
  "capsule_attempts": 1,
  "calculator": {"interactions": 5, "night_ok": true, "last": {"dept": "bottling", "nights": 7, "dorm": true, "meals": true}},
  "asked_topics": {"dorm": 2, "military": 1},
  "viewed_map_locations": ["Центральная Лаборатория и R&D-центр Дегустаций", "Технологический цех (Варка, участок CO2 и ЛЭП)"],
  "selected_map_workshop": "Технологический цех (Варка, участок CO2 и ЛЭП)",
  "skipped": [],
  "started_at": "2026-10-24T10:00:00Z"
}
```

## ИИ-агент №1: маскот «Крафти»

`POST /api/mascot/chat`
```json
{"session_id": "sess_…", "message": "Как с общежитием?", "history": [{"role": "user|bot", "text": "…"}]}
```
Ответ:
```json
{"reply": "Общежитие на ул. Рябиновой, 36к2…", "topic": "dorm", "topic_label": "Общежитие и быт", "suggestions": ["Как добраться до офиса?"]}
```
`topic` ∈ `dorm, salary, session, military, schedule, contract, food, transport, uniform, mentor, health, pass, practice_docs, brands, history, vacancies, other`.
Если бэкенд вернёт только `reply`, тему определит локальный классификатор.

## ИИ-агент №2: рекомендация

`POST /api/recommendation` `{session_id, telemetry}` →
```json
{
  "archetype": {"id": "line", "name": "Капитан Линии", "tagline": "…", "icon": "Factory"},
  "competencies": {"safety": 100, "lab": 81, "speed": 88, "systems": 79, "lms": 90},
  "matches": [{"id": "bottling", "title": "Оператор линии розлива", "dept": "Цех розлива", "salary": "от 70 000 ₽", "block": "line", "match": 91}],
  "retention_score": 84,
  "strengths": ["скорость реакции на линии"],
  "growth": [],
  "verdict": "Текст вердикта"
}
```

## Розыгрыш мерча

`POST /api/raffle/tickets` `{session_id, item_id}` → `{ok, tickets: {hoodie: 1}, ticket_no}`
`item_id` ∈ `hoodie, box, stickers, vip`.

## Кандидаты (анкета 18+)

`POST /api/candidates`
```json
{
  "form": {"fio": "…", "phone": "…", "telegram": "…", "email": "…", "birth_date": "2004-05-01",
           "vacancy": "Оператор линии розлива", "readiness": "Готов(а) выйти сразу",
           "university": "…", "study_level": "4 курс", "specialty": "…", "consent": true},
  "telemetry": { "…": "…" },
  "points": 1180,
  "session_id": "sess_…"
}
```
→ `201` объект кандидата (см. ниже). Ошибки валидации: `422 {"errors": {"birth_date": "…"}}`
или стандартный FastAPI `{"detail": [{"loc": ["body", "birth_date"], "msg": "…"}]}`.
Возраст должен быть не меньше 18: его проверяют и клиент, и сервер.

`GET /api/candidates?university=&block=&q=&sort=created|retention|points` → `[candidate]` или `{items: [candidate]}`

Объект кандидата:
```json
{"id": "cand_…", "session_id": "…", "fio": "…", "phone": "…", "telegram": "…", "email": "…",
 "birth_date": "2004-05-01", "vacancy": "…", "readiness": "…", "university": "…", "study_level": "…",
 "specialty": "…", "points": 1180, "telemetry": {}, "created_at": "ISO", "is_live": true}
```
Производные поля (`age`, `block`, `competencies`, `archetype`, `top_match`, `retention_score`, `shift`)
фронт досчитывает сам, если бэкенд их не прислал.

`GET /api/candidates/{id}/dossier` →
```json
{
  "candidate": {},
  "competencies": [{"key": "safety", "label": "Индекс ТБ и дисциплины (СИЗ)", "source": "…", "value": 100}],
  "retention_score": 84,
  "probation_dropout_risk": 9,
  "shift_readiness": {"level": "full|day|unknown", "label": "Готов к 2/2 с ночными сменами"},
  "asked_topics": [{"topic": "dorm", "label": "Общежитие и быт", "count": 2, "tip": "…"}],
  "mentor": {"name": "…", "role": "…", "age": 52, "exp": "…", "bridge": "21 + 52 лет"},
  "matches": [], "archetype": {}, "risks": ["…"], "why_cards": [], "calculator": {},
  "mirapolis_courses": ["…"], "summary": "Резюме для рекрутера"
}
```

`POST /api/candidates/{id}/mirapolis` → `{status: "queued", candidate_id, courses: [], message}`

## Аналитика

`GET /api/analytics/summary` →
```json
{
  "total_candidates": 13, "live_candidates": 1,
  "funnel": [{"step": "Открыли игру (QR/ВК)", "value": 1841}],
  "conversion_to_form": 7.1, "baseline_conversion": 0.02,
  "probation_dropout": {"current": 38, "forecast": 9},
  "avg_retention": 86, "avg_age": 21.6, "company_avg_age": 52,
  "by_block": [{"block": "engineering", "label": "Инженерия", "color": "#A2AAAD", "count": 3}],
  "by_university": [{"university": "…", "count": 2}],
  "top_topics": [{"topic": "dorm", "label": "Общежитие и быт", "count": 8}]
}
```

Ответ проходит через `src/services/normalize.js → normalizeAnalytics`. Там же принимаются альтернативные имена ключей
(см. раздел «Ответы на вопросы бэкенда» в конце). Единственное обязательное поле: непустой `funnel`:
без него фронт считает ответ неправильной формы и берёт локальную аналитику (с демо-данными).

CSV формируется на клиенте из загруженного списка (разделитель `;`, UTF-8 с BOM для Excel).

## ВК-бот сообщества (симулятор во вкладке «ВК-бот»)

На проде бот работает на бэкенде через VK Callback API / Long Poll и использует те же ответы.
Фронт-симулятор вызывает эти эндпоинты, а без бэкенда использует встроенный `src/services/botEngine.js`.

`POST /api/bot/message` передаёт боту сообщение пользователя:
```json
{"session_id": "sess_…", "payload": "dorm", "text": null,
 "ctx": {"stationsDone": 2, "points": 540, "capsuleOpened": false, "hasCandidate": false, "tickets": 0}}
```
→ `{"messages": [{"from": "bot", "text": "…", "topic": "dorm",
     "keyboard": [[{"label": "Общежитие за 3 400 ₽", "payload": "dorm", "color": "secondary"}]],
     "attachment": {"type": "miniapp", "title": "Секретный код 1978", "sub": "…"}}]}`

`color` кнопок такой же, как в клавиатурах ВК-ботов: `primary | secondary | positive | negative`.
Payload кнопок: `start, open_app, continue, dorm, session, salary, vacancies, subscribe, stop,
iv_yes, iv_question, iv_later, season_yes, excursion_yes`.

`POST /api/bot/invite-draft` `{candidate_id}` → персональное ИИ-приглашение
```json
{"text": "Алина, привет! Это HR ОЧАКОВО…", "based_on": ["1180 баллов", "архетип «Хранитель Точности»", "мэтч 96%"],
 "keyboard": [[{"label": "Записаться на собеседование", "payload": "iv_yes", "color": "positive"}]]}
```

`POST /api/bot/send` `{candidate_id, vk_user_id, text}` → `{ok, delivered, channel: "vk" | "vk_demo", message_id}`
(сообщение уходит от имени сообщества через `messages.send` с ключом сообщества; кандидат должен был разрешить сообщения,
в мини-приложении для этого есть `VKWebAppAllowMessagesFromGroup`).

## VK Mini App

- Анкета, заполненная через VK ID, приходит в `POST /api/candidates` с полями `form.vk_user_id` и `form.vk_source`
  (`vk` значит реальные данные из `VKWebAppGetUserInfo`, `demo` значит демо-профиль вне ВК). Контакт ВК засчитывается как контакт кандидата.
- Подпись параметров запуска (`sign` в URL) бэкенд должен проверять секретным ключом приложения, прежде чем доверять `vk_user_id`.
- Новые события телеметрии: `vk_init`, `vk_autofill {source}`, `vk_story_share {source}`, `bot_message`, `bot_push {scenario}`, `hr_bot_invite`.

## Ответы на вопросы бэкенда (24.10)

### 1. `GET /api/analytics/summary`: какие ключи ждёт и проверяет фронт

Форма проверяется одним условием: `funnel` должен быть непустым массивом. Всё остальное фронт достраивает сам (`normalize.js`).
Отдавать можно как в примере выше, так и в текущей форме бэкенда; соответствие ключей такое:

| Что показывает панель HR | Фронтовый ключ | Принимается также (форма бэкенда) | Если нет |
|---|---|---|---|
| KPI «Кандидатов (анкеты)» | `total_candidates` | `submitted` | последний шаг `funnel` |
| подпись «живых сессий сегодня» | `live_candidates` | `submitted_today` | 0 |
| KPI «Конверсия в анкету», % | `conversion_to_form` (в процентах, 7.1) | `conversion` (доля 0.071 или проценты; значение ≤ 1 считается долей) | последний шаг / первый шаг `funnel` |
| подпись «было 0,02% конверсии в найм» | `baseline_conversion` | нет | 0.02 |
| KPI «Отсев на испытательном» | `probation_dropout {current, forecast}` | то же | 38 / 9 |
| KPI «Средний возраст» | `avg_age` | нет | прочерк |
| подпись «в компании сейчас 52» | `company_avg_age` | нет | 52 |
| «Воронка сезона» | `funnel[] {step, value}` | `funnel[] {label, count}` (`id` и `pct` игнорируются, проценты фронт считает от первого шага) | обязательно |
| «Кандидаты по 3 блокам» | `by_block[] {block, label, color, count}` | `blocks`, массив `{id, label?, count}` или объект `{engineering: 3, line: 5}` | пусто |
| «Топ вузов» | `by_university[] {university, count}` | `top_universities`, массив `{name, count}` или объект `{"ИТМО": 2}` | пусто |
| «Что волнует кандидатов» | `top_topics[] {topic, label, count}` | `asked_topics`, массив `{topic|id, count}` или объект `{dorm: 8}` | пусто |
| нет | нет | `total_players`, `merch` (фронт их сейчас не показывает, но отдавать можно) | нет |

Ключи блоков: `engineering` (Инженерия), `profile` (Химики и технологи), `line` (Линейный персонал), `free` (Бесплатная практика).
Подписи и цвета блоков фронт берёт из `BLOCKS` в `src/data/content.js`, если не прислать `label`/`color`.
Ключи тем: см. список в разделе «ИИ-агент №1»; подписи: `TOPIC_LABELS` в `content.js`.

### 2. `telemetry.stations`: что лежит внутри каждой станции

Id станций на фронте: `lab`, `engineering`, `line`, `design` (не `bottling` и не `rnd`).
На всякий случай фронт понимает и `bottling → line`, `rnd → design`, `tech → engineering`, `laboratory → lab`,
но шлёт всегда свои id. Станция появляется в `stations` только после прохождения.

```jsonc
{
  "stations": {
    "lab": {
      "titration_accuracy": 82,          // 0–100, точность титрования (100: остановился ровно в точке эквивалентности)
      "drops": 21, "endpoint": 20,       // сколько капель добавил / где была точка эквивалентности
      "brix_correct": 4, "brix_total": 4,// верные вердикты «норма/брак» по рефрактометру ATAGO
      "tasting_done": true,
      "tasting": {"5": 4, "6": 3, "7": 5, "8": 4},  // оценки органолептики 1–5 по образцам №5–8
      "quiz_correct": 2, "quiz_total": 2,
      "score": 226,                      // баллы за станцию, максимум 250
      "breakdown": [{"label": "Титрование: точность 82%", "points": 66, "max": 80}],
      "completed_at": "2026-10-24T10:12:00.000Z"
    },
    "engineering": {
      "pressure_stability": 87,          // % времени, когда давление в абсорбере было в зелёной зоне 1,8–2,2 бар
      "mea_reaction_ms": 1900,           // реакция на аварию МЭА в мс; null, если не успел за 6 с
      "inspections_correct": 3, "inspections_total": 3,  // обход: барботёр (верно «отклонение»), SCHENK и чан ЛЭП («норма»)
      "quiz_correct": 2, "quiz_total": 2,
      "score": 233, "breakdown": [], "completed_at": "…"
    },
    "line": {
      "defects_caught": 8,               // снял мятых банок
      "defects_missed": 1,               // мятые, доехавшие до термотуннеля
      "false_rejects": 0,                // снял целую банку
      "cans_passed": 15,                 // целых банок прошло в туннель
      "estop_used": 0,                   // сколько раз жал аварийный стоп
      "ttn_correct": 3,                  // верных полей ТТН из 3 (получатель + 2 количества)
      "quiz_correct": 3, "quiz_total": 3,
      "score": 236, "breakdown": [], "completed_at": "…"
    },
    "design": {
      "pantone_match": 92,               // 0–100, совпадение палитры банки KERN с эталоном вкуса
      "flavor": "pineapple",             // pineapple | raspberry
      "colors": ["p109", "p7406", "p361"],  // id из PANTONE в content.js: фон, акцент, детали
      "mirapolis_correct": 4, "mirapolis_total": 4,  // тест Mirapolis: SMART, SWOT, Исикава, 5 почему
      "score": 242, "breakdown": [], "completed_at": "…"
    }
  },
  "skipped": []                          // id станций, пропущенных кнопкой демо-ускорения (там подставлены средние значения)
}
```

Остальные поля `telemetry` описаны в разделе «Объект telemetry» выше. Отправляется это так:
- `POST /api/telemetry` с `event: "station_done"` и `payload: {id, points, result, skipped}`, сразу после станции (`result` равен объекту станции выше);
- полный снимок `telemetry` уходит в `POST /api/recommendation` (финал) и в `POST /api/candidates` (анкета).

Как фронт считает компетенции из этих полей: `computeCompetencies()` в `src/services/localEngine.js`.

### 3. Иконка и id архетипа

Эмодзи не нужны. Фронт ждёт имя иконки из набора `lucide-react`, как в `ARCHETYPES` (`src/data/content.js`):

| `archetype.id` | `name` | `icon` | Станция-источник |
|---|---|---|---|
| `lab` | Хранитель Точности | `FlaskConical` | лаборатория |
| `engineering` | Инженер Потока | `Gauge` | техцех |
| `line` | Капитан Линии | `Factory` | розлив и склад |
| `design` | Архитектор Бренда | `Palette` | дизайн и Mirapolis |

Если придёт эмодзи или незнакомое имя, фронт сам подставит иконку по `id` (`normalizeArchetype`).
`id` `bottling` и `rnd` тоже понимаются (как `line` и `design`), но лучше отдавать фронтовые.

Вакансии (`matches[].id`), веса компетенций и блоки: `VACANCIES` в `content.js`:
`chem` (Химик-лаборант, profile), `technologist` (Технолог, profile), `machinist` (Машинист тех. установок, engineering),
`automation` (Наладчик / автоматизация, engineering), `bottling` (Оператор линии розлива, line),
`warehouse` (Оператор склада / кладовщик, line), `digital` (Практика: дизайн, IT, оцифровка, free).

### 4. `GET /api/candidates`: массив или объект

Подходит и то, и другое: просто массив `[...]` (как сейчас) или `{items: [...]}`. При любой другой форме фронт возьмёт локальный список.
Каждому кандидату нужна `telemetry` (из неё фронт пересчитывает компетенции, архетип, удержание и рисует столбец
«Вопросы маскоту»); станции внутри неё можно называть и фронтовыми id, и `bottling`/`rnd`.
