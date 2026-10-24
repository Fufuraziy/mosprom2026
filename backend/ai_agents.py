"""
ИИ-Агенты платформы «ОЧАКОВО: Крафт-код 1978»:
1. Агент №1 («Крафти» — Маскот и консультант по адаптации студентов)
2. Агент №2 (HR Рекомендатель: скоринг компетенций, прогноз удержания, досье и генератор офферов)
"""
import re
from typing import Dict, Any, List, Optional

# Справочник тем
TOPIC_LABELS = {
    "dorm": "Общежитие и быт",
    "salary": "Зарплата и выплаты",
    "session": "Сессия и учёба",
    "military": "Военкомат",
    "schedule": "Смены и график",
    "contract": "Оформление и ТК РФ",
    "food": "Питание и столовая",
    "transport": "Как добраться",
    "uniform": "Спецодежда и СИЗ",
    "mentor": "Наставничество",
    "health": "Здравпункт",
    "pass": "Пропускная система",
    "practice_docs": "Документы практики",
    "brands": "Бренды и продукция",
    "history": "История и рекорды",
    "vacancies": "Вакансии и старт",
    "other": "Другой вопрос"
}

TOPIC_KEYWORDS = {
    "dorm": ["общаг", "общежит", "комнат", "рябинов", "36", "проживан", "засел", "фен", "душ", "кухн", "комендант"],
    "salary": ["зарплат", "зп", "доход", "деньг", "выплат", "аванс", "12", "27", "ндфл", "ночн", "рубл", "ставк"],
    "session": ["сесси", "экзамен", "зачет", "учеб", "пары", "универ", "институт", "колледж", "отпуск"],
    "military": ["военком", "арми", "повестк", "призыв", "отсрочк", "учет"],
    "schedule": ["график", "смен", "2/2", "часов", "ноч", "выходн", "перерыв", "отсыпн", "режим"],
    "contract": ["договор", "оформлен", "тк", "трудов", "стаж", "испытательн", "книжк", "срочн"],
    "food": ["питани", "столов", "обед", "ужин", "еда", "компенсац", "карточк", "50%"],
    "transport": ["добрат", "автобус", "метро", "озерн", "кунцевск", "говорово", "проезд", "маршрут", "адрес"],
    "uniform": ["одежд", "форма", "халат", "сиз", "ботинк", "беруш", "перчатк", "стирк", "прачечн"],
    "mentor": ["наставник", "обучен", "курсы", "мираполис", "mirapolis", "опыт", "помощ"],
    "health": ["врач", "здравпункт", "больничн", "1370", "1303", "медосмотр", "поликлиник"],
    "pass": ["пропуск", "турникет", "штраф", "500", "потер"],
    "practice_docs": ["договор", "дневник", "отчет", "приказ", "характеристик", "каб 525", "учебный центр"],
    "brands": ["квас", "coolcola", "kern", "кола", "сок", "лимонад", "мохито", "limontel", "ах", "напитк"],
    "history": ["1978", "олимпиад", "пэт", "1994", "1995", "1996", "рекорд", "завод", "музей"],
    "vacancies": ["ваканси", "лаборант", "технолог", "оператор", "машинист", "склад", "работа", "устроит"]
}

FAQ_KNOWLEDGE_BASE = {
    "dorm": {
        "reply": "Общежитие ОЧАКОВО находится на ул. Рябиновая, 36, к. 2 (в 10 минутах пешком от завода на Рябиновой, 44). Для студентов стоимость всего 3 400 ₽ в месяц (50% компенсирует компания!). Комнаты на 4–6 человек, на каждом этаже кухни со всей техникой и посудой. Важный лайфхак: фен нужно взять свой! Вход закрывается с 23:00 до 6:00.",
        "suggestions": ["Как добраться до завода?", "Сколько стоит питание?", "Когда выплачивается зарплата?"]
    },
    "salary": {
        "reply": "Зарплата выплачивается строго 2 раза в месяц: 12 и 27 числа на банковскую карту. Все суммы в вакансиях (от 56 000 до 70 000+ ₽) указаны до вычета НДФЛ. За ночные смены начисляется повышенный коэффициент. Расчётный листок приходит на электронную почту.",
        "suggestions": ["Как совмещать с учёбой?", "Есть ли общежитие?", "Какие вакансии есть?"]
    },
    "session": {
        "reply": "В ОЧАКОВО отличные условия для студентов: в высокий сезон (март–сентябрь) экзамены и зачёты можно сдавать прямо на территории комбината! Главное — заранее согласовать даты сессии с руководителем смены, и на эти дни тебе не будут ставить рабочие смены.",
        "suggestions": ["Какое общежитие?", "Есть ли испытательный срок?", "Где оформить практику?"]
    },
    "military": {
        "reply": "Воинский учёт ведётся официально и строго по закону. При получении повестки нужно написать заявление в отдел кадров и приложить оригинал повестки. Дни прохождения медкомиссии согласовываются с руководителем с сохранением места.",
        "suggestions": ["Какой график работы?", "Где общежитие?", "Сколько платят?"]
    },
    "schedule": {
        "reply": "Основные графики: сменный 2/2 по 12 часов (дневные смены 8:00–20:00, ночные 20:00–8:00) либо график день–ночь–отсыпной–выходной. В высокий сезон возможны дополнительные смены по повышенной ставке.",
        "suggestions": ["Как доехать до завода?", "Как оплачивается ночная смена?", "Как насчёт сессии?"]
    },
    "contract": {
        "reply": "С первого дня заключается официальный срочный трудовой договор по ТК РФ с записью в электронную трудовую книжку. Главный плюс для студентов: у нас НЕТ испытательного срока! Вместо него — производственная практика с наставником.",
        "suggestions": ["Со скольки лет берут?", "Сколько платят лаборанту?", "Как оформить документы?"]
    },
    "food": {
        "reply": "На комбинате работает собственная столовая: горячие комплексные обеды (11:30–14:30) и ужины (20:30–22:00). Компания компенсирует 50% стоимости питания! Наличные не нужны: расчёт идёт по карточке сотрудника с удержанием остатка из зарплаты.",
        "suggestions": ["Где находится общежитие?", "Как добраться до завода?", "Какая зарплата?"]
    },
    "transport": {
        "reply": "Завод и офис: г. Москва, ул. Рябиновая, д. 44. Доехать легко: бесплатный корпоративный автобус от м. Озёрная; городские автобусы № 275 и 610 от м. Кунцевская; № 259 от пл. Рабочий посёлок; № 221, 259, 275 от м. Говорово.",
        "suggestions": ["Где находится общежитие?", "Какой график смен?", "Какие вакансии открыты?"]
    },
    "uniform": {
        "reply": "Каждому сотруднику бесплатно выдаётся фирменная удобная спецодежда с манифестом на спине «Я ДЕЛАЮ НАТУРАЛЬНЫЕ НАПИТКИ» и все необходимые СИЗ (защитная обувь, перчатки, очки, беруши). На территории завода работает бесплатная прачечная (стирка 1–2 дня).",
        "suggestions": ["Нужны ли свои СИЗ?", "Как устроен первый день?", "Кто такой наставник?"]
    },
    "mentor": {
        "reply": "За каждым молодым специалистом закрепляется опытный Гранд-мастер с 15–30-летним стажем. Он лично обучает работе на оборудовании. Дополнительно доступна мобильная СДО Mirapolis с курсами по менеджменту: SMART, SWOT, диаграмма Исикавы, 5 Почему.",
        "suggestions": ["Как пройти тест в Mirapolis?", "Какие вакансии есть?", "Как сдавать сессию?"]
    },
    "health": {
        "reply": "На территории комбината круглосуточно работает лицензированный здравпункт. Внутренние телефоны: доб. 1370 или 1303. В случае недомогания тебе окажут первую помощь. Больничный лист оформляется официально через городскую поликлинику.",
        "suggestions": ["Как получить пропуск?", "Какой график работы?", "Как с питанием?"]
    },
    "pass": {
        "reply": "Электронный пропуск оформляется в отделе кадров в первый день. Он служит ключом на проходной завода и карточкой оплаты питания в столовой. Береги его: при утере штраф составляет 500 ₽.",
        "suggestions": ["Где находится отдел кадров?", "Что нужно в первый день?", "Как доехать?"]
    },
    "practice_docs": {
        "reply": "Все документы по практике (договор от вуза/колледжа, приказ, дневник практики, индивидуальное задание, характеристика) оформляются в Учебном центре ОЧАКОВО: главный корпус, 5-й этаж, кабинет 525. Тел.: 8 800 100 77 77 (доб. 1155).",
        "suggestions": ["Берут ли без опыта?", "Со скольки лет?", "Можно ли остаться в штате?"]
    },
    "brands": {
        "reply": "ОЧАКОВО — лидер натурального брожения! Наши флагманы: легендарный квас «Очаковский» (двойное брожение), премиальная CoolCola, безалкогольный солодовый напиток KERN (ананас, малина), лимонады «Таёжная кола», «Тархун-мята», «Ситро-апельсин», «Дюшес-Барбарис», Мохито Fresh и Limontel.",
        "suggestions": ["Как делают квас?", "Где варят KERN?", "Какие вакансии в цехе варки?"]
    },
    "history": {
        "reply": "Комбинат основан в 1978 году к Олимпиаде-80 как самый мощный в Европе. ОЧАКОВО — мировой трендсеттер: первыми в мире разлили пиво в ПЭТ (1994), первыми в РФ выпустили напитки в банке (1995), первыми в промышленности воссоздали натуральное молочнокислое и дрожжевое брожение кваса (1996). 100% российский капитал без иностранных инвесторов!",
        "suggestions": ["Что за капсула 1978 года?", "Где музей комбината?", "Какие вакансии есть?"]
    },
    "vacancies": {
        "reply": "Сейчас открыт весенне-летний набор: Химики-лаборанты (от 60 000 ₽), Технологи / Операторы варки (от 70 000 ₽), Операторы линии розлива (от 70 000 ₽), Машинисты техустановок CO2 (от 70 000 ₽), Операторы склада и кладовщики (от 56 000 до 60 000+ ₽), а также бесплатная IT-практика. Приём строго с 18 лет! Звони: 8 800 100 77 77 (доб. 1155).",
        "suggestions": ["Как подать анкету?", "Какое общежитие?", "С чего начать?"]
    }
}

MENTORS = {
    "profile": {"name": "Елена Васильевна Морозова", "role": "Главный химик-технолог ЛЭП", "age": 49, "exp": "24 года в ОЧАКОВО", "quote": "Научу слышать каждую ноту вкуса и работать на ATAGO с закрытыми глазами."},
    "engineering": {"name": "Виктор Сергеевич Громов", "role": "Ведущий инженер КИПиА", "age": 54, "exp": "28 лет на комбинате", "quote": "Мнемосхемы и абсорбер CO2 станут для тебя как родные. Главное — дисциплина."},
    "line": {"name": "Михаил Николаевич Соколов", "role": "Старший мастер линии розлива", "age": 52, "exp": "26 лет в ОЧАКОВО", "quote": "Линия SMI SK 500 P выдаёт 500 банок в минуту. Передам тебе весь ритм цеха."},
    "free": {"name": "Анна Павловна Романова", "role": "Руководитель Учебного центра и проектов", "age": 46, "exp": "19 лет в компании", "quote": "Помогу упаковать твои идеи в реальные цифровые сервисы и макеты комбината."}
}

VACANCIES_DATA = [
    {"id": "chem", "title": "Химик-лаборант", "dept": "Лаборатория качества", "salary": "от 60 000 ₽", "block": "profile", "weights": {"safety": 0.2, "lab": 0.5, "speed": 0.1, "systems": 0.1, "lms": 0.1}},
    {"id": "technologist", "title": "Технолог пищевого производства", "dept": "Цех варки и ЛЭП", "salary": "от 70 000 ₽", "block": "profile", "weights": {"safety": 0.15, "lab": 0.35, "speed": 0.1, "systems": 0.25, "lms": 0.15}},
    {"id": "machinist", "title": "Машинист технологических установок", "dept": "Участок углекислоты CO2", "salary": "от 70 000 ₽", "block": "engineering", "weights": {"safety": 0.3, "lab": 0.05, "speed": 0.1, "systems": 0.45, "lms": 0.1}},
    {"id": "automation", "title": "Наладчик / автоматизация", "dept": "Инженерная служба", "salary": "от 70 000 ₽", "block": "engineering", "weights": {"safety": 0.2, "lab": 0.05, "speed": 0.2, "systems": 0.45, "lms": 0.1}},
    {"id": "bottling", "title": "Оператор линии розлива", "dept": "Цех розлива", "salary": "от 70 000 ₽", "block": "line", "weights": {"safety": 0.25, "lab": 0.05, "speed": 0.5, "systems": 0.1, "lms": 0.1}},
    {"id": "warehouse", "title": "Оператор склада / кладовщик", "dept": "Складской комплекс", "salary": "от 56 000 ₽", "block": "line", "weights": {"safety": 0.2, "lab": 0.05, "speed": 0.35, "systems": 0.2, "lms": 0.2}},
    {"id": "digital", "title": "Практика: дизайн, IT, оцифровка", "dept": "Офис и Учебный центр", "salary": "Практика / стажировка", "block": "free", "weights": {"safety": 0.1, "lab": 0.1, "speed": 0.1, "systems": 0.3, "lms": 0.4}}
]

def classify_topic(message: str) -> str:
    msg = message.lower()
    for topic, words in TOPIC_KEYWORDS.items():
        for w in words:
            if w in msg:
                return topic
    return "other"

class MascotAgent:
    """ИИ-Агент №1 («Крафти»): диалоговый агент маскота"""
    @staticmethod
    def chat(message: str, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        topic = classify_topic(message)
        kb_entry = FAQ_KNOWLEDGE_BASE.get(topic)
        if kb_entry:
            reply = kb_entry["reply"]
            suggestions = kb_entry["suggestions"]
        else:
            reply = (
                "Привет! Я Крафти — цифровой маскот ОЧАКОВО. "
                "Я знаю всё про работу, стажировку и практику на комбинате: общежитие за 3 400 ₽, "
                "сдачу сессии на территории завода, смены 2/2, зарплату от 56 000 до 70 000+ ₽, питание и СИЗ. "
                "О чём тебе подробнее рассказать?"
            )
            suggestions = ["Расскажи про общежитие", "Как сдавать сессию?", "Сколько платят?", "Какие есть вакансии?"]
        
        return {
            "reply": reply,
            "topic": topic,
            "topic_label": TOPIC_LABELS.get(topic, "Консультация"),
            "suggestions": suggestions
        }

class RecSysAgent:
    """ИИ-Агент №2 (HR Рекомендатель и Аналитик Досье)"""

    @staticmethod
    def compute_competencies(telemetry: Dict[str, Any]) -> Dict[str, int]:
        stations = telemetry.get("stations", {})
        ppe_att = telemetry.get("ppe_attempts", 1)
        ppe_wrong = len(telemetry.get("ppe_wrong_picks", []))
        
        # 1. Safety (0-100)
        safety = max(20, min(100, 100 - (ppe_att - 1) * 22 - ppe_wrong * 4))
        
        # 2. Lab (0-100)
        lab_st = stations.get("lab", {})
        titration = lab_st.get("titration_accuracy", 75)
        brix = (lab_st.get("brix_correct", 3) / max(1, lab_st.get("brix_total", 4))) * 100
        lab_comp = round(titration * 0.6 + brix * 0.4)
        
        # 3. Speed / Focus (0-100)
        line_st = stations.get("line", {})
        defects = line_st.get("defects_caught", 8)
        missed = line_st.get("defects_missed", 1)
        false_rej = line_st.get("false_rejects", 0)
        ttn = (line_st.get("ttn_correct", 3) / 3) * 100
        line_acc = max(20, min(100, defects * 8 - missed * 12 - false_rej * 10 + 30))
        speed_comp = round(line_acc * 0.6 + ttn * 0.4)
        
        # 4. Systems / Engineering (0-100)
        eng_st = stations.get("engineering", {})
        pressure = eng_st.get("pressure_stability", 80)
        mea_ms = eng_st.get("mea_reaction_ms")
        mea_score = 90 if (mea_ms and mea_ms < 2500) else (60 if mea_ms else 40)
        systems_comp = round(pressure * 0.5 + mea_score * 0.3 + 20)
        
        # 5. LMS / Management (0-100)
        des_st = stations.get("design", {})
        mira = (des_st.get("mirapolis_correct", 4) / max(1, des_st.get("mirapolis_total", 4))) * 100
        quiz_data = telemetry.get("quiz", {})
        q_acc = (quiz_data.get("correct", 6) / max(1, quiz_data.get("total", 7))) * 100
        lms_comp = round(mira * 0.6 + q_acc * 0.4)
        
        return {
            "safety": max(30, min(100, safety)),
            "lab": max(30, min(100, lab_comp)),
            "speed": max(30, min(100, speed_comp)),
            "systems": max(30, min(100, systems_comp)),
            "lms": max(30, min(100, lms_comp))
        }

    @classmethod
    def determine_archetype(cls, comp: Dict[str, int]) -> Dict[str, str]:
        # Выбираем сильнейшую компетенцию
        key_max = max(comp, key=comp.get)
        if key_max == "lab":
            return {"id": "lab", "name": "Хранитель Точности", "tagline": "Твой конёк — безупречный контроль качества проб, титрование и Brix.", "icon": "FlaskConical"}
        elif key_max in ("systems", "safety") and comp["systems"] >= 70:
            return {"id": "engineering", "name": "Инженер Потока", "tagline": "Ты мгновенно видишь отклонения мнемосхем и держишь давление под контролем.", "icon": "Gauge"}
        elif key_max == "speed":
            return {"id": "line", "name": "Капитан Линии", "tagline": "Рекордная реакция на линии SMI SK 500 P и точное паллетирование по ТТН.", "icon": "Factory"}
        else:
            return {"id": "design", "name": "Архитектор Бренда", "tagline": "Умение соединять дизайн вкусов KERN с передовыми инструментами менеджмента.", "icon": "Palette"}

    @classmethod
    def calculate_retention(cls, comp: Dict[str, int], telemetry: Dict[str, Any]) -> int:
        avg_comp = sum(comp.values()) / len(comp)
        why_cnt = len(telemetry.get("why_ochakovo_cards_viewed", []))
        calc_cnt = telemetry.get("calculator", {}).get("interactions", 0)
        skipped_cnt = len(telemetry.get("skipped", []))
        
        base = 50 + (avg_comp * 0.3) + (why_cnt * 2) + min(10, calc_cnt * 2) - (skipped_cnt * 5)
        return int(max(35, min(97, round(base))))

    @classmethod
    def match_vacancies(cls, comp: Dict[str, int]) -> List[Dict[str, Any]]:
        results = []
        for vac in VACANCIES_DATA:
            score = 0
            for k, w in vac["weights"].items():
                score += comp.get(k, 60) * w
            match_pct = max(45, min(98, round(score)))
            results.append({
                "id": vac["id"],
                "title": vac["title"],
                "dept": vac["dept"],
                "salary": vac["salary"],
                "block": vac["block"],
                "match": match_pct
            })
        results.sort(key=lambda x: x["match"], reverse=True)
        return results

    @classmethod
    def build_recommendation(cls, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        comp = cls.compute_competencies(telemetry)
        archetype = cls.determine_archetype(comp)
        retention = cls.calculate_retention(comp, telemetry)
        matches = cls.match_vacancies(comp)
        
        best = matches[0]
        strengths = []
        if comp["safety"] >= 80: strengths.append("Высокая культура охраны труда и работы с СИЗ")
        if comp["lab"] >= 80: strengths.append("Филигранная точность химического анализа")
        if comp["speed"] >= 80: strengths.append("Быстрая реакция на линии упаковки")
        if comp["systems"] >= 80: strengths.append("Системное понимание технологических установок")
        if comp["lms"] >= 80: strengths.append("Отличное владение методологиями менеджмента")
        if not strengths: strengths.append("Уверенный баланс инженерных и аналитических навыков")

        verdict = (
            f"По результатам испытаний в ЛЭП и цехах твой архетип — «{archetype['name']}». "
            f"Наивысший мэтч ({best['match']}%) зафиксирован с вакансией «{best['title']}» ({best['dept']}). "
            f"Прогноз удержания в команде ОЧАКОВО составляет {retention}% с минимальным риском на адаптационном периоде!"
        )

        return {
            "archetype": archetype,
            "competencies": comp,
            "matches": matches,
            "retention_score": retention,
            "strengths": strengths,
            "growth": [],
            "verdict": verdict
        }

    @classmethod
    def generate_invite_draft(cls, candidate: Any) -> Dict[str, Any]:
        fio = candidate.fio.strip()
        first_name = fio.split()[1] if len(fio.split()) > 1 else fio.split()[0]
        
        telemetry = {}
        if hasattr(candidate, "telemetry_json") and candidate.telemetry_json:
            import json
            try:
                telemetry = json.loads(candidate.telemetry_json)
            except Exception:
                pass
        
        comp = cls.compute_competencies(telemetry)
        archetype = cls.determine_archetype(comp)
        matches = cls.match_vacancies(comp)
        best_match = matches[0] if matches else {"title": candidate.vacancy, "match": 92}
        
        block = "profile" if "лаборант" in candidate.vacancy.lower() or "технолог" in candidate.vacancy.lower() else (
            "engineering" if "машинист" in candidate.vacancy.lower() or "автоматиз" in candidate.vacancy.lower() else "line"
        )
        mentor = MENTORS.get(block, MENTORS["line"])
        
        asked = telemetry.get("asked_topics", {})
        topic_clause = ""
        if "dorm" in asked:
            topic_clause = " Заселение в общежитие на Рябиновой 36к2 (3 400 ₽/мес) организуем в день приезда."
        elif "session" in asked:
            topic_clause = " График смен скорректируем под твою сессию, экзамены можно сдать прямо на заводе."
        elif "salary" in asked:
            topic_clause = f" Оплата смен 2 раза в месяц, ставка по вакансии «{best_match['title']}»."

        text = (
            f"{first_name}, привет! Это команда подбора ОЧАКОВО. "
            f"Ты набрал(а) {candidate.points} баллов в квесте «Крафт-код 1978», твой архетип — «{archetype['name']}», "
            f"а мэтч с позицией «{best_match['title']}» составил рекордные {best_match['match']}%! "
            f"Твой наставник — {mentor['name']} ({mentor['role']}).{topic_clause} "
            f"Ждём тебя в Учебном центре комбината: ул. Рябиновая, д. 44, каб. 525. Готов(а) к старту?"
        )

        based_on = [
            f"{candidate.points} Крафт-баллов",
            f"Архетип: {archetype['name']}",
            f"Мэтч: {best_match['title']} ({best_match['match']}%)",
            f"Наставник: {mentor['name']} ({mentor['age']} лет, мост поколений)",
        ]
        if asked:
            based_on.append(f"Учтены вопросы: {', '.join(TOPIC_LABELS.get(k, k) for k in asked.keys())}")

        keyboard = [
            [{"label": "Да, готов(а) приехать!", "payload": "iv_yes", "color": "positive"}],
            [{"label": "Уточнить дату собеседования", "payload": "iv_question", "color": "secondary"}]
        ]

        return {
            "text": text,
            "based_on": based_on,
            "keyboard": keyboard
        }
