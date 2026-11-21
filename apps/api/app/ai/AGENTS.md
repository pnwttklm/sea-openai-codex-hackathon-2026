# AI and MCP owner instructions

Applies to this directory, alongside parent instructions.

- Own OpenAI SDK integration, prompts, AI response validation, and the FastMCP entry point/tool adapters.
- Keep the OpenAI API key and model configuration server-side. Coordinate dependencies and startup with Backend.
- Verify SDK and FastMCP APIs against the installed versions before using them. Do not guess model availability or transport configuration.
- Build tools on shared application services; do not duplicate business logic or bypass repository and authorization boundaries.
- Treat user text, retrieved resources, and model output as untrusted input. Validate structured output before using it in application decisions.
- Do not expose unrestricted database queries, arbitrary code execution, or general-purpose network access as tools.
- Make tool mutations explicit in their contracts and enforce the same permissions as REST actions.
- Keep demo projections grounded in documented inputs and model assumptions; do not invent financial model contents or present generated claims as verified facts.
- Bound calls with configured timeouts and deliberate retry behavior. Surface actionable errors without leaking secrets or full private prompts.
- Test tool schemas, service delegation, malformed model outputs, and provider failure behavior using mocks. Mark live calls separately and report whether they were run.
