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
| DOC-02 | [Future World conversation, chart, and 3D goal integration handoff](future-world-integration.md) | Codex | Review | `poon-future-you` | WEB-18 |
| WEB-19 | Make Nobita playable and move the Shopee dog into a separate town companion role | Codex | Review | `poon-future-you` | WEB-18 |
| DOC-03 | Update the [backend handoff](future-world-integration.md) for Nobita and both town companions | Codex | Review | `poon-future-you` | WEB-19, DOC-02 |
| WEB-20 | Have Doraemon approach Nobita with occasional goal progress reminders in town | Codex | Review | `poon-future-you` | WEB-19 |
| DOC-04 | Document the required visual for every Doraemon AI reply in the [backend handoff](future-world-integration.md) | Codex | Review | `poon-future-you` | DOC-03 |
| WEB-21 | Give Doraemon contextual conversation starters across all goal stages | Codex | Review | `poon-future-you` | WEB-20 |
| API-01 | Scaffold FastAPI, configuration, health route, and Python package | Codex | Review | Current workspace | Starter implemented; review before feature work |
| DATA-01 | Implement MongoDB client lifecycle and agreed repository interfaces | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| AI-01 | Implement configurable OpenAI service and FastMCP entry point | Unassigned | Ready | TBD | API-01; CONTRACT-01 |
| DEMO-01 | Implement two Portfolio states, Stock Detail, and Investor Health Score using a read-only demo API and MongoDB | Codex | Review | codex/prik-thai-design-stack | API tests, MongoDB fixture, frontend build/typecheck, and browser navigation verified |
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
| DEMO-12 | Connect four Investor Health Score dimensions across the demo | Codex | Review | codex/prik-thai-agent-demo | Verified seven holdings, four dimensions, shared navigation and Future You |
| TALK-01 | Integrate the profile-based Future Talk conversation into the Goals dashboard | Codex | Done | codex/main-future-talk | WEB-10 |
| DEMO-13 | Add real holding logos | Codex | Review | main | Build, typecheck and five served SVGs verified |
| AI-DESIGN-01 | Specify companion roles, FastMCP tools and the operator dashboard | Codex | Done | codex/agent-foundation | AGENT-01 |
| AI-DESIGN-02 | Specify investor reflection and headline sentiment analysis | Codex | Done | codex/agent-foundation | AGENT-01 |
| AGENT-01 | Implement four agents, MCP tools, shared investor data, character popup and private dashboard | Codex | Review | codex/agent-foundation | [Agent operations](../contracts/agent-operations.md) |
| CHART-01 | Refresh the stock INVX radar, add selectable factors and a bar comparison | Codex | Review | codex/agent-foundation | AMD five-factor fixture |
| POPUP-01 | Show the current stock in the investor’s portfolio in the stock companion popup | Codex | Review | codex/agent-foundation | AGENT-01 |
| INVEST-01 | Open the searchable demo market from the Invest tab | Codex | Review | codex/agent-foundation | Demo stock catalog, stock detail and shared tab bar |
| OPTIONS-01 | Add a read-only interactive option-chain mockup to stock detail | Codex | Review | codex/agent-foundation | Stock detail synthetic quote |
| PORT-DEMO | Seed the shared paper portfolio from the seven-holding THB 500,000 example | Codex | Review | codex/agent-foundation | Shared portfolio, paper account and Mongo seed |
| VOICE-LOCAL | Enable Future You voice in the running demo | Codex | Review | codex/agent-foundation | Local API configuration |
| SCORE-01 | Open the reference behavior score from Portfolio and preserve the monthly health report | Codex | Review | codex/agent-foundation | Portfolio, behavior, shared health rubric and server-side AI assessment |
| TUNNEL-01 | Read the demo portfolio and score through the frontend port | Codex | Review | codex/agent-foundation | Shared demo preview |
| SCORE-ART | Show the Doraemon portrait on the assessment control | Codex | Review | codex/agent-foundation | Behavior screen |
| ORDER-BAL | Lead stock order tickets with the current paper balance | Codex | Review | codex/agent-foundation | Stock order sheet |
| ORDER-COPY | Simplify user-facing trading and balance labels | Codex | Review | codex/agent-foundation | Order sheet, portfolio and order errors |
| OPS-GRAPH | Visualize agent activity and the parent-child trace of each run | Codex | Review | codex/agent-foundation | Private operator console |
| DB-HANDOFF | Ship the opening MongoDB dataset and integration guide | Codex | Review | codex/agent-foundation | Seed, data export and README |
| OPS-MAP | Diagram the connections between the API, agents, MCP tools and data sources | Codex | Review | codex/agent-foundation | Private operator dashboard |
| INT-02 | Repair merged frontend dependencies and goal loading, verify local startup | Codex | Review | `poon-future-you` | WEB-21 |
| WORLD-01 | Connect Future You goals, Future World conversations, visuals and landmark appearances across `apps/web`, `apps/api`, and `docs/contracts` | Codex | Review | `poon-future-you` | Live OpenAI, MongoDB, 42 API tests, browser journeys, typecheck and production build verified. [Integration handoff](future-world-integration.md) |
| HEALTH-UX | Integrate the investor health v2 experience with measured scores and Doraemon | Codex | Review | codex/investor-health-ux | Behavior report and human-agent interactions |
| WORLD-SYNC | Fix merged frontend manifests and verify Future World with investor health | Codex | Review | codex/investor-health-ux | Frontend integration |
| AGENT-ART | Replace agent portraits with the four supplied Doraemon illustrations | Codex | Review | codex/investor-health-ux | Companion, research and operator views |
| OPS-FUTURE | Map Future You tools and data flows in the private operator console | Codex | Review | codex/investor-health-ux | OPS-MAP |
| TRADE-PLAN | Review a draft buy or sell with Doraemon and apply the supplied team portraits | Codex | Review | codex/investor-health-ux | Shared goals and trading demo |
| OPS-CONTEXT | Inspect the saved Future You session context in the authenticated operator dashboard | Codex | Review | codex/investor-health-ux | OPS-FUTURE |
| STOCK-NEWS | Show ticker headlines and analysis directly, and open stock chat from Doraemon | Codex | Review | codex/investor-health-ux | Companion news tool |
| AMBIENT-TICKETS | Adapt trade tickets and animate a reviewed reserve withdrawal using the supplied ambient prototype | Codex | Review | codex/investor-health-ux | TRADE-PLAN |
| INVX-AGENT | Ground missing INVX ratings in shared demo goal-fit evidence and a Portfolio Analyst review | Codex | Review | codex/investor-health-ux | TRADE-PLAN |
| STOCK-OVERVIEW | Minimal time-range chart and basic analysis | Codex | Review | codex/investor-health-ux | Demo stock data |
| FUTURE-TALK-LINK | Connect Future Talk directly to the future-self voice screen | Codex | Review | codex/investor-health-ux | Future You |
| TALK-PORTRAIT | Use the supplied adult Nobita portrait in Future Talk | Codex | Review | codex/investor-health-ux | FUTURE-TALK-LINK |
| MARKET-CHARTS | Use sourced price history for every catalog instrument and add the research agent portrait to its stock action | Codex | Review | codex/investor-health-ux | Stock overview, research trigger and market data contract |
| STOCK-COMPANION | Route stock questions to Doraemon and remove the separate research panel | Codex | Review | codex/investor-health-ux | Stock UI and companion turn context |
| CORE-WORLD | Integrate the backend town with the ed6f7c8 shared demo and preserve its navigation | Codex | Review | codex/core-future-world | Future World UI, local demo configuration, and integration verification |
| MERGE-03 | Resolve PR #3 conflicts in Future World, goal loading, API types and the task board | Codex | Review | `poon-future-you` | WORLD-01, WORLD-SYNC |
| INT-01 | Integrate and verify the first complete mobile and desktop journey | Unassigned | Ready | TBD | PLAN-01; WEB-01; API-01; DATA-01; AI-01 |

Implementation tasks may scaffold infrastructure before product contracts are agreed; product behavior must follow the selected journey and approved interface decisions.
