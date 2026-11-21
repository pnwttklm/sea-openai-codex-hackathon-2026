# Initialization task board

All tasks are unassigned and not started. Update the owner and status before work. Statuses: Ready, In progress, Blocked, Review, Done. For blockers, name the dependency and next action.

| ID | Task | Owner | Status | Branch | Depends on |
| --- | --- | --- | --- | --- | --- |
| PLAN-01 | Select MVP journey and review accessible design references | Unassigned | Ready | TBD | Team decision |
| CONTRACT-01 | Agree on first journey's API, service, data, and tool interfaces | Unassigned | Ready | TBD | PLAN-01 |
| WEB-01 | Scaffold Next.js, TypeScript, and responsive shell | Codex | Review | Current workspace | Starter implemented; design required for product-specific screens |
| API-01 | Scaffold FastAPI, configuration, health route, and Python package | Codex | Review | Current workspace | Starter implemented; review before feature work |
| DATA-01 | Implement MongoDB client lifecycle and agreed repository interfaces | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| AI-01 | Implement configurable OpenAI service and FastMCP entry point | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| DEMO-01 | Implement two Portfolio states, Stock Detail, and Investing Behavior Score using a read-only demo API and MongoDB | Codex | Review | codex/prik-thai-design-stack | API tests, MongoDB fixture, frontend build/typecheck, and browser navigation verified |
| DEMO-02 | Add an NVDA sell reflection with Webull news | Codex | Review | codex/prik-thai-design-stack | Paper fills verified in browser; live Webull and OpenAI require credentials |
| DEMO-03 | Present the sell reflection as an extension-style chat panel | Codex | Review | codex/prik-thai-design-stack | Verified chat replies, review and dismiss in browser at mobile and desktop widths |
| DEMO-04 | Add a conversational research agent with source-backed tool calls | Codex | Review | codex/prik-thai-design-stack | Tool routing mocked and browser fallback verified; live providers require credentials |
| DEMO-05 | Persist Agent conversations and citations in MongoDB | Codex | Review | codex/prik-thai-agent-demo | Live Agent answer and sources reloaded from MongoDB; build and typecheck passed |
| DEMO-06 | Add stateful bot avatars to the Agent panels | Codex | Review | codex/prik-thai-agent-demo | Both panels verified in browser; production build and typecheck passed |
| DEMO-07 | Animate confirmed paper orders into their receipt | Codex | Review | codex/prik-thai-agent-demo | Buy, sell, and insufficient cash verified in browser; build and typecheck passed |
| DEMO-08 | Add a broker-style paper order ticket with market and limit orders | Codex | Review | codex/prik-thai-agent-demo | Market fills, limit placement and cancellation verified in browser; API tests and frontend checks passed |
| DEMO-09 | Settle paper trades in THB and add direct Portfolio chart interaction | Codex | Review | codex/prik-thai-agent-demo | Live FX, THB buy/sell, chart interactions, API tests and frontend checks verified |
| DEMO-10 | Remove stock action bar caption | Codex | Review | codex/prik-thai-agent-demo | Frontend typecheck passed |
| DEMO-11 | Show five INVX dimensions on stock pages | Codex | Review | codex/prik-thai-agent-demo | VOO browser check and typecheck passed |
| DEMO-12 | Connect four Investor Health Score dimensions across the demo | Codex | In progress | codex/prik-thai-agent-demo | Frontend, API, data, agent and contract |
| INT-01 | Integrate and verify the first complete mobile and desktop journey | Unassigned | Ready | TBD | PLAN-01; WEB-01; API-01; DATA-01; AI-01 |

Implementation tasks may scaffold infrastructure before product contracts are agreed; product behavior must follow the selected journey and approved interface decisions.
