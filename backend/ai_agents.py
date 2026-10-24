"""Два ИИ-агента ОЧАКОВО.

Агент №1 «Крафти» — маскот-наставник: отвечает по базе знаний и классифицирует тему вопроса.
Агент №2 «Рекомендатель» — профайлинг по телеметрии (числа считает telemetry_engine,
LLM только формулирует тексты) и черновик приглашения от HR. Диалоги ВК-бота — в vk_bot.py.

LLM подключается, если в .env есть OPENAI_API_KEY или GEMINI_API_KEY. Любая ошибка/таймаут LLM —
мгновенный переход на детерминированный движок, поэтому API отвечает всегда.
"""
from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timedelta

import httpx

import http_pool

import database  # noqa: F401 — загружает .env до того, как LLMClient прочитает ключи
from knowledge_base import (
    ALCOHOL_ANSWER, ALCOHOL_KEYWORDS, FALLBACK_ANSWER, FAQ, SMALL_TALK, STAGES, TOPICS, build_kb_text, normalize_topic,
    topic_label,
)
from telemetry_engine import build_dossier, evaluate

log = logging.getLogger("ochakovo.ai")


# ======================================================================================
# LLM-клиент (OpenAI-совместимый или Gemini) через httpx
# ======================================================================================
class LLMClient:
    def __init__(self) -> None:
        self.timeout = float(os.getenv("LLM_TIMEOUT", "10"))
        preferred = os.getenv("LLM_PROVIDER", "auto").lower()
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.openai_base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        if preferred == "off":
            self.provider = None
        elif preferred == "openai":
            self.provider = "openai" if self.openai_key else None
        elif preferred == "gemini":
            self.provider = "gemini" if self.gemini_key else None
        else:
            self.provider = "openai" if self.openai_key else "gemini" if self.gemini_key else None

    @property
    def model(self) -> str | None:
        return {"openai": self.openai_model, "gemini": self.gemini_model}.get(self.provider or "")

    async def complete_json(self, system: str, user: str, max_tokens: int = 700, temperature: float = 0.6) -> dict | None:
        if not self.provider:
            return None
        try:
            client = http_pool.client()  # общий пул соединений; свой таймаут на запрос — генерация LLM дольше 4 с
            if self.provider == "openai":
                r = await client.post(
                    f"{self.openai_base}/chat/completions", timeout=self.timeout,
                    headers={"Authorization": f"Bearer {self.openai_key}"},
                    json={"model": self.openai_model, "temperature": temperature, "max_tokens": max_tokens,
                          "response_format": {"type": "json_object"},
                          "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]},
                )
                r.raise_for_status()
                text = r.json()["choices"][0]["message"]["content"]
            else:
                r = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent", timeout=self.timeout,
                    headers={"x-goog-api-key": self.gemini_key},
                    json={"systemInstruction": {"parts": [{"text": system}]},
                          "contents": [{"role": "user", "parts": [{"text": user}]}],
                          "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens,
                                               "responseMimeType": "application/json"}},
                )
                r.raise_for_status()
                text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r"^```(?:json)?|```$", "", text.strip()).strip()
            data = json.loads(text)
            return data if isinstance(data, dict) else None
        except Exception as exc:  # сеть, таймаут, квота, невалидный JSON — всё уходит в фоллбэк
            log.warning("LLM %s недоступна, используем детерминированный движок: %r", self.provider, exc)
            return None


llm = LLMClient()


def _lf(text: str) -> str:
    return text[:1].lower() + text[1:]


def _norm(text: str) -> str:
    return " " + re.sub(r"\s+", " ", text.lower().replace("ё", "е")) + " "


# ======================================================================================
# Агент №1: маскот «Крафти»
# ======================================================================================
def _rank_faq(message: str) -> list[tuple[int, dict]]:
    t = _norm(message)
    ranked = []
    for item in FAQ:
        score = sum(len(kw) for kw in item["keywords"] if kw.replace("ё", "е") in t)
        if score:
            ranked.append((score, item))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return ranked


STAGE_PREFERRED = {"lab": "lab", "bottling": "bottling", "engineering": "engineering", "rnd": "brewing", "locker": "uniform"}


def classify(message: str, stage: str | None = None) -> tuple[str, list[dict]]:
    """Определяет тему вопроса. Возвращает (topic_id, подходящие FAQ-записи по убыванию релевантности)."""
    t = _norm(message)
    if any(k in t for k in ALCOHOL_KEYWORDS):
        return "brands", []
    if re.search(r"мне\s*(1[0-7])\b", t) or re.search(r"\b(1[0-7])\s*лет\b", t):
        return "contract", [next(i for i in FAQ if i["id"] == "age")]
    ranked = _rank_faq(message)
    if not ranked:
        return "other", []
    best = ranked[0][0]
    top = [item for score, item in ranked if score == best]
    preferred = STAGE_PREFERRED.get(stage or "")
    top.sort(key=lambda i: i["id"] != preferred)
    rest = [item for score, item in ranked if score != best]
    entries = top + rest
    return entries[0]["topic"], entries


def _suggestions(entries: list[dict], stage: str | None, message: str, asked: list[str]) -> list[str]:
    pool: list[str] = []
    for e in entries[:2]:
        pool += e["suggestions"]
    pool += STAGES.get(stage or "", STAGES["final"])["suggestions"]
    pool += ["Сколько стоит общежитие?", "Какие есть вакансии?", "А если у меня сессия?"]
    msg = message.lower().strip(" ?!.")
    out: list[str] = []
    for s in pool:
        if s.lower().strip(" ?!.") == msg or s in out:
            continue
        sid, _ = classify(s)
        if sid in asked and sid != (entries[0]["topic"] if entries else None) and len(pool) > 4:
            continue
        out.append(s)
        if len(out) == 3:
            break
    return out


def rule_based_reply(message: str, stage: str | None = None, asked: list[str] | None = None) -> dict:
    asked = asked or []
    t = _norm(message)
    topic, entries = classify(message, stage)

    if any(k in t for k in ALCOHOL_KEYWORDS):
        reply = ALCOHOL_ANSWER
    elif entries:
        main = entries[0]
        reply = main["answer"]
        second = next((e for e in entries[1:] if e["topic"] != main["topic"]), None)
        if second and _rank_faq(message) and len(message) > 25:
            scores = {item["id"]: s for s, item in _rank_faq(message)}
            if scores.get(second["id"], 0) >= 0.6 * scores.get(main["id"], 1):
                reply += "\n\nИ про " + topic_label(second["topic"]).lower() + ": " + second["answer"]
        if any(k in t for k in SMALL_TALK[0]["keywords"]) and len(t.split()) <= 12:
            reply = "Привет! " + reply
    else:
        small = next((s for s in SMALL_TALK if any(k in t for k in s["keywords"])), None)
        if small:
            reply = small["answer"]
        else:
            reply = FALLBACK_ANSWER
            fact = STAGES.get(stage or "", {}).get("fact")
            if fact:
                reply += f"\n\nКстати, факт с этой станции: {fact}"
    return {"reply": reply, "topic": topic, "suggestions": _suggestions(entries, stage, message, asked), "source": "rules"}


MASCOT_SYSTEM = """Ты — Крафти, дружелюбный маскот-наставник игры «ОЧАКОВО: Секретный код 1978» для студентов 18–26 лет.
Говоришь на «ты», коротко (2–5 предложений, до 600 символов), по-молодёжному, с 1–2 эмодзи.
Правила:
- Используй ТОЛЬКО факты из базы знаний ниже. Не выдумывай цифры, даты, имена и условия.
- Все суммы зарплат — «до вычета НДФЛ».
- Работа и практика — строго с 18 лет.
- Не рекламируй алкоголь; пивные факты — только как история компании (например, ПЭТ-бутылки в 1994 г.).
- Бренд пишется ОЧАКОВО (прописными, без кавычек); юрлицо — АО МПБК «ОЧАКОВО».
- Если ответа нет в базе — честно скажи и направь в отдел подбора: 8 800 100 77 77, доб. 1155.
Верни строго JSON: {"reply": "<ответ>", "topic": "<id темы>"}.
Допустимые id тем: """ + ", ".join(TOPICS) + "\n\nБАЗА ЗНАНИЙ:\n"


async def mascot_reply(message: str, stage: str | None, history: list[dict], asked: list[str]) -> dict:
    base = rule_based_reply(message, stage, asked)
    if not llm.provider:
        return base
    dialog = "\n".join(f"{'Студент' if h.get('role') == 'user' else 'Крафти'}: {h.get('text', '')}" for h in history[-8:])
    stage_info = STAGES.get(stage or "", {})
    user = (f"Текущая станция игры: {stage_info.get('label', 'не указана')}. Факт станции: {stage_info.get('fact', '—')}\n"
            f"История диалога:\n{dialog or '—'}\n\n"
            f"Подсказка классификатора: тема «{base['topic']}».\n"
            f"Справка-черновик по теме (опирайся на неё):\n{base['reply']}\n\n"
            f"Вопрос студента: {message}")
    data = await llm.complete_json(MASCOT_SYSTEM + build_kb_text(), user, max_tokens=500)
    if not data or not str(data.get("reply", "")).strip():
        return base
    topic = normalize_topic(data.get("topic"))
    if topic == "other" and base["topic"] != "other":
        topic = base["topic"]
    return {"reply": str(data["reply"]).strip()[:1200], "topic": topic, "suggestions": base["suggestions"], "source": "llm"}


# ======================================================================================
# Агент №2: профайлинг и приглашение
# ======================================================================================
EVAL_SYSTEM = """Ты — HR-аналитик АО МПБК «ОЧАКОВО». По готовым метрикам игры перепиши три текста живым языком.
Не меняй и не добавляй числа — используй только те, что есть во входных данных. Без алкоголя. Бренд — ОЧАКОВО.
Верни строго JSON: {"personalized_pitch": "<до 350 символов, на «ты», для студента>",
"verdict": "<до 400 символов, на «ты»: архетип, лучшая вакансия и % совпадения, сильные стороны, что подтянуть>",
"ai_executive_summary": "<до 600 символов, деловой стиль, для HR: ТБ, сильные стороны, зона роста, Mirapolis, вывод>"}"""


async def evaluate_with_ai(raw: dict, target_vacancy: str | None = None, readiness: str | None = None) -> dict:
    """Числа считает telemetry_engine; LLM (если есть) только переписывает тексты вердикта, питча и резюме."""
    result = evaluate(raw, target_vacancy, readiness)
    meta = result.pop("_meta")
    result["source"] = "rules"
    if not llm.provider:
        return result
    rec, st, hr = result["recommendation"], result["student_recommendations"], result["hr_deep_dossier"]
    payload = {
        "archetype": rec["archetype"]["name"], "archetype_title": st["archetype_title"],
        "competencies": rec["competencies"], "strengths": rec["strengths"], "growth": rec["growth"],
        "top_matches": [f"{m['title']} — {m['match']}%" for m in rec["matches"][:3]],
        "retention": meta["retention"], "ppe_attempts": meta["metrics"]["ppe_attempts"],
        "primary_vacancy": st["primary_vacancy"], "needs_dorm": meta["metrics"]["needs_dorm"],
        "exam_on_site": meta["metrics"]["exam_on_site"], "night_ok": meta["metrics"]["night_ok"],
        "asked_topics": hr["asked_topics_labels"], "mirapolis": hr["mirapolis_pre_attestation"]["label"],
        "draft_verdict": rec["verdict"], "draft_pitch": st["personalized_pitch"], "draft_summary": hr["ai_executive_summary"],
    }
    data = await llm.complete_json(EVAL_SYSTEM, json.dumps(payload, ensure_ascii=False), max_tokens=800, temperature=0.4)
    if not data:
        return result
    for target, key, limit in ((st, "personalized_pitch", 500), (rec, "verdict", 600), (hr, "ai_executive_summary", 900)):
        text = str(data.get(key, "")).strip()
        if text:
            target[key] = text[:limit]
            result["source"] = "llm"
    return result


def _btn(label: str, payload: str, color: str = "secondary") -> dict:
    """Кнопка в формате фронтенда ({label, payload, color}); в формат VK её переводит vk_bot.to_vk_keyboard."""
    return {"label": label, "payload": payload, "color": color}


INVITE_KEYBOARD = [
    [_btn("Записаться на собеседование", "iv_yes", "positive")],
    [_btn("Задать вопрос HR", "iv_question"), _btn("Позже", "iv_later")],
]

INVITE_TOPIC_LINES = {
    "dorm": "Ты спрашивал(а) про общежитие — место на Рябиновой, 36к2 за 3 400 ₽ забронируем.",
    "session": "Про сессию не переживай: на дни экзаменов смены не ставим, а в сезон экзамены можно сдать прямо на заводе.",
    "military": "Вопрос с военкоматом решаем через отдел кадров — всё расскажем.",
    "salary": "По деньгам: выплаты 12 и 27 числа, ночные смены оплачиваются по повышенному коэффициенту.",
    "schedule": "График 2/2 покажем вживую, ночные оплачиваются дороже.",
    "transport": "От м. Озёрная ходит наш корпоративный автобус.",
    "food": "Половину стоимости обедов в столовой компенсирует завод.",
    "contract": "Для студентов нет испытательного срока — сразу договор по ТК РФ.",
    "mentor": "Наставник будет с первого дня, теория — в СДО Mirapolis.",
    "practice_docs": "Документы по практике подпишем в Учебном центре, каб. 525.",
}

WEEKDAYS = ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу"]
MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]


def interview_slot(now: datetime | None = None) -> str:
    """Ближайший будний день через 3+ дня, 11:00."""
    day = (now or datetime.now()) + timedelta(days=3)
    while day.weekday() >= 5:
        day += timedelta(days=1)
    return f"{WEEKDAYS[day.weekday()]}, {day.day} {MONTHS[day.month - 1]}, в 11:00"


def template_invite(c: dict) -> dict:
    """Шаблон приглашения (эталон — inviteDraft() в frontend/src/services/botEngine.js)."""
    d = build_dossier(c)
    cand = d["candidate"]
    words = (cand.get("fio") or "").split()
    name = words[1] if len(words) > 1 else (words[0] if words else "Привет")
    rec = evaluate(cand.get("telemetry") or {}, cand.get("vacancy"), cand.get("readiness"))["recommendation"]
    top = d["matches"][0]
    strengths = f"особенно {' и '.join(rec['strengths'][:2])}" if rec["strengths"] else "отличный результат"
    tips = [INVITE_TOPIC_LINES[t["topic"]] for t in d["asked_topics"] if t["topic"] in INVITE_TOPIC_LINES][:2]
    mentor = d["mentor"]
    text = (f"{name}, привет! Это HR ОЧАКОВО 👋 Ты прошёл(-ла) «Секретный код 1978» на {cand.get('points', 0)} баллов — {strengths}. "
            f"ИИ-наставник видит в тебе «{d['archetype']['name']}», а это {top['match']}% совпадения с вакансией «{top['title']}». "
            f"Приглашаем познакомиться {interview_slot()}: ул. Рябиновая, 44 (Учебный центр, каб. 525). "
            + (" ".join(tips) + " " if tips else "")
            + f"Твоим наставником будет {mentor['name']} ({mentor['role']}). Записать тебя?")
    if len(text) > 700 and len(tips) > 1:
        text = text.replace(" " + tips[1], "")
    based_on = [f"{cand.get('points', 0)} баллов", f"архетип «{d['archetype']['name']}»", f"мэтч {top['match']}%",
                *[f"вопрос: {t['label'].lower()}" for t in d["asked_topics"][:2]],
                f"наставник: {mentor['name']}", f"прогноз удержания {d['retention_score']}%"]
    return {"text": text, "based_on": based_on, "keyboard": INVITE_KEYBOARD, "source": "rules"}


INVITE_SYSTEM = """Ты пишешь личное приглашение кандидату от команды подбора АО МПБК «ОЧАКОВО» во ВКонтакте.
На «ты», 500–700 символов, 2–3 эмодзи. Обязательно: баллы, сильные стороны, архетип, вакансия и % мэтча,
дата/место (ул. Рябиновая, 44, Учебный центр, каб. 525), ответы на темы, которые кандидат спрашивал у маскота, имя наставника.
Только факты из входных данных, без алкоголя, бренд — ОЧАКОВО. Верни строго JSON: {"text": "<приглашение>"}"""


async def invite_draft(c: dict) -> dict:
    base = template_invite(c)
    if not llm.provider:
        return base
    data = await llm.complete_json(INVITE_SYSTEM, json.dumps({"draft": base["text"], "facts": base["based_on"]},
                                                             ensure_ascii=False), max_tokens=600, temperature=0.5)
    if data and 300 <= len(str(data.get("text", ""))) <= 900:
        return {**base, "text": str(data["text"]).strip(), "source": "llm"}
    return base
