"""Расчёт поведенческих метрик кандидата по телеметрии игры.

Формулы компетенций, удержания, мэтча вакансий, архетипа и досье повторяют эталон фронтенда
(frontend/src/services/localEngine.js: computeCompetencies, retentionScore, vacancyMatches, archetypeFor,
buildDossier), поэтому сервер и мини-приложение показывают одинаковые цифры.

Принимается телеметрия фронта (stations.lab / engineering / line / design с сырыми полями мини-игр)
и упрощённый формат контракта бэкенда (station_scores, calculator_prefs, quiz_correct_count).
Поверх общих метрик строятся блоки контракта: student_recommendations и hr_deep_dossier.

Формулы — эвристика прототипа; после пилота веса стоит откалибровать на реальном удержании.
"""
from __future__ import annotations

import math
import re
from dataclasses import asdict, dataclass, field
from typing import Any

from knowledge_base import (
    ARCHETYPES, BLOCKS, COMPETENCY_LABELS, COMPETENCY_META, DORM_PRICE_FULL, DORM_PRICE_STUDENT, MEAL_AVG_PRICE,
    MENTORS, MIRAPOLIS_COURSES, NDFL_RATE, NIGHT_SHIFT_UPLIFT, SEASON_MONTHS, SHIFTS_PER_MONTH, TOPIC_TALKING_POINTS,
    TOPIC_TIPS, VACANCIES, VACANCY_BY_ID, normalize_topic, topic_label,
)

STATION_ALIASES = {"bottling": "line", "rnd": "design", "tech": "engineering", "laboratory": "lab"}
STATION_IDS = ("lab", "engineering", "line", "design")
STATION_LABELS = {"lab": "Лаборатории", "engineering": "Инженерии", "line": "Линии розлива", "design": "Дизайна и Mirapolis"}
# Упрощённый формат контракта: оценки станций 0–100 сразу
STATION_SCORE_KEYS = {"lab_precision": "lab", "engineering_systems": "engineering", "bottling_speed": "line",
                      "rnd_mirapolis_score": "design"}
WHY_CARD_IDS = ["giant", "noprobation", "money", "dorm", "mentors"]
COMP_TO_ARCHETYPE = {"lab": "lab", "systems": "engineering", "speed": "line", "lms": "design"}
ARCHETYPE_TO_BLOCK = {"lab": "profile", "engineering": "engineering", "line": "line", "design": "free"}
FREE_PRACTICE_MARKERS = ("бесплатн", "оцифровк", "маркетинг", "дизайн", "blender", "маскот", "ролик",
                         "электронн", "оптимизац", "it-", "ит-", " it", "айти", "практика:")
FALLBACK = 55  # значение «неизвестной» компетенции для производных метрик контракта


def _clamp(x: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, x))


def _round(x: float | None) -> int | None:
    """Math.round из JS (половина — вверх), а не банковское округление Python."""
    return None if x is None else int(math.floor(x + 0.5))


def _num(v: Any) -> float | None:
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v.replace(",", ".").replace("%", "").strip())
        except ValueError:
            return None
    return None


def _get(d: dict, key: str, default: float) -> float:
    """Аналог `d.key ?? default` из JS."""
    v = _num(d.get(key))
    return default if v is None else v


def _lf(text: str) -> str:
    return text[:1].lower() + text[1:]


def _uf(text: str) -> str:
    return text[:1].upper() + text[1:]


def _v(c: dict, key: str) -> float:
    return c[key] if c.get(key) is not None else FALLBACK


@dataclass
class Metrics:
    stations: dict = field(default_factory=dict)          # станции фронта (lab / engineering / line / design)
    overrides: dict = field(default_factory=dict)         # оценки 0–100 из station_scores контракта
    ppe_attempts: int = 0
    ppe_wrong: int = 0
    quiz_correct: int = 0
    quiz_total: int = 0
    why_cards: list = field(default_factory=list)
    calc_interactions: int = 0
    night_ok: bool = False
    needs_dorm: bool = False
    exam_on_site: bool = False
    calculator: dict = field(default_factory=dict)
    asked_topics: dict = field(default_factory=dict)      # {topic: count}
    skipped: list = field(default_factory=list)
    total_points: int = 0
    code_unlocked: bool = False

    @property
    def quiz_acc(self) -> float | None:
        return self.quiz_correct / self.quiz_total if self.quiz_total else None

    @property
    def quiz_pct(self) -> float:
        return 100 * (self.quiz_acc if self.quiz_acc is not None else 0.6)

    @property
    def stations_done(self) -> int:
        return len(set(self.stations) | set(self.overrides))

    @property
    def topics_sorted(self) -> list[str]:
        return [t for t, _ in sorted(self.asked_topics.items(), key=lambda kv: -kv[1])]


def topic_counts(value: Any) -> dict[str, int]:
    """asked_topics в любом виде (объект {topic: n}, список id/подписей, список объектов) → {topic: n}."""
    counts: dict[str, int] = {}
    if isinstance(value, dict):
        items = [(k, v) for k, v in value.items()]
    elif isinstance(value, list):
        items = [((x.get("topic") or x.get("id")) if isinstance(x, dict) else x, 1) for x in value]
    else:
        items = []
    for key, n in items:
        tid = normalize_topic(key)
        if tid == "other":
            continue
        counts[tid] = counts.get(tid, 0) + max(int(_num(n) or 0), 0 if isinstance(value, dict) else 1)
    return counts


def normalize_telemetry(raw: dict | None) -> Metrics:
    raw = dict(raw or {})
    if isinstance(raw.get("telemetry"), dict):
        raw = {**raw["telemetry"], **{k: v for k, v in raw.items() if k != "telemetry"}}
    m = Metrics()

    stations = raw.get("stations")
    if isinstance(stations, list):
        stations = {str(s.get("id") or s.get("station")): s for s in stations if isinstance(s, dict)}
    for key, value in (stations or {}).items():
        sid = STATION_ALIASES.get(key, key)
        if isinstance(value, dict):
            m.stations[sid] = value
        elif _num(value) is not None:
            m.overrides[sid] = _clamp(_num(value))
    for key, sid in STATION_SCORE_KEYS.items():
        src = raw.get("station_scores") if isinstance(raw.get("station_scores"), dict) else {}
        value = _num(src.get(key)) if key in src else _num(raw.get(key))
        if value is not None and sid not in m.stations:
            m.overrides[sid] = _clamp(value)

    ppe = raw.get("ppe_attempts")
    m.ppe_attempts = int(_num(ppe) or 0)
    wrong = raw.get("ppe_wrong_picks")
    m.ppe_wrong = len(wrong) if isinstance(wrong, list) else int(_num(wrong) or 0)

    quiz = raw.get("quiz") if isinstance(raw.get("quiz"), dict) else {}
    correct = _num(quiz.get("correct"))
    total = _num(quiz.get("total"))
    if correct is None and _num(raw.get("quiz_correct_count")) is not None:
        correct = _num(raw.get("quiz_correct_count"))
        total = _num(raw.get("quiz_total")) or 5
    m.quiz_correct = int(correct or 0)
    m.quiz_total = int(max(total or 0, m.quiz_correct))

    cards = raw.get("why_ochakovo_cards_viewed")
    if isinstance(cards, list):
        m.why_cards = [str(c) for c in cards]
    elif _num(cards):
        m.why_cards = WHY_CARD_IDS[: int(_num(cards))]

    calc = raw.get("calculator") if isinstance(raw.get("calculator"), dict) else {}
    prefs = raw.get("calculator_prefs") if isinstance(raw.get("calculator_prefs"), dict) else {}
    last = calc.get("last") if isinstance(calc.get("last"), dict) else {}
    m.calculator = calc or ({"interactions": 1, "night_ok": bool(prefs.get("night_shifts")), "last": {
        "dorm": bool(prefs.get("needs_dorm"))}} if prefs else {})
    if "interactions" in calc:
        m.calc_interactions = int(_num(calc.get("interactions")) or 0)
    else:
        m.calc_interactions = 1 if (calc or prefs) else 0
    m.night_ok = bool(calc.get("night_ok") or prefs.get("night_shifts"))
    m.needs_dorm = bool(last.get("dorm") or prefs.get("needs_dorm"))
    m.asked_topics = topic_counts(raw.get("asked_topics"))
    m.exam_on_site = bool(prefs.get("exam_on_site_needed")) or "session" in m.asked_topics

    skipped = raw.get("skipped")
    m.skipped = [str(s) for s in skipped] if isinstance(skipped, list) else []
    m.total_points = int(_num(raw.get("total_points", raw.get("points"))) or 0)
    m.code_unlocked = (str(raw.get("unlocked_code") or "").strip() == "1978" or bool(raw.get("capsule_open"))
                       or bool(_num(raw.get("capsule_attempts"))))
    return m


# --------------------------------------------------------------------------------------
# Эталон фронтенда (localEngine.js)
# --------------------------------------------------------------------------------------
def compute_competencies(m: Metrics) -> dict[str, int | None]:
    st, ov = m.stations, m.overrides
    quiz_acc = m.quiz_acc

    safety = _clamp(100 - (m.ppe_attempts - 1) * 22 - m.ppe_wrong * 4, 20, 100) if m.ppe_attempts else None

    lab = None
    if "lab" in st:
        s = st["lab"]
        lab = 0.55 * _get(s, "titration_accuracy", 50) + 0.45 * (_get(s, "brix_correct", 2) / (_num(s.get("brix_total")) or 4) * 100)
    elif "lab" in ov:
        lab = ov["lab"]

    speed = None
    if "line" in st:
        s = st["line"]
        c, mm = _get(s, "defects_caught", 0), _get(s, "defects_missed", 0)
        ratio = c / (c + mm) if c + mm else 0.6
        speed = _clamp(ratio * 100 - _get(s, "false_rejects", 0) * 6 + _get(s, "ttn_correct", 0) / 3 * 8, 10, 100)
    elif "line" in ov:
        speed = ov["line"]

    systems = None
    if "engineering" in st:
        e = st["engineering"]
        ms = _num(e.get("mea_reaction_ms"))
        mea = 20 if ms is None else 100 if ms <= 1500 else _clamp(100 - ((ms - 1500) / 4500) * 60, 40, 100)
        systems = (0.5 * _get(e, "pressure_stability", 50) + 0.25 * mea
                   + 0.25 * (_get(e, "inspections_correct", 1) / (_num(e.get("inspections_total")) or 3) * 100))
    elif "engineering" in ov:
        systems = ov["engineering"]

    lms = None
    acc_pct = (quiz_acc if quiz_acc is not None else 0.6) * 100
    if "design" in st:
        d = st["design"]
        lms = 0.65 * (_get(d, "mirapolis_correct", 2) / (_num(d.get("mirapolis_total")) or 4) * 100) + 0.35 * acc_pct
    elif "design" in ov:
        lms = 0.65 * ov["design"] + 0.35 * acc_pct
    elif quiz_acc is not None:
        lms = quiz_acc * 80

    return {k: _round(v) for k, v in
            {"safety": safety, "lab": lab, "speed": speed, "systems": systems, "lms": lms}.items()}


def avg_known(c: dict) -> float:
    vals = [v for v in c.values() if v is not None]
    return sum(vals) / len(vals) if vals else 55


def archetype_for(c: dict) -> dict:
    best, best_v = "line", -1
    for comp_key, arch_id in COMP_TO_ARCHETYPE.items():
        v = c.get(comp_key)
        if v is not None and v > best_v:
            best, best_v = arch_id, v
    a = ARCHETYPES[best]
    return {"id": best, "name": a["name"], "tagline": a["tagline"], "icon": a["icon"]}


def vacancy_matches(c: dict) -> list[dict]:
    result = []
    for v in VACANCIES:
        s = sum(w * (c.get(k) if c.get(k) is not None else 50) for k, w in v["w"].items())
        result.append({"id": v["id"], "title": v["title"], "dept": v["dept"], "salary": v["salary"], "block": v["block"],
                       "match": _round(_clamp(52 + (s - 50) * 0.95, 38, 98))})
    result.sort(key=lambda x: -x["match"])   # sort стабильный, как Array.sort во фронте
    return result


def shift_readiness(m: Metrics) -> dict:
    if not m.calc_interactions:
        return {"level": "unknown", "label": "График 2/2 не изучал"}
    if m.night_ok:
        return {"level": "full", "label": "Готов к 2/2 с ночными сменами"}
    return {"level": "day", "label": "Рассматривает только дневные смены"}


def retention_score(m: Metrics, readiness: str | None = None) -> int:
    c = compute_competencies(m)
    r = (33 + 0.3 * avg_known(c) + 2.4 * min(len(m.why_cards), 5) + (6 if m.calc_interactions else 0)
         + (6 if m.night_ok else 0) + min(len(m.asked_topics), 4) * 1.5 + m.stations_done * 1.5)
    rd = readiness or ""
    if re.search(r"сразу|2 недели|сезона", rd, re.I):
        r += 6
    if re.search(r"присматриваюсь", rd, re.I):
        r -= 7
    r -= 3 * len(m.skipped)
    return _round(_clamp(r, 25, 97))


def probation_risk(retention: int) -> int:
    return _round(_clamp(100 - retention, 3, 70) * 0.55)


STRENGTH_GROWTH = [
    ("safety", "дисциплина и ТБ", "внимательнее к требованиям охраны труда"),
    ("lab", "лабораторная точность", "точность измерений"),
    ("speed", "скорость реакции на линии", "реакция на брак в потоке"),
    ("systems", "системное мышление", "чтение мнемосхем и последовательность действий"),
    ("lms", "управленческие инструменты", "SMART/SWOT и методы анализа"),
]


def strengths_growth(c: dict) -> tuple[list[str], list[str]]:
    strengths, growth = [], []
    for key, strong, weak in STRENGTH_GROWTH:
        v = c.get(key)
        if v is None:
            continue
        if v >= 75:
            strengths.append(strong)
        elif v < 55:
            growth.append(weak)
    return strengths, growth


def wants_free_practice(vacancy: str | None) -> bool:
    low = (vacancy or "").lower()
    return any(marker in low for marker in FREE_PRACTICE_MARKERS)


def block_for(vacancy: str | None, c: dict) -> str:
    title = (vacancy or "").strip().lower()
    for v in VACANCIES:
        if v["title"].lower() == title:
            return v["block"]
    if title:
        if wants_free_practice(title):
            return "free"
        for v in VACANCIES:
            head = v["title"].lower().split()[0].split("/")[0]
            if len(head) > 4 and head[:-1] in title:
                return v["block"]
    return ARCHETYPE_TO_BLOCK[archetype_for(c)["id"]]


def build_recommendation(m: Metrics, readiness: str | None = None) -> dict:
    c = compute_competencies(m)
    arch = archetype_for(c)
    matches = vacancy_matches(c)
    retention = retention_score(m, readiness)
    strengths, growth = strengths_growth(c)
    top = matches[0]
    verdict = (f"{arch['name']}. {arch['tagline']} Лучшее совпадение: «{top['title']}» ({top['match']}%). "
               + (f"Сильные стороны: {', '.join(strengths)}. " if strengths else "")
               + (f"Наставник поможет подтянуть: {', '.join(growth)}." if growth
                  else "Можно выходить на смену с наставником хоть завтра."))
    return {"archetype": arch, "competencies": c, "matches": matches[:4], "retention_score": retention,
            "strengths": strengths, "growth": growth, "verdict": verdict}


# --------------------------------------------------------------------------------------
# Блоки контракта бэкенда (студент + HR)
# --------------------------------------------------------------------------------------
def competency_radar(m: Metrics, c: dict) -> dict[str, int]:
    values = 45 + min(len(m.why_cards), 5) / 5 * 30 + (10 if m.code_unlocked else 0) + m.quiz_pct * 0.15
    radar = {
        "attention_to_detail": _v(c, "lab") * 0.8 + _v(c, "safety") * 0.2,
        "stress_resistance_speed": _v(c, "speed"),
        "technical_systems_thinking": _v(c, "systems") * 0.85 + _v(c, "lab") * 0.15,
        "management_mirapolis_readiness": _v(c, "lms"),
        "company_values_alignment": values,
    }
    return {k: _round(_clamp(v)) for k, v in radar.items()}


def safety_discipline(m: Metrics, c: dict) -> int:
    safety = c["safety"] if c["safety"] is not None else 60
    return _round(_clamp(0.7 * safety + 0.15 * m.quiz_pct + 0.15 * _v(c, "lms")))


def churn_risk(m: Metrics, c: dict, retention: int) -> tuple[str, list[str]]:
    positives, flags = [], []
    if m.night_ok:
        positives.append("заранее согласен на график 2/2 с ночными сменами")
    if m.needs_dorm and ("dorm" in m.asked_topics or "dorm" in m.why_cards):
        positives.append("ознакомлен с условиями общежития")
    if m.calc_interactions:
        positives.append("посчитал доход в калькуляторе — ожидания реалистичны")
    if "session" in m.asked_topics:
        positives.append("понимает, как совмещать смены и сессию")
    if c["safety"] is not None and c["safety"] < 60:
        flags.append("ошибки при выборе СИЗ — нужен усиленный инструктаж по ТБ")
    if m.skipped:
        flags.append(f"мини-игры пропущены в демо-режиме: {len(m.skipped)}")
    if c["speed"] is not None and c["speed"] < 55:
        flags.append("может не выдержать темп линии")
    if not m.calc_interactions:
        flags.append("не изучал график 2/2 — обсудите ночные смены до выхода")
    elif not m.night_ok:
        flags.append("рассматривает только дневные смены")
    if len(m.why_cards) < 2:
        flags.append("слабо знаком с компанией (мало карточек «Почему ОЧАКОВО»)")
    level = "Низкий" if retention >= 85 else "Средний" if retention >= 70 else "Высокий"
    if level == "Низкий":
        text = level + (f" (кандидат {'; '.join(positives[:3])})" if positives else "")
    else:
        text = level + (f" ({'; '.join(flags[:3])})" if flags else "")
    return text, flags


def financial_summary(m: Metrics, matches: list[dict]) -> dict:
    paid = next(x for x in matches if VACANCY_BY_ID[x["id"]]["salary_from"])
    vac = VACANCY_BY_ID[paid["id"]]
    gross = vac["salary_from"] * (1 + NIGHT_SHIFT_UPLIFT if (m.night_ok and vac["night_shifts"]) else 1)
    net = round(gross * (1 - NDFL_RATE) / 500) * 500
    return {
        "estimated_monthly_net": int(net),
        "dorm_savings_rub": (DORM_PRICE_FULL - DORM_PRICE_STUDENT) * SEASON_MONTHS if m.needs_dorm else 0,
        "meal_savings_rub": int(MEAL_AVG_PRICE * 0.5 * SHIFTS_PER_MONTH * SEASON_MONTHS),
        "gross_monthly": int(round(gross)),
        "based_on_vacancy": vac["title"],
        "period": f"экономия — за сезон март–август ({SEASON_MONTHS} мес.), доход — в месяц",
        "assumptions": [
            f"«На руки» = минимальная ставка вакансии минус НДФЛ {int(NDFL_RATE * 100)}%",
            f"ночные смены: оценочная надбавка +{int(NIGHT_SHIFT_UPLIFT * 100)}% (точный коэффициент — в отделе подбора)"
            if m.night_ok else "только дневные смены",
            f"общежитие: {DORM_PRICE_STUDENT} ₽ вместо {DORM_PRICE_FULL} ₽ в месяц" if m.needs_dorm else "общежитие не нужно",
            f"питание: компенсация 50% при среднем чеке ~{MEAL_AVG_PRICE} ₽ и {SHIFTS_PER_MONTH} сменах в месяц",
        ],
    }


def mirapolis_status(c: dict, m: Metrics, block: str) -> dict:
    lms = _v(c, "lms")
    if lms >= 85:
        status, label = "ready", "Готов к пред-аттестации в СДО Mirapolis"
    elif lms >= 70:
        status, label = "intro", "Нужен вводный модуль перед аттестацией"
    else:
        status, label = "full_course", "Рекомендован полный курс «Инструменты менеджмента»"
    courses = MIRAPOLIS_COURSES.get(block, MIRAPOLIS_COURSES["line"])
    return {"status": status, "label": label, "recommended_course": courses[-1], "courses": courses,
            "score": _round(lms), "quiz": f"{m.quiz_correct}/{m.quiz_total}" if m.quiz_total else "—"}


STUDENT_PHRASES = {
    "lab": "точность в лаборатории с рефрактометром ATAGO RX-7000i ({v}%)",
    "systems": "системное мышление на участке CO2 с абсорбером МЭА ({v}%)",
    "speed": "скорость на линии розлива SMI SK 500 P ({v}%)",
    "lms": "результат теста Mirapolis по SMART/SWOT ({v}%)",
    "safety": "безупречная техника безопасности ({v}%)",
}


def _ranked(c: dict, skip_safety: bool = True) -> list[str]:
    keys = [k for k in c if c[k] is not None and not (skip_safety and k == "safety")]
    return sorted(keys, key=lambda k: -c[k])


def build_pitch(m: Metrics, c: dict, primary: dict) -> str:
    order = _ranked(c) or ["safety"]
    parts = [STUDENT_PHRASES[k].format(v=c[k]) for k in order[:2] if c.get(k) is not None]
    head = " и ".join(parts) if parts else "твой результат в игре"
    text = f"{_uf(head)} — именно то, что нужно на позиции «{primary['title']}» в ОЧАКОВО!"
    extras = []
    if m.needs_dorm:
        extras.append("общежитие на Рябиновой за 3 400 ₽ закроет вопрос жилья")
    if m.exam_on_site:
        extras.append("сессию можно сдать прямо на заводе")
    if not extras:
        extras.append("для студентов нет испытательного срока — сразу официальный договор по ТК РФ")
    return text + " " + _uf(", а ".join(extras)) + "."


def build_summary(m: Metrics, c: dict, retention: int, mira: dict, primary: dict) -> str:
    if not m.ppe_attempts:
        s1 = "Раздевалку (выбор СИЗ) кандидат не проходил"
    elif m.ppe_attempts == 1:
        s1 = "Кандидат продемонстрировал безошибочное соблюдение ТБ (выбрал СИЗ с 1-й попытки)"
    elif m.ppe_attempts == 2:
        s1 = "Кандидат выбрал СИЗ со 2-й попытки — достаточно короткого повторного инструктажа"
    else:
        s1 = f"Кандидат выбрал СИЗ лишь с {m.ppe_attempts}-й попытки — обязателен усиленный вводный инструктаж"
    top = _ranked(c)[:2]
    parts = [s1 + (f"; сильные стороны — {' и '.join(f'{_lf(COMPETENCY_LABELS[k])} ({c[k]}%)' for k in top)}." if top else ".")]
    known = [k for k in c if c[k] is not None]
    if known:
        weak = min(known, key=lambda k: c[k])
        if c[weak] < 65:
            parts.append(f"Зона роста — {_lf(COMPETENCY_LABELS[weak])} ({c[weak]}%).")
    parts.append(f"Mirapolis: {_lf(mira['label'])} (тест {mira['score']}%, квизы {mira['quiz']}).")
    if retention >= 85:
        verdict = "Рекомендуется к ускоренному выходу без риска раннего отсева."
    elif retention >= 70:
        verdict = "Рекомендуется к выходу с плотным сопровождением наставника в первые 2 недели."
    else:
        verdict = "Рекомендуется дополнительное интервью: повышенный риск раннего отсева."
    parts.append(f"Лучший трек — «{primary['title']}», прогноз удержания {retention}%. {verdict}")
    return " ".join(parts)


def talking_points(m: Metrics, c: dict) -> list[str]:
    points = [TOPIC_TALKING_POINTS[t] for t in m.topics_sorted if t in TOPIC_TALKING_POINTS]
    if m.needs_dorm and "dorm" not in m.asked_topics:
        points.append(TOPIC_TALKING_POINTS["dorm"])
    if m.exam_on_site and "session" not in m.asked_topics:
        points.append(TOPIC_TALKING_POINTS["session"])
    if m.night_ok and "schedule" not in m.asked_topics:
        points.append("Подтвердить готовность к ночным сменам (20:00–8:00) и повышенный коэффициент оплаты")
    known = [k for k in c if c[k] is not None]
    if known:
        weak = min(known, key=lambda k: c[k])
        if c[weak] < 65:
            points.append(f"Проверить на собеседовании: {_lf(COMPETENCY_LABELS[weak])} ({c[weak]}%)")
    if m.ppe_attempts > 1:
        points.append("Повторить правила подбора СИЗ на вводном инструктаже")
    if not points:
        points.append("Обсудить дату выхода и выбрать наставника в Учебном центре (каб. 525)")
    return list(dict.fromkeys(points))[:6]


def best_station(c: dict) -> tuple[str, int] | None:
    """Станция с лучшим результатом — для шаблонов приглашений («высокий балл на станции Лаборатории»)."""
    comp_to_station = {"lab": "lab", "systems": "engineering", "speed": "line", "lms": "design"}
    ranked = [k for k in _ranked(c) if k in comp_to_station]
    return (comp_to_station[ranked[0]], c[ranked[0]]) if ranked else None


def evaluate(raw: dict | None, target_vacancy: str | None = None, readiness: str | None = None) -> dict:
    """Полный детерминированный профайлинг: рекомендация фронта + блоки контракта (студент и HR)."""
    m = normalize_telemetry(raw)
    rec = build_recommendation(m, readiness)
    c, retention = rec["competencies"], rec["retention_score"]
    matches = vacancy_matches(c)
    paid = [x for x in matches if x["block"] != "free"]
    free = [x for x in matches if x["block"] == "free"]
    # без желаемой вакансии основной считаем лучшую оплачиваемую позицию
    block = block_for(target_vacancy, c) if target_vacancy else paid[0]["block"]
    primary, secondary = (free[0], paid[0]) if block == "free" else (paid[0], free[0])
    archetype = rec["archetype"]
    second_comp = next((k for k in _ranked(c) if COMP_TO_ARCHETYPE.get(k) != archetype["id"] and k in COMP_TO_ARCHETYPE), None)
    combo = ARCHETYPES[COMP_TO_ARCHETYPE[second_comp]]["combo"] if second_comp else "Мастер Всех Станций"
    mira = mirapolis_status(c, m, block)
    mentor = MENTORS.get(block, MENTORS["line"])
    risk_text, flags = churn_risk(m, c, retention)

    track = BLOCKS[block]["full_label"]
    other = next((x for x in paid if x["block"] != block), None)
    if block != "free" and other and primary["match"] - other["match"] <= 4:
        track = f"{BLOCKS[block]['label']} / {BLOCKS[other['block']]['label']}"

    def vacancy_line(x: dict) -> str:
        v = VACANCY_BY_ID[x["id"]]
        return f"{v['title']} ({v['salary']}{' до вычета НДФЛ' if v['salary_from'] else ''})"

    student = {
        "archetype_title": f"{archetype['name']} и {combo}",
        "primary_vacancy": vacancy_line(primary),
        "secondary_vacancy": vacancy_line(secondary),
        "match_percentage": primary["match"],
        "personalized_pitch": build_pitch(m, c, primary),
        "financial_summary": financial_summary(m, matches),
        "archetype": archetype,
        "matches": matches,
    }
    dossier = {
        "candidate_track_block": track,
        "safety_and_discipline_score": safety_discipline(m, c),
        "probation_survival_probability": retention,
        "burnout_or_churn_risk": risk_text,
        "competency_radar": competency_radar(m, c),
        "ai_executive_summary": build_summary(m, c, retention, mira, primary),
        "recommended_mentor_type": f"{mentor['name']}, {mentor['role']} ({mentor['exp']}) — закрепляется через Учебный центр (каб. 525)",
        "interview_talking_points": talking_points(m, c),
        "block": block,
        "competencies": c,
        "probation_dropout_risk": probation_risk(retention),
        "shift_readiness": shift_readiness(m),
        "mirapolis_pre_attestation": mira,
        "asked_topics_labels": [topic_label(t) for t in m.topics_sorted],
        "risk_flags": flags,
    }
    return {"recommendation": rec, "student_recommendations": student, "hr_deep_dossier": dossier,
            "_meta": {"metrics": asdict(m), "primary": primary, "archetype": archetype, "retention": retention}}


# --------------------------------------------------------------------------------------
# Кандидат и досье в форме фронтенда (enrichCandidate / buildDossier)
# --------------------------------------------------------------------------------------
def enrich_candidate(c: dict) -> dict:
    """Добавляет производные поля, которые фронт считает в enrichCandidate()."""
    m = normalize_telemetry(c.get("telemetry"))
    comp = compute_competencies(m)
    arch = archetype_for(comp)
    block = c.get("block") or block_for(c.get("vacancy"), comp)
    return {**c, "block": block, "block_label": BLOCKS[block]["label"], "competencies": comp, "archetype": arch["name"],
            "archetype_id": arch["id"], "top_match": vacancy_matches(comp)[0],
            "retention_score": retention_score(m, c.get("readiness")), "shift": shift_readiness(m)}


def build_dossier(candidate: dict) -> dict:
    c = enrich_candidate(candidate)
    m = normalize_telemetry(c.get("telemetry"))
    comp = c["competencies"]
    topics = [{"topic": t, "label": topic_label(t), "count": m.asked_topics[t], "tip": TOPIC_TIPS.get(t, "")}
              for t in m.topics_sorted]
    mentor = MENTORS.get(c["block"], MENTORS["line"])
    risks = []
    if c["shift"]["level"] == "unknown":
        risks.append("Не изучал график 2/2: обсудите ночные смены до выхода")
    if c["shift"]["level"] == "day":
        risks.append("Хочет только дневные смены: предложите лабораторию или склад 2/2 день")
    if "dorm" in m.asked_topics:
        risks.append("Иногородний: важно заселение в общежитие в первый день")
    if "military" in m.asked_topics:
        risks.append("Вопрос военкомата: проговорите порядок отпуска на медкомиссию")
    if comp["safety"] is not None and comp["safety"] < 60:
        risks.append("Ошибки в выборе СИЗ: усиленный инструктаж по ТБ")
    if m.skipped:
        risks.append(f"Мини-игры пропущены в демо-режиме: {len(m.skipped)}")
    if re.search(r"присматриваюсь", c.get("readiness") or "", re.I):
        risks.append("Пока присматривается: нужен прогрев (экскурсия, мерч)")
    retention = c["retention_score"]
    risk = probation_risk(retention)
    matches = vacancy_matches(comp)
    arch = archetype_for(comp)
    name = " ".join((c.get("fio") or "").split()[:2])
    summary = (f"{name}, {c.get('age') if c.get('age') is not None else '—'} лет, {c.get('university') or '—'}. "
               f"Архетип: {arch['name']}. Лучший мэтч: «{matches[0]['title']}» {matches[0]['match']}%. "
               f"Прогноз удержания {retention}/100, риск ухода на испытательном/практике ≈ {risk}%. "
               + (f"Волнует: {', '.join(t['label'].lower() for t in topics[:3])}." if topics else "Вопросов маскоту не задавал."))
    return {
        "candidate": c,
        "competencies": [{**meta, "value": comp[meta["key"]]} for meta in COMPETENCY_META],
        "retention_score": retention,
        "probation_dropout_risk": risk,
        "shift_readiness": c["shift"],
        "asked_topics": topics,
        "mentor": {**mentor, "block": c["block"], "bridge": f"{c.get('age') or '20+'} + {mentor['age']} лет"},
        "matches": matches[:3],
        "archetype": arch,
        "risks": risks,
        "why_cards": m.why_cards,
        "calculator": m.calculator or None,
        "mirapolis_courses": MIRAPOLIS_COURSES.get(c["block"], MIRAPOLIS_COURSES["line"]),
        "summary": summary,
    }


# --------------------------------------------------------------------------------------
# Воронка по событиям телеметрии (шаги как в аналитике фронта)
# --------------------------------------------------------------------------------------
FUNNEL_STAGES = [
    ("opened", "Открыли игру (QR/ВК)"),
    ("started", "Начали квест"),
    ("ppe", "Прошли ТБ"),
    ("all_stations", "Прошли 4 станции"),
    ("capsule", "Открыли капсулу"),
    ("submitted", "Отправили анкету"),
]
PASSIVE_EVENTS = {"session_open", "vk_init", "bot_message", "bot_push", "hr_bot_invite", "evaluation"}


def session_funnel_stage(event_types: set[str], station_count: int, has_candidate: bool) -> int:
    """Индекс самого глубокого шага воронки, которого достигла сессия."""
    stage = 0
    if event_types - PASSIVE_EVENTS or station_count:
        stage = 1
    if "ppe_done" in event_types:
        stage = 2
    if station_count >= 4:
        stage = 3
    if "capsule_open" in event_types:
        stage = 4
    if has_candidate or "candidate_submitted" in event_types:
        stage = 5
    return stage
