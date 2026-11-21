from uuid import UUID

from pymongo import AsyncMongoClient
from pymongo.errors import DuplicateKeyError

from app.schemas.demo import AgentTurn


class ResearchRepository:
    def __init__(self, client: AsyncMongoClient, database: str) -> None:
        self.collection = client[database]["agent_conversations"]

    async def history(self, conversation_id: UUID, symbol: str) -> list[AgentTurn]:
        key = {"_id": f"{conversation_id}:{symbol}"}
        document = await self.collection.find_one(key, {"turns": 1})
        return [AgentTurn.model_validate(turn) for turn in document["turns"]] if document else []

    async def append(self, conversation_id: UUID, symbol: str, turn: AgentTurn) -> None:
        key = {"_id": f"{conversation_id}:{symbol}"}
        update = {"$push": {"turns": {"$each": [turn.model_dump(mode="json")], "$slice": -20}}}
        try:
            await self.collection.update_one(key, update, upsert=True)
        except DuplicateKeyError:
            await self.collection.update_one(key, update)
