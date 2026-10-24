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
