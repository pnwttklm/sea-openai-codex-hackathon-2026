from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request

from app.ai.future_world import ProviderUnavailable
from app.api.routes.companion import goal_store
from app.data.future_you import DEMO_PROFILE_ID
from app.data.goal_plans import Slug
from app.data.world_conversations import WorldConversations
from app.schemas.future_world import Appearance, WorldReply, WorldTurn
from app.services.future_world import TurnConflict, WorldGuide

router = APIRouter(prefix="/future-world")


@router.post("/turns", response_model=WorldReply)
async def world_turn(turn: WorldTurn, request: Request, goals=Depends(goal_store)):
    owner = ObjectId(DEMO_PROFILE_ID)
    store = WorldConversations(goals.database["future_world_conversations"], owner)
    guide = WorldGuide(goals, store, owner, request.app.state.companion_model)
    try:
        return await guide.respond(turn)
    except KeyError:
        raise HTTPException(404, "Goal is unavailable.") from None
    except TurnConflict:
        raise HTTPException(409, "This conversation changed. Start a new conversation.") from None
    except ProviderUnavailable:
        raise HTTPException(502, "Doraemon could not reply. Try again.") from None


@router.post("/landmarks/{goal_id}", response_model=Appearance)
async def landmark(goal_id: Slug, request: Request, goals=Depends(goal_store)):
    if not goal_id.startswith("custom-"):
        raise HTTPException(422, "Choose a custom goal.")
    try:
        state = request.app.state
        return await state.world_landmarks.get(goals, ObjectId(DEMO_PROFILE_ID), goal_id, state.companion_model)
    except KeyError:
        raise HTTPException(404, "Goal is unavailable.") from None
    except ValueError as error:
        raise HTTPException(409, str(error)) from None
    except ProviderUnavailable:
        raise HTTPException(502, "Using the default landmark. Try again on your next visit.") from None
