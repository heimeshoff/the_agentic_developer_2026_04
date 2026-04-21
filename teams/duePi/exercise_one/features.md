# duePi Features

Feature backlog derived from `CLAUDE.md`. Living list — add, reorder, strike as the product takes shape.

Legend: `[ ]` pending · `[~]` in-progress · `[x]` done

## v1 — Track income & expenses

### Must have
- [ ] **track-income** — Record income entries with `amount`, `date`, `category` (e.g. `salary`).
- [ ] **track-expenses** — Record expense entries with `amount`, `date`, `category` (e.g. `food`, `rents`, `transport`).
- [ ] **list-entries** — View all income and expense entries in one place.
- [ ] **filter-by-category** — Narrow the entry list to one or more categories.
- [ ] **filter-by-date-range** — Narrow the entry list to a date range.
- [ ] **seeded-categories** — Default set: `hobbies`, `food`, `rents`, `transport`, `insurance`, `salary`. Open set — users can add more.
- [ ] **persist-to-localstorage** — Single typed, versioned schema (e.g. `{ version: 1, entries: [...] }`).

### Should have (cheap wins)
- [ ] **edit-entry** — Modify an existing entry.
- [ ] **delete-entry** — Remove an entry.
- [ ] **export-data** — Download all app state as JSON (escape hatch before site data is cleared).
- [ ] **import-data** — Upload a previously exported JSON and restore state.

## v2+ — Deferred / explore if they fall out naturally

- [ ] **budget-groups** — Organise categories into groups (e.g. `essentials`, `lifestyle`, `savings`). Deferred from v1.
- [ ] **savings** — Track savings goals / balances.
- [ ] **investments** — Track investment holdings.
- [ ] **monthly-summary** — Income vs expenses per month, per category.
- [ ] **charts** — Spend by category, trend over time.
- [ ] **manage-categories** — Rename, delete, re-colour custom categories.

## Explicitly out of scope

- Accounts, transfers between accounts.
- Recurring transactions.
- Authentication, multi-user, multi-device sync.
- Real bank integrations (Plaid, Open Banking, etc.).
- Backend / server / remote API — browser-only, `localStorage` only.
- Production hardening, exhaustive tests, CI.
- Real PII or real bank data — synthetic / dummy data only.

## Guiding principles

- Smallest thing that lets a user **record an entry and see it back** wins.
- Vibe code — prototype, throw away what doesn't work.
- No premature abstraction. Three similar lines beats a speculative helper.
- Breadth and exploration over production polish.
