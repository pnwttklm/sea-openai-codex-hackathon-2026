# Frontend instructions

Applies to `apps/web/`, alongside root instructions.

- Own the Next.js app, TypeScript UI, styles, frontend dependency manifest, and lockfile.
- Use the App Router. Choose one package manager when scaffolding and document verified commands.
- Keep API access in a small typed client layer. Use shared contracts and handle failures explicitly.
- Build mobile-first, keyboard-accessible screens. Check a narrow mobile viewport and desktop for overflow and usable controls.
- Preserve server/client component boundaries. Browser code must never connect directly to MongoDB or hold OpenAI credentials.
- Label development fixtures and keep them separate from live API behavior. Do not silently replace failed live requests with success fixtures.
- Read product context and inspect Figma before product-specific design work; a neutral shell can be scaffolded independently.
- The user-selected frontend theme is the Figma pitch deck linked in `resources/design/README.md`. Match verified colors, typography, and visual patterns from that deck across the shared UI. Current starter styling is provisional; do not invent deck tokens while access is unavailable.
- Also use the Figma brainstorm linked in that design index for product and flow context; both Figma references are user-selected. Resolve any conflict using the user's latest direction and record unresolved design choices rather than guessing.
- Use Inter as the primary frontend font, per explicit user direction. Fonts are bundled through `@fontsource/inter`; keep typography centralized in `src/styles/theme.css` and retain system fallbacks for unsupported glyphs.
- Coordinate API changes with Backend. Do not edit Backend manifests or schemas without a claimed cross-area task.
- When available, verify type checking, production build, and the affected UI flow; report any browser verification limit.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
