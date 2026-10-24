"""Оптимизация, вход HR по корпоративному ключу, сообщения бота (GET /api/bot/inbox).

Запуск из папки backend: python -m pytest test_perf_auth_inbox.py -q
"""
import os
import sys
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp, 'test.db').as_posix()}"
os.environ.setdefault("SEED_DEMO_DATA", "true")
os.environ["VK_GROUP_TOKEN"] = ""
os.environ["LLM_PROVIDER"] = "off"
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from database import engine  # noqa: E402
from sqlalchemy import text  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(main.app) as c:
        yield c


def test_sqlite_pragmas_and_indexes(client):
    with engine.connect() as conn:
        assert conn.execute(text("PRAGMA journal_mode")).scalar().lower() == "wal"
        assert conn.execute(text("PRAGMA synchronous")).scalar() == 1  # NORMAL
        names = {r[0] for r in conn.execute(text("SELECT name FROM sqlite_master WHERE type='index'"))}
    for name in ("ix_candidates_session_id", "ix_candidates_created_at", "ix_candidates_target_vacancy",
                 "ix_bot_messages_session_id", "ix_bot_messages_created_at"):
        assert name in names


def test_login_corporate_key(client):
    r = client.post("/api/auth/login", json={"key": "Ochakovo#HR525!"})
    assert r.status_code == 200
    body = r.json()
    assert body["authenticated"] is True and body["role"] == "hr_admin"
    check = client.get("/api/auth/check", headers={"X-HR-Token": body["token"]})
    assert check.status_code == 200 and check.json()["authenticated"] is True


def test_login_legacy_pin_and_wrong_key(client):
    assert client.post("/api/auth/login", json={"pin": "1978"}).status_code == 200
    bad = client.post("/api/auth/login", json={"key": "ochakovo#hr525!"})
    assert bad.status_code == 401
    assert "Неверный код доступа" in bad.json()["detail"]
    assert client.get("/api/auth/check", headers={"X-HR-Token": "abc.def"}).status_code == 401


def test_dashboard_cache_and_gzip(client):
    first = client.get("/api/hr/dashboard")
    assert first.status_code == 200 and first.headers["X-Cache"] == "MISS"
    second = client.get("/api/hr/dashboard", headers={"Accept-Encoding": "gzip"})
    assert second.headers["X-Cache"] == "HIT"
    assert second.headers.get("content-encoding") == "gzip"


def test_bot_send_saved_and_visible_in_inbox(client):
    client.get("/api/hr/dashboard")  # прогреваем кэш
    r = client.post("/api/bot/send", json={"session_id": "sess_inbox_1", "text": "Приглашаем на экскурсию!"})
    assert r.status_code == 200
    sent = r.json()
    assert sent["is_from_hr"] is True and sent["channel"] == "vk_demo" and sent["bot_message_id"]
    # отправка сбрасывает кэш панели HR
    assert client.get("/api/hr/dashboard").headers["X-Cache"] == "MISS"

    inbox = client.get("/api/bot/inbox", params={"session_id": "sess_inbox_1"}).json()
    assert inbox["source"] == "remote"
    item = inbox["items"][-1]
    assert item["id"] == f"bm_{sent['bot_message_id']}"
    assert item["is_from_hr"] is True and item["from"] == "hr" and item["text"] == "Приглашаем на экскурсию!"

    # since: только новее последнего полученного
    again = client.get("/api/bot/inbox", params={"session_id": "sess_inbox_1", "since": item["created_at"]}).json()
    assert again["items"] == []
    # без параметров — последние приглашения HR
    assert any(i["id"] == item["id"] for i in client.get("/api/bot/inbox").json()["items"])
