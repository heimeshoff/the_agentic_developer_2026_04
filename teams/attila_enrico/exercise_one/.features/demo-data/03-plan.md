# Demo Data — Implementation Plan

## 1. Summary

Add an in-app feature allowing any logged-in user to populate their own account with ~500 realistic, currency-scaled transactions spread over the last 12 months, and to one-click remove them again. Demo rows are tagged with a new `source: "demo" | "user"` field on the `Transaction` schema (defaulting to `"user"` via Zod, so existing on-disk data is backfilled transparently). The `/app` page shows a single toggling button whose label depends on whether the caller already has demo rows. Two server actions (`createDemoDataAction`, `removeDemoDataAction`) wrap the generator, commit the full batch in a single `writeDb` call, and write exactly one summary audit entry per action. The generator uses a timeline-with-running-balance-guard algorithm to guarantee the running balance never goes negative.

## 2. Architectural decisions

### Decision 1 — Where does the `source` marker live?

- **Options considered:**
  - (a) Extend `TransactionSchema` with `source: "demo" | "user"` (default `"user"`).
  - (b) Separate `demoTransactionIds: string[]` index on `DB`.
  - (c) Title convention (prefix `[demo] `).
- **Recommendation:** (a) **Schema extension**, declared as `z.enum(["demo","user"]).default("user")` so existing rows parsing through Zod automatically receive `"user"` without a file migration. All transaction-creating code sets `source: "user"` explicitly on object literals; Zod's default is a safety net for on-disk data, not a licence for code-level omission.

### Decision 2 — Balance-positive generation algorithm

- **Options considered:**
  - (a) Front-load all income then spend within running balance.
  - (b) Interleaved timeline with running-balance guard.
  - (c) Fixed monthly template + jitter.
- **Recommendation:** (b) **Interleaved with running-balance guard.**
  1. Walk 12 months from `now - 365d` to `now`.
  2. Seed a starter income on day 0 (e.g. 1–2× expected monthly salary) so early expenses don't starve.
  3. For each month: add 1 salary (~25th), 0–2 freelance/gift/investment events at weighted probabilities.
  4. Derive per-category expense weights (Groceries weekly, Dining 2×/week, Utilities monthly, Rent monthly, Transport 3×/week, Entertainment 1×/week, Healthcare sparse, Other sparse) and pre-compute candidate transactions to approximate the ~500 target.
  5. Sort candidates by timestamp ascending. Walk the list accumulating `runningBalance`; for each expense, if it would drive balance below 0, **skip** it (do not shrink — shrinking distorts the distribution). Keep generating until the target count is hit or a max-attempts cap trips.
  6. Emit the final batch sorted by timestamp ascending.

### Decision 3 — Currency-aware amount scaling

- **Options considered:**
  - (a) Per-currency lookup table of category → `{min, max}` ranges.
  - (b) Compute from ISO-4217 exponent + a base EUR table.
  - (c) Hardcode one table per category and ignore currency.
- **Recommendation:** (a) **Per-currency lookup table**, keyed by each of `SUPPORTED_CURRENCIES` with a `DEFAULT` fallback. Explicit is better than clever: HUF salary isn't a simple exponent multiple of EUR, and rent scales differently than groceries per currency. Lives in `src/lib/demoData/scales.ts` and is tested to cover every currency.

### Decision 4 — Component structure for the button

- **Options considered:**
  - (a) Single button that toggles label based on server-known state.
  - (b) Two always-visible buttons, one disabled depending on state.
  - (c) Kebab menu / dropdown.
- **Recommendation:** (a) **Single toggling button.** The intake says "if no demo data exists it says 'Create demo data', if demo data exists it switches to 'Remove demo data'." Implement as a client component `<DemoDataButton hasDemoData={boolean} />` which receives the derived flag from `page.tsx` (no extra DB hit — the transactions list is already loaded). The remove action is wrapped in a lightweight confirm UX since it's destructive.

### Decision 5 — Server action shape

- **Options considered:**
  - (a) One action with a `mode: "create" | "remove"` parameter.
  - (b) Two separate server actions: `createDemoDataAction` and `removeDemoDataAction`.
- **Recommendation:** (b) **Two separate actions.** Different success payloads, different audit entries, different UI affordances — the mode param would just be a router. Matches the existing `add/update/delete/restore` pattern.

### Decision 6 — Audit log entry shape

- **Options considered:**
  - (a) Reuse existing `AuditEntry` with `action: "create"` and a sentinel `transactionId`.
  - (b) Extend `AuditEntrySchema` with new action variants `demo_data_created` / `demo_data_removed`.
  - (c) Separate log file.
- **Recommendation:** (b) **Extend `AuditEntrySchema` as a discriminated union on `action`.** Existing four variants keep their current shape; two new variants carry `{ action, id, userId, at, count }` and omit `before`/`after`/`transactionId`. Existing on-disk audit rows continue to parse unchanged.

### Decision 7 — How to detect "demo data already exists" cheaply

- **Options considered:**
  - (a) Scan the user's transactions array for any row with `source === "demo"`.
  - (b) Maintain a separate `demoBatches` index on `DB`.
  - (c) Query the audit log.
- **Recommendation:** (a) **In-memory scan.** `/app` already loads `listTransactionsByUser` for the balance and list; we derive `hasDemoData = transactions.some(t => t.source === "demo")` for zero additional I/O. The server action re-checks inside `withLock` (don't trust the client) — same pattern as `findOwnedTransaction`.

## 3. Affected files / modules

| File | Change |
|---|---|
| `src/lib/db.ts` | modify — extend `TransactionSchema` with `source: z.enum(["demo","user"]).default("user")`. |
| `src/lib/audit.ts` | modify — convert `AuditEntrySchema` to a discriminated union; add `demo_data_created` / `demo_data_removed` variants with `{ count: number }`. |
| `src/lib/transactions.ts` | modify — set `source: "user"` on every `Transaction` object literal (add-path, update-path). |
| `src/lib/demoData/generator.ts` | new — pure generator: `generateDemoTransactions({ userId, currency, now, rng? }): Transaction[]`. |
| `src/lib/demoData/scales.ts` | new — per-currency × per-category `{min, max}` amount ranges. |
| `src/lib/demoData/rng.ts` | new — seeded RNG helper (Mulberry32 or similar) for deterministic test runs. |
| `src/lib/demoData/index.ts` | new — `createDemoDataForUser`, `removeDemoDataForUser`, `hasDemoDataForUser`; single `withLock` + `readDb` → compute → `writeDb` + one `appendAuditEntry`. |
| `src/actions/demoData.ts` | new — `"use server"` wrappers: `createDemoDataAction`, `removeDemoDataAction`, `requireSession()`, `revalidatePath('/app')`. |
| `src/app/app/DemoDataButton.tsx` | new — client component rendering the single toggling button + confirm UX. |
| `src/app/app/page.tsx` | modify — compute `hasDemoData` from loaded transactions; render `<DemoDataButton>`. |
| `tests/demoData.generator.test.ts` | new — unit tests: count, `runningBalance >= 0` invariant, category coverage, currency scaling, determinism. |
| `tests/demoData.lib.test.ts` | new — integration tests for `createDemoDataForUser` / `removeDemoDataForUser` / `hasDemoDataForUser`. |
| `tests/demoData.actions.test.ts` | new — server-action tests mirroring `tests/transactions.test.ts`. |
| `tests/transactions.test.ts` | modify — assert user-path writes persist `source: "user"`; keep fixtures passing. |
| `tests/db.test.ts` | modify — assert legacy rows without `source` round-trip to `source: "user"`. |
| `tests/audit.test.ts` | modify — add cases for new discriminated-union variants. |

**Test runner convention:** per `vitest.config.ts`, tests live at `tests/**/*.test.ts`. Path alias `@` → `src`. Run with `npm test`. `AUTH_SECRET` env must be set at module top-level for tests that transitively import `@/lib/auth` (existing pattern in `tests/transactions.test.ts`).

## 4. Risks & unknowns

1. **Backfilling `source` on existing user transactions.** The JSON file at `data/db.json` already has rows without `source`. Zod's `.default("user")` populates missing fields during `parse`, avoiding a file migration. Add a regression test in `tests/db.test.ts`.
2. **Idempotence under concurrent writes.** The `hasDemoData` check must run *inside* `withLock` so read-then-write is atomic with respect to other locked operations. Two concurrent create calls from the same user would otherwise both insert.
3. **Currency table coverage.** Add a unit test iterating `SUPPORTED_CURRENCIES` that asserts each has a scale entry. Also provide an explicit `DEFAULT` fallback with a console.warn when a currency is missing.
4. **Balance-positive algorithm correctness.** Seed generation with 2–3× expected monthly expenses on day 0 so skips are rare; assert in tests that ≥ 95% of candidate expenses survive the guard.
5. **User with real negative-balance history.** The balance-positive constraint applies only to generated demo data. Documented in the generator's docblock. If the user's real rows already drive balance negative, the demo feature is not responsible.
6. **Audit schema discriminated-union migration.** Design the union so existing legacy shapes are unchanged — only the two new action values add new variants. Add a round-trip test against `data/audit.json` shape.
7. **Test-runner gotcha.** Tests that transitively import `@/lib/auth` (action-layer, lib-layer composition) must set `AUTH_SECRET` at module top-level. Keep the pure generator free of `next/navigation` imports so its tests stay lightweight.

## 5. Task list

> **Grouping rule:** tasks share a group only if they don't depend on each other's output, don't edit the same file, and don't import a symbol from a file another task is newly creating. When in doubt, sequence.

### Group 1 — schema foundations

1. **[group-1]** Extend `TransactionSchema` with `source: z.enum(["demo","user"]).default("user")`. Export a helper `hasDemoTransactions(userId: string)` (scans `listTransactionsByUser`).
   - Files: `src/lib/db.ts`
2. **[group-1]** Convert `AuditEntrySchema` to a discriminated union on `action`; add `demo_data_created` and `demo_data_removed` variants carrying `{ count: number }`. Legacy variants unchanged.
   - Files: `src/lib/audit.ts`

Tasks 1 and 2 edit disjoint schema files and don't import each other — share `group-1`.

### Group 2 — ripple fixes in existing code

3. **[group-2]** Set `source: "user"` on every `Transaction` object literal in `addTransactionForUser` and `updateTransactionForUser`.
   - Files: `src/lib/transactions.ts`
4. **[group-2]** Update existing tests to accommodate the new schemas — add assertions that user-path writes persist `source: "user"` and that legacy rows without `source` round-trip as `source: "user"`.
   - Files: `tests/transactions.test.ts`, `tests/db.test.ts`, `tests/audit.test.ts`

### Group 3 — generator inputs

5. **[group-3]** Per-currency × per-category amount-scale table with a `DEFAULT` fallback.
   - Files: `src/lib/demoData/scales.ts` (new)
6. **[group-3]** Seeded RNG helper (Mulberry32 or similar).
   - Files: `src/lib/demoData/rng.ts` (new)

### Group 4 — generator

7. **[group-4]** Implement `generateDemoTransactions({ userId, currency, now, rng? }): Transaction[]` with the running-balance-guard algorithm. All rows have `source: "demo"`.
   - Files: `src/lib/demoData/generator.ts` (new)

### Group 5 — generator tests + lib composition

8. **[group-5]** Unit tests for the generator: ~500 count with tolerance, `runningBalance >= 0` invariant at every chronological step, category coverage, per-currency scale sanity, determinism under a fixed seed.
   - Files: `tests/demoData.generator.test.ts` (new)
9. **[group-5]** Implement `createDemoDataForUser`, `removeDemoDataForUser`, `hasDemoDataForUser`. Each takes a single `withLock`-guarded `readDb` → compute → `writeDb` + one `appendAuditEntry` call. Create path rejects if demo data already exists for the caller.
   - Files: `src/lib/demoData/index.ts` (new)

Tasks 8 and 9 both import the generator from group-4 but not from each other — share `group-5`.

### Group 6 — lib-layer integration tests

10. **[group-6]** Integration tests for the three lib functions against a temp JSON DB: single `writeDb` call, single audit entry with correct `count`, idempotence guard, remove clears only `source === "demo"` rows for the caller.
    - Files: `tests/demoData.lib.test.ts` (new)

### Group 7 — server actions

11. **[group-7]** `createDemoDataAction` + `removeDemoDataAction` server actions wrapping the lib calls with `requireSession()` and `revalidatePath('/app')`. Return shapes mirror the existing add/update/delete action shape.
    - Files: `src/actions/demoData.ts` (new)

### Group 8 — server-action tests

12. **[group-8]** Action-level tests mirroring `tests/transactions.test.ts`: happy path for both actions, "already exists" rejection, not-logged-in redirect, correct audit entry.
    - Files: `tests/demoData.actions.test.ts` (new)

### Group 9 — UI button component

13. **[group-9]** Build `<DemoDataButton hasDemoData={boolean} />`: renders one of two forms wired to the respective actions; `useTransition` for pending state; confirm UX before removal.
    - Files: `src/app/app/DemoDataButton.tsx` (new)

### Group 10 — wire into the app page

14. **[group-10]** Wire `<DemoDataButton>` into `/app`: compute `hasDemoData = transactions.some(t => t.source === "demo")` server-side and render the component in the aside.
    - Files: `src/app/app/page.tsx`

### Group dependency summary

Group 1 → 2 → 3 → 4 → 5 → (6, 7) → (8, 9) → 10. Groups 6 and 7 could run in parallel; groups 8 and 9 could run in parallel. Within each group, every task edits disjoint files and does not import symbols from files another in-group task is newly creating.
