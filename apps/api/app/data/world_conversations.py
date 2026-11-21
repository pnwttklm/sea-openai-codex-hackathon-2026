"""One bounded document per owner and conversation, atomically appended in turn order."""
from pymongo.errors import DuplicateKeyError


class WorldConversations:
    def __init__(self, collection, owner):
        self.collection = collection
        self.owner = owner

    def query(self, conversation_id):
        return {"_id": f"{self.owner}:{conversation_id}", "user_id": self.owner}

    async def read(self, conversation_id):
        doc = await self.collection.find_one(self.query(conversation_id), {"exchanges": 1})
        return doc["exchanges"] if doc else []

    async def append(self, turn, reply):
        query = {**self.query(turn.conversation_id), "count": turn.turn}
        entry = {"request": turn.model_dump(mode="json"), "reply": reply.model_dump(mode="json")}
        try:
            result = await self.collection.update_one(
                query, {"$push": {"exchanges": entry}, "$inc": {"count": 1}}, upsert=turn.turn == 0)
        except DuplicateKeyError:
            return False
        return bool(result.matched_count or result.upserted_id)
