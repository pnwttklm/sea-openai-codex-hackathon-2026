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

The demo starts at `/` with both Portfolio chart views. The score card opens `/behavior` and holdings open `/stocks/[symbol]`. For the reference stock detail use `/stocks/AMD`. The browser reads synthetic portfolio, quotes, and scores from the FastAPI demo endpoints. Stock Overview embeds a separate TradingView feed.

Stock pages support confirmed paper buys and sells at synthetic prices. Open NVDA and select Sell to see the optional Agent reflection before review. Portfolio shows the paper account cash and share counts separately from the synthetic THB reference chart.

Ask Agent saves completed questions, answers, and citations to MongoDB. Reopen the panel in the same browser and stock page to pick up the conversation. The browser stores the random conversation identifier locally.

`/goals` shows the Future You dashboard with editable demo goals, an emergency reserve, and Future World at `/future-you/[goal]`. Goal edits persist in the current browser origin. The `/journal` and `/companion` routes remain starters.
