from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.schemas.future_you import MongoId

Agent = Literal["companion", "goal_planner", "portfolio_analyst", "sentiment_analyst"]
State = Literal["running", "completed", "partial", "failed", "interrupted"]
Cue = Literal["concern", "enthusiasm", "mixed", "unclear"]
Tone = Literal["positive", "negative", "neutral", "unclear"]
Symbol = Annotated[str, StringConstraints(pattern=r"^[A-Z]{1,5}$")]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Turn(StrictModel):
    question: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1500)]
    goal_id: MongoId | None = None


class Reply(StrictModel):
    answer: str
    presenters: list[Agent]
    evidence: list[str]
    status: Literal["complete", "partial", "needs_input"]
    mode: Literal["demo", "openai"]


class Intent(StrictModel):
    goal: bool
    goal_category: Literal["wedding", "retirement", "home", "time-machine"] | None
    monthly_preview: int | None = Field(ge=0, le=10_000_000)
    portfolio: bool
    reflection: bool
    news: bool
    symbol: Symbol | None


class Reflection(StrictModel):
    cue: Cue
    phrase: str


class HeadlineTones(StrictModel):
    tones: list[Tone] = Field(max_length=3)


class OperatorLogin(StrictModel):
    secret: str = Field(min_length=1, max_length=512)


class Span(BaseModel):
    id: UUID
    parent: UUID | None
    kind: Literal["agent", "tool", "db", "service", "provider", "fixture"]
    name: str
    started: str
    status: State
    duration_ms: int | None = None
    error: str | None = None


class Run(BaseModel):
    id: UUID
    started: str
    status: State
    agents: list[Agent]
    tools: int
    db_reads: int


class RunDetail(Run):
    spans: list[Span]

class NewsReading(StrictModel):
    summary: str = Field(min_length=1, max_length=480)
    tones: list[Tone] = Field(max_length=3)


class NewsArticle(BaseModel):
    title: str
    publisher: str | None
    url: str | None
    published: str
    tone: Tone | None = None


class StockNews(BaseModel):
    source: Literal["demo", "Webull"]
    as_of: str
    items: list[NewsArticle]
    summary: str | None = None
    analysis_source: Literal["ai", "demo"] | None = None
