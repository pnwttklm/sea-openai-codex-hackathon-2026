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
| WEB-08 | Build the Future World trip ticket and savings view in `apps/web` | Codex | Review | `poon-future-you` | WEB-07 |
| WEB-09 | Add personal goals and refine the Future You editor in `apps/web` | Codex | Review | `poon-future-you` | WEB-07 |
| WEB-10 | Apply the supplied Brim and Slava references to the Future You dashboard | Codex | Review | `poon-future-you` | WEB-09 |
| WEB-11 | Restore the previous web UI icons and design guidance | Codex | Review | `poon-future-you` | WEB-10 |
| WEB-12 | Build playable Future World and render saved Future You goals as 3D landmarks in `apps/web` | Codex | Review | `poon-future-you` | WEB-08, WEB-09; Spline miniature and Figma `54:1927` |
| WEB-13 | Full-screen mobile Future World house and analog thumbstick in `apps/web/src/features/future-world` | Codex | Review | `poon-future-you` | WEB-12; supplied mobile reference |
| WEB-14 | Restore the island as a walkable full-screen town alongside the house in `apps/web` | Codex | Review | `poon-future-you` | WEB-12, WEB-13 |
| WEB-15 | Connect town houses and interior doors with matching doorstep returns in `apps/web` | Codex | Review | `poon-future-you` | WEB-14 |
| WEB-16 | Unify the town and its enterable interiors in a single Future World scene under `apps/web` | Codex | Review | `poon-future-you` | WEB-15 |
| WEB-17 | Apply the supplied character turnaround and Prik Thai AI design guidelines to the Future World scene and controls in `apps/web` | Codex | Review | `poon-future-you` | WEB-16 |
| WEB-18 | Animate Doraemon wandering, inspecting goals, and stopping to talk in Future World | Codex | Review | `poon-future-you` | WEB-17 |
| API-01 | Scaffold FastAPI, configuration, health route, and Python package | Codex | Review | Current workspace | Starter implemented; review before feature work |
| DATA-01 | Implement MongoDB client lifecycle and agreed repository interfaces | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| AI-01 | Implement configurable OpenAI service and FastMCP entry point | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| INT-01 | Integrate and verify the first complete mobile and desktop journey | Unassigned | Ready | TBD | PLAN-01; WEB-01; API-01; DATA-01; AI-01 |

Implementation tasks may scaffold infrastructure before product contracts are agreed; product behavior must follow the selected journey and approved interface decisions.
