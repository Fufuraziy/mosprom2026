"""Демо-данные: 12 кандидатов из frontend/src/data/seedCandidates.js и анонимные игровые сессии для воронки.

Кандидаты те же, что во встроенном движке фронта (вымышленные люди, контакты не настоящие), поэтому панель HR
выглядит одинаково онлайн и офлайн. Все записи помечены is_demo=True — их скрывает SHOW_DEMO_DATA=false или
?include_demo=false. Демо-кандидатам ВК-бот никогда не пишет по-настоящему, только в режиме симуляции.
"""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from knowledge_base import MERCH
from models import BotMessage, Candidate, GameSession, RaffleTicket, TelemetryEvent
from telemetry_engine import evaluate


def T(stations, why=("giant", "noprobation", "money"), ppe=1, wrong=(), quiz=(6, 7), calc=None, topics=None, skipped=()):
    """Телеметрия в формате фронта (как функция T() в seedCandidates.js)."""
    return {
        "why_ochakovo_cards_viewed": list(why), "ppe_attempts": ppe, "ppe_wrong_picks": list(wrong), "stations": stations,
        "quiz": {"correct": quiz[0], "total": quiz[1]}, "capsule_attempts": 1, "capsule_open": True,
        "calculator": calc or {"interactions": 0}, "asked_topics": topics or {}, "skipped": list(skipped), "duration_s": 900,
    }


def lab(acc, brix):
    return {"titration_accuracy": acc, "brix_correct": brix, "brix_total": 4, "tasting_done": True}


def eng(stab, ms, insp):
    return {"pressure_stability": stab, "mea_reaction_ms": ms, "inspections_correct": insp, "inspections_total": 3}


def line(c, m, f, ttn):
    return {"defects_caught": c, "defects_missed": m, "false_rejects": f, "ttn_correct": ttn}


def des(pan, mira):
    return {"pantone_match": pan, "mirapolis_correct": mira, "mirapolis_total": 4}


def calc(n, night, dept, nights, dorm=False):
    return {"interactions": n, "night_ok": night, "last": {"dept": dept, "nights": nights, "dorm": dorm}}


# Поля фронта + статус HR, мерч (id из MERCH) и демо-VK для части кандидатов
CANDIDATES = [
    dict(id="seed_01", fio="Смирнова Алина Олеговна", phone="+7 916 000-11-21", telegram="@alina_chem", email="alina.s@example.ru",
         birth_date="2004-03-14", vacancy="Химик-лаборант", readiness="К началу сезона (март–апрель)",
         university="РХТУ им. Д. И. Менделеева", study_level="4 курс", specialty="Химическая технология", points=1180,
         created_at="2026-10-22T10:12:00+03:00", status="invited", merch=["hoodie", "vip"], vk=True,
         telemetry=T({"lab": lab(96, 4), "engineering": eng(78, 2100, 3), "line": line(9, 2, 0, 3), "design": des(81, 4)},
                     why=("giant", "noprobation", "money", "dorm", "mentors"), calc=calc(6, False, "lab", 0),
                     topics={"session": 2, "schedule": 1})),
    dict(id="seed_02", fio="Ковалёв Денис Андреевич", phone="+7 925 000-32-10", telegram="@den_kip", email="",
         birth_date="2003-07-02", vacancy="Наладчик / специалист по автоматизации", readiness="Готов(а) выйти сразу",
         university="МГТУ им. Н. Э. Баумана", study_level="Выпускник", specialty="Автоматизация технологических процессов",
         points=1240, created_at="2026-10-22T13:40:00+03:00", status="interview", merch=["vip"], vk=True,
         telemetry=T({"lab": lab(71, 3), "engineering": eng(94, 1200, 3), "line": line(12, 1, 1, 3), "design": des(64, 4)},
                     calc=calc(4, True, "tech", 7), topics={"salary": 1, "military": 1})),
    dict(id="seed_03", fio="Ибрагимов Тимур Рустамович", phone="+7 987 000-45-67", telegram="", email="timur.i@example.ru",
         birth_date="2006-01-19", vacancy="Оператор линии розлива", readiness="Готов(а) выйти сразу",
         university="Колледж автоматизации и информационных технологий № 20", study_level="Колледж / СПО",
         specialty="Монтаж и эксплуатация оборудования", points=1010, created_at="2026-10-23T09:05:00+03:00", status="new",
         merch=["stickers", "box"], vk=False,
         telemetry=T({"lab": lab(52, 2), "engineering": eng(70, 2900, 2), "line": line(14, 1, 0, 3), "design": des(55, 2)},
                     ppe=2, wrong=("headphones",), calc=calc(9, True, "bottling", 8, dorm=True),
                     topics={"dorm": 3, "salary": 2, "military": 1, "transport": 1}, quiz=(5, 7))),
    dict(id="seed_04", fio="Лебедева Полина Игоревна", phone="+7 903 000-77-08", telegram="@polina_food", email="p.lebedeva@example.ru",
         birth_date="2004-11-30", vacancy="Технолог пищевого производства", readiness="После сессии / летом",
         university="Росбиотех (МГУПП)", study_level="4 курс", specialty="Технология продуктов брожения", points=1150,
         created_at="2026-10-21T18:22:00+03:00", status="new", merch=["hoodie"], vk=False,
         telemetry=T({"lab": lab(88, 4), "engineering": eng(85, 1800, 3), "line": line(8, 3, 1, 2), "design": des(77, 3)},
                     why=("giant", "mentors", "noprobation"), calc=calc(3, False, "tech", 0),
                     topics={"session": 1, "brands": 2, "mentor": 1})),
    dict(id="seed_05", fio="Орлов Максим Сергеевич", phone="+7 977 000-19-44", telegram="@orlov_mx", email="",
         birth_date="2005-05-08", vacancy="Оператор склада / кладовщик", readiness="Через 2 недели",
         university="Пензенский государственный университет", study_level="3 курс", specialty="Логистика", points=890,
         created_at="2026-10-23T11:31:00+03:00", status="new", merch=["stickers"], vk=True,
         telemetry=T({"lab": lab(60, 2), "engineering": eng(66, 3400, 2), "line": line(11, 2, 2, 3), "design": des(50, 3)},
                     why=("money", "dorm"), calc=calc(5, True, "warehouse", 4, dorm=True),
                     topics={"dorm": 2, "food": 1, "transport": 2}, quiz=(4, 7))),
    dict(id="seed_06", fio="Ким Виктория Александровна", phone="+7 926 000-55-31", telegram="@vika_design", email="v.kim@example.ru",
         birth_date="2003-09-21", vacancy="Практика: дизайн, IT, оцифровка линии", readiness="Пока присматриваюсь",
         university="Университет ИТМО", study_level="Магистратура", specialty="Цифровой дизайн", points=1060,
         created_at="2026-10-20T16:05:00+03:00", status="new", merch=["box"], vk=False,
         telemetry=T({"lab": lab(63, 3), "engineering": eng(61, 2600, 2), "line": line(7, 4, 1, 2), "design": des(97, 4)},
                     why=("giant", "mentors"), topics={"practice_docs": 2, "brands": 1})),
    dict(id="seed_07", fio="Петров Артём Владимирович", phone="+7 915 000-62-90", telegram="", email="artem.p@example.ru",
         birth_date="2002-12-12", vacancy="Машинист технологических установок", readiness="Готов(а) выйти сразу",
         university="НИУ МЭИ", study_level="Выпускник", specialty="Теплоэнергетика", points=1120,
         created_at="2026-10-22T20:48:00+03:00", status="new", merch=["hoodie", "stickers"], vk=False,
         telemetry=T({"lab": lab(68, 3), "engineering": eng(91, 1400, 3), "line": line(10, 2, 0, 3), "design": des(60, 3)},
                     why=("giant", "noprobation", "money", "mentors"), calc=calc(7, True, "tech", 7),
                     topics={"schedule": 2, "salary": 1})),
    dict(id="seed_08", fio="Захарова Дарья Михайловна", phone="+7 999 000-08-17", telegram="@dasha_z", email="",
         birth_date="2005-02-27", vacancy="Химик-лаборант", readiness="К началу сезона (март–апрель)", university="КубГТУ",
         study_level="3 курс", specialty="Биотехнология", points=980, created_at="2026-10-23T08:14:00+03:00", status="new",
         merch=["stickers"], vk=False,
         telemetry=T({"lab": lab(84, 3), "engineering": eng(72, 2400, 2), "line": line(9, 3, 1, 2), "design": des(70, 3)},
                     ppe=2, wrong=("scarf",), calc=calc(2, False, "lab", 0, dorm=True),
                     topics={"dorm": 2, "session": 1, "military": 0})),
    dict(id="seed_09", fio="Сидоренко Илья Павлович", phone="+7 950 000-23-56", telegram="@ilya_line", email="",
         birth_date="2006-06-03", vacancy="Оператор линии розлива", readiness="Через 2 недели",
         university="Тюменский индустриальный университет", study_level="1–2 курс", specialty="Машиностроение", points=760,
         created_at="2026-10-21T12:00:00+03:00", status="new", merch=[], vk=False,
         telemetry=T({"lab": lab(45, 2), "engineering": eng(58, None, 1), "line": line(10, 4, 3, 2), "design": des(48, 2)},
                     ppe=3, wrong=("slippers", "hoodie"), why=("money",), calc=calc(1, True, "bottling", 6, dorm=True),
                     topics={"dorm": 1, "military": 2, "salary": 1}, quiz=(3, 7))),
    dict(id="seed_10", fio="Николаева Софья Дмитриевна", phone="+7 916 000-90-12", telegram="", email="s.nikolaeva@example.ru",
         birth_date="2004-08-16", vacancy="Технолог пищевого производства", readiness="Готов(а) выйти сразу",
         university="Росбиотех (МГУПП)", study_level="Выпускник", specialty="Технология безалкогольных напитков", points=1210,
         created_at="2026-10-23T14:26:00+03:00", status="invited_vk", merch=["hoodie", "vip"], vk=True,
         telemetry=T({"lab": lab(92, 4), "engineering": eng(88, 1600, 3), "line": line(11, 1, 0, 3), "design": des(74, 4)},
                     why=("giant", "noprobation", "money", "dorm", "mentors"), calc=calc(5, True, "tech", 5),
                     topics={"brands": 1, "mentor": 1})),
    dict(id="seed_11", fio="Гусев Роман Евгеньевич", phone="+7 985 000-44-02", telegram="@roma_auto", email="",
         birth_date="2003-04-25", vacancy="Наладчик / специалист по автоматизации", readiness="После сессии / летом",
         university="Московский Политех", study_level="4 курс", specialty="Мехатроника и робототехника", points=1090,
         created_at="2026-10-22T08:58:00+03:00", status="new", merch=["box"], vk=False,
         telemetry=T({"lab": lab(58, 2), "engineering": eng(89, 1700, 3), "line": line(13, 2, 1, 3), "design": des(79, 4)},
                     calc=calc(3, False, "tech", 0), topics={"session": 2, "practice_docs": 1})),
    dict(id="seed_12", fio="Мельникова Ксения Романовна", phone="+7 903 000-31-75", telegram="@ksu_mirea", email="ksenia.m@example.ru",
         birth_date="2005-10-09", vacancy="Оператор склада / кладовщик", readiness="Пока присматриваюсь",
         university="МИРЭА — Российский технологический университет", study_level="3 курс", specialty="Информационные системы",
         points=840, created_at="2026-10-20T19:37:00+03:00", status="new", merch=["stickers"], vk=False,
         telemetry=T({"lab": lab(66, 3), "engineering": eng(63, 3100, 2), "line": line(9, 3, 1, 2), "design": des(83, 4)},
                     why=("money", "dorm", "noprobation"), topics={"schedule": 1, "food": 1, "contract": 1})),
]

CHANNELS = ["story", "menu", "bot", "catalog", "qr_campus", "story", "bot"]
ANON_TOPICS = ["dorm", "salary", "session", "schedule", "transport", "military", "food", "vacancies", "contract"]
STATION_ORDER = ["lab", "engineering", "line", "design"]
# 53 анонимные сессии по глубине: 0 — открыли, 1 — начали, 2 — прошли ТБ, 3 — все станции, 4 — открыли капсулу
ANON_STAGES = [0] * 12 + [1] * 10 + [2] * 11 + [3] * 9 + [4] * 11


def _events(sid: str, start: datetime, stage: int, rng: random.Random, telemetry: dict | None = None,
            topics: dict | None = None, merch=()) -> list[TelemetryEvent]:
    t = start
    out: list[TelemetryEvent] = []

    def add(kind: str, payload: dict | None = None, minutes: float = 1.0):
        nonlocal t
        t += timedelta(minutes=minutes)
        out.append(TelemetryEvent(session_id=sid, type=kind, payload=payload or {}, created_at=t, is_demo=True))

    add("session_open", {}, 0)
    if stage >= 1:
        add("navigate", {"to": "locker"}, 0.5)
        add("ppe_attempt", {"wrong": [], "missing": []}, 0.5)
    if stage >= 2:
        add("ppe_done", {"attempts": (telemetry or {}).get("ppe_attempts", 1)})
        for card in (telemetry or {}).get("why_ochakovo_cards_viewed", ["giant"]):
            add("why_ochakovo_cards_viewed", {"id": card}, 0.3)
    n_stations = 4 if stage >= 3 else (rng.randint(0, 3) if stage == 2 else 0)
    for st in STATION_ORDER[:n_stations]:
        result = ((telemetry or {}).get("stations") or {}).get(st, {})
        add("navigate", {"to": st}, 0.3)
        add("station_done", {"id": st, "points": rng.randint(150, 250), "result": result, "skipped": False}, rng.uniform(3, 6))
    for topic, n in (topics or {}).items():
        for _ in range(n):
            add("asked_topics", {"topic": topic}, 0.4)
    if stage >= 3:
        add("calculator", {"dept": "bottling", "nights": rng.choice([0, 4, 7]), "dorm": rng.random() < 0.5}, 1.5)
        add("capsule_attempt", {"code": "1980"}, 1)
    if stage >= 4:
        add("capsule_open", {"code": "1978"}, 0.5)
        for item in merch:
            add("raffle_ticket", {"item": item, "price": MERCH[item]["price"]}, 0.3)
    if stage >= 5:
        add("candidate_submitted", {}, 3)
    return out


def seed_database(db: Session) -> int:
    """Наполняет пустую БД. Возвращает число созданных кандидатов (0, если данные уже есть)."""
    if db.query(Candidate).count() or db.query(GameSession).count():
        return 0
    rng = random.Random(1978)
    now = datetime.now(timezone.utc)

    for i, row in enumerate(CANDIDATES):
        sid = f"demo-sess-{i + 1:02d}"
        created = datetime.fromisoformat(row["created_at"]).astimezone(timezone.utc)
        tele = {**row["telemetry"], "total_points": row["points"]}
        evaluation = evaluate(tele, row["vacancy"], row["readiness"])
        evaluation.pop("_meta")
        vk_id = 900000 + i + 1 if row["vk"] else None   # демо-id: реальная отправка демо-кандидатам заблокирована
        db.add(GameSession(id=sid, created_at=created - timedelta(minutes=40), updated_at=created,
                           channel=CHANNELS[i % len(CHANNELS)], platform="mobile_android" if i % 3 else "mobile_iphone",
                           vk_user_id=str(vk_id) if vk_id else None, last_stage="final", last_event="candidate_submitted",
                           telemetry=tele, asked_topics=list(row["telemetry"]["asked_topics"]), evaluation=evaluation,
                           is_demo=True))
        db.add_all(_events(sid, created - timedelta(minutes=40), 5, rng, tele, row["telemetry"]["asked_topics"], row["merch"]))
        contacts = [x for x in (row["phone"], row["telegram"], row["email"]) if x]
        status = row["status"]
        cand = Candidate(
            id=row["id"], session_id=sid, created_at=created, full_name=row["fio"],
            birth_date=date.fromisoformat(row["birth_date"]), contact_info=" · ".join(contacts),
            phone=row["phone"] or None, telegram=row["telegram"] or None, email=row["email"] or None,
            vk_user_id=str(vk_id) if vk_id else None, vk_source="demo" if vk_id else None,
            vk_profile_url=f"https://vk.com/id{vk_id}" if vk_id else None,
            target_vacancy=row["vacancy"], readiness_date=row["readiness"], university=row["university"],
            course_or_grad_year=row["study_level"], specialty=row["specialty"], consent=True, consent_at=created,
            consent_version="demo", total_points=row["points"], purchased_merch_tickets=list(row["merch"]),
            promo_code=f"OCHAKOVO-1978-D{i + 1:03d}", telemetry=tele, evaluation=evaluation,
            block=evaluation["hr_deep_dossier"]["block"], status=status,
            mirapolis_status="queued" if status in ("interview", "invited_vk") else "not_assigned",
            mirapolis_assigned_at=created + timedelta(days=1) if status in ("interview", "invited_vk") else None,
            invited_at=created + timedelta(hours=6) if status != "new" else None, is_demo=True,
        )
        db.add(cand)
        for item in row["merch"]:
            db.add(RaffleTicket(session_id=sid, candidate_id=cand.id, item=item, cost=MERCH[item]["price"],
                                ticket_no=f"OCH-{rng.randint(100000, 999999)}", created_at=created, is_demo=True))
        if status == "invited_vk":
            db.add(BotMessage(direction="out", kind="invite", channel="vk_demo", vk_user_id=str(vk_id), candidate_id=cand.id,
                              text=f"Привет, {row['fio'].split()[1]}! Ты круто прошёл(-ла) симулятор ОЧАКОВО и набрал(а) "
                                   f"высокий балл на станции Лаборатории. Приглашаем тебя на оплачиваемую практику и "
                                   f"экскурсию на ул. Рябиновая, 44!",
                              delivered=False, simulated=True, created_at=created + timedelta(hours=6), is_demo=True))

    for j, stage in enumerate(ANON_STAGES):
        sid = f"demo-anon-{j + 1:03d}"
        start = now - timedelta(days=rng.randint(0, 29), hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
        topics = {t: 1 for t in rng.sample(ANON_TOPICS, k=rng.choice([0, 0, 1, 1, 2]))} if stage >= 1 else {}
        merch = rng.sample(["stickers", "box", "hoodie"], k=rng.choice([0, 1])) if stage >= 4 else []
        db.add(GameSession(id=sid, created_at=start, updated_at=start + timedelta(minutes=20), channel=rng.choice(CHANNELS),
                           platform=rng.choice(["mobile_android", "mobile_iphone", "desktop_web"]),
                           last_stage=["locker", "locker", "lab", "design", "final"][stage],
                           telemetry={"asked_topics": topics}, asked_topics=list(topics), is_demo=True))
        db.add_all(_events(sid, start, stage, rng, None, topics, merch))
        for item in merch:
            db.add(RaffleTicket(session_id=sid, item=item, cost=MERCH[item]["price"],
                                ticket_no=f"OCH-{rng.randint(100000, 999999)}", created_at=start, is_demo=True))

    db.commit()
    return len(CANDIDATES)
