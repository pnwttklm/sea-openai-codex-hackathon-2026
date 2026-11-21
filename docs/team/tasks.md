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
| VOICE-02 | Configure personalized Realtime voice with client secrets and interruptible turns | Codex | Review | feat/future-you-realtime | FUTURE-01 |
| FUTURE-01 | Talk live about saved goals, personalization, and the latest portfolio | Codex | Review | feat/future-you-realtime | Future Talk owns its page layout and can share the API lifespan with the Agent demo. See the branch handoff in `parallel-work.md`. |
| INT-01 | Integrate and verify the first complete mobile and desktop journey | Unassigned | Ready | TBD | PLAN-01; WEB-01; API-01; DATA-01; AI-01 |

Implementation tasks may scaffold infrastructure before product contracts are agreed; product behavior must follow the selected journey and approved interface decisions.
