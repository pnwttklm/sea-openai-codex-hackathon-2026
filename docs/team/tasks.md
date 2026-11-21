# Initialization task board

All tasks are unassigned and not started. Update the owner and status before work. Statuses: Ready, In progress, Blocked, Review, Done. For blockers, name the dependency and next action.

| ID | Task | Owner | Status | Branch | Depends on |
| --- | --- | --- | --- | --- | --- |
| PLAN-01 | Select MVP journey and review accessible design references | Unassigned | Ready | TBD | Team decision |
| CONTRACT-01 | Agree on first journey's API, service, data, and tool interfaces | Unassigned | Ready | TBD | PLAN-01 |
| WEB-01 | Scaffold Next.js, TypeScript, and responsive shell | Codex | Review | Current workspace | Starter implemented; design required for product-specific screens |
| WEB-02 | Implement the Figma Future You dashboard at `/goals` in `apps/web` with synthetic goal fixtures | Codex | Review | `poon-future-you` | Figma `67:1974` and `54:1816` |
| WEB-03 | Build editable goal details, the emergency fund box, glass tabs and time-machine entry in `apps/web` | Codex | Review | `poon-future-you` | WEB-02 |
| WEB-04 | Refine interaction motion across Future You in `apps/web/src/features/goals` | Codex | Review | `poon-future-you` | WEB-03 |
| WEB-05 | Redesign Edit goal input interactions in `apps/web/src/features/goals` | Codex | Review | `poon-future-you` | WEB-04 |
| DOC-01 | Document Future You interaction and motion guidance in `.agents/skills/prik-thai-ai-design/SKILL.md` | Codex | Review | `poon-future-you` | WEB-04, WEB-05 |
| WEB-06 | Replace the Future You hero picker with Future Talk and Future World actions | Codex | Review | `poon-future-you` | WEB-05 |
| WEB-07 | Restore the pre-wave Future You launch controls | Codex | Review | `poon-future-you` | WEB-06 |
| API-01 | Scaffold FastAPI, configuration, health route, and Python package | Codex | Review | Current workspace | Starter implemented; review before feature work |
| DATA-01 | Implement MongoDB client lifecycle and agreed repository interfaces | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| AI-01 | Implement configurable OpenAI service and FastMCP entry point | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| DEMO-01 | Implement two Portfolio states, Stock Detail, and Investing Behavior Score using a read-only demo API and MongoDB | Codex | Review | codex/prik-thai-design-stack | API tests, MongoDB fixture, frontend build/typecheck, and browser navigation verified |
| DEMO-02 | Add an NVDA sell reflection with Webull news | Codex | Review | codex/prik-thai-design-stack | Paper fills verified in browser; live Webull and OpenAI require credentials |
| DEMO-03 | Present the sell reflection as an extension-style chat panel | Codex | Review | codex/prik-thai-design-stack | Verified chat replies, review and dismiss in browser at mobile and desktop widths |
| DEMO-04 | Add a conversational research agent with source-backed tool calls | Codex | Review | codex/prik-thai-design-stack | Tool routing mocked and browser fallback verified; live providers require credentials |
| DEMO-05 | Persist Agent conversations and citations in MongoDB | Codex | Review | codex/prik-thai-agent-demo | Live Agent answer and sources reloaded from MongoDB; build and typecheck passed |
| VOICE-02 | Configure personalized Realtime voice with client secrets and interruptible turns | Codex | Review | feat/future-you-realtime | FUTURE-01 |
| FUTURE-01 | Talk live about saved goals, personalization, and the latest portfolio | Codex | Review | feat/future-you-realtime | Future Talk owns its page layout and can share the API lifespan with the Agent demo. See the branch handoff in `parallel-work.md`. |
| INT-01 | Integrate and verify the first complete mobile and desktop journey | Unassigned | Ready | TBD | PLAN-01; WEB-01; API-01; DATA-01; AI-01 |

Implementation tasks may scaffold infrastructure before product contracts are agreed; product behavior must follow the selected journey and approved interface decisions.
