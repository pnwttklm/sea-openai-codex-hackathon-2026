import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from time import monotonic
from uuid import uuid4

from pymongo.errors import PyMongoError

from app.schemas.companion import Agent, State

logger = logging.getLogger(__name__)
TTL = 7 * 24 * 3600


class TraceStore:
    def __init__(self, database):
        self.runs = database["agent_runs"]
        self.spans = database["agent_spans"]
        self.ready = False
        self.lock = asyncio.Lock()

    async def ensure_indexes(self):
        async with self.lock:
            if self.ready:
                return
            for collection in (self.runs, self.spans):
                await collection.create_index("created", expireAfterSeconds=TTL)
            await self.runs.create_index([("created", -1), ("_id", -1)])
            await self.spans.create_index([("run", 1), ("created", 1)])
            self.ready = True

    async def start(self, run):
        await self.ensure_indexes()
        now = datetime.now(UTC)
        await self.runs.insert_one(dict(_id=run, id=run, created=now, started=now.isoformat(),
                                        status="running", agents=[], tools=0, db_reads=0))

    async def finish(self, run, state):
        await self.runs.update_one({"_id": run}, {"$set": {"status": state}})

    async def begin_span(self, run, span, parent, kind, name):
        now = datetime.now(UTC)
        await self.spans.insert_one(dict(_id=span, id=span, run=run, parent=parent, kind=kind, name=name,
                                         created=now, started=now.isoformat(), status="running"))
        if kind == "agent":
            await self.runs.update_one({"_id": run}, {"$addToSet": {"agents": name}})
        elif kind in {"tool", "db"}:
            key = "tools" if kind == "tool" else "db_reads"
            await self.runs.update_one({"_id": run}, {"$inc": {key: 1}})

    async def end_span(self, span, status, duration_ms, error):
        await self.spans.update_one({"_id": span}, {"$set": dict(status=status, duration_ms=duration_ms, error=error)})

    async def list_runs(self, agent: Agent | None, status: State | None, before: str | None = None):
        cutoff = datetime.now(UTC) - timedelta(seconds=60)
        await self.runs.update_many({"status": "running", "created": {"$lt": cutoff}},
                                    {"$set": {"status": "interrupted"}})
        query = {}
        if agent:
            query["agents"] = agent
        if status:
            query["status"] = status
        if before:
            cursor = await self.runs.find_one({"_id": before}, {"created": 1})
            if cursor is None:
                return []
            query["$or"] = [{"created": {"$lt": cursor["created"]}},
                            {"created": cursor["created"], "_id": {"$lt": before}}]
        return await self.runs.find(query).sort([("created", -1), ("_id", -1)]).limit(40).to_list()

    async def detail(self, run):
        doc = await self.runs.find_one({"_id": run})
        if not doc:
            return None
        spans = await self.spans.find({"run": run}).sort("created", 1).limit(128).to_list()
        if doc["status"] == "running" and datetime.fromisoformat(doc["started"]) < datetime.now(UTC) - timedelta(seconds=60):
            doc["status"] = "interrupted"
        if doc["status"] == "interrupted":
            for span in spans:
                if span["status"] == "running":
                    span["status"] = "interrupted"
        return dict(**doc, spans=spans)


class Trace:
    """Only call with operation names from code. Never attach tool payloads."""
    def __init__(self, store):
        self.store = store
        self.id = str(uuid4())
        self.available = True
        self.outcomes = {}

    async def record(self, fn, *args):
        if self.available:
            try:
                async with asyncio.timeout(1):
                    await fn(*args)
            except (PyMongoError, TimeoutError):
                self.available = False
                logger.warning("Agent trace storage unavailable")

    @asynccontextmanager
    async def span(self, parent, kind, name):
        span = str(uuid4())
        await self.record(self.store.begin_span, self.id, span, parent, kind, name)
        start = monotonic()
        status, error = "completed", None
        try:
            yield span
        except asyncio.CancelledError:
            status, error = "interrupted", "cancelled"
            raise
        except Exception:
            status, error = "failed", "unavailable"
            raise
        finally:
            status = self.outcomes.pop(span, status) if status == "completed" else status
            await self.record(self.store.end_span, span, status, round(1000 * (monotonic() - start)), error)
