"""Подключение к SQLite через SQLAlchemy."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(BASE_DIR / 'ochakovo.db').as_posix()}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)


if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, _record):
        """Режим под слабый сервер: WAL — чтение (дашборд HR) не ждёт записи (анкеты, телеметрия),
        synchronous=NORMAL — меньше fsync, кэш страниц ~20 МБ в RAM, временные таблицы в памяти."""
        cur = dbapi_connection.cursor()
        try:
            cur.execute("PRAGMA journal_mode=WAL;")
            cur.execute("PRAGMA synchronous=NORMAL;")
            cur.execute("PRAGMA cache_size=-20000;")
            cur.execute("PRAGMA temp_store=MEMORY;")
        finally:
            cur.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_columns() -> list[str]:
    """Добавляет в существующие таблицы колонки, появившиеся в новых версиях моделей (create_all этого не делает)."""
    added = []
    insp = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not insp.has_table(table.name):
                continue
            existing = {c["name"] for c in insp.get_columns(table.name)}
            for column in table.columns:
                if column.name not in existing:
                    ddl = column.type.compile(dialect=engine.dialect)
                    conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN "{column.name}" {ddl}'))
                    added.append(f"{table.name}.{column.name}")
        if insp.has_table("candidates"):
            cols = {c["name"] for c in insp.get_columns("candidates")}
            if "fio" in cols and "full_name" in cols:
                conn.execute(text("UPDATE candidates SET full_name = fio WHERE (full_name IS NULL OR full_name = '') AND fio IS NOT NULL"))
                conn.execute(text("UPDATE candidates SET fio = full_name WHERE (fio IS NULL OR fio = '') AND full_name IS NOT NULL"))
            if "vacancy" in cols and "target_vacancy" in cols:
                conn.execute(text("UPDATE candidates SET target_vacancy = vacancy WHERE (target_vacancy IS NULL OR target_vacancy = '') AND vacancy IS NOT NULL"))
            if "readiness" in cols and "readiness_date" in cols:
                conn.execute(text("UPDATE candidates SET readiness_date = readiness WHERE (readiness_date IS NULL OR readiness_date = '') AND readiness IS NOT NULL"))
            if "points" in cols and "total_points" in cols:
                conn.execute(text("UPDATE candidates SET total_points = points WHERE (total_points IS NULL OR total_points = 0) AND points IS NOT NULL"))
        if insp.has_table("raffle_tickets"):
            cols = {c["name"] for c in insp.get_columns("raffle_tickets")}
            if "item_id" in cols and "item" in cols:
                conn.execute(text("UPDATE raffle_tickets SET item = item_id WHERE (item IS NULL OR item = '') AND item_id IS NOT NULL"))
                conn.execute(text("UPDATE raffle_tickets SET item_id = item WHERE (item_id IS NULL OR item_id = '') AND item IS NOT NULL"))
    return added


# Индексы для частых выборок Панели HR и ВК-бота. create_all создаёт их только в новых таблицах,
# поэтому для существующей базы досоздаём (идемпотентно).
INDEXES = (
    ("ix_candidates_session_id", "candidates", "session_id"),
    ("ix_candidates_created_at", "candidates", "created_at"),
    ("ix_candidates_target_vacancy", "candidates", "target_vacancy"),
    ("ix_bot_messages_session_id", "bot_messages", "session_id"),
    ("ix_bot_messages_created_at", "bot_messages", "created_at"),
    ("ix_bot_messages_sent_by", "bot_messages", "sent_by"),
)


def ensure_indexes() -> None:
    insp = inspect(engine)
    with engine.begin() as conn:
        for name, table, column in INDEXES:
            if insp.has_table(table):
                conn.execute(text(f'CREATE INDEX IF NOT EXISTS {name} ON {table} ("{column}")'))
