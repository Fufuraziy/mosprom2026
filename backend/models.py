"""Таблицы SQLite (SQLAlchemy 2.x)."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


STATUS_LABELS = {
    "new": "Новый",
    "invited": "Приглашён",
    "invited_vk": "Приглашён в ВК",
    "interview": "Собеседование",
    "hired": "Принят",
    "rejected": "Отказ",
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GameSession(Base):
    """Анонимная игровая сессия (до отправки анкеты). Хранит сводную телеметрию."""
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    channel: Mapped[str | None] = mapped_column(String(32), nullable=True)      # vk_ref: story, menu, bot, web...
    platform: Mapped[str | None] = mapped_column(String(32), nullable=True)
    vk_user_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_stage: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_event: Mapped[str | None] = mapped_column(String(48), nullable=True)
    telemetry: Mapped[dict] = mapped_column(JSON, default=dict)
    asked_topics: Mapped[list] = mapped_column(JSON, default=list)
    evaluation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    def add_topic(self, topic: str | None, count: int = 1) -> None:
        """Учитывает тему вопроса: telemetry.asked_topics хранится как у фронта — {topic: число вопросов}."""
        if not topic or topic == "other":
            return
        tele = dict(self.telemetry or {})
        raw = tele.get("asked_topics")
        counts = dict(raw) if isinstance(raw, dict) else {t: 1 for t in (raw or []) if isinstance(t, str)}
        counts[topic] = int(counts.get(topic, 0)) + count
        self.telemetry = {**tele, "asked_topics": counts}
        if topic not in (self.asked_topics or []):
            self.asked_topics = [*(self.asked_topics or []), topic]


class TelemetryEvent(Base):
    """Поток событий игры — из него строится воронка."""
    __tablename__ = "telemetry_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    type: Mapped[str] = mapped_column(String(48), index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)


class ChatMessage(Base):
    """Диалог с маскотом Крафти (для истории и аналитики тем)."""
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(16))          # user | assistant
    text: Mapped[str] = mapped_column(Text)
    topic: Mapped[str | None] = mapped_column(String(32), nullable=True)
    stage: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source: Mapped[str | None] = mapped_column(String(16), nullable=True)   # llm | rules
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Candidate(Base):
    """Анкета кандидата + ИИ-досье."""
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    session_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    full_name: Mapped[str] = mapped_column(String(160))
    birth_date: Mapped[date] = mapped_column(Date)
    contact_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    telegram: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(160), nullable=True)
    vk_user_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    vk_source: Mapped[str | None] = mapped_column(String(16), nullable=True)
    vk_profile_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    target_vacancy: Mapped[str | None] = mapped_column(String(160), nullable=True)
    readiness_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    university: Mapped[str | None] = mapped_column(String(200), nullable=True)
    course_or_grad_year: Mapped[str | None] = mapped_column(String(64), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(160), nullable=True)
    city: Mapped[str | None] = mapped_column(String(64), nullable=True)

    consent: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_version: Mapped[str | None] = mapped_column(String(32), nullable=True)

    total_points: Mapped[int] = mapped_column(Integer, default=0)
    purchased_merch_tickets: Mapped[list] = mapped_column(JSON, default=list)
    promo_code: Mapped[str] = mapped_column(String(32), unique=True)
    telemetry: Mapped[dict] = mapped_column(JSON, default=dict)
    evaluation: Mapped[dict] = mapped_column(JSON, default=dict)     # student_recommendations + hr_deep_dossier
    block: Mapped[str | None] = mapped_column(String(16), nullable=True)

    status: Mapped[str] = mapped_column(String(24), default="new")   # см. STATUS_LABELS
    mirapolis_status: Mapped[str] = mapped_column(String(24), default="not_assigned")
    mirapolis_assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    invited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)


class RaffleTicket(Base):
    """Билеты на мерч/розыгрыш, купленные за игровые баллы."""
    __tablename__ = "raffle_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    candidate_id: Mapped[str | None] = mapped_column(ForeignKey("candidates.id"), nullable=True)
    item: Mapped[str] = mapped_column(String(160))
    cost: Mapped[int] = mapped_column(Integer, default=0)
    ticket_no: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)


class BotMessage(Base):
    """История диалогов ВК-бота: входящие от студентов и исходящие (ответы бота, приглашения HR).

    channel: vk — отправлено через VK API, vk_demo — режим симуляции (нет токена / демо-кандидат).
    """
    __tablename__ = "bot_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    direction: Mapped[str] = mapped_column(String(8))                 # in | out
    kind: Mapped[str] = mapped_column(String(16), default="reply")    # reply | invite | push | incoming
    channel: Mapped[str] = mapped_column(String(16), default="vk_demo")
    vk_user_id: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    candidate_id: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    payload: Mapped[str | None] = mapped_column(String(64), nullable=True)
    keyboard: Mapped[list | None] = mapped_column(JSON, nullable=True)
    topic: Mapped[str | None] = mapped_column(String(32), nullable=True)
    delivered: Mapped[bool] = mapped_column(Boolean, default=False)
    simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    vk_message_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    error: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sent_by: Mapped[str | None] = mapped_column(String(32), nullable=True)   # bot | hr
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
