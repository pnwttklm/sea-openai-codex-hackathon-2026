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

`/goals` shows the Future You dashboard with editable demo goals, an emergency reserve, and a time-machine entry at `/future-you/[goal]`. Edits persist in the current browser origin. `/`, `/journal`, and `/companion` are starter routes. Loading, error, and not-found boundaries are included.
