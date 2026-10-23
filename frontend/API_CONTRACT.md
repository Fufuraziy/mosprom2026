# API-контракт фронтенда «Секретный код 1978»

Фронтенд обращается к FastAPI по адресу `VITE_API_URL` (по умолчанию `http://localhost:8000`).
Если бэкенд не отвечает, **каждый** метод автоматически выполняется во встроенном движке
`src/services/localEngine.js` с теми же структурами данных. Поэтому бэкенд можно
реализовывать постепенно: эндпоинт, отвечающий `404/405/501`, тихо подменяется локальной логикой.

Все тела запросов и ответов — JSON, поля в `snake_case`. Таймауты фронта: 3,5 с на обычные запросы, 15 с на ИИ-эндпоинты (`/api/mascot/chat`, `/api/recommendation`, `/api/bot/message`, `/api/bot/invite-draft`). Передача бэкенду с приоритетами и подводными камнями — [`../BACKEND_HANDOFF.md`](../BACKEND_HANDOFF.md). Нужен CORS для `http://localhost:5173`.

## Проверка доступности

`GET /api/health` (или `GET /health`) → `200 {"status": "ok", "version": "..."}`

Фронт перепроверяет доступность раз в 20 секунд и показывает статус в шапке и в панели HR.

## Игровая сессия и телеметрия

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| POST | `/api/sessions` | `{started_at}` | `{session_id}` |
| POST | `/api/telemetry` | `{session_id, event, payload, ts}` | `{ok: true}` |

Основные `event`: `session_open`, `navigate`, `points`, `why_ochakovo_cards_viewed` (`{id}`),
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
  "skipped": [],
  "started_at": "2026-10-24T10:00:00Z"
}
```

## ИИ-агент №1 — маскот «Крафти»

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

## ИИ-агент №2 — рекомендация

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
**Возраст строго ≥ 18** — проверяется и на клиенте, и должен проверяться на сервере.

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
  "by_block": [{"block": "engineering", "label": "Инженерия", "color": "#C9922E", "count": 3}],
  "by_university": [{"university": "…", "count": 2}],
  "top_topics": [{"topic": "dorm", "label": "Общежитие и быт", "count": 8}]
}
```

CSV формируется на клиенте из загруженного списка (разделитель `;`, UTF-8 с BOM для Excel).

## ВК-бот сообщества (симулятор во вкладке «ВК-бот»)

На проде бот работает на бэкенде через VK Callback API / Long Poll и использует те же ответы.
Фронт-симулятор вызывает эти эндпоинты, а без бэкенда — встроенный `src/services/botEngine.js`.

`POST /api/bot/message` — сообщение пользователя боту
```json
{"session_id": "sess_…", "payload": "dorm", "text": null,
 "ctx": {"stationsDone": 2, "points": 540, "capsuleOpened": false, "hasCandidate": false, "tickets": 0}}
```
→ `{"messages": [{"from": "bot", "text": "…", "topic": "dorm",
     "keyboard": [[{"label": "Общежитие за 3 400 ₽", "payload": "dorm", "color": "secondary"}]],
     "attachment": {"type": "miniapp", "title": "Секретный код 1978", "sub": "…"}}]}`

`color` кнопок — как в клавиатурах ВК-ботов: `primary | secondary | positive | negative`.
Payload кнопок: `start, open_app, continue, dorm, session, salary, vacancies, subscribe, stop,
iv_yes, iv_question, iv_later, season_yes, excursion_yes`.

`POST /api/bot/invite-draft` `{candidate_id}` → персональное ИИ-приглашение
```json
{"text": "Алина, привет! Это HR ОЧАКОВО…", "based_on": ["1180 баллов", "архетип «Хранитель Точности»", "мэтч 96%"],
 "keyboard": [[{"label": "Записаться на собеседование", "payload": "iv_yes", "color": "positive"}]]}
```

`POST /api/bot/send` `{candidate_id, vk_user_id, text}` → `{ok, delivered, channel: "vk" | "vk_demo", message_id}`
(сообщение от имени сообщества: `messages.send` с ключом сообщества; кандидат должен был разрешить сообщения —
в мини-приложении для этого есть `VKWebAppAllowMessagesFromGroup`).

## VK Mini App

- Анкета, заполненная через VK ID, приходит в `POST /api/candidates` с полями `form.vk_user_id` и `form.vk_source`
  (`vk` — реальные данные из `VKWebAppGetUserInfo`, `demo` — демо-профиль вне ВК). Контакт ВК засчитывается как контакт кандидата.
- Подпись параметров запуска (`sign` в URL) бэкенд должен проверять секретным ключом приложения, прежде чем доверять `vk_user_id`.
- Новые события телеметрии: `vk_init`, `vk_autofill {source}`, `vk_story_share {source}`, `bot_message`, `bot_push {scenario}`, `hr_bot_invite`.
