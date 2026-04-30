# charts — task list
_Source: `03-plan.md` section 5. Tick items as they complete._

- [x] 1. Add `recharts` dependency — files: `package.json` — `[group-1]` · pinned `^2.15.0`, resolved 2.15.4
- [x] 2. Implement aggregation utilities (`inRange`, `bucketByMonth`, `groupByCategory`, `resolvePresetRange`, `RangePreset`) — files: `src/lib/aggregations.ts` — `[group-1]` · `tx.timestamp` (UTC), `last-3-months` = window of 3 calendar months ending current
- [x] 3. Implement chart URL-state helpers (`parseChartParams`, `buildChartHref`, defensive parsing) — files: `src/lib/chartUrlState.ts` — `[group-1]` · `RangePreset` re-exported from aggregations; `range=this-month` omitted from URLs (lossless)
- [x] 4. Unit tests for aggregations — files: `tests/aggregations.test.ts` — `[group-2]` · 24 tests, all green
- [x] 5. Unit tests for chart URL state — files: `tests/chartUrlState.test.ts` — `[group-2]` · 30 tests, all green
- [x] 6. Build `RangeControls.tsx` (presets + custom date inputs; URL-driven) — files: `src/app/app/RangeControls.tsx` — `[group-2]` · uses `aria-pressed`; styling matches `TransactionForm` toggle
- [x] 7. Build `MonthlyBarChart.tsx` (Recharts bar; click → month filter; empty-state) — files: `src/app/app/MonthlyBarChart.tsx` — `[group-2]` · income `#2a8a5f` / expense `#c43a3a` (from tailwind.config.ts)
- [x] 8. Build `CategoryPieChart.tsx` (Recharts donut; click → category filter; empty-state) — files: `src/app/app/CategoryPieChart.tsx` — `[group-2]` · 6-step neutral ramp + accent on largest slice
- [x] 9. Build `DashboardCharts.tsx` client wrapper composing controls + charts — files: `src/app/app/DashboardCharts.tsx` — `[group-3]`
- [x] 10. Wire `/app/page.tsx`: parse params, range-aggregate for charts, filter for list, pass props — files: `src/app/app/page.tsx` — `[group-4b]` · charts inserted between Balance card and `TransactionsList`, balance unchanged
- [x] 11. Extend `TransactionsList.tsx` with optional `activeFilters` chip — files: `src/app/app/TransactionsList.tsx` — `[group-4a]` · "Filtered by …" pill with `<Link href="/app">` clear; rendered in both populated and empty branches
- [ ] 12. Manual smoke verification (human) — files: _(verification only)_ — `[group-5]`
