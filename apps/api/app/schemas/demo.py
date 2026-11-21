from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, UUID4, model_validator

Range = Literal["1Y", "3Y", "5Y", "10Y", "All"]


class History(BaseModel):
    values: list[int] = Field(min_length=2)
    change_thb: int
    change_percent: float


class Allocation(BaseModel):
    name: str
    percent: float = Field(gt=0, le=100)


class Quote(BaseModel):
    symbol: str
    name: str
    exchange: str
    price_cents: int = Field(ge=0)
    change_percent: float


class Holding(Quote):
    weight: float
    trend: list[int]


class Factor(BaseModel):
    name: str
    score: float = Field(ge=0, le=10)
    label: str


class HealthDimension(Factor):
    question: str
    measurement: str


class MonthlyTarget(BaseModel):
    monthly_target_thb: int = Field(strict=True, ge=1, le=100_000_000)


class Behavior(MonthlyTarget):
    source: Literal["demo"] = "demo"
    score: int = Field(ge=0, le=100)
    label: str
    explanation: str
    factors: list[HealthDimension] = Field(min_length=4, max_length=4)


class Portfolio(BaseModel):
    source: Literal["demo"] = "demo"
    investor: str
    value_thb: int
    history: dict[Range, History]
    allocation: list[Allocation]
    holdings: list[Holding]
    score: int = Field(ge=0, le=100)
    score_label: str


class Stock(Quote):
    source: Literal["demo"] = "demo"
    factors: list[Factor] = Field(default_factory=list)


class NewsHeadline(BaseModel):
    title: str
    publisher: str | None = None
    published_at: str | None = None
    url: str | None = None


class SellPrompt(BaseModel):
    demo_change_percent: float
    behavior_score: int
    goal_risk_fit_score: float
    question: str
    news_status: Literal["available", "empty", "unavailable"]
    headlines: list[NewsHeadline]


class SellReflection(BaseModel):
    prompt: SellPrompt | None


class PaperFX(BaseModel):
    rate_micros: int = Field(gt=0, le=1_000_000_000)
    as_of: date
    source: Literal["Frankfurter"] = "Frankfurter"


class PaperAccount(BaseModel):
    cash_cents: int = Field(ge=0)
    cash_thb_satang: int | None = Field(default=None, ge=0)
    positions: dict[str, int]
    revision: int = Field(ge=0)


class PaperOrder(BaseModel):
    order_id: UUID4
    symbol: str = Field(pattern=r"^[A-Z]{1,5}$")
    side: Literal["buy", "sell"]
    quantity: int = Field(strict=True, ge=1, le=10000)
    order_type: Literal["market", "limit"] = "market"
    fx_rate_micros: int | None = Field(default=None, strict=True, gt=0, le=1_000_000_000)
    limit_price_cents: int | None = Field(default=None, strict=True, ge=1, le=100_000_000)

    @model_validator(mode="after")
    def validate_limit(self):
        if (self.order_type == "limit") != (self.limit_price_cents is not None):
            raise ValueError("A limit price is required only for limit orders")
        return self


class PaperFill(PaperOrder):
    status: Literal["filled", "open", "cancelled"] = "filled"
    price_cents: int | None
    total_cents: int
    total_thb_satang: int | None = None
    fx: PaperFX | None = None
    account: PaperAccount


class AgentMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=2400)


class AgentChat(BaseModel):
    symbol: str = Field(pattern=r"^[A-Z]{1,5}$")
    messages: list[AgentMessage] = Field(min_length=1, max_length=9)

    @model_validator(mode="after")
    def validate_turns(self):
        roles = [message.role for message in self.messages]
        if roles != ["user", "assistant"] * (len(roles) // 2) + ["user"]:
            raise ValueError("Chat must alternate and end with a user message")
        if any(not message.text.strip() for message in self.messages):
            raise ValueError("Messages cannot be blank")
        return self


class AgentReply(BaseModel):
    answer: str
    sources: list[NewsHeadline]


class AgentQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2400)

    @model_validator(mode="after")
    def validate_question(self):
        self.question = self.question.strip()
        if not self.question:
            raise ValueError("Question cannot be blank")
        return self


class AgentTurn(AgentQuestion):
    reply: AgentReply
    created_at: datetime
