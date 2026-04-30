# Charts — clarifying questions

## Questions

### Scope & users

1. Who is the audience for v1? (A) the signed-in user viewing only their own data (consistent with current ownership model), (B) also support a future "shared/household" view, (C) admin/global aggregates across users.
2. What's the primary user job-to-be-done? (A) "see where my money goes by category" (compositional view), (B) "see trends over time" (temporal view), (C) "compare income vs expense at a glance," (D) all of the above as equal first-class views.
3. Should soft-deleted transactions be excluded from charts (consistent with `listTransactionsByUser`), or should there be any view that includes them (e.g. an audit/history chart)?

### Data & state

4. Should chart data be derived live on each request from `data/db.json` (same path as the dashboard list), or pre-aggregated and cached? Given the JSON-file store and single-process model, is "compute on the server per request" acceptable for v1?
5. Does this feature introduce any new persisted entity (e.g. saved chart preferences, pinned date ranges, per-user filter defaults), or is all chart state ephemeral/URL-driven and require zero schema changes to `db.json`?
6. The `Transaction` shape includes `source: "demo" | "user"` — should demo transactions be included in charts (matching the list page), excluded, or visually distinguished (e.g. dashed series)?

### UI / UX

7. Where do charts live? (A) on the existing `/app` dashboard (above or below the transactions list), (B) a new dedicated route like `/app/charts` with nav entry in `src/app/app/layout.tsx`, (C) a new tab/segmented control on `/app` that swaps list ↔ charts, (D) a modal/drawer.
8. Which chart types in v1? (A) bar (monthly income vs expense) + pie/donut (spending-by-category), (B) those plus a line/area chart of balance-over-time, (C) those plus stacked-bar by category over time, (D) other combination — please specify.
9. What time-range controls should be exposed? (A) fixed "last 30 days" only, (B) presets (this month / last 3 months / this year / all time), (C) presets + custom date-range picker, (D) none — always show all-time.
10. Which charting library/approach? (A) Recharts, (B) Chart.js + react-chartjs-2, (C) Visx, (D) hand-rolled SVG (matches the minimal monochrome theme already established), (E) author's call as long as it respects the Tailwind monochrome palette + `text-expense` / `text-income` accents.

### Edge cases & constraints

11. Empty/sparse data: when a user has zero transactions (or zero in the selected range), what should each chart show? (A) hide the chart entirely with a hint, (B) render an empty-state placeholder per chart, (C) render the chart axes only with a "No data" overlay.
12. Currency: the model is single-currency-per-user (`User.currency`), so all amounts share one unit — confirm charts should just format with that user's currency via `formatAmount` and not introduce any FX/multi-currency handling (which is explicitly Tier 4 per `README.md`).
13. Performance/scale: demo data seeds ~500 transactions; should v1 be designed/tested for that order of magnitude only, or should we cap/paginate/down-sample beyond some threshold (e.g. > 5k rows)?

### Non-goals

14. Are interactive drill-downs (clicking a pie slice to filter the list, clicking a bar to jump to that month) explicitly out of scope for v1, or expected?
15. Are export/share features (PNG download, CSV export of aggregated data, shareable link) out of scope for this feature?
16. Are budget/target overlays (e.g. "spending vs monthly budget" reference lines) out of scope, given budgets are listed as Tier 3 in `README.md`?

## Answers

### Scope & users
1. **A** — signed-in user, own data only.
2. **A** — primary JTBD: "see where my money goes by category" (compositional view).
3. **A** — exclude soft-deleted (matches `listTransactionsByUser`).

### Data & state
4. **A** — compute live on the server per request from `data/db.json`.
5. **A** — no new persisted entity; all chart state is ephemeral / URL-driven; zero schema changes.
6. **A** — include demo transactions (matches the list page).

### UI / UX
7. **A** — charts live on the existing `/app` dashboard (placement on the page is the architect's call).
8. **A** — v1 ships two chart types: a bar chart of monthly income vs expense, and a pie/donut of spending-by-category.
9. **C** — presets (this month / last 3 months / this year / all time) **plus** a custom date-range picker.
10. **A** — Recharts.

### Edge cases
11. **C** — when there's no data, render the chart axes with a "No data" overlay.
12. **A** — single-currency per user; format with `formatAmount`; no FX handling (Tier 4 stays out).
13. **A** — design and test for ~500 rows (current demo scale); no down-sampling required.

### Non-goals
14. **B** — drill-downs are **in scope**: clicking a pie slice filters the transactions list to that category; clicking a bar jumps to that month's transactions.
15. **A** — export/share (PNG / CSV / shareable link) is out of scope.
16. **A** — budget/target overlays are out of scope (Tier 3 stays out).
