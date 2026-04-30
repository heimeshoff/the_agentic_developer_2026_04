# Technical Implementation Plan — Charts

## 1. Summary

Add a charts capability to the existing `/app` dashboard: a monthly income-vs-expense bar chart and a spending-by-category pie/donut, both computed live server-side from `data/db.json` over a user-selected time range (presets + custom date picker). Time-range and drill-down state live entirely in URL search params, which the same `/app` page consumes both to (a) parameterise aggregation for the charts and (b) filter the existing `TransactionsList`. Charts render in a small client island wrapping Recharts (the only new dependency); pure aggregation utilities live in a new `src/lib/aggregations.ts` and are unit-tested against `Transaction[]` fixtures with vitest. The dashboard server component stays the orchestrator: it reads transactions via `listTransactionsByUser` (already excludes soft-deleted, includes demo + user), runs the aggregations, applies the new list filters, and passes the results down. No schema changes, no new persisted entity, no interaction with `withLock`.

## 2. Architectural decisions

- **Decision:** Where does the server/client boundary live for the charts on `/app`?
  - **Options considered:**
    - Make the whole `/app/page.tsx` a client component — simplest Recharts integration, but loses server-side data access (`requireSession`, `listTransactionsByUser` are server-only) and breaks the existing pattern.
    - Keep `page.tsx` a server component that aggregates data, then pass aggregated arrays into a small `"use client"` wrapper (`DashboardCharts.tsx`) that renders Recharts — preserves existing server-data flow, ships only the rendering layer to the client.
    - Server component renders nothing chart-shaped, lazy-loads a chart island via `next/dynamic({ ssr: false })` from inside the page — avoids any SSR attempt at Recharts, but adds a client-side fetch round-trip or forces props through a thin shim.
  - **Recommendation:** Option 2. The dashboard server component continues to own auth + data + aggregation; a single `DashboardCharts` client component receives plain serializable arrays (`{ month, income, expense }[]` and `{ category, total }[]`) plus the active range and renders both charts. This matches the `TransactionsList` pattern already used in the codebase and keeps `Recharts` strictly in client land. If hydration warnings appear from Recharts measuring the DOM, escalate the inner chart components individually to `next/dynamic({ ssr: false })`.

- **Decision:** Where do `bucketByMonth` / `groupByCategory` / `inRange` live, and what's their shape?
  - **Options considered:**
    - Inline inside `page.tsx` — fast to write, untestable in isolation, couples view to math.
    - New `src/lib/aggregations.ts` exporting pure functions over `Transaction[]` — testable, reusable, matches the `src/lib/*` convention (`categories.ts`, `currencies.ts`).
    - Extend `src/lib/transactions.ts` — keeps domain-related helpers together but mixes write-path logic (mutations + audit) with read-only analytics; overloads an already-busy module.
  - **Recommendation:** Option 2. Create `src/lib/aggregations.ts` with pure, dependency-free functions:
    - `inRange(tx: Transaction, from?: string, to?: string): boolean`
    - `bucketByMonth(txs: Transaction[]): { month: string; income: number; expense: number }[]` — `month` is `"YYYY-MM"`, output sorted ascending, months with zero on either side included only if at least one transaction falls in them (caller decides whether to densify; v1 keeps this minimal).
    - `groupByCategory(txs: Transaction[], kind: "expense" | "income"): { category: string; total: number }[]` — sorted descending by total, only the requested kind.
    - `resolvePresetRange(preset: RangePreset, today: Date): { from: string; to: string }` — `today` is injectable for testability (no hidden `new Date()` inside).
    All functions take already-soft-delete-filtered transactions (the page calls `listTransactionsByUser` which already filters); they do not call the DB layer themselves.

- **Decision:** URL search-param shape for chart range and drill-down filters.
  - **Options considered:**
    - Two disjoint param namespaces — e.g. `chartFrom` / `chartTo` for charts and `listFrom` / `listTo` for the list — strictly separates concerns but means clicking a chart slice can't drive the list without ugly mirroring.
    - One unified `from` / `to` / `range` / `category` namespace consumed by both the aggregation and the list filter on the same page — single source of truth, drill-down is just "set `category=Groceries`" and re-render.
    - Encode chart state in a JSON-stringified blob — flexible, but ugly URLs and no shareability.
  - **Recommendation:** Option 2. Search params on `/app`:
    - `range`: `"this-month" | "last-3-months" | "this-year" | "all" | "custom"` (default `"this-month"`); when `"custom"`, `from` and `to` (ISO date strings) are read; otherwise they're derived.
    - `from`, `to`: ISO `YYYY-MM-DD` (inclusive). Ignored unless `range=custom`.
    - `category`: optional string; if present, narrows the list (drill-down from pie). Charts continue to show all categories regardless — the category filter applies only to the list.
    - `month`: optional `"YYYY-MM"`; if present, narrows the list to that month (drill-down from bar). Same charts-unaffected rule.
    Backwards compatibility: today `/app` ignores all search params, so adding these params is purely additive — old bookmarks (`/app`) keep rendering with default range.

- **Decision:** Drill-down navigation target for chart clicks.
  - **Options considered:**
    - Push to a new route like `/app/transactions?category=Groceries` — clean separation, but duplicates the dashboard UI and forks the codebase.
    - Push to the same `/app` URL with new search params; `/app/page.tsx` filters its `transactions` array before handing it to `TransactionsList` — single page, single source of truth, charts and list stay synchronized.
    - Client-side scroll + local state filter inside `TransactionsList` — non-shareable URL, breaks back-button.
  - **Recommendation:** Option 2. Chart clicks call `router.push(`/app?${nextParams}`)`. The page reads `searchParams`, applies `category` / `month` filters to the transactions array, and passes the filtered array to `TransactionsList`. Charts continue to receive the *unfiltered-by-drill-down* (but range-filtered) array, so clicking a slice doesn't make the chart collapse to one slice. **This requires the list page to start consuming search params** — currently it doesn't (verified by grep). That work is in scope for this feature.

- **Decision:** Recharts integration footprint and palette.
  - **Options considered:**
    - Import full `recharts` barrel — simplest, ships everything.
    - Import only the components used (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`, `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Legend`) — Recharts is tree-shakeable; named imports already give us this.
    - Wrap Recharts behind a project-local thin component that only re-exports our two charts — useful if we expect to swap the lib later; premature now.
  - **Recommendation:** Option 2. Two leaf components: `MonthlyBarChart.tsx` and `CategoryPieChart.tsx`, both `"use client"`, each a thin Recharts wrapper. Palette:
    - Bar chart: `text-income` for the income bar fill, `text-expense` for the expense bar fill — read the actual hex from `tailwind.config.ts` and pass via `fill` prop (Recharts doesn't consume Tailwind classes for SVG fills).
    - Pie chart: a small monochrome ramp (e.g. 6–8 shades from the existing `text-*` / `border` neutrals plus one `text-expense` accent) cycled across slices via `<Cell fill={...}>`. Define the ramp once in the chart file (or in a tiny `chartPalette.ts`) — do not re-derive it per render.
    - All chart containers wrap in `<ResponsiveContainer width="100%" height={H}>` so layout stays Tailwind-driven (no fixed widths).

- **Decision:** Empty-state rendering for "no data in range".
  - **Options considered:**
    - Skip rendering the chart and show a `<p>No data</p>` placeholder — simplest, but the spec calls for axes-with-overlay.
    - For the bar chart: render the chart with an explicit X-domain (the months in the selected range) and Y-domain `[0, 1]`, no bars; overlay a centered "No data" label absolutely positioned. For the pie: render an empty grey ring (single full-circumference `<Pie>` with one synthetic slice colored as the neutral border) and overlay "No data" centered. Matches spec.
    - Mock a single zero-value data point — Recharts renders nothing meaningful and the axes auto-scale weirdly.
  - **Recommendation:** Option 2. Each chart component checks `data.length === 0` and renders an "empty mode": axes/ring drawn with a deterministic domain, plus an absolutely-positioned `<div className="absolute inset-0 flex items-center justify-center text-sm text-muted">No data</div>` inside the same relative-positioned wrapper as the `ResponsiveContainer`.

- **Decision:** Testing approach.
  - **Options considered:**
    - Pure-function tests only on aggregations — fast, deterministic, full coverage of the math; matches `vitest.config.ts` (which currently includes only `tests/**/*.test.ts` in a node environment).
    - Add jsdom + React Testing Library for component tests — broader coverage, but requires changing `vitest.config.ts` (currently `environment: "node"`) and adding deps; out of proportion for this feature.
    - E2E with Playwright — out of scope per project rules (no Playwright dep yet).
  - **Recommendation:** Option 1. Unit tests in `tests/aggregations.test.ts` (matching the existing `tests/**` discovery pattern from `vitest.config.ts`) covering: `inRange` boundaries (inclusive start / inclusive end / soft-delete already filtered upstream so not retested here), `bucketByMonth` (income vs expense separation, multi-month ordering, single-month, empty input), `groupByCategory` (correct kind selection, descending sort, ties, empty input), `resolvePresetRange` (each preset against an injected `today`). Also add `tests/urlState.test.ts` for the URL helper (parse + serialize round-trip, defaults, custom-without-dates falls back to default). No component tests in v1 — keep `vitest.config.ts` as `environment: "node"`.

## 3. Affected files / modules

- `package.json` — `modify` — add `recharts` (dependency), pin to a major. No devDeps change.
- `src/lib/aggregations.ts` — `new` — pure `inRange`, `bucketByMonth`, `groupByCategory`, `resolvePresetRange`, plus `RangePreset` type.
- `src/lib/chartUrlState.ts` — `new` — `parseChartParams(searchParams)` and `buildChartHref(prev, patch)` helpers; single source of truth for the search-param vocabulary (`range` / `from` / `to` / `category` / `month`).
- `src/app/app/page.tsx` — `modify` — accept `searchParams`, parse via `parseChartParams`, derive effective `{from, to}`, filter transactions for the list (by `category` and/or `month` if present), aggregate transactions for the charts (by range only), render `<DashboardCharts>` above or beside `<TransactionsList>`. Layout adjustment to fit the charts row.
- `src/app/app/TransactionsList.tsx` — `modify` (small) — receive optional `activeFilters` props (`{ category?: string; month?: string }`) and render a small "Filtered by …" chip with a clear-link (links to `/app` minus those params). The list itself is already pre-filtered by the page; the chip is presentational only. No change to its existing optimistic-delete logic.
- `src/app/app/DashboardCharts.tsx` — `new` — `"use client"` wrapper that lays out `<RangeControls>` + `<MonthlyBarChart>` + `<CategoryPieChart>` in a responsive grid. Receives serializable aggregated data and current range/from/to from the server. Does not fetch.
- `src/app/app/MonthlyBarChart.tsx` — `new` — `"use client"`; Recharts `BarChart` with two `<Bar>`s (income, expense) using palette colors; `onClick` on bars dispatches `router.push` to `/app?…&month=YYYY-MM`. Empty-state handling.
- `src/app/app/CategoryPieChart.tsx` — `new` — `"use client"`; Recharts `PieChart` (donut via `innerRadius`); `<Cell>` per slice from a fixed palette ramp; `onClick` on slices dispatches `router.push` to `/app?…&category=<name>`. Empty-state handling.
- `src/app/app/RangeControls.tsx` — `new` — `"use client"`; preset buttons (this month / last 3 months / this year / all time) and two `<input type="date">` for custom; updates URL via `router.push` and `useSearchParams` so server re-renders re-aggregate.
- `tests/aggregations.test.ts` — `new` — vitest unit tests for the four aggregation helpers with hand-rolled `Transaction[]` fixtures.
- `tests/chartUrlState.test.ts` — `new` — vitest unit tests for parse/build helpers, defaults, and `range=custom` validation.

## 4. Risks & unknowns

- **List filtering by search params is new work.** The current `/app/page.tsx` does not read `searchParams`, and `TransactionsList` has no notion of filters. The bar/pie drill-down depends on this. The plan keeps this scoped (filter at the page level before passing into the list, drop a "Filtered by … · clear" chip into the list), but it is genuinely a list-side change, not just a chart-side change. If reviewers want list-filter UI to be richer (e.g. filter dropdowns), call out as scope creep — v1 only adds search-param consumption and the chip.
- **Recharts + Next.js 15 SSR.** Recharts is a client-only library; rendering it inside a server component will throw at import time. Using `"use client"` on the wrapper components is the canonical fix. If Recharts still produces "ResizeObserver is not defined" or hydration mismatches at build, escalate to `next/dynamic(() => import("./MonthlyBarChart"), { ssr: false })`. Worth a quick spike on first integration; do not pre-emptively `dynamic()` everything.
- **`withLock` interaction (ADR-0005).** Charts are read-only and call `readDb` (via `listTransactionsByUser`) which does **not** acquire `withLock`. So charts cannot block writes nor be blocked by them. There is a tiny chance of a chart aggregation reading a snapshot taken between two writes; given the single-process / last-write-wins model and the workshop scale, that's identical to the existing behaviour of the list view and is acceptable.
- **Bundle size.** Recharts is ~90KB gzipped. That's the only new dep and only ships on `/app`. Acceptable for v1; if ever a concern, lazy-load via `next/dynamic`.
- **Date arithmetic without a date library.** `resolvePresetRange` and `bucketByMonth` need month boundaries. `date-fns` / `dayjs` are not in the project. Hand-roll using the `Date` API (`new Date(y, m, 1)`, `toISOString().slice(0,10)`) and write thorough tests against an injected `today`. If the hand-rolled logic gets gnarly, reconsider — but adding a date lib is a separate decision.
- **`<input type="date">` cross-browser quirks.** Native, Tailwind-styleable, no extra deps. Acceptable for v1; revisit only if the workshop hits a Safari/iOS issue.
- **Pie click-target ergonomics with many small categories.** With 8 expense categories there are usually a few dominant slices; tiny slices may be hard to click. Out of scope to add a category list legend with click-to-filter alongside the pie, but worth noting — Recharts' `<Legend>` can be made interactive cheaply if needed.
- **Schema for the `month` URL param.** Must be exactly `YYYY-MM`; reject anything else in `parseChartParams` and fall back to "no month filter" rather than throwing — search params come from untrusted sources (bookmarks, hand-edited URLs). Same defensive parse for `category` (must be a known category from `EXPENSE_CATEGORIES ∪ INCOME_CATEGORIES`, else ignore).
- **Search params + `revalidatePath("/app")` interaction.** Existing mutation actions revalidate `/app` without preserving query string. After a delete-from-filtered-list, the user should stay in the filtered view. `revalidatePath("/app")` revalidates the route segment regardless of params, which is what we want — Next.js re-renders with the *current* URL's params. Confirm during integration.
- **No component tests for the charts in v1.** Chosen deliberately (vitest is `environment: "node"` and adding jsdom is out of proportion). Math is fully tested at the aggregation layer; chart wiring is verified manually. Document this and revisit if the project standardizes on RTL.

## 5. Task list

1. Add `recharts` to `package.json` dependencies and run install — files: `package.json` — `[group-1]`
2. Implement `src/lib/aggregations.ts` (`inRange`, `bucketByMonth`, `groupByCategory`, `resolvePresetRange`, `RangePreset` type) as pure functions over `Transaction[]` — files: `src/lib/aggregations.ts` — `[group-1]`
3. Implement `src/lib/chartUrlState.ts` (`parseChartParams`, `buildChartHref`, defensive parsing of `range` / `from` / `to` / `category` / `month`) — files: `src/lib/chartUrlState.ts` — `[group-1]`
4. Unit tests for aggregations (boundaries, multi-month ordering, kind selection, preset resolution against injected `today`, empty inputs) — files: `tests/aggregations.test.ts` — `[group-2]`
5. Unit tests for chart URL state (parse defaults, custom-without-dates fallback, unknown category rejected, malformed month rejected, round-trip via `buildChartHref`) — files: `tests/chartUrlState.test.ts` — `[group-2]`
6. Build `RangeControls.tsx` (preset buttons + two date inputs; uses `useSearchParams` + `useRouter` to push `buildChartHref(...)` URLs) — files: `src/app/app/RangeControls.tsx` — `[group-2]`
7. Build `MonthlyBarChart.tsx` (Recharts `BarChart` with income/expense bars, palette from Tailwind tokens, click → `router.push` with `month` param, empty-state overlay) — files: `src/app/app/MonthlyBarChart.tsx` — `[group-2]`
8. Build `CategoryPieChart.tsx` (Recharts donut, monochrome palette ramp via `<Cell>`, click → `router.push` with `category` param, empty-state overlay) — files: `src/app/app/CategoryPieChart.tsx` — `[group-2]`
9. Build `DashboardCharts.tsx` client wrapper that composes `RangeControls` + `MonthlyBarChart` + `CategoryPieChart` in a responsive grid; receives aggregated data and current range as props — files: `src/app/app/DashboardCharts.tsx` — `[group-3]`
10. Wire `/app/page.tsx`: accept `searchParams`, parse via `parseChartParams`, range-filter for charts, additionally apply `category`/`month` filters for the list; aggregate via `bucketByMonth` + `groupByCategory`; pass results into `<DashboardCharts>` and pre-filtered transactions + active filters into `<TransactionsList>` — files: `src/app/app/page.tsx` — `[group-4]`
11. Extend `TransactionsList.tsx` to accept optional `activeFilters` props and render a small "Filtered by … · clear" chip linking back to `/app` without those params; no change to the optimistic-delete logic — files: `src/app/app/TransactionsList.tsx` — `[group-4]`
12. Manual smoke verification (human, not a subagent): preset buttons swap aggregation, custom date range works, empty range renders axes + "No data", clicking a bar narrows the list to that month and chart still shows full range, clicking a pie slice narrows the list to that category and chart still shows all categories, "clear" chip restores unfiltered list, soft-deleted rows excluded, demo + user rows both included — files: (verification only) — `[group-5]`

Group rationale (clause-(c) check):
- group-1 tasks (1, 2, 3) edit different files and don't import each other's symbols — safe to parallelize.
- group-2 tasks: 4 imports from `aggregations.ts` (built in group-1), 5 imports from `chartUrlState.ts` (built in group-1), 6/7/8 import from both — all consumers of group-1 outputs, none consume each other (RangeControls / MonthlyBarChart / CategoryPieChart are siblings, not nested), safe to parallelize.
- group-3 (task 9) imports `RangeControls` / `MonthlyBarChart` / `CategoryPieChart` newly created in group-2 — must be sequenced after.
- group-4 tasks (10, 11): both edit files in the page tree but task 10 imports `DashboardCharts` (built in group-3) and task 11 only edits `TransactionsList.tsx`; they don't touch the same file and don't import each other's new symbols, so they can parallelize. (Page wiring in task 10 references `TransactionsList`'s new `activeFilters` prop — but that prop is optional and additive; task 10 can be written assuming the prop exists, and runtime behaviour stays correct as long as both land before group-5. If reviewers want strict sequencing, demote task 11 to a sub-step of task 10 instead.)
- group-5 (task 12) is human verification, runs last.
