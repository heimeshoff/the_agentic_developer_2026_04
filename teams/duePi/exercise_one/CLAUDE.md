## What we're building

A **personal finance and budgeting app** for team duePi (Exercise One).

Domain areas in scope: **income**, **budgeting**, **savings**, **investments**, and whatever personal money habits the team wants to model.

The brief is deliberately loose — no required features, no prescribed data model. The shape of the product is ours to discover. Favour breadth and exploration over production polish.

## First use case — track income & expenses

The team's first sticky-note model (from the whiteboard session):

**Jobs the user wants to do**
- Track income
- Track expenses

**Core concepts**
- **Income / expense entry** — has `amount`, `date`, `category`.
- **Category** — e.g. `hobbies`, `food`, `rents`, `transport`, `insurance`, `salary`. (Salary is an income category; the rest are expense categories in this first cut. Treat the list as a seeded default, not a closed set.)
- **Budget** — organises categories into **groups** (the grouping detail is deferred; the first cut only needs to record entries against categories).

**Scope of the first iteration**
- Create income and expense entries with amount, date, and category.
- List / view entries, ideally filterable by category or date range.
- Budget grouping is **out of scope for v1** — model it only if it falls out naturally; otherwise defer.
- No accounts, no transfers, no recurring transactions yet.

When in doubt, build the smallest thing that lets a user record an entry and see it back.

## Working style

- **Vibe code.** Try things, prototype quickly, throw away what doesn't work.
- Lean into the agent — ask for ideas, alternatives, and critiques, not just implementation.
- Keep iterations small and runnable. Prefer something working now over something perfect later.
- No premature abstraction. Three similar lines beats a speculative helper.

## Where code lives

All code for this exercise lives under `teams/duePi/exercise_one/`. Create subfolders freely (e.g. `app/`, `data/`, `notes/`) as the app takes shape. Do **not** write code for this exercise outside this folder.

## Tech stack

- **Runtime:** browser only — no backend, no server.
- **Language:** TypeScript (strict mode).
- **UI:** React.
- **Persistence:** `localStorage`. All app state (entries, categories, settings) is read from and written to `localStorage`. No IndexedDB, no remote API.
- **Build tool:** Vite (default unless a reason emerges to pick otherwise).

Implications to keep in mind:
- Data lives in the user's browser. Clearing site data wipes everything — surface an export/import escape hatch early if it's cheap.
- Keep a single typed schema for what's stored in `localStorage`, and version it (e.g. `{ version: 1, entries: [...] }`) so future migrations are possible.
- No auth, no multi-device sync. One device, one user.

## Data

Assume **synthetic / personal dummy data** only. No real bank credentials, no real account numbers, no PII. If realistic-looking data is needed, generate it.

## Out of scope (for now)

- Auth, multi-user, deployment, CI — unless the team explicitly asks.
- Real bank integrations (Plaid, Open Banking, etc.).
- Production hardening, exhaustive tests.

## Team

- **Team name:** duePi
- **Branch:** `team-duePi` (merge to `main` with `--no-ff` only)
- **Exercise:** One — Personal finance & budgeting
