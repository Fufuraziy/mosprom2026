import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_healthcheck():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["service"] == "ochakovo-backend"

def test_session_start_dynamic_code():
    r = client.post("/api/game/start-session", json={})
    assert r.status_code == 200
    data = r.json()
    assert "session_id" in data
    assert "target_code" in data
    assert len(data["target_code"]) == 4

def test_telemetry():
    r = client.post("/api/telemetry", json={
        "session_id": "test_sess_001",
        "event": "ppe_done",
        "payload": {"attempts": 1}
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True

def test_mascot_chat_and_topic_classification():
    # Проверяем вопрос про общежитие
    r = client.post("/api/mascot/chat", json={
        "session_id": "test_sess_001",
        "message": "Расскажи про общежитие на Рябиновой, сколько стоит?"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["topic"] == "dorm"
    assert "3 400" in data["reply"]
    assert "Рябиновая" in data["reply"]

    # Проверяем вопрос про сессию
    r = client.post("/api/mascot/chat", json={
        "session_id": "test_sess_001",
        "message": "А как сдавать сессию во время практики?"
    })
    assert r.status_code == 200
    assert r.json()["topic"] == "session"
    assert "на территории" in r.json()["reply"]

def test_recommendation_agent():
    r = client.post("/api/recommendation", json={
        "session_id": "test_sess_001",
        "telemetry": {
            "stations": {
                "lab": {"titration_accuracy": 95, "brix_correct": 4, "brix_total": 4},
                "engineering": {"pressure_stability": 80},
                "line": {"defects_caught": 10, "ttn_correct": 3},
                "design": {"pantone_match": 85, "mirapolis_correct": 4}
            }
        }
    })
    assert r.status_code == 200
    data = r.json()
    assert "archetype" in data
    assert "competencies" in data
    assert "matches" in data
    assert len(data["matches"]) > 0
    assert "retention_score" in data
    assert data["retention_score"] >= 25

def test_raffle_tickets():
    r = client.post("/api/raffle/tickets", json={
        "session_id": "test_sess_001",
        "item_id": "hoodie"
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert "OCH-1978-" in r.json()["ticket_no"]

def test_candidate_under_18_rejected():
    # Кандидат 16 лет: должен получить 422 ошибку!
    r = client.post("/api/candidates", json={
        "form": {
            "fio": "Иванов Иван",
            "phone": "+7 999 111-22-33",
            "birth_date": "2010-01-01", # 16 лет в 2026 году
            "vacancy": "Оператор линии розлива",
            "readiness": "Готов выйти сразу",
            "university": "Колледж №20",
            "consent": True
        },
        "points": 500,
        "session_id": "test_sess_001"
    })
    assert r.status_code == 422
    data = r.json()
    assert "18 лет" in str(data)

def test_candidate_valid_submission_and_hr_flow():
    # Корректный кандидат 21 год
    cand_payload = {
        "form": {
            "fio": "Соколова Анна Михайловна",
            "phone": "+7 900 123-45-67",
            "telegram": "@sokolova_anna",
            "birth_date": "2005-06-15",
            "vacancy": "Химик-лаборант",
            "readiness": "К началу сезона (март–апрель)",
            "university": "РХТУ им. Менделеева",
            "study_level": "3 курс",
            "specialty": "Химическая экспертиза",
            "consent": True,
            "vk_user_id": "12345678"
        },
        "telemetry": {
            "stations": {
                "lab": {"titration_accuracy": 98, "brix_correct": 4, "brix_total": 4, "tasting_done": True}
            },
            "asked_topics": {"dorm": 2, "session": 1}
        },
        "tickets": {"hoodie": 1},
        "points": 1350,
        "session_id": "test_sess_live"
    }
    r = client.post("/api/candidates/submit", json=cand_payload)
    assert r.status_code == 201
    cand = r.json()
    assert cand["id"].startswith("cand_")
    assert cand["is_live"] is True
    assert cand["points"] == 1350

    # Проверяем, что кандидат первый в списке HR
    r_list = client.get("/api/candidates")
    assert r_list.status_code == 200
    cands = r_list.json()
    assert len(cands) >= 13
    assert cands[0]["id"] == cand["id"] # Живой кандидат на 1 месте!

    # Проверяем досье
    r_dos = client.get(f"/api/candidates/{cand['id']}/dossier")
    assert r_dos.status_code == 200
    dos = r_dos.json()
    assert dos["candidate"]["fio"] == "Соколова Анна Михайловна"
    assert "mentor" in dos
    assert "Елена Васильевна" in dos["mentor"]["name"] # Наставник химиков

    # Проверяем генерацию персонального оффера от HR
    r_inv = client.post("/api/bot/invite-draft", json={"candidate_id": cand["id"]})
    assert r_inv.status_code == 200
    inv = r_inv.json()
    assert "Анна" in inv["text"]
    assert "1350" in inv["text"]
    assert "Рябиновая, д. 44" in inv["text"]
    assert "Елена Васильевна" in inv["text"]

    # Проверяем отправку сообщения через бота
    r_send = client.post("/api/bot/send", json={
        "candidate_id": cand["id"],
        "vk_user_id": cand["vk_user_id"],
        "text": inv["text"]
    })
    assert r_send.status_code == 200
    assert r_send.json()["ok"] is True
    assert r_send.json()["channel"] == "vk"

def test_analytics_dashboard():
    r = client.get("/api/analytics/summary")
    assert r.status_code == 200
    data = r.json()
    assert "funnel" in data
    assert len(data["funnel"]) == 6
    assert data["baseline_conversion"] == 0.02
    assert data["probation_dropout"]["current"] == 38
    assert data["probation_dropout"]["forecast"] == 9
    assert data["company_avg_age"] == 52

def test_export_csv():
    r = client.get("/api/hr/export-csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    content = r.content.decode("utf-8-sig")
    assert "ФИО" in content
    assert "Соколова Анна" in content
    assert "Крафт-баллы" in content

def test_static_index():
    r = client.get("/")
    assert r.status_code == 200
    assert "html" in r.headers["content-type"]
    assert "ОЧАКОВО" in r.text or "Vite" in r.text or "root" in r.text
