# Shared contracts

The API implements [process liveness](health.md), the [Portfolio and Agent demo](demo.md), and [Future Talk](future-you.md).

Before two work areas depend on each other, add a short contract document here and have the affected owners review it in the task or PR. Backend coordinates the canonical Pydantic schemas and eventual generated OpenAPI output; Frontend must not maintain a competing schema definition.

## Record for each interface

- Contract name, owner, consumers, status, and linked task.
- Method and route, or Python service/repository method, or MCP tool name.
- Typed inputs and outputs with representative synthetic examples.
- Validation, error behavior, optional fields, and compatibility expectations.
- Identifier representation, timestamps and timezone, and money currency and precision.
- User identity and authorization boundaries where relevant.
- Fixture or mock behavior while dependencies are unavailable.

## Architectural boundaries

The browser calls FastAPI. REST routes and MCP tools invoke shared application services. Services use repository interfaces; MongoDB access stays in `apps/api/app/data/`. OpenAI orchestration stays in `apps/api/app/ai/`. Pass required services through explicit dependencies; avoid circular imports and import-time network connections.

Choose the MCP transport, execution entry point, dependency lifecycle, and authentication with Backend before wiring it into startup. Both REST and MCP must enforce the same data access rules.

Document changes before implementing a breaking interface update, notify affected owners, and update examples and consumers together. Never treat a brainstormed endpoint or projection assumption as an agreed contract.
