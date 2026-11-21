from datetime import UTC, datetime
from uuid import UUID

from app.ai.research import research_chat
from app.data.research import ResearchRepository
from app.schemas.demo import AgentChat, AgentMessage, AgentTurn


from app.services.demo import DemoService


class ResearchService:
    def __init__(self, repository: ResearchRepository, demo: DemoService) -> None:
        self.repository = repository
        self.demo = demo

    async def history(self, conversation_id: UUID, symbol: str) -> list[AgentTurn]:
        return await self.repository.history(conversation_id, symbol)

    async def ask(self, conversation_id: UUID, symbol: str, question: str) -> AgentTurn | None:
        history = await self.history(conversation_id, symbol)
        messages = []
        for turn in history[-4:]:
            messages.extend([
                AgentMessage(role="user", text=turn.question),
                AgentMessage(role="assistant", text=turn.reply.answer[:2400]),
            ])
        messages.append(AgentMessage(role="user", text=question))
        reply = await research_chat(AgentChat(symbol=symbol, messages=messages), await self.demo.behavior())
        if reply is None:
            return None
        turn = AgentTurn(question=question, reply=reply, created_at=datetime.now(UTC))
        await self.repository.append(conversation_id, symbol, turn)
        return turn
