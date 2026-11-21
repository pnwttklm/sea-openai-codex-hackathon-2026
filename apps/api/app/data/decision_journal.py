from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from pymongo import ReturnDocument

from pydantic import AwareDatetime, BaseModel, ConfigDict, StringConstraints


class JournalNote(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: UUID
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1500)]


class JournalEntry(JournalNote):
    created: AwareDatetime


class JournalRepository:
    def __init__(self, database):
        self.entries = database["decision_journal"]

    async def list(self, subject):
        rows = self.entries.find({"user_id": subject}).sort([("created", -1), ("_id", -1)]).limit(50)
        return [self.entry(row) async for row in rows]

    async def save(self, subject, note):
        row = await self.entries.find_one_and_update(
            {"_id": f"{subject}/{note.id}", "user_id": subject},
            {"$setOnInsert": {"id": str(note.id), "text": note.text, "created": datetime.now(UTC)}},
            upsert=True, return_document=ReturnDocument.AFTER)
        return self.entry(row)

    @staticmethod
    def entry(row):
        return JournalEntry(id=row["id"], text=row["text"], created=row["created"].replace(tzinfo=UTC))
