# Frontend

Next.js App Router with TypeScript and npm. Node.js 20.9 or later is required.

```sh
cd apps/web
npm ci
npm run dev
```

Open http://localhost:3000. Optional configuration: copy `.env.example` to `.env.local`.

```sh
npm run typecheck
npm run build
npm start
```

`npm start` requires a successful build. `src/app/` owns routes and layouts; `src/components/layout/` owns navigation and the shared shell; `src/components/ui/` owns reusable UI; `src/features/` owns feature modules; `src/lib/api/` owns the API client. Use `@/` imports for `src/`.

The demo starts at `/` with both Portfolio chart views. The score card opens `/behavior` and holdings open `/stocks/[symbol]`. For the reference stock detail use `/stocks/AMD`. The browser reads the demo endpoints via FastAPI. Portfolio, quotes, and scores are labeled synthetic. Stock Overview embeds a separate TradingView feed. The shared demo exposes a decision journal, four-agent companion and private operator dashboard.

Stock pages support confirmed paper buys and sells at synthetic prices. Open NVDA and select Sell to see the optional Agent reflection before review. Shared demo mode values the same paper account for the Portfolio, Future Talk and Companion views.

In shared demo mode, the Doraemon button on each stock page opens Investor Companion with the selected ticker. The News tab shows headlines and analysis directly.

The paper order ticket offers Market and Limit orders for whole shares, with a separate review before confirmation. The static quote fills market orders and limits that already qualify. Other limits go to Open orders and reserve cash or shares until cancelled. The demo does not match against a live market feed.
`/goals` shows the Future You dashboard with editable demo goals, an emergency reserve, and a time-machine entry at `/future-you/[goal]`. In shared demo mode confirmed edits persist in MongoDB. Standalone mode uses the current browser origin. Future Talk opens the full-screen conversation at `/future-you` using the configured API profile. Loading, error, and not-found boundaries are included.
