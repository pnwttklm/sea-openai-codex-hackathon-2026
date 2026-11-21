"""Structured input, grounded visuals and renderer-supported landmark descriptions."""
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Nonempty = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Kind = Literal["house", "car", "wedding", "retreat", "machine", "travel", "personal"]
Money = Annotated[float, Field(ge=0, allow_inf_nan=False)]


class ArtDirection(BaseModel):
    kind: Kind
    color: Annotated[str, StringConstraints(pattern=r"^#[0-9a-fA-F]{6}$")]
    accessory: Literal["none", "flowers", "flag"]


class Appearance(ArtDirection):
    revision: int = Field(ge=1)


class WorldTurn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    conversation_id: UUID
    offline: bool = False
    turn: int = Field(ge=0, lt=40)
    goal_id: Annotated[str, StringConstraints(min_length=1, max_length=90)] | None = None
    question: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=600)] | None = None
    extra_monthly: Annotated[float, Field(ge=0, le=1e12, multiple_of=0.01, allow_inf_nan=False)] | None = None


class GoalCard(BaseModel):
    id: str
    title: Nonempty


class GoalCards(BaseModel):
    type: Literal["goals"] = "goals"
    goals: list[GoalCard]


class Progress(BaseModel):
    type: Literal["progress"] = "progress"
    title: Nonempty
    saved: Money
    target: float = Field(gt=0)
    remaining: Money
    monthly: Money
    months_to_target: int | None = Field(ge=0)


class Point(BaseModel):
    month: int = Field(ge=0)
    balance: Money


class SavingsPath(BaseModel):
    label: Nonempty
    monthly: Money
    months_to_target: int | None = Field(ge=0)
    points: list[Point] = Field(min_length=2)


class Comparison(BaseModel):
    type: Literal["comparison"] = "comparison"
    title: Nonempty
    unit: Literal["THB"] = "THB"
    assumption: Literal["Monthly contributions, zero growth."] = "Monthly contributions, zero growth."
    target: float = Field(gt=0)
    current: SavingsPath
    proposed: SavingsPath


class WorldReply(BaseModel):
    mode: Literal["openai", "offline"]
    goal_id: str | None
    answer: Nonempty
    caption: Nonempty
    visual: Annotated[GoalCards | Progress | Comparison, Field(discriminator="type")]
