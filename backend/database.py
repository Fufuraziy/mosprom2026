"""
Настройка базы данных SQLite и SQLAlchemy для кейса ОЧАКОВО: Крафт-код 1978.
"""
import os
import json
from datetime import datetime
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.environ.get("OCHAKOVO_DB_PATH", os.path.join(os.path.dirname(__file__), "ochakovo.db"))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)


@event.listens_for(engine, "connect")
def _sqlite_pragmas(dbapi_connection, connection_record):
    """
    Режим под слабый сервер: WAL — чтение не блокируется записью (дашборд HR и анкеты работают параллельно),
    synchronous=NORMAL — меньше fsync на диск, кэш страниц ~20 МБ в RAM, временные таблицы в памяти.
    """
    cur = dbapi_connection.cursor()
    try:
        cur.execute("PRAGMA journal_mode=WAL;")
        cur.execute("PRAGMA synchronous=NORMAL;")
        cur.execute("PRAGMA cache_size=-20000;")
        cur.execute("PRAGMA temp_store=MEMORY;")
    finally:
        cur.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def run_light_migrations():
    """
    Лёгкие миграции для уже существующей ochakovo.db: create_all не добавляет новые колонки и индексы
    в старые таблицы, поэтому досоздаём их сами (идемпотентно).
    """
    with engine.begin() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(bot_messages)"))}
        if cols:
            if "candidate_id" not in cols:
                conn.execute(text("ALTER TABLE bot_messages ADD COLUMN candidate_id VARCHAR"))
            if "is_from_hr" not in cols:
                conn.execute(text("ALTER TABLE bot_messages ADD COLUMN is_from_hr BOOLEAN DEFAULT 0"))
            if "channel" not in cols:
                conn.execute(text("ALTER TABLE bot_messages ADD COLUMN channel VARCHAR"))
            if "delivered" not in cols:
                conn.execute(text("ALTER TABLE bot_messages ADD COLUMN delivered BOOLEAN DEFAULT 1"))
        for stmt in (
            "CREATE INDEX IF NOT EXISTS ix_candidates_session_id ON candidates (session_id)",
            "CREATE INDEX IF NOT EXISTS ix_candidates_created_at ON candidates (created_at)",
            "CREATE INDEX IF NOT EXISTS ix_candidates_vacancy ON candidates (vacancy)",
            "CREATE INDEX IF NOT EXISTS ix_bot_messages_candidate_id ON bot_messages (candidate_id)",
            "CREATE INDEX IF NOT EXISTS ix_bot_messages_created_at ON bot_messages (created_at)",
            "CREATE INDEX IF NOT EXISTS ix_bot_messages_is_from_hr ON bot_messages (is_from_hr)",
        ):
            conn.execute(text(stmt))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
