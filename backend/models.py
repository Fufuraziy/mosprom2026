from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime
from datetime import datetime, timezone
from .database import Base

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(String, primary_key=True, index=True)
    started_at = Column(String, default=utc_now_iso)
    secret_code = Column(String, default="1978")
    created_at = Column(String, default=utc_now_iso)

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, index=True)
    event = Column(String, index=True)
    payload_json = Column(Text, default="{}")
    ts = Column(String, default=utc_now_iso)

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=True)
    fio = Column(String, nullable=False)
    phone = Column(String, default="")
    telegram = Column(String, default="")
    email = Column(String, default="")
    birth_date = Column(String, nullable=False)
    vacancy = Column(String, nullable=False)
    readiness = Column(String, nullable=False)
    university = Column(String, nullable=False)
    study_level = Column(String, default="")
    specialty = Column(String, default="")
    consent = Column(Boolean, default=True)
    vk_user_id = Column(String, nullable=True)
    vk_source = Column(String, nullable=True)
    points = Column(Integer, default=0)
    telemetry_json = Column(Text, default="{}")
    tickets_json = Column(Text, default="{}")
    created_at = Column(String, default=utc_now_iso)
    is_live = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)

class RaffleTicket(Base):
    __tablename__ = "raffle_tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, index=True)
    item_id = Column(String, nullable=False)
    ticket_no = Column(String, nullable=False)
    created_at = Column(String, default=utc_now_iso)

class BotMessage(Base):
    __tablename__ = "bot_messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    sender = Column(String, default="user") # user | bot
    text = Column(Text, default="")
    topic = Column(String, default="other")
    payload = Column(String, nullable=True)
    created_at = Column(String, default=utc_now_iso)
