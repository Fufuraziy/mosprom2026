from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime, date

def calculate_age(birth_date_str: str) -> Optional[int]:
    try:
        b_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - b_date.year - ((today.month, today.day) < (b_date.month, b_date.day))
        return age
    except Exception:
        return None

class CandidateFormSchema(BaseModel):
    fio: str = Field(..., description="ФИО кандидата")
    phone: Optional[str] = ""
    telegram: Optional[str] = ""
    email: Optional[str] = ""
    birth_date: str = Field(..., description="Дата рождения YYYY-MM-DD")
    vacancy: str = Field(..., description="Выбранная вакансия")
    readiness: str = Field(..., description="Готовность выйти на смену")
    university: str = Field(..., description="Вуз или колледж")
    study_level: Optional[str] = ""
    specialty: Optional[str] = ""
    consent: bool = Field(True, description="Согласие на обработку ПДн")
    vk_user_id: Optional[Any] = None
    vk_source: Optional[str] = None

    @field_validator("fio")
    @classmethod
    def validate_fio(cls, v: str) -> str:
        parts = [p for p in v.strip().split() if p]
        if len(parts) < 2:
            raise ValueError("Укажи имя и фамилию")
        return v.strip()

    @field_validator("birth_date")
    @classmethod
    def validate_age_strict(cls, v: str) -> str:
        if not v:
            raise ValueError("Укажи дату рождения")
        age = calculate_age(v)
        if age is None:
            raise ValueError("Некорректный формат даты (ожидается ГГГГ-ММ-ДД)")
        if age < 18:
            raise ValueError("В ОЧАКОВО принимают на работу и практику строго с 18 лет")
        if age > 80:
            raise ValueError("Проверь год рождения")
        return v

    @field_validator("university")
    @classmethod
    def validate_university(cls, v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Укажи вуз или колледж")
        return v.strip()

    @field_validator("vacancy")
    @classmethod
    def validate_vacancy(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Выбери вакансию")
        return v.strip()

    @field_validator("readiness")
    @classmethod
    def validate_readiness(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Когда готов(а) выйти?")
        return v.strip()

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Нужно согласие на обработку персональных данных")
        return v

class CandidateSubmitRequest(BaseModel):
    form: CandidateFormSchema
    telemetry: Optional[Dict[str, Any]] = Field(default_factory=dict)
    points: Optional[int] = 0
    session_id: Optional[str] = None
    tickets: Optional[Dict[str, int]] = Field(default_factory=dict)

class SessionStartRequest(BaseModel):
    started_at: Optional[str] = None
    # Фронт генерирует случайный код замка и свой id сессии при старте новой игры и присылает их сюда.
    session_id: Optional[str] = None
    target_code: Optional[List[str]] = None
    vk_platform: Optional[str] = None
    vk_ref: Optional[str] = None

class SessionStartResponse(BaseModel):
    session_id: str
    secret_code: Optional[str] = None
    target_code: Optional[List[str]] = None
    source: str = "remote"

class TelemetryEventRequest(BaseModel):
    session_id: str
    event: str
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict)
    ts: Optional[str] = None

class MascotChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class MascotChatResponse(BaseModel):
    reply: str
    topic: str
    topic_label: Optional[str] = None
    suggestions: Optional[List[str]] = None

class RecommendationRequest(BaseModel):
    session_id: Optional[str] = None
    telemetry: Optional[Dict[str, Any]] = Field(default_factory=dict)

class BuyTicketRequest(BaseModel):
    session_id: str
    item_id: str

class BotMessageRequest(BaseModel):
    session_id: Optional[str] = None
    payload: Optional[str] = None
    text: Optional[str] = None
    ctx: Optional[Dict[str, Any]] = Field(default_factory=dict)

class InviteDraftRequest(BaseModel):
    candidate_id: str

class BotSendRequest(BaseModel):
    candidate_id: str
    vk_user_id: Optional[Any] = None
    text: str


class LoginRequest(BaseModel):
    pin: Optional[str] = None
    key: Optional[str] = None
    login: Optional[str] = None
    vk_user_id: Optional[Any] = None
    sign: Optional[str] = None

class LoginResponse(BaseModel):
    authenticated: bool
    token: str
    role: str = "hr_admin"
