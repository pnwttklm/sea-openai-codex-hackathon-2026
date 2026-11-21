---
name: prik-thai-ai-design
description: Use when implementing or reviewing the Prik Thai AI hackathon prototype from Figma, especially the Portfolio, Invest, Future You, and Doraemon contextual guidance flows.
---

# Prik Thai AI design

Build an investing companion that helps Nobita stay on track for life goals. The prototype is a demo, not a brokerage. Keep third-party market data separate from synthetic balances and goal projections. Use Figma for screen design and the demo financial model for projections; do not reconcile conflicting values by silently changing either source.

## Find the right Figma frame

File key: `fxGXlNob258j5CekcAFxIH`. In [the Design canvas](https://www.figma.com/design/fxGXlNob258j5CekcAFxIH/SEA-x-OpenAI-Codex-Hackathon-2026-Brainstorm?node-id=0-1), use node IDs below to distinguish production targets from nearby mood boards, screenshots, and experiments. Inspect the specific node and its screenshot before implementing. Do not treat examples or adjacent reference imagery as shipped interactions.

| Area | Figma nodes | What to preserve |
| --- | --- | --- |
| Portfolio | `54:1325` default; `54:1541` allocation | Nobita profile, portfolio value and period change, line/allocation toggle, line time ranges, Investor Health Score, insights, and holdings. Holdings show ticker, weight, mini-chart, price and signed change. |
| Investing Behavior Score | `73:7643` | Me/Community selector, overall score and explanation, five-axis radar, and cards for Discipline, Performance, Decision, Pressure, and Psychology. Demo overall state: Low, 30/100. Do not invent a scoring formula. |
| Future You | `67:1974` top viewport; `54:1816` full goals | Character hero, lead goal selector and Enter action, then a two-column goal grid with amount saved, target, progress and years left. Order: Marry Shizuka, Retirement in Thailand, Time machine, Dream home. |
| Future world | `54:1904` transition; `54:1927` landscape world; `72:6245` adult Nobita concept | Treat the transition, landscape scene, and future-self conversation as distinct from the dashboard. The board labels voice/video as a concept; a reference image does not require live calling or a 3D engine. |
| Invest | `67:2340` Search; `54:2004` Matrix; `67:2257` World | Keep Search, Matrix and World as modes inside Invest, not as global tabs. Search starts from goal, horizon and risk context; Matrix is exploration against a goal; World is the globe visualization. |
| Product details and budget | `67:3497` product reference; `72:6297` budget card | Keep product research and monthly budget context apart from confirmation or execution. Do not wire trades from mock controls. |
| Ambient AI | `54:2253` case 1; `54:2251` board heading | Use Doraemon as a contextual companion. The board includes alternate AI navigation experiments; default to the three primary tabs unless the task explicitly targets the ambient variant. |

## Mobile-first, native-feeling web UI

- Build for touch in Next.js, not native Swift. Use 375 px as the reference, check 320/375/430 px widths and iOS Safari, and keep the portrait experience in a centered shell (max 480 px) on desktop. Only the Future World view may use a wider landscape layout.
- Use `100dvh` with a `100vh` fallback and safe-area insets for the floating tab bar and bottom sheets. Keep one vertical scroll surface per view, reserve bottom clearance for the nav, and make interactive hit areas at least 44 × 44 px. Do not imitate the OS status bar or home indicator.
- Aim for an iOS-style feel with a floating glass tab bar, clear pressed states, segmented-control selection, and a bottom sheet for the wedding preview when the layout calls for it. Keep selection and scroll position stable where practical when switching tabs. Close sheets by an explicit control, Escape, or backdrop; return focus to the trigger. A swipe may supplement, never replace, a visible control.

## Design tokens

Use semantic CSS variables and shared components. These are web implementation defaults, informed by the Figma frames rather than claimed exports of Figma variables. The selected frame controls per-view exceptions; the Inter, English-only, and icon requirements below override the mockups.

| Role | Default |
| --- | --- |
| Page / card / raised control | `#101114` / `#191A20` / `#252630` |
| Text / secondary text / subtle border | `#F7F8FC` / `#ADB2C1` / `#343640` |
| Primary action / focus ring | `#0071D9` with white label / `#9CCBFF` |
| Hero gradient | `linear-gradient(180deg, #4842EE 0%, #1B1768 45%, #101114 100%)`; only on views with a gradient |
| Positive / negative / caution | `#2AD4AE` / `#FF6E7D` / `#FFD468`; add signed text or a state label |
| Spacing | 4/8/12/16/24/32 px; 16 px screen gutters, 12 px goal-grid gap, 16 px card padding |
| Shape | 20 px cards, 28 px sheets, full-radius nav and segments; thin borders; avoid heavy shadows |
| Tab bar / controls | 64 px floating bar plus safe-area clearance; dark translucent fill with blur, solid dark fallback; 48 px primary CTA; compact segments in 44 px touch targets |

- **Typography:** Inter variable, Latin subset, with a system sans-serif fallback. Set the UI language to English (`lang="en"`), including buttons, empty/loading/error states, chart labels and accessibility labels. Preserve names and ticker symbols; use English locale formatting and THB (for example `THB 50,000`) rather than relying on a Thai glyph in the Latin font. Use tabular lining numerals for changing balances and tables.
- **Type scale (size / line height):** 28/34 semibold for hero amounts, 22/28 semibold for screen titles, 16/24 semibold for section headers, 14/20 regular for body, 12/16 medium for labels. Let amounts wrap cleanly if needed; don't shrink them to unreadable sizes.
- **Icons:** use [Font Awesome 6 Free Classic Solid](https://docs-v6.fontawesome.com/web/use-with/react), with named imports and its React SVG component. Use 16 px for inline icons and 20–24 px for controls. Map chart switches to `faChartLine` and `faChartPie`, search to `faMagnifyingGlass`, back to `faArrowLeft`, close to `faXmark`, and forward navigation to `faChevronRight`. Decorative SVGs are hidden from assistive tech; icon-only buttons get English names. Doraemon/Nobita art and stock logos are assets, not UI icons; do not replace them with emoji or mix icon packs.
- **Components:** share the tab bar, segmented control, card, primary button, amount, status badge and bottom sheet. Pair holdings' green/red changes with explicit signs. Keep goal progress and score readable without relying on the charts or color. Check contrast on glass and gradients.

## Motion

- Keep motion lightweight: CSS first; add no animation dependency unless an existing one meaningfully simplifies a specific interaction. Animate `transform` and `opacity` instead of layout properties. No blocking splash, oversized parallax, or full-screen animation on every tab tap.
- Suggested timing: 100–120 ms press feedback (scale to 0.97), 180–220 ms selection-indicator or chart crossfade, and 240–300 ms for a bottom sheet (ease-out on entry, faster exit). Animate the affected element, not the entire app. Keep backdrop blur static; translate the sheet and fade the scrim.
- For the best demo payoff, animate the funding preview opening, then the saved goal progress changing **after** confirmation. When numbers or charts move, keep final values immediately available to assistive tech. Respect `prefers-reduced-motion`: remove sliding, scale and chart tweening; update state immediately.

## Demo behavior and data

- Prefer a complete wedding-goal path before expanding concept screens: open Marry Shizuka, explain the shortfall, compare paying more each month with taking longer, preview the change, and require a distinct user confirmation before saving.
- Fixture from the separate demo model, not Figma: ฿50,000 starting balance, ฿7,000 monthly, 4% nominal annual assumption compounded monthly, end-of-month contributions, 60 months, ฿650,000 target. Expect ฿525,142.68 projected and ฿124,857.32 short. At the same rate, use ฿8,884/month for the five-year target or keep ฿7,000/month and reach it in month 74. Label projections as estimates, not guarantees.
- When previewing the higher contribution, show the ฿1,884 monthly reallocation from discretionary spending to investments; leave emergency savings alone. Cancel or closing the preview must not change the saved plan.
- Follow the agreed stack: Next.js renders the flow; FastAPI calculates and validates; MongoDB stores confirmed changes; OpenAI SDK + FastMCP can read plans and request previews server-side. A model/tool result is never confirmation. Do not execute trades or connect bank accounts. Use the sources below for market information.

## Stock information and charts

- **Primary:** In the FastAPI service, look up public stock/ETF information with [Webull Cloud MCP](https://developer.webull.com/apis/docs/AI-friendly-Resources/mcp/). Use only the minimum read-only market-data tools, such as instrument lookup and snapshots. Never expose trading, account-data, or watchlist-write tools to the companion. Market coverage and quote freshness depend on Webull entitlements; do not claim real time by default or put credentials in the browser.
- **Fallback:** If Webull is unconfigured, times out, rate-limits, or lacks the instrument or requested data, use Yahoo Finance via [`yfinance`](https://github.com/ranaroussi/yfinance), server-side. Bound timeouts and keep synchronous calls off the async request loop. `yfinance` is unofficial; its README notes personal-use limits for the data. Use it only where the data terms permit; if public demo use is not covered, use a licensed source or a clearly labeled synthetic fixture instead.
- Normalize symbol, exchange, currency, price, as-of time, and source. Show freshness where known, omit missing fields rather than guessing, and label stale/demo data. Avoid stitching prices or percent changes from different providers into a single quote. If both providers fail, show “Quote unavailable” without breaking the screen.
- **Stock price chart:** Embed the official [TradingView Advanced Real-Time Chart widget](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/) on the stock detail screen. Pass a verified exchange-qualified symbol (e.g. `NASDAQ:AAPL`), dark theme and English locale. Mount in a client component with a reserved responsive height, keep the attribution, and show a useful fallback if it is blocked or the symbol is unsupported. Let the widget use its own feed; don't pipe Webull/Yahoo prices into it or assume it matches the quote header's timestamp. Keep portfolio allocation, personal returns, and goal projections in app-owned charts.

## UI references

Use these as references, not as new dependencies or replacements for the Figma design, Inter, or Font Awesome 6:

- [Transitions.dev](https://transitions.dev/): reference for sheet entry, segmented selection, and transitions between related states.
- [Beautiful UI](https://www.beautifului.dev/): reference for compact AI prompt, loading, and result states for Doraemon.
- [BoardUI](https://www.boardui.com/): reference for holdings rows, dashboard cards, and data hierarchy.
- [Bencho](https://bencho.dev/): reference for touch/press feedback and small React micro-interactions.

## Review checklist

- Compare each changed view against its exact Figma node at 375 px. Check 320/430 px, landscape only where intended, iOS Safari safe areas and scrolling, keyboard focus, long amounts, and reduced motion.
- Verify active tab/mode, chart switching, scroll reach, and the distinct preview/cancel/confirmed states wherever implemented.
- Run the wedding fixture through server math; verify cancel leaves persistence unchanged and confirmed values appear on reload. List missing or ambiguous design states instead of presenting guesses as approved behavior.
- For stock detail, check Webull success, Yahoo fallback, both unavailable, correct symbol/venue, attribution, and mobile chart overflow.
