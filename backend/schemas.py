"""Pydantic-схемы API.

Схемы основного контракта (/api/ai/*, /api/game/*, /api/candidates/submit, /api/hr/*) строгие по полям,
но принимают лишние ключи (extra="allow"), чтобы фронтенд мог присылать телеметрию в своём формате.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Stage = Literal["locker", "lab", "engineering", "bottling", "rnd", "final"]


class Flexible(BaseModel):
    model_config = ConfigDict(extra="allow")


# ---------------------------------------------------------------- Агент №1: маскот
class ChatTurn(Flexible):
    role: str = "user"
    text: str = ""


class MascotChatRequest(Flexible):
    session_id: str = Field(default="anonymous", max_length=64)
    message: str = Field(min_length=1, max_length=1500)
    current_stage: Optional[str] = Field(default=None, description="locker | lab | engineering | bottling | rnd | final")
    history: list[ChatTurn] = Field(default_factory=list)


class MascotChatResponse(BaseModel):
    reply: str
    suggested_questions: list[str]
    detected_topic: str = Field(description="Тема вопроса по-русски (для HR)")
    topic: str = Field(description="id темы: dorm, salary, session, ...")
    topic_label: str
    suggestions: list[str]
    source: Literal["llm", "rules"]


# ---------------------------------------------------------------- Агент №2: профайлинг
class StationScores(Flexible):
    lab_precision: Optional[float] = None
    engineering_systems: Optional[float] = None
    bottling_speed: Optional[float] = None
    rnd_mirapolis_score: Optional[float] = None


class CalculatorPrefs(Flexible):
    night_shifts: bool = False
    needs_dorm: bool = False
    exam_on_site_needed: bool = False


class EvaluateTelemetryRequest(Flexible):
    session_id: str = Field(default="anonymous", max_length=64)
    total_points: int = 0
    unlocked_code: Optional[str] = None
    ppe_attempts: int = 1
    station_scores: StationScores = Field(default_factory=StationScores)
    quiz_correct_count: int = 0
    why_ochakovo_cards_viewed: int = 0
    calculator_prefs: CalculatorPrefs = Field(default_factory=CalculatorPrefs)
    asked_topics: list[str] = Field(default_factory=list)


class FinancialSummary(BaseModel):
    estimated_monthly_net: int
    dorm_savings_rub: int
    meal_savings_rub: int
    gross_monthly: int
    based_on_vacancy: str
    period: str
    assumptions: list[str]


class Archetype(BaseModel):
    id: str
    name: str
    tagline: str
    icon: str


class VacancyMatch(BaseModel):
    id: str
    title: str
    dept: str
    salary: str
    block: str
    match: int


class StudentRecommendations(BaseModel):
    archetype_title: str
    primary_vacancy: str
    secondary_vacancy: str
    match_percentage: int
    personalized_pitch: str
    financial_summary: FinancialSummary
    archetype: Archetype
    matches: list[VacancyMatch]


class CompetencyRadar(BaseModel):
    attention_to_detail: int
    stress_resistance_speed: int
    technical_systems_thinking: int
    management_mirapolis_readiness: int
    company_values_alignment: int


class HRDeepDossier(BaseModel):
    candidate_track_block: str
    safety_and_discipline_score: int
    probation_survival_probability: int
    burnout_or_churn_risk: str
    competency_radar: CompetencyRadar
    ai_executive_summary: str
    recommended_mentor_type: str
    interview_talking_points: list[str]
    block: str
    competencies: dict[str, Optional[int]]
    probation_dropout_risk: int
    shift_readiness: dict[str, str]
    mirapolis_pre_attestation: dict[str, Any]
    asked_topics_labels: list[str]
    risk_flags: list[str]


class EvaluateTelemetryResponse(BaseModel):
    student_recommendations: StudentRecommendations
    hr_deep_dossier: HRDeepDossier
    recommendation: dict[str, Any] = Field(description="То же в формате фронта: archetype, competencies, matches, verdict")
    source: Literal["llm", "rules"]


# ---------------------------------------------------------------- Анкета кандидата
class CandidateSubmitRequest(Flexible):
    session_id: Optional[str] = Field(default=None, max_length=64)
    full_name: str = Field(min_length=2, max_length=160)
    contact_info: str = Field(min_length=3, max_length=255)
    birth_date: date
    target_vacancy: str = Field(min_length=2, max_length=160)
    readiness_date: str = Field(min_length=1, max_length=64)
    university_or_college: str = Field(min_length=2, max_length=200)
    course_or_grad_year: str = Field(default="", max_length=64)
    total_points: int = Field(default=0, ge=0)
    purchased_merch_tickets: list[str] = Field(default_factory=list)
    telemetry_payload: dict[str, Any] = Field(default_factory=dict)
    vk_user_id: Optional[int] = Field(default=None, description="id пользователя ВК из VK Mini App (VKWebAppGetUserInfo)")
    vk_profile_url: Optional[str] = Field(default=None, max_length=255, description="https://vk.com/id…")


class CandidateSubmitResponse(BaseModel):
    candidate_id: str
    promo_code: str
    message: str
    vk_linked: bool
    student_recommendations: StudentRecommendations
    hr_deep_dossier: HRDeepDossier


# ---------------------------------------------------------------- Контракт фронтенда (BACKEND_HANDOFF.md)
class FrontCandidateCreate(Flexible):
    form: dict[str, Any] = Field(default_factory=dict)
    telemetry: dict[str, Any] = Field(default_factory=dict)
    points: int = 0
    session_id: Optional[str] = None


class SessionCreate(Flexible):
    session_id: Optional[str] = None
    started_at: Optional[str] = None
    vk_ref: Optional[str] = None
    vk_platform: Optional[str] = None
    platform: Optional[str] = None
    vk_user_id: Optional[str | int] = None


class RecommendationRequest(Flexible):
    session_id: Optional[str] = None
    telemetry: dict[str, Any] = Field(default_factory=dict)


class InviteDraftRequest(Flexible):
    candidate_id: str


class BotMessageRequest(Flexible):
    session_id: Optional[str] = None
    user_id: Optional[str | int] = None
    text: Optional[str] = ""
    payload: Optional[Any] = None
    ctx: dict[str, Any] = Field(default_factory=dict, description="stationsDone, points, capsuleOpened, hasCandidate, tickets")


class BotSendRequest(Flexible):
    candidate_id: Optional[str] = None
    session_id: Optional[str] = None
    vk_user_id: Optional[str | int] = None
    text: str = Field(default="", max_length=4000)
    keyboard: Optional[list[list[dict[str, Any]]]] = None


class ContactCandidateRequest(Flexible):
    candidate_id: str
    message: Optional[str] = Field(default=None, max_length=4000,
                                   description="Текст от HR; если пусто — персональный шаблон приглашения")


class RaffleTicketRequest(Flexible):
    session_id: Optional[str] = None
    candidate_id: Optional[str] = None
    item_id: Optional[str] = Field(default=None, description="hoodie | box | stickers | vip")
    item: Optional[str] = None
    ticket: Optional[str] = None
    cost: int = 0


# ---------------------------------------------------------------- Авторизация HR / Режим жюри
class LoginRequest(Flexible):
    """Корпоративный ключ HR (key). pin/code — старые имена поля, vk_user_id — вход администратора по VK_ADMIN_IDS."""
    key: Optional[str] = Field(default=None, max_length=128)
    pin: Optional[str] = Field(default=None, max_length=128)
    code: Optional[str] = Field(default=None, max_length=128)
    vk_user_id: Optional[str | int] = None
