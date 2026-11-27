# Read-only prototype data

Owner and consumer: Backend/API and Frontend (DEMO-01). Prefix: `/api/v1/demo`.
This is a shared, synthetic fixture for the local prototype. The monthly target, paper orders and saved chat are local-demo mutations.

- `GET /portfolio` returns investor name, value and period change in integer THB, chart point arrays and comparison values by range, allocation percentages, and holdings with USD prices in cents and signed percentage moves.
- `GET /behavior` returns Financial Health Score Score calculated from the monthly demo snapshot. The four equally weighted dimensions are Contribution, DCA Consistency, Diversification, and Goal & Risk Fit. Each includes its question, measurement and score out of 10. POST /behavior/target accepts monthly_target_thb (whole THB, 1–100,000,000) and returns the recalculated score.
- `POST /order-review` reviews a local synthetic trade draft (symbol, side, shares, order type and displayed THB estimate in integer satang). It reads the shared monthly target and symbol-linked goals and returns their names, horizons, and optional saved amounts, targets and goal slugs, one reflection question, and its source (AI or demo). An unknown symbol returns 404. Reviewing never places an order.
- `POST /stocks/{symbol}/agent-rating` reads the local synthetic portfolio, symbol exposure and matching goals. It returns the checks underlying the plan-fit rating and an AI interpretation, with a labeled rules-based fallback. The score counts passed checks. Missing inputs stay unscored.
- `GET /stocks/{symbol}/history?period=1M` accepts 1D, 1W, 1M and 1Y. It returns Yahoo Finance USD closing prices in trading order for any catalog instrument (BTC maps to BTC-USD). `timestamps` are matching Unix seconds and `as_of` is the last bar time in UTC. The API caches successful readings for 60 seconds. An unknown symbol returns 404. Missing, invalid or unavailable market history returns 503, and the chart offers a retry.
- `GET /stocks` returns the complete demo instrument catalog as a list of Stock objects sorted by symbol. Invest searches this catalog by ticker or name. Prices use USD cents, changes use signed percentages, and an empty catalog returns an empty list.
- `GET /stocks/{symbol}` accepts 1–5 uppercase ASCII letters. It returns name, exchange, synthetic USD quote in cents, signed percentage change, and optional fundamental factors. Unknown symbols return 404 and malformed symbols return 422.

The canonical fields are the Pydantic schemas exposed in OpenAPI. Synthetic quote responses include `source: "demo"`. For example AMD has `price_cents: 17523` and `change_percent: 1.36`. The frontend distinguishes the fixture quote from any independently sourced TradingView chart.

The async repository reads a versioned fixture document by its unique MongoDB `_id`. The API initializes the fixture idempotently on first access. Missing configuration or database connectivity returns 503 with a useful detail. The health endpoint remains process liveness.

## Regenerate the frontend contract

With the default Compose stack running, run these commands from the repo root with Node/npm on the host:

```sh
curl -fsS http://localhost:8000/openapi.json -o /tmp/prik-thai-openapi.json
npm exec --yes --package=openapi-typescript@7.10.1 -- openapi-typescript /tmp/prik-thai-openapi.json -o apps/web/src/lib/api/demo.generated.ts
```

## Sell reflection (DEMO-02)

`GET /stocks/{symbol}/sell-reflection` evaluates an explicit demo sell scenario. Only NVDA with the simulated 6% drop and a Goal & Risk Fit score below full fit receives a prompt. Other known symbols return `{"prompt": null}`; unknown symbols and malformed symbols keep the existing 404/422 behavior. The prompt returns the simulated move, Financial Health Score and Goal & Risk Fit scores, a neutral question, and up to three Webull headlines. `news_status` distinguishes available, empty, and unavailable results. Articles include a headline and optional publisher, date, and link. If Webull is unconfigured or unavailable, the response still includes the reflection with an empty list. The endpoint never submits an order.

## Paper orders (DEMO-02)

`GET /paper-account` returns a local demo account with USD cash in cents, positions keyed by symbol, and a revision. `POST /paper-orders` accepts `order_id` (UUID), `symbol`, `side` (`buy` or `sell`), and `quantity` (positive integer shares). The backend uses the synthetic stock price, verifies cash or shares, and atomically saves the fill and balance update. Duplicate order IDs replay the original fill if inputs match, and return 409 otherwise. Insufficient cash or shares returns 409. An unknown symbol returns 404. This shared synthetic account is for localhost demos.

## Research chat (DEMO-04)

`POST /agent/chat` accepts a `symbol` (1–5 uppercase ASCII letters) and up to nine chat messages (user/assistant, starting and ending with a user message). The symbol is the current stock's context. A question can name other supported US tickers. The response contains an answer and source references returned by the research tools. The chat endpoint has no access to order or account mutation tools. It returns 503 when the configured research runtime is unavailable.

The browser uses `GET /agent/chat/{conversation_id}/{symbol}` to load saved turns and `POST` on the same path with `{"question":"..."}` to add a turn. The server supplies the last four saved exchanges as context, stores completed turns with sources and UTC timestamps, and keeps the latest 20 per conversation. The random UUID is kept in browser storage per ticker. This is a local demo conversation locator, not user authentication. API keys are not stored in chat records.

Market orders use the demo quote. Limit orders accept `limit_price_cents` and fill immediately at the quote if the buy price is at or below the limit or the sell price is at or above it. Otherwise they are stored as open, reserve cash or shares, and do not change ledger cash or holdings. The static demo quote does not run a market feed or re-match orders later. `GET /paper-orders/open` lists open orders. `POST /paper-orders/{order_id}/cancel` releases the reservation and returns the cancelled order; cancelling an already cancelled order is idempotent. A filled order cannot be cancelled. Old order requests still default to market.

`GET /paper-fx` returns the latest published USD/THB reference rate in millionths of one THB per USD, with source and date. The UI sends the reviewed `fx_rate_micros`; confirmation rejects a changed rate. Paper accounts migrate their existing USD cash once at the first rate used and subsequently settle in THB satang. Filled and open orders snapshot the rate and their THB amount. USD prices and limits stay in cents. If the rate is unavailable, the UI blocks confirmation and retains the order details.

### Investing behavior assessment

`POST /api/v1/demo/behavior/assessment` reads the current shared synthetic portfolio and health plan on the server. Only the local demo origin can request a model assessment. The response uses the same four rubric scores and measurements as the behavior endpoint, with an optional `ai_assessment` on the report and each factor. Regular reads and target edits return these fields empty. The shared read-only preview requests the last assessment from this server session with `include_assessment=true`. It is shown only while the current report matches the assessed measurements. A provider failure or missing model returns 503. The operator dashboard records the assessment run.

In shared demo mode the paper ledger opens fully invested at THB 500,000 with fractional holding quantities at the synthetic USD prices and fixed THB 35/USD rate. Cash starts at zero. Positions can be fractional; order quantities remain whole units. A versioned account keeps prior demo trades in their original ledger.

Each behavior factor includes `facts`, a label-to-value mapping of measured evidence from the score snapshot. Contribution exposes the amount set aside and the current target, DCA the scheduled and completed counts, diversification the look-through exposure weights, and goal fit the checks per assigned goal. API factor scores remain on a 0–10 scale. The health screen displays them on a 0–100 scale.
