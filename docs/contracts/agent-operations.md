# Companion agents and shared demo data

**AGENT-01** implements the AI-DESIGN-01 and AI-DESIGN-02 proposals for the local synthetic investor. The server owns investor identity, agent permissions and run IDs. The typed HTTP interface is available in FastAPI's OpenAPI schema. The frontend uses generated schema types.

## One investor, one investment account

| Consumer | MongoDB authority and behavior |
| --- | --- |
| Goals, Future World, Future Talk and Goal Planner | `future_you_demo` contains the profile and owned goals. Goals displays stable slugs. Voice and MCP use ObjectIds. Confirmed edits update the same document. Exact months drive projections. The separate emergency reserve stays outside life-goal projections. |
| Portfolio, Portfolio Analyst, stock order tickets and Future Talk | `paper_accounts` holds cash and positions (including fractional opening holdings). `demo_snapshots` supplies synthetic quoted prices and metadata. In shared demo mode, all consumers value the same account with the same synthetic USD/THB rate of 35. Legacy paper balances and orders are preserved. The portfolio chart shows illustrative history. |
| Investor Health, Invest research and sell reflection | The shared portfolio supplies current exposures. Saved goal horizons feed goal/risk fit. The existing synthetic planning assumptions and contribution history drive the other dimensions. Research chat retains its existing MongoDB conversation storage. |
| Decision journal | `decision_journal` stores reflections explicitly submitted for the synthetic investor. A retried submission with the same ID and text returns the original record. |
| Operator dashboard | `agent_runs` and `agent_spans` store operation metadata, statuses, durations and call relationships. Both collections have seven-day TTL indexes. |

The local API creates one async MongoDB client per lifespan. User-specific routes from the preexisting Future Talk contract still support the configured real profile outside shared demo mode. New agent and goal-write routes require synthetic demo mode and an allowed loopback browser origin. [Future You contract](future-you.md)

## Agents and first-party tools

| Agent | Responsibilities | MCP arguments and results |
| --- | --- | --- |
| Investor Companion (Doraemon) | Route the turn and present a single answer in Thai or English | `get_my_profile()` returns selected personalization fields. `list_my_goals()` returns owned goal IDs, categories and names. |
| Goal Planner | Calculate the gap or compare a proposed contribution in memory | `assess_my_goal(goal_id)` returns target, monthly amount, horizon, rate, estimated value, shortfall and required contribution. `preview_my_contribution(goal_id, monthly_thb)` returns baseline, preview and difference. |
| Portfolio Analyst | Explain account cash, balance and allocations | `read_my_portfolio()` returns the account timestamp, THB amounts and holding weights. |
| Sentiment Analyst | Acknowledge explicitly expressed feelings and analyze a named stock's sampled coverage | `reflect_current_turn()` returns a cue supported by the current message. `get_headline_sample(symbol)` returns up to three deduplicated and dated headlines in a seven-day window. Results identify synthetic news or Webull. |

FastAPI calls the official OpenAI Python SDK when credentials and a model are configured. An offline demo router and classifier support a credential-free walkthrough. The orchestrator applies the same allowlists in both modes and uses the MCP SDK's FastMCP server with in-memory client sessions. The active role determines which wrappers are registered. Server-side closures bind the actor, current message and parent span. Tools share goal, portfolio and news services with existing features. One turn has a 20-second deadline and at most six tool calls.

For the wedding fixture, the estimated five-year balance is THB 525,142.68. The shortfall is THB 124,857.32, and the required monthly contribution is THB 8,884. A mixed concern and savings question invokes Goal Planner and Sentiment Analyst concurrently. Partial results preserve independently supported answers. News tone describes only the cited sample.

## HTTP and operator access

| Route under `/api/v1` | Contract |
| --- | --- |
| `POST /companion/turns` | Accepts `question` and optional `goal_id`. Returns `answer`, `presenters`, `evidence`, `status` and `mode`. The investor sees specialist mascots and source notes. |
| `GET /companion/goals`, `POST /companion/goals` | Read or explicitly confirm a plan with slug, title, saved/target/monthly THB, months and revision. Concurrent edits with a stale revision return 409. |
| `GET /companion/journal`, `POST /companion/journal` | Read the latest 50 owned entries or submit a UUID and reflection text. |
| `POST /ops/session`, `DELETE /ops/session` | Local operator login/logout. Login requires a server-only secret of at least 24 characters, issues an HttpOnly, SameSite=Strict signed one-hour cookie and rate-limits failed attempts. |
| `GET /ops/agent-runs` | Recent summaries, newest first. Optional `agent`, `status`, and `cursor` filters. Cursor is the last returned run ID. Page size is 40. |
| `GET /ops/agent-runs/{run_id}` | Bounded span tree including agent, tool, DB, calculation, classifier and news provider activity. A missing session returns 401. An invalid session returns 403. |

The private Next.js route `/ops/agents` verifies the session on the server before rendering runs. The API verifies the session on each operational read. Polling refreshes the selected active run every two seconds and stops at a terminal status. Trace fields exclude message text, cue labels, balances, DB filters, tool payloads and secrets. Trace-storage failure leaves the investor response usable.

## Local walkthrough

Start the [shared demo](../../README.md#shared-agent-demo). Open a stock detail page to see the pet greeting and choose **Yes** or **Talk later**. Open **Investor Companion** from the portfolio avatar or visit `/companion`. Sign in at `/ops/agents` in a second tab and expand the same run. Compare the tool and database spans with the visible answer. [Original Future You reference](https://www.figma.com/design/fxGXlNob258j5CekcAFxIH/SEA-x-OpenAI-Codex-Hackathon-2026-Brainstorm?node-id=67-1974)

## Verification

The implementation passed 38 backend tests including the opt-in disposable MongoDB integration. The integration saves a revised goal, checks Future You and the agent output, fills and retries a paper order, compares portfolio cash with the Companion answer, saves a journal entry twice and checks operator access. TypeScript and the Next.js production build passed. Chromium checks covered the stock popup, Thai answer, dashboard login and nested trace, and the stock factor chart at 320, 375, 430 and 1280 pixels. A live OpenAI test used the Thai wedding question with both specialists and confirmed the THB 8,884 result. Headline tests used synthetic or mocked news.

```sh
docker compose -p prik-agent-foundation exec -T -e AGENT_TEST_MONGODB_URI=mongodb://mongo:27017 api pytest -q
docker compose -p prik-agent-foundation exec -T web npm run typecheck
docker compose -p prik-agent-foundation run --rm --no-deps web npm run build
```
