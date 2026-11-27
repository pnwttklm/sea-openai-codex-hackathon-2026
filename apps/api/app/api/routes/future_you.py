import asyncio
import os
from shutil import which
from urllib.parse import urlsplit
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, Response
from openai import OpenAIError
from pydantic import ValidationError
from pymongo.errors import PyMongoError

from app.ai.future_media import MAX_IMAGE_BYTES, animate_portrait, generate_portrait, match_portrait_voice, validate_png
from app.ai.future_voice import connect_future_voice
from app.data.future_you import FutureYouRepository
from app.schemas.future_you import (
    FutureAssessmentResponse,
    FuturePlan,
    FutureProfile,
    FutureYouContext,
    Goal,
    OVERVIEW_YEARS,
    SavedGoal,
    SavedGoalSummary,
    VoiceOffer,
)
from app.services.future_you import assess_plan, profile_voice_style

router = APIRouter(prefix="/future-you", tags=["future-you"])
media_slot = asyncio.Semaphore(1)
no_store = {"Cache-Control": "no-store"}


def local_origin_allowed(request: Request) -> bool:
    if getattr(request.state, "hosted_demo_access", False):
        return True
    origin = request.headers.get("origin")
    return origin is not None and origin in request.app.state.allowed_origins and urlsplit(origin).hostname in {
        "localhost", "127.0.0.1", "::1"
    }


def voice_api_key() -> str | None:
    if os.getenv("FUTURE_YOU_VOICE_ENABLED") == "1":
        return os.getenv("OPENAI_API_KEY") or None
    return None


def media_api_key() -> str | None:
    if os.getenv("FUTURE_YOU_MEDIA_ENABLED") == "1":
        return os.getenv("OPENAI_API_KEY") or None
    return None


def require_media(request: Request) -> str:
    if not local_origin_allowed(request):
        raise HTTPException(403, "Media is available from the local development app only.")
    api_key = media_api_key()
    if not api_key:
        raise HTTPException(503, "Future You media is unavailable. Enable it and configure OpenAI.")
    if media_slot.locked():
        raise HTTPException(429, "Another scene is generating. Try again shortly.")
    return api_key


@router.post("/assessment", response_model=FutureAssessmentResponse)
async def assessment(plan: FuturePlan, request: Request) -> FutureAssessmentResponse:
    return FutureAssessmentResponse(
        **assess_plan(plan).model_dump(),
        voice_available=local_origin_allowed(request) and voice_api_key() is not None,
        media_available=local_origin_allowed(request) and media_api_key() is not None,
    )


async def load_saved_profile(request: Request) -> tuple[FutureYouRepository, ObjectId, FutureProfile] | None:
    if not local_origin_allowed(request):
        raise HTTPException(403, "Saved scenarios are available from the local development app only.")
    configured_id = request.app.state.future_you_user_id
    if not configured_id:
        return None
    if not ObjectId.is_valid(configured_id):
        raise HTTPException(503, "The local Future You profile ID is invalid.")
    repository = request.app.state.future_you_repository
    if repository is None:
        raise HTTPException(503, "The local profile database is unavailable.")

    user_id = ObjectId(configured_id)
    try:
        profile = await repository.get_profile(user_id)
    except (PyMongoError, ValidationError) as exc:
        raise HTTPException(503, "Could not load the saved profile.") from exc
    return (repository, user_id, profile) if profile is not None else None


SavedProfile = Annotated[tuple[FutureYouRepository, ObjectId, FutureProfile] | None, Depends(load_saved_profile)]


@router.get("/context", response_model=FutureYouContext)
async def context(saved_profile: SavedProfile, request: Request, response: Response) -> FutureYouContext:
    response.headers.update(no_store)
    if saved_profile is None:
        return FutureYouContext(voice_available=False)
    repository, user_id, profile = saved_profile
    try:
        goals = await repository.list_goals(user_id)
    except (PyMongoError, ValidationError) as exc:
        raise HTTPException(503, "Could not load the saved goals.") from exc
    return FutureYouContext(
        profile_name=profile.name,
        profile_available=True,
        future_age=profile.age + OVERVIEW_YEARS if profile.age is not None else None,
        voice_style=profile_voice_style(profile),
        voice_available=voice_api_key() is not None,
        media_available=media_api_key() is not None,
        is_demo=request.app.state.future_you_is_demo,
        goals=[
            SavedGoalSummary(
                id=goal.id, name=goal.goal_name, saved=goal.saved, target=goal.target, years=goal.years,
                future_age=profile.age + goal.years if profile.age is not None else None,
            )
            for goal in goals
        ],
    )


async def find_owned_goal(saved_profile: SavedProfile, goal_id: str) -> SavedGoal:
    if saved_profile is None:
        raise HTTPException(404, "No saved profile is available.")
    repository, user_id, _ = saved_profile
    try:
        goal = await repository.get_goal(user_id, ObjectId(goal_id))
    except (PyMongoError, ValidationError) as exc:
        raise HTTPException(503, "Could not load the saved goal.") from exc
    if goal is None:
        raise HTTPException(404, "This goal is unavailable for the saved profile.")
    return goal


@router.post(
    "/voice",
    response_class=Response,
    responses={200: {"content": {"application/sdp": {"schema": {"type": "string"}}}}},
)
async def voice(offer: VoiceOffer, saved_profile: SavedProfile) -> Response:
    api_key = voice_api_key()
    if not api_key:
        raise HTTPException(503, "Live voice is disabled. Configure the local API to enable it.")
    if saved_profile is None:
        raise HTTPException(404, "No saved profile is available.")
    repository, user_id, profile = saved_profile
    selected = await find_owned_goal(saved_profile, offer.goal_id) if offer.goal_id else None
    try:
        goals = [selected] if selected is not None else await repository.list_goals(user_id)
    except (PyMongoError, ValidationError) as exc:
        raise HTTPException(503, "Could not load the saved goals.") from exc
    try:
        portfolio = await repository.latest_portfolio(user_id)
    except (PyMongoError, ValidationError) as exc:
        raise HTTPException(503, "Could not load the saved portfolio.") from exc
    try:
        answer = await connect_future_voice(
            profile, goals, offer.sdp, api_key,
            years_from_now=selected.years if selected else OVERVIEW_YEARS,
            focused_goal=selected is not None,
            portfolio=portfolio,
            voice_style=offer.voice_style,
        )
    except OpenAIError as exc:
        raise HTTPException(502, "Could not start the voice session. Try again.") from exc
    return Response(answer, media_type="application/sdp", headers=no_store)


async def read_png(request: Request) -> bytes:
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "image/png":
        raise HTTPException(415, "Send a PNG image.")
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_IMAGE_BYTES:
            raise HTTPException(413, "The image is too large.")
        body.extend(chunk)
    png = bytes(body)
    try:
        validate_png(png)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return png


async def render_portrait(goal: Goal, years: int, request: Request, *, auto_voice: bool = False) -> Response:
    api_key = require_media(request)
    async with media_slot:
        photo = await read_png(request)
        try:
            result = await generate_portrait(photo, goal, years, api_key)
        except OpenAIError as exc:
            raise HTTPException(502, "Could not generate your future portrait. Try again.") from exc
        voice_style = await match_portrait_voice(result, api_key) if auto_voice else None
    headers = {**no_store, "X-Future-Voice-Style": voice_style} if voice_style else no_store
    return Response(result, media_type="image/png", headers=headers)


@router.post("/image", response_class=Response)
async def image(goal: Goal, years: Annotated[int, Query(ge=1, le=50)], request: Request) -> Response:
    return await render_portrait(goal, years, request)


png_content = {"image/png": {"schema": {"type": "string", "format": "binary"}}}
png_upload = {"requestBody": {"required": True, "content": png_content}}


@router.post("/portrait/{goal_id}", response_class=Response,
             responses={200: {"content": png_content}}, openapi_extra=png_upload)
async def portrait(
    goal_id: Annotated[str, Path(pattern=r"^[0-9a-fA-F]{24}$")],
    saved_profile: SavedProfile,
    request: Request,
) -> Response:
    goal = await find_owned_goal(saved_profile, goal_id)
    return await render_portrait(goal.goal, goal.years, request)


@router.post("/portrait", response_class=Response, openapi_extra=png_upload, responses={200: {
    "content": png_content,
    "headers": {"X-Future-Voice-Style": {"schema": {"type": "string", "enum": ["masculine", "feminine", "neutral"]}}},
}})
async def overview_portrait(saved_profile: SavedProfile, request: Request) -> Response:
    if saved_profile is None:
        raise HTTPException(404, "No saved profile is available.")
    return await render_portrait("other", OVERVIEW_YEARS, request, auto_voice=True)


@router.post("/video", response_class=Response)
async def video(request: Request) -> Response:
    api_key = require_media(request)
    if not which("ffmpeg"):
        raise HTTPException(503, "Video encoding requires FFmpeg.")
    async with media_slot:
        png = await read_png(request)
        try:
            result = await animate_portrait(png, api_key)
        except (OpenAIError, OSError, ValueError, TimeoutError) as exc:
            raise HTTPException(502, "Could not create the animation. Try again.") from exc
    return Response(result, media_type="video/mp4", headers=no_store)
