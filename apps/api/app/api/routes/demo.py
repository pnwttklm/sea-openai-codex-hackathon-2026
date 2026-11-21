from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Request
from pydantic import UUID4

from app.ai.behavior_assessment import AssessmentUnavailable, assess_behavior
from app.api.routes.future_you import local_origin_allowed
from app.data.agent_traces import Trace
from app.ai.research import research_chat
from app.schemas.demo import AgentChat, AgentQuestion, AgentReply, AgentTurn, Behavior, MonthlyTarget, PaperAccount, PaperFill, PaperFX, PaperOrder, Portfolio, SellReflection, Stock
from app.services.demo import DemoService
from app.services.paper import PaperConflict, PaperService
from app.services.research import ResearchService

router = APIRouter(prefix="/demo", tags=["demo"])


def demo_service(request: Request) -> DemoService:
    service = request.app.state.demo
    if service is None:
        raise HTTPException(status_code=503, detail="Demo database is not configured")
    return service


Demo = Annotated[DemoService, Depends(demo_service)]


@router.get("/portfolio")
async def portfolio(service: Demo) -> Portfolio:
    return await service.portfolio()


@router.get("/behavior")
async def behavior(service: Demo, request: Request, include_assessment: bool = False) -> Behavior:
    report = await service.behavior()
    if include_assessment and request.app.state.future_you_is_demo:
        cached = getattr(request.app.state, "behavior_preview", None)
        if cached and cached[0] == report:
            return cached[1]
    return report


@router.post("/behavior/assessment")
async def behavior_assessment(service: Demo, request: Request) -> Behavior:
    state = request.app.state
    if not state.future_you_is_demo or not local_origin_allowed(request):
        raise HTTPException(403, "Open the local demo to request an assessment.")
    if not state.companion_model.client or state.agent_traces is None:
        raise HTTPException(503, "AI assessment is unavailable in this session.")
    try:
        review = await assess_behavior(service, state.companion_model, Trace(state.agent_traces))
        evidence = review.model_copy(deep=True)
        evidence.ai_assessment = None
        for factor in evidence.factors:
            factor.ai_assessment = None
        state.behavior_preview = (evidence, review)
        return review
    except AssessmentUnavailable:
        raise HTTPException(503, "Doraemon could not complete the assessment. Try again.") from None


@router.post("/behavior/target")
async def update_target(body: MonthlyTarget, service: Demo) -> Behavior:
    return await service.update_target(body.monthly_target_thb)


@router.get("/stocks")
async def stocks(service: Demo) -> list[Stock]:
    return await service.stocks()


@router.get("/stocks/{symbol}")
async def stock(symbol: Annotated[str, Path(pattern=r"^[A-Z]{1,5}$")], service: Demo) -> Stock:
    result = await service.stock(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail="Symbol is not in the demo")
    return result


@router.get("/stocks/{symbol}/sell-reflection")
async def sell_reflection(
    symbol: Annotated[str, Path(pattern=r"^[A-Z]{1,5}$")], service: Demo,
) -> SellReflection:
    result = await service.sell_reflection(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail="Symbol is not in the demo")
    return result


def paper_service(request: Request) -> PaperService:
    service = request.app.state.paper
    if service is None:
        raise HTTPException(status_code=503, detail="Trading accounts are not configured")
    return service


Paper = Annotated[PaperService, Depends(paper_service)]


@router.get("/paper-account")
async def paper_account(service: Paper) -> PaperAccount:
    try:
        return await service.account()
    except PaperConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/paper-orders")
async def paper_order(order: PaperOrder, service: Paper) -> PaperFill:
    try:
        result = await service.fill(order)
    except PaperConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Symbol is not in the demo")
    return result


@router.post("/agent/chat")
async def agent_chat(chat: AgentChat, request: Request) -> AgentReply:
    service = request.app.state.demo
    health = await service.behavior() if service is not None else None
    reply = await research_chat(chat, health)
    if reply is None:
        raise HTTPException(status_code=503, detail="Research is unavailable right now. Try again once the agent is configured and online.")
    return reply


def research_service(request: Request) -> ResearchService:
    service = request.app.state.research
    if service is None:
        raise HTTPException(status_code=503, detail="Chat storage is not configured")
    return service


Research = Annotated[ResearchService, Depends(research_service)]
StockSymbol = Annotated[str, Path(pattern=r"^[A-Z]{1,5}$")]


@router.get("/agent/chat/{conversation_id}/{symbol}")
async def agent_history(conversation_id: UUID4, symbol: StockSymbol, service: Research) -> list[AgentTurn]:
    return await service.history(conversation_id, symbol)


@router.post("/agent/chat/{conversation_id}/{symbol}")
async def agent_turn(
    conversation_id: UUID4, symbol: StockSymbol, body: AgentQuestion, service: Research,
) -> AgentTurn:
    turn = await service.ask(conversation_id, symbol, body.question)
    if turn is None:
        raise HTTPException(status_code=503, detail="Research is unavailable right now. Try again once the agent is configured and online.")
    return turn


@router.get("/paper-orders/open")
async def open_paper_orders(service: Paper) -> list[PaperFill]:
    return await service.open_orders()


@router.post("/paper-orders/{order_id}/cancel")
async def cancel_paper_order(order_id: UUID4, service: Paper) -> PaperFill:
    try:
        result = await service.cancel(order_id)
    except PaperConflict as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


@router.get("/paper-fx")
async def paper_fx(service: Paper) -> PaperFX:
    return await service.fx()
