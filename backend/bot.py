"""
Модуль ВК-бота сообщества «ОЧАКОВО: Карьера и практика».
Обеспечивает работу симулятора на фронтенде и готов к подключению VK Bots Long Poll / Callback API.
"""
from typing import Dict, Any, List, Optional
from .ai_agents import MascotAgent, TOPIC_LABELS

MAIN_KEYBOARD = [
    [{"label": "🎮 Запустить Mini App", "payload": "open_app", "color": "primary"}],
    [
        {"label": "🏠 Общежитие за 3 400 ₽", "payload": "dorm", "color": "secondary"},
        {"label": "🎓 Сессия на заводе", "payload": "session", "color": "secondary"}
    ],
    [
        {"label": "💰 Зарплата 12 и 27 числа", "payload": "salary", "color": "secondary"},
        {"label": "📋 Вакансии 18+", "payload": "vacancies", "color": "secondary"}
    ]
]

INVITE_KEYBOARD = [
    [{"label": "Записаться на собеседование", "payload": "iv_yes", "color": "positive"}],
    [
        {"label": "Задать вопрос HR", "payload": "iv_question", "color": "secondary"},
        {"label": "Напомнить позже", "payload": "iv_later", "color": "secondary"}
    ]
]

def handle_bot_message(payload: Optional[str] = None, text: Optional[str] = None, ctx: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    ctx = ctx or {}
    points = ctx.get("points", 0)
    stations_done = ctx.get("stationsDone", 0)
    
    cmd = (payload or "").lower().strip()
    raw_text = (text or "").strip()
    
    # 1. Стартовые команды
    if cmd in ("start", "начать") or "привет" in raw_text.lower():
        msg = {
            "from": "bot",
            "text": (
                "Привет! Это карьерный бот АО МПБК «ОЧАКОВО» 🏭\n\n"
                "Мы запустили детективную игру «Секретный код 1978»: пройди 4 станции от идеи до полки, "
                "собери секретный код капсулы мастерства, получи персональный карьерный вердикт "
                "и выиграй лимитированный мерч «Я делаю натуральные напитки»!"
            ),
            "keyboard": MAIN_KEYBOARD,
            "attachment": {
                "type": "miniapp",
                "title": "Секретный код 1978",
                "sub": "VK Mini App · Квест по заводу ОЧАКОВО"
            }
        }
        return [msg]

    # 2. Быстрые кнопки по материалам кейса
    if cmd == "open_app":
        return [{
            "from": "bot",
            "text": "Открываем VK Mini App! Станций пройдено: {}/4. Твой текущий счёт: {} Крафт-баллов.".format(stations_done, points),
            "keyboard": MAIN_KEYBOARD,
            "attachment": {
                "type": "miniapp",
                "title": "Секретный код 1978",
                "sub": "Продолжить квест в ЛЭП и цехах"
            }
        }]

    if cmd == "dorm":
        return [{
            "from": "bot",
            "topic": "dorm",
            "text": (
                "🏠 Общежитие ОЧАКОВО:\n"
                "• Москва, ул. Рябиновая, 36, к. 2 (10 мин пешком до завода)\n"
                "• 3 400 ₽/мес для студентов (50% оплачивает компания!)\n"
                "• Комнаты на 4–6 человек, кухни со всей техникой на каждом этаже\n"
                "• Спортивная площадка рядом\n"
                "• Вход закрыт с 23:00 до 6:00. И не забудь взять свой фен!"
            ),
            "keyboard": MAIN_KEYBOARD
        }]

    if cmd == "session":
        return [{
            "from": "bot",
            "topic": "session",
            "text": (
                "🎓 Сессия и учёба без проблем:\n"
                "• В высокий сезон (март–сентябрь) экзамены можно сдать прямо на заводе!\n"
                "• Предупреди руководителя смены о дате зачёта — и в этот день смены не будет\n"
                "• Официальная производственная практика по срочному договору ТК РФ без испытательного срока!"
            ),
            "keyboard": MAIN_KEYBOARD
        }]

    if cmd == "salary":
        return [{
            "from": "bot",
            "topic": "salary",
            "text": (
                "💰 Доход и выплаты в ОЧАКОВО:\n"
                "• Выплаты 2 раза в месяц: строго 12 и 27 числа\n"
                "• Химики-лаборанты: от 60 000 ₽\n"
                "• Технологи и операторы линий: от 70 000 ₽\n"
                "• Склад: от 56 000 до 60 000+ ₽\n"
                "• Ночные смены оплачиваются по повышенному коэффициенту!"
            ),
            "keyboard": MAIN_KEYBOARD
        }]

    if cmd == "vacancies":
        return [{
            "from": "bot",
            "topic": "vacancies",
            "text": (
                "📋 Горящие вакансии весенне-летнего сезона (строго с 18 лет!):\n"
                "1. Химик-лаборант (Лаборатория качества)\n"
                "2. Технолог пищевого производства (Цех варки / ЛЭП)\n"
                "3. Машинист техустановок (Участок CO2, абсорбер, МЭА)\n"
                "4. Оператор линии розлива (SMI SK 500 P)\n"
                "5. Оператор склада / кладовщик\n"
                "6. Бесплатная практика: оцифровка, дизайн, IT\n"
                "📞 Телефон отдела подбора: 8 800 100 77 77 (доб. 1155)"
            ),
            "keyboard": MAIN_KEYBOARD
        }]

    if cmd == "iv_yes":
        return [{
            "from": "bot",
            "text": (
                "Отлично! Твой отклик зафиксирован в HR-системе ОЧАКОВО ✅\n"
                "Ждём тебя в Учебном центре комбината: г. Москва, ул. Рябиновая, 44, каб. 525.\n"
                "С собой: паспорт (18+), студенческий билет или диплом. Наставник уже ждёт встречи!"
            ),
            "keyboard": MAIN_KEYBOARD
        }]

    if cmd == "iv_question":
        return [{
            "from": "bot",
            "text": "Напиши свой вопрос прямо сюда, и специалист отдела подбора ответит тебе или позвони: 8 800 100 77 77 (доб. 1155, 3105, 2107).",
            "keyboard": MAIN_KEYBOARD
        }]

    # 3. Свободный текст — делегируем ИИ-Маскоту Крафти
    ai_res = MascotAgent.chat(raw_text or cmd)
    return [{
        "from": "bot",
        "topic": ai_res["topic"],
        "text": ai_res["reply"],
        "keyboard": MAIN_KEYBOARD
    }]
