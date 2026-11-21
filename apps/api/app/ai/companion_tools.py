import json
from typing import Annotated, Any

from mcp.server.fastmcp import FastMCP
from mcp.shared.memory import create_connected_server_and_client_session
from pydantic import Field

from app.ai.agent_profiles import PROFILES
from app.schemas.companion import Agent, Symbol
from app.schemas.future_you import MongoId


async def call_tool(agent: Agent, name, arguments, services, parent):
    """One isolated MCP session per call. The model cannot supply the actor or span."""
    if name not in PROFILES[agent].tools:
        raise PermissionError("Tool outside agent role")
    async with services.trace.span(parent, "tool", name) as span:
        async def get_my_profile() -> dict[str, Any]:
            return await services.profile(span)

        async def list_my_goals() -> dict[str, Any]:
            return await services.goals(span)

        async def assess_my_goal(goal_id: MongoId) -> dict[str, Any]:
            return await services.projection(span, goal_id)

        async def preview_my_contribution(goal_id: MongoId, monthly_thb: Annotated[int, Field(strict=True, ge=0, le=10_000_000)]) -> dict[str, Any]:
            return await services.projection(span, goal_id, monthly_thb)

        async def read_my_portfolio() -> dict[str, Any]:
            return await services.portfolio(span)

        async def reflect_current_turn() -> dict[str, Any]:
            return await services.reflection(span)

        async def get_headline_sample(symbol: Symbol) -> dict[str, Any]:
            return await services.headlines(span, symbol)

        handlers = {fn.__name__: fn for fn in (get_my_profile, list_my_goals, assess_my_goal, preview_my_contribution,
                                               read_my_portfolio, reflect_current_turn, get_headline_sample)}
        server = FastMCP(PROFILES[agent].name)
        for allowed in PROFILES[agent].tools:
            server.add_tool(handlers[allowed])
        data = None
        async with create_connected_server_and_client_session(server) as client:
            schemas = {tool.name: tool.inputSchema for tool in (await client.list_tools()).tools}
            if set(arguments) <= schemas[name]["properties"].keys():
                result = await client.call_tool(name, arguments)
                if not result.isError:
                    data = result.structuredContent
                    if data is None and len(result.content) == 1 and result.content[0].type == "text":
                        data = json.loads(result.content[0].text)
        if not isinstance(data, dict):
            raise ValueError("Tool request unavailable")
        return data
