"""ВК-бот сообщества «Очаково Старт».

Один движок ответов на всех:
  * симулятор во вкладке «ВК-бот» фронтенда — POST /api/bot/message (кнопки в формате {label, payload, color});
  * настоящий ВК — Bots Long Poll API (по умолчанию, публичный URL не нужен) или Callback API (/api/vk/callback).

Без VK_GROUP_TOKEN сервер не падает: бот работает в режиме симуляции — исходящие сообщения пишутся в консоль
и в таблицу bot_messages (история видна в панели HR: GET /api/hr/bot-messages).

Переменные .env: VK_GROUP_TOKEN, VK_GROUP_ID (необязательно — узнаем по токену), VK_MINI_APP_URL
(https://vk.com/app<ID>), VK_APP_ID (необязательно — берётся из VK_MINI_APP_URL), VK_BOT_MODE=longpoll|callback|off.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import re

import httpx
from sqlalchemy.orm import Session

import ai_agents
import http_pool
from database import SessionLocal
from knowledge_base import topic_label
from models import BotMessage, GameSession, TelemetryEvent

log = logging.getLogger("ochakovo.vk")

VK_API = "https://api.vk.com/method/"
VK_API_VERSION = "5.199"
LABEL_LIMIT = 40   # ВК не принимает подписи кнопок длиннее 40 символов


class VKError(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(f"VK API {code}: {message}")
        self.code, self.message = code, message


# --------------------------------------------------------------------------------------
# Настройки
# --------------------------------------------------------------------------------------
def token() -> str:
    return os.getenv("VK_GROUP_TOKEN", "").strip()


def mini_app_url() -> str:
    return os.getenv("VK_MINI_APP_URL", "").strip()


def app_id() -> int | None:
    raw = os.getenv("VK_APP_ID", "").strip()
    if raw.isdigit():
        return int(raw)
    found = re.search(r"app(\d+)", mini_app_url())
    return int(found.group(1)) if found else None


def mode() -> str:
    """longpoll | callback | simulation."""
    if not token():
        return "simulation"
    wanted = os.getenv("VK_BOT_MODE", "longpoll").strip().lower()
    return wanted if wanted in ("longpoll", "callback") else "simulation"


# --------------------------------------------------------------------------------------
# Тексты и клавиатуры
# --------------------------------------------------------------------------------------
B = ai_agents._btn
APP_BUTTON = "🚀 Запустить игру КРАФТ-КОД 1978"

MAIN_KEYBOARD = [
    [B(APP_BUTTON, "open_app", "primary")],
    [B("💰 Рассчитать зарплату и льготы", "salary", "positive")],
    [B("🏠 Общежитие и как добраться", "dorm")],
    [B("🤖 Задать вопрос ИИ-Наставнику", "ask_ai")],
]
START_KEYBOARD = [[B("Начать", "start", "primary")]]


def miniapp_attachment() -> dict:
    return {"type": "miniapp", "title": "КРАФТ-КОД 1978", "sub": "VK Mini App · 4 станции · мерч за баллы",
            "url": mini_app_url() or None}


GREETING = (
    "Привет! Я Крафти, наставник ОЧАКОВО 🐻 Почему к нам стоит прийти:\n"
    "🏭 100% российская компания, работаем с 1978 года — завод строили к Олимпиаде-80;\n"
    "💸 оплачиваемая практика от 56 000 до 70 000+ ₽ (до вычета НДФЛ), выплаты 12 и 27 числа;\n"
    "📄 для студентов нет испытательного срока — сразу договор по ТК РФ;\n"
    "🏠 общежитие на Рябиновой, 36к2 — 3 400 ₽ в месяц;\n"
    "🎓 экзамены в сезон можно сдавать прямо на заводе.\n\n"
    "Берём строго с 18 лет. Запусти игру КРАФТ-КОД 1978 — 15 минут, 4 станции и мерч за баллы!"
)
SALARY_TEXT = (
    "💰 Доход на оплачиваемой практике (до вычета НДФЛ):\n"
    "• цех розлива и технологический цех — от 70 000 ₽;\n"
    "• лаборатория — от 60 000 ₽ (с ночными больше);\n"
    "• склад — 56 000–60 000 ₽.\n"
    "Ночные смены — по повышенному коэффициенту, переработки оплачиваются отдельно, выплаты 12 и 27 числа.\n\n"
    "🎁 Льготы: общежитие 3 400 ₽ вместо 6 800 ₽, 50% стоимости питания платит завод, бесплатные спецодежда, "
    "прачечная и медосмотр, наставник с первого дня, без испытательного срока.\n"
    "Точный расчёт под твой график — в калькуляторе внутри игры 👇"
)
DORM_TEXT = (
    "🏠 Общежитие: Москва, ул. Рябиновая, 36, к. 2 — 3 400 ₽/мес для студентов, комнаты на 4–6 человек, "
    "есть всё, кроме фена. Заселение до 14:00 или после 16:00, вход закрыт с 23:00 до 6:00. Комендант: 8 495 446 42 55.\n"
    "🏢 Офис: ул. Рябиновая, 44.\n\n"
    "🚌 Как добраться:\n"
    "• м. Озёрная — корпоративный автобус ОЧАКОВО;\n"
    "• м. Кунцевская — автобусы 275, 610;\n"
    "• м. Говорово — автобусы 259, 275, 221;\n"
    "• ст. Рабочий посёлок — автобус 259.\n"
    "Перед приездом позвони в отдел подбора: 8 800 100 77 77, доб. 1155."
)
ASK_AI_TEXT = (
    "🤖 Я на связи! Напиши вопрос одним сообщением — отвечу по «Справочнику студента»: зарплата, смены 2/2, сессия, "
    "военкомат, общежитие, документы по практике, вакансии. Если чего-то не знаю — честно скажу и дам контакт отдела подбора."
)
STATIC_REPLIES = {
    "subscribe": ("Готово, подписка оформлена ✅ Будем присылать: старт сезонного набора, приглашения на экскурсии, "
                  "итоги розыгрыша мерча и сообщения от HR. Отписаться можно словом «Стоп».", "other"),
    "iv_question": ("Напиши свой вопрос одним сообщением — рекрутер ответит в течение рабочего дня. На частые вопросы "
                    "отвечу сразу: общежитие, сессия, зарплата, военкомат.", "other"),
    "iv_later": ("Хорошо, напомним через неделю. Если появятся вопросы — пиши сюда в любое время.", "other"),
    "season_yes": ("Отлично, записали! За день до даты пришлём напоминание и схему проезда до ул. Рябиновая, 44.", "other"),
    "excursion_yes": ("Отлично, записали! За день до даты пришлём напоминание и схему проезда до ул. Рябиновая, 44.", "other"),
}
FAQ_PAYLOADS = {"session": "А если у меня сессия?", "vacancies": "Какие есть вакансии?"}
START_WORDS = re.compile(r"^(начать|старт|start|/start|привет|меню|/menu)$", re.I)


def _progress(ctx: dict) -> str:
    done = int(ctx.get("stationsDone") or 0)
    if not done:
        return "Ты ещё не начинал(а) квест — первая станция ждёт."
    if done < 4:
        return f"У тебя уже {done} из 4 цифр кода и {ctx.get('points', 0)} Крафт-баллов."
    return "Капсула 1978 уже открыта — осталось забрать награды." if ctx.get("capsuleOpened") else "Все 4 цифры собраны — открой капсулу!"


def _msg(text: str, topic: str = "other", keyboard=None, attachment=None) -> dict:
    out = {"from": "bot", "text": text, "topic": topic, "topic_label": topic_label(topic),
           "keyboard": keyboard if keyboard is not None else MAIN_KEYBOARD}
    if attachment:
        out["attachment"] = attachment
    return out


def parse_payload(raw) -> str | None:
    """Payload ВК ('{"cmd":"dorm"}', '{"command":"start"}') или фронта ("dorm") → команда."""
    if raw is None or raw == "":
        return None
    if isinstance(raw, dict):
        return raw.get("cmd") or raw.get("command") or raw.get("payload")
    try:
        data = json.loads(raw)
    except (TypeError, ValueError):
        return str(raw)
    return parse_payload(data) if isinstance(data, dict) else str(data)


async def respond(payload=None, text: str | None = None, ctx: dict | None = None,
                  history: list[dict] | None = None, asked: list[str] | None = None) -> list[dict]:
    """Ответ бота на кнопку или свободный текст. Возвращает сообщения в формате симулятора фронта."""
    ctx = ctx or {}
    cmd = parse_payload(payload)
    t = (text or "").strip()
    if cmd == "start" or (not cmd and START_WORDS.match(t)):
        return [_msg(GREETING, attachment=miniapp_attachment())]
    if cmd in ("open_app", "continue"):
        link = f"\n{mini_app_url()}" if mini_app_url() else ""
        return [_msg(f"Открываю мини-приложение КРАФТ-КОД 1978. {_progress(ctx)}{link}", attachment=miniapp_attachment())]
    if cmd == "salary":
        return [_msg(SALARY_TEXT, "salary", attachment=miniapp_attachment())]
    if cmd == "dorm":
        return [_msg(DORM_TEXT, "dorm")]
    if cmd == "ask_ai":
        return [_msg(ASK_AI_TEXT)]
    if cmd == "iv_yes":
        return [_msg(f"Записали тебя на собеседование {ai_agents.interview_slot()}: Москва, ул. Рябиновая, 44, Учебный центр "
                     "(каб. 525). Возьми паспорт — пропуск закажем на проходной. Корпоративный автобус ходит от м. Озёрная. "
                     "До встречи!")]
    if cmd in STATIC_REPLIES:
        reply, topic = STATIC_REPLIES[cmd]
        return [_msg(reply, topic)]
    if cmd == "stop" or (not cmd and t.lower() == "стоп"):
        return [_msg("Отписали от рассылки. Вернуться можно кнопкой «Начать».", keyboard=START_KEYBOARD)]
    if cmd in FAQ_PAYLOADS:
        r = ai_agents.rule_based_reply(FAQ_PAYLOADS[cmd])
        return [_msg(r["reply"], r["topic"])]
    r = await ai_agents.mascot_reply(t or "привет", None, history or [], asked or [])
    return [_msg(r["reply"], r["topic"])]


def to_vk_keyboard(rows: list[list[dict]], inline: bool = True) -> dict:
    """Кнопки фронта → клавиатура VK. open_app → кнопка мини-приложения (или ссылка, если id приложения неизвестен)."""
    vk_rows = []
    group_id = os.getenv("VK_GROUP_ID", "").strip()
    for row in rows:
        out = []
        for b in row:
            label = b["label"][:LABEL_LIMIT]
            if b["payload"] in ("open_app", "continue") and (app_id() or mini_app_url()):
                if app_id():
                    action = {"type": "open_app", "app_id": app_id(), "label": label}
                    if group_id.isdigit():
                        action["owner_id"] = -int(group_id)
                    if b["payload"] == "continue":
                        action["hash"] = "/hub"
                else:
                    action = {"type": "open_link", "link": mini_app_url(), "label": label}
                out.append({"action": action})
            else:
                out.append({"action": {"type": "text", "label": label, "payload": json.dumps({"cmd": b["payload"]})},
                            "color": b.get("color", "secondary")})
        vk_rows.append(out)
    return {"inline": True, "buttons": vk_rows} if inline else {"one_time": False, "buttons": vk_rows}


# --------------------------------------------------------------------------------------
# Отправка и история
# --------------------------------------------------------------------------------------
async def vk_call(method: str, params: dict, client: httpx.AsyncClient | None = None) -> dict | list | int:
    data = {**params, "access_token": token(), "v": VK_API_VERSION}
    r = await (client or http_pool.client()).post(VK_API + method, data=data)  # общий пул, таймаут 4 с
    body = r.json()
    if "error" in body:
        raise VKError(body["error"].get("error_code", 0), body["error"].get("error_msg", ""))
    return body["response"]


async def send_message(db: Session, *, vk_user_id: str | int | None, text: str, keyboard: list | None = None,
                       kind: str = "reply", candidate_id: str | None = None, session_id: str | None = None,
                       sent_by: str = "bot", force_demo: bool = False, topic: str | None = None,
                       is_demo: bool = False) -> dict:
    """Отправляет сообщение от имени сообщества или симулирует отправку. Всегда пишет историю в bot_messages."""
    real = bool(token()) and bool(vk_user_id) and not force_demo
    delivered, message_id, error = False, None, None
    if real:
        params = {"peer_id": str(vk_user_id), "random_id": str(random.randint(1, 2**31 - 1)), "message": text}
        if keyboard:
            params["keyboard"] = json.dumps(to_vk_keyboard(keyboard), ensure_ascii=False)
        try:
            response = await vk_call("messages.send", params)
            delivered, message_id = True, str(response)
        except VKError as exc:
            error = str(exc)[:255]   # 901 — пользователь не разрешил сообщения сообщества
        except Exception as exc:
            error = f"VK API недоступен: {exc!r}"[:255]
    else:
        error = ("демо-кандидат: реальная отправка отключена" if force_demo else
                 "VK_GROUP_TOKEN не задан — режим симуляции" if not token() else "кандидат не связан с ВК (нет vk_user_id)")
        log.info("[VK-СИМУЛЯЦИЯ] → %s: %s", vk_user_id or "—", text.replace("\n", " ")[:300])
    row = BotMessage(direction="out", kind=kind, channel="vk" if real else "vk_demo",
                     vk_user_id=str(vk_user_id) if vk_user_id else None, candidate_id=candidate_id, session_id=session_id,
                     text=text, keyboard=keyboard, topic=topic, delivered=delivered, simulated=not real,
                     vk_message_id=message_id, error=error, sent_by=sent_by, is_demo=is_demo)
    db.add(row)
    db.flush()
    return {"ok": True, "delivered": delivered, "channel": "vk" if real else "vk_demo", "simulated": not real,
            "message_id": message_id or f"sim_{row.id}", "bot_message_id": row.id, "error": error}


def log_incoming(db: Session, *, vk_user_id, text: str, payload: str | None, session_id: str | None) -> None:
    db.add(BotMessage(direction="in", kind="incoming", channel="vk" if token() else "vk_demo",
                      vk_user_id=str(vk_user_id) if vk_user_id else None, session_id=session_id, text=text or "",
                      payload=payload, delivered=True, simulated=not token(), sent_by="user"))


def message_to_dict(m: BotMessage) -> dict:
    return {"id": m.id, "direction": m.direction, "kind": m.kind, "channel": m.channel, "vk_user_id": m.vk_user_id,
            "candidate_id": m.candidate_id, "text": m.text, "payload": m.payload, "keyboard": m.keyboard, "topic": m.topic,
            "delivered": m.delivered, "simulated": m.simulated, "error": m.error, "sent_by": m.sent_by,
            "created_at": m.created_at.isoformat() if m.created_at else None, "is_demo": m.is_demo}


async def handle_incoming(vk_user_id: int | str, text: str | None, payload=None) -> list[dict]:
    """Входящее сообщение из ВК (Long Poll или Callback): ответить, записать историю и тему вопроса."""
    cmd = parse_payload(payload)
    sid = f"vk-{vk_user_id}"
    with SessionLocal() as db:
        session = db.get(GameSession, sid)
        if not session:
            session = GameSession(id=sid, channel="bot", vk_user_id=str(vk_user_id), telemetry={}, asked_topics=[])
            db.add(session)
        log_incoming(db, vk_user_id=vk_user_id, text=text or "", payload=cmd, session_id=sid)
        history = [{"role": "user" if m.direction == "in" else "bot", "text": m.text} for m in
                   db.query(BotMessage).filter(BotMessage.vk_user_id == str(vk_user_id))
                   .order_by(BotMessage.id.desc()).limit(8).all()][::-1]
        messages = await respond(cmd, text, {}, history, list(session.asked_topics or []))
        for m in messages:
            session.add_topic(m["topic"])
            await send_message(db, vk_user_id=vk_user_id, text=m["text"], keyboard=m.get("keyboard"),
                               session_id=sid, topic=m["topic"])
        db.add(TelemetryEvent(session_id=sid, type="bot_message", payload={"text": (text or "")[:200], "cmd": cmd}))
        db.commit()
    return messages


# --------------------------------------------------------------------------------------
# Bots Long Poll API
# --------------------------------------------------------------------------------------
class LongPollRunner:
    def __init__(self) -> None:
        self.task: asyncio.Task | None = None
        self.running = False
        self.group_id: int | None = None
        self.last_error: str | None = None

    def start(self) -> None:
        if mode() == "longpoll" and self.task is None:
            self.task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task, self.running = None, False

    async def _resolve_group(self, client: httpx.AsyncClient) -> int:
        raw = os.getenv("VK_GROUP_ID", "").strip()
        if raw.isdigit():
            return int(raw)
        resp = await vk_call("groups.getById", {}, client)
        groups = resp.get("groups", []) if isinstance(resp, dict) else resp
        return int(groups[0]["id"])

    async def _run(self) -> None:
        async with httpx.AsyncClient(timeout=40) as client:
            while True:
                try:
                    self.group_id = self.group_id or await self._resolve_group(client)
                    server = await vk_call("groups.getLongPollServer", {"group_id": self.group_id}, client)
                    key, url, ts = server["key"], server["server"], server["ts"]
                    self.running, self.last_error = True, None
                    log.info("ВК-бот: Long Poll подключён (сообщество %s)", self.group_id)
                    while True:
                        r = await client.get(url, params={"act": "a_check", "key": key, "ts": ts, "wait": 25})
                        data = r.json()
                        if "failed" in data:
                            if data["failed"] == 1:
                                ts = data["ts"]
                                continue
                            break   # 2 / 3 — ключ устарел, запрашиваем сервер заново
                        ts = data["ts"]
                        for update in data.get("updates", []):
                            if update.get("type") == "message_new":
                                asyncio.create_task(self._handle(update.get("object") or {}))
                except asyncio.CancelledError:
                    raise
                except Exception as exc:
                    self.running, self.last_error = False, repr(exc)[:300]
                    log.warning("ВК-бот: ошибка Long Poll, переподключение через 5 с: %r", exc)
                    await asyncio.sleep(5)

    @staticmethod
    async def _handle(obj: dict) -> None:
        msg = obj.get("message", obj)
        user_id = msg.get("from_id")
        if not user_id or user_id < 0 or msg.get("out"):
            return
        try:
            await handle_incoming(user_id, msg.get("text"), msg.get("payload"))
        except Exception as exc:
            log.exception("ВК-бот: не удалось ответить %s: %r", user_id, exc)


runner = LongPollRunner()


def status() -> dict:
    return {"mode": mode(), "longpoll_running": runner.running, "group_id": runner.group_id or os.getenv("VK_GROUP_ID") or None,
            "mini_app_url": mini_app_url() or None, "app_id": app_id(), "last_error": runner.last_error}
