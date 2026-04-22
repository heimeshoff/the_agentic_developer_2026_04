# CLAUDE.md — Snowball / Exercise One

Guidance for Claude Code when working in this directory. This supplements the workshop-level `CLAUDE.md` at the repo root; read that first for branch and folder rules.

## What this is

A **single-user personal finance app** for one household. One person enters the numbers; the app gives him and his family an at-a-glance picture of where they stand and lets him plan ahead. It replaces a paper spreadsheet that never got updated.

## The user behind it

- One operator, household-pooled finances. **No multi-user, no logins, no per-person accounts.**
- The real constraint is **laziness, not complexity.** Every UX decision optimises for *"open the app, add a transaction in under 10 seconds, close it."* A feature that slows entry is worse than not having the feature.
- Currency is **EUR**. Format numbers with German conventions (comma decimal, thousands separator) unless obviously inappropriate.

## What the app tracks

In priority order:

1. **Income** — regular (salary) and one-off (bonuses, refunds, gifts).
2. **Expenses** — explicitly distinguish **regular/recurring** from **one-off**. Budgeting style today is **track-and-review**: no hard caps, no envelopes. Leave room to add category caps or envelope budgeting later without a rewrite.
3. **Savings & investments** — balances and progress toward goals.
4. **Debt / loans** — what's owed, to whom, interest, repayment progress.
5. **Net worth over time** — derived from the above, not manually tracked. Lower priority for MVP.

The main view should serve all four of these without menu-diving:
- *Where do we stand this month?*
- *Plan next month.*
- *How are savings goals tracking?*
- *12-month forecast.*

Volume is small: **tens of transactions per month**, not hundreds. Do not over-engineer for scale.

## Architecture

- **Frontend-only SPA, no backend.** Served as static files from the user's home server (nginx / caddy / whatever). No Node process in production.
- **Stack**: pnpm · TypeScript · Vite. Pick a UI library and state approach as you see fit; prefer small, well-maintained deps.
- **Persistence**: browser-local, IndexedDB (Dexie or similar wrapper is fine). **JSON export/import must ship from day one** — it is the only backup mechanism and the only way to move between devices. Do not skip it.
- **Single device per install** is acceptable. Cross-device sync is explicitly out of scope; the export/import hatch covers it well enough for one user.
- **No auth.** The app is served behind the home-server network.

## Out of scope (for now)

- Multi-user, permissions, sharing.
- Bank API integration (FinTS, Plaid, GoCardless, …) and CSV imports from bank exports. **Manual entry only.**
- Multi-currency.
- Mobile-app packaging. Plain browser only.
- Cloud hosting, server-side sync, encryption-at-rest beyond what the browser provides.

If asked to add any of the above, pause and confirm with the user before implementing — the point of keeping them out is to preserve the fast-entry focus.

## Working rules

- This is a **workshop exercise**, not a shippable product. Favour breadth and working features over polish, test coverage, or premature abstractions.
- Keep it runnable end-to-end at all times. A half-built feature that breaks `pnpm dev` is worse than no feature.
- The exercise brief says to *creatively prompt engineer and vibe code* — lean into that. Don't over-design before the user has actually clicked through the app.
