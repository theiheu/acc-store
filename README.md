# ACC Store

A Next.js app (App Router) for selling accounts. This repo uses a central server-only data store with SSE for realtime updates and a set of APIs for the UI.

## Quick start

1. Install

- npm ci

2. Configure environment

- Copy .env.example to .env.local and fill values
  - NEXTAUTH_URL, NEXTAUTH_SECRET
  - ADMIN_EMAILS=you@example.com,admin2@example.com
  - Optional: GOOGLE*\* / FACEBOOK*\* for OAuth
  - Optional: UPSTASH\_\* for distributed rate limiting

3. Run

- npm run dev
- Open http://localhost:3000

## Scripts

- dev: start dev server
- build: build for production
- start: run production build
- lint: lint code
- lint:strict: lint (enforced in CI via next.config.ts)
- typecheck: TypeScript check without emitting
- cleanup:\*: utilities for category/code cleanup

## What’s improved recently

- Middleware simplified: only path normalization; heavy product resolution moved to route-level logic (app/products/[category]/[slug]/page.tsx)
- Rate limiting: added route-level guard using Upstash Redis if configured, else in-memory dev limiter
  - Applied to: /api/products, /api/products/[id], /api/products/resolve, /api/categories, several admin and user endpoints
- RBAC: role injected into JWT/session via ADMIN_EMAILS; admin checks prefer role from session
- Admin analytics charts dynamically imported to reduce bundle/SSR cost
- next.config.ts now enforces lint/TS errors in CI but relaxed locally
- .env.example added

## Admin access

- Set ADMIN_EMAILS in .env.local to grant admin role based on email
- After login, the session carries user.role (admin/user) for server checks

## Notes on data and persistence

- Current data uses in-memory store with JSON persistence under .data (dev-friendly only). For production durability, migrate to a DB (e.g., SQLite/Prisma).

## Next steps (recommended)

- Refactor DataSyncProvider to stop importing server data store on the client; use API + SSE only
- Convert app/products/page.tsx to server-first rendering and split client islands for interactivity
- Add tests (Vitest/RTL, Playwright) and CI workflow (lint/typecheck/test/build)

See docs/ for domain-specific details.
