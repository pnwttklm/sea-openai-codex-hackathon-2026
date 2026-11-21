import hashlib
import hmac
import os
import secrets
import time
from typing import Annotated
from uuid import UUID

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response

from app.ai.companion_runtime import TurnRunner
from app.ai.stock_news import stock_news
from app.schemas.companion import StockNews, Symbol
from app.ai.future_voice import voice_scenario
from app.schemas.future_you import OVERVIEW_YEARS, VoiceScenario
from app.api.routes.future_you import local_origin_allowed
from app.data.decision_journal import JournalEntry, JournalNote
from app.data.agent_traces import Trace
from app.data.goal_plans import GoalPlan, TownGoalPlan, list_plans, save_plan
from app.data.future_you import DEMO_PROFILE_ID
from app.schemas.companion import Agent, OperatorLogin, Reply, Run, RunDetail, State, Turn
from app.services.companion import CompanionServices

router = APIRouter()
COOKIE = "prik_agent_operator"
MAX_AGE = 3600


def demo_only(request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    if not request.app.state.future_you_is_demo:
        raise HTTPException(403, "Enable the local synthetic demo.")


def companion_services(request: Request, question: str) -> CompanionServices:
    if not local_origin_allowed(request):
        raise HTTPException(403, "Use the local demo app.")
    state = request.app.state
    if state.agent_traces is None:
        raise HTTPException(503, "Demo database is unavailable.")
    return CompanionServices(state.future_you_repository, ObjectId(DEMO_PROFILE_ID), question,
                                 Trace(state.agent_traces), state.companion_model,
                                 os.getenv("COMPANION_NEWS_SOURCE", "demo") == "demo")

@router.post("/companion/news/{symbol}", dependencies=[Depends(demo_only)])
async def news(symbol: Symbol, request: Request) -> StockNews:
    services = companion_services(request, "")
    try:
        return await stock_news(services, symbol)
    except (RuntimeError, TimeoutError, ValueError):
        raise HTTPException(503, "The headline feed is unavailable. Try again.") from None


@router.post("/companion/turns", response_model=Reply, dependencies=[Depends(demo_only)])
async def companion_turn(body: Turn, request: Request):
    services = companion_services(request, body.question)
    try:
        return await TurnRunner(services, body).run()
    except TimeoutError:
        raise HTTPException(504, "The companion timed out. Please try again.") from None
    except Exception:
        raise HTTPException(503, "Companion unavailable. Check the demo seed and model configuration.") from None


def operator_secret():
    secret = os.getenv("AGENT_OPS_SECRET", "")
    if len(secret) < 24:
        raise HTTPException(503, "Operator access is disabled.")
    return secret.encode()


def signature(secret, value):
    return hmac.new(secret, ("operator:" + value).encode(), hashlib.sha256).hexdigest()


def require_operator(request: Request, response: Response):
    demo_only(request, response)
    secret = operator_secret()
    token = request.cookies.get(COOKIE, "")
    if not token:
        raise HTTPException(401, "Operator sign-in required.")
    try:
        expires, nonce, mac = token.split(".")
        valid = int(expires) > time.time() and hmac.compare_digest(mac, signature(secret, expires + "." + nonce))
    except (TypeError, ValueError):
        valid = False
    if not valid:
        raise HTTPException(403, "Operator session invalid.")
    if request.app.state.agent_traces is None:
        raise HTTPException(503, "Trace database unavailable.")
    return request.app.state.agent_traces


@router.post("/ops/session", dependencies=[Depends(demo_only)], status_code=204)
async def login(body: OperatorLogin, request: Request, response: Response):
    if not local_origin_allowed(request):
        raise HTTPException(403, "Use the local operator page.")
    secret = operator_secret()
    now = time.monotonic()
    attempts = request.app.state.operator_failures
    attempts[:] = [t for t in attempts if now - t < 60]
    if len(attempts) >= 8:
        raise HTTPException(429, "Try again in one minute.")
    if not secrets.compare_digest(body.secret.encode(), secret):
        attempts.append(now)
        raise HTTPException(403, "Operator sign-in failed.")
    attempts.clear()
    value = f"{int(time.time()) + MAX_AGE}.{secrets.token_hex(16)}"
    response.set_cookie(COOKIE, value + "." + signature(secret, value), max_age=MAX_AGE,
                        httponly=True, samesite="strict", secure=request.url.scheme == "https", path="/")


@router.delete("/ops/session", status_code=204)
async def logout(request: Request, response: Response):
    if not local_origin_allowed(request):
        raise HTTPException(403, "Use the local operator page.")
    response.delete_cookie(COOKIE, path="/")
    response.headers["Cache-Control"] = "no-store"


Traces = Annotated[object, Depends(require_operator)]


@router.get("/ops/future-context", dependencies=[Depends(require_operator)])
async def future_context(request: Request) -> VoiceScenario:
    repo = request.app.state.future_you_repository
    subject = ObjectId(DEMO_PROFILE_ID)
    profile = await repo.get_profile(subject)
    if profile is None:
        raise HTTPException(404, "The demo profile has not been seeded.")
    goals = await repo.list_goals(subject)
    portfolio = await repo.latest_portfolio(subject)
    return voice_scenario(profile, goals, OVERVIEW_YEARS, portfolio)


@router.get("/ops/agent-runs", response_model=list[Run])
async def list_runs(store: Traces, agent: Agent | None = None, status: State | None = None, cursor: UUID | None = None):
    return await store.list_runs(agent, status, str(cursor) if cursor else None)


@router.get("/ops/agent-runs/{run_id}", response_model=RunDetail)
async def run_detail(run_id: UUID, store: Traces):
    doc = await store.detail(str(run_id))
    if doc is None:
        raise HTTPException(404, "Run not found.")
    return doc



def goal_store(request: Request, response: Response):
    demo_only(request, response)
    if not local_origin_allowed(request):
        raise HTTPException(403, "Use the local demo app.")
    repo = request.app.state.future_you_repository
    if repo is None:
        raise HTTPException(503, "Demo database unavailable.")
    return repo.goals


@router.get("/companion/goals", response_model=list[TownGoalPlan], response_model_exclude_none=True)
async def shared_goals(collection=Depends(goal_store)):
    return await list_plans(collection, ObjectId(DEMO_PROFILE_ID))


@router.post("/companion/goals", response_model=GoalPlan)
async def confirm_goal(plan: TownGoalPlan, request: Request, background: BackgroundTasks, collection=Depends(goal_store)):
    # A client may round-trip the GET payload. Only the renderer service writes appearance.
    changes = GoalPlan.model_validate(plan.model_dump(exclude={"appearance"}))
    saved = await save_plan(collection, ObjectId(DEMO_PROFILE_ID), changes)
    if saved is None:
        raise HTTPException(409, "This goal changed. Reopen the goal and review the latest values.")
    if saved.id.startswith("custom-"):
        state = request.app.state
        background.add_task(state.world_landmarks.prepare, collection, ObjectId(DEMO_PROFILE_ID),
                            saved.id, state.companion_model)
    return saved


@router.get("/companion/journal", response_model=list[JournalEntry])
async def journal_entries(request: Request, _=Depends(goal_store)):
    return await request.app.state.journal.list(ObjectId(DEMO_PROFILE_ID))


@router.post("/companion/journal", response_model=JournalEntry)
async def journal_save(body: JournalNote, request: Request, _=Depends(goal_store)):
    entry = await request.app.state.journal.save(ObjectId(DEMO_PROFILE_ID), body)
    if entry.text != body.text:
        raise HTTPException(409, "This journal entry already exists.")
    return entry
