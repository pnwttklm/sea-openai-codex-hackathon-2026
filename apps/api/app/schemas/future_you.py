from decimal import Decimal
from typing import Annotated, Literal

from typing_extensions import NotRequired, TypedDict

from pydantic import AwareDatetime, BaseModel, Field, StringConstraints

Goal = Literal["wedding", "retirement", "time-machine", "home", "other"]
GoalName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
ProfileLabel = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
VoiceStyle = Literal["masculine", "feminine", "neutral"]
Baht = Annotated[Decimal, Field(max_digits=18, decimal_places=2)]
OVERVIEW_YEARS = 25


class FutureProfile(BaseModel):
    name: ProfileLabel | None = None
    age: int | None = Field(default=None, ge=18, le=100, strict=True)
    priorities: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)] | None = None
    gender: ProfileLabel | None = None
    voice_style: VoiceStyle | None = None
    risk_tolerance: ProfileLabel | None = None
    preferred_language: Literal["th", "en"] | None = None


class PortfolioHolding(BaseModel):
    symbol: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=24)]
    weight_pct: Annotated[Decimal, Field(max_digits=9, decimal_places=4)]


class PortfolioSnapshot(BaseModel):
    as_of: AwareDatetime
    total_value_thb: Baht
    cash_thb: Baht | None = None
    holdings: list[PortfolioHolding] = Field(default_factory=list)


class FuturePlan(BaseModel):
    goal: Goal
    goal_name: GoalName | None = None
    profile: FutureProfile | None = None
    saved: int = Field(ge=0, le=100_000_000, strict=True)
    target: int = Field(gt=0, le=100_000_000, strict=True)
    monthly: int = Field(ge=0, le=10_000_000, strict=True)
    years: int = Field(ge=1, le=50, strict=True)


class FutureAssessment(BaseModel):
    projected: float
    gap: float
    on_track: bool
    required_monthly: int
    annual_rate: float


class FutureAssessmentResponse(FutureAssessment):
    voice_available: bool
    media_available: bool


MongoId = Annotated[str, StringConstraints(pattern=r"^[0-9a-fA-F]{24}$")]


class SavedGoal(FuturePlan):
    saved: Annotated[Decimal, Field(ge=0, le=10**12, decimal_places=2)]
    target: Annotated[Decimal, Field(gt=0, le=10**12, decimal_places=2)]
    monthly: Annotated[Decimal, Field(ge=0, le=10**12, decimal_places=2)]
    months: int | None = Field(default=None, ge=1, le=1200)
    years: int = Field(ge=1, le=100)

    id: MongoId
    goal_name: GoalName


class SavedGoalSummary(BaseModel):
    id: MongoId
    name: GoalName
    saved: float
    target: float
    years: int
    future_age: int | None = None


class FutureYouContext(BaseModel):
    profile_name: str | None = None
    profile_available: bool = False
    years_from_now: int = OVERVIEW_YEARS
    future_age: int | None = None
    voice_style: VoiceStyle = "neutral"
    voice_available: bool
    media_available: bool = False
    is_demo: bool = False
    goals: list[SavedGoalSummary] = Field(default_factory=list)


class VoiceOffer(BaseModel):
    goal_id: MongoId | None = None
    sdp: str = Field(min_length=10, max_length=24_000, pattern=r"^v=0\r?\n")
    voice_style: VoiceStyle | None = None

class ScenarioHolding(TypedDict):
    symbol: str
    weight_pct: str


class ScenarioPortfolio(TypedDict):
    as_of: str
    total_value_thb: str
    cash_thb: NotRequired[str]
    holdings_count: int
    largest_holdings: list[ScenarioHolding]


class VoiceScenario(TypedDict):
    years_from_now: int
    age_in_scenario: int | None
    profile_today: dict[str, str | int]
    portfolio_today: ScenarioPortfolio | None
    goals: list[dict[str, str | float]]
