# demo-data — task list
_Source: `03-plan.md` section 5. Tick items as they complete._

### Group 1 — schema foundations
- [x] 1. Extend `TransactionSchema` with `source: z.enum(["demo","user"]).default("user")`; export `hasDemoTransactions(userId)` helper — files: `src/lib/db.ts` — `[group-1]`
- [x] 2. Convert `AuditEntrySchema` to a discriminated union; add `demo_data_created` / `demo_data_removed` variants with `{ count }` — files: `src/lib/audit.ts` — `[group-1]` — added `createDemoDataCreatedAuditEntry` / `createDemoDataRemovedAuditEntry` helpers matching existing factory style; `createAuditEntry` narrowed via `Extract<>` so existing call sites keep typing.

### Group 2 — ripple fixes
- [x] 3. Set `source: "user"` on every `Transaction` literal in add/update paths — files: `src/lib/transactions.ts` — `[group-2]`
- [x] 4. Update existing tests for the new schemas; assert user-path writes and legacy-row backfill — files: `tests/transactions.test.ts`, `tests/db.test.ts`, `tests/audit.test.ts` — `[group-2]` — 61/61 tests passing post-group-2.

### Group 3 — generator inputs
- [x] 5. Per-currency × per-category amount-scale table with `DEFAULT` fallback — files: `src/lib/demoData/scales.ts` — `[group-3]` — strongly typed per `Currency` / `Expense|IncomeCategory`; HUF/JPY/PLN/CZK bespoke; EUR/USD/GBP/CHF/CAD/AUD share EUR-like; NOK/SEK/DKK share Nordic.
- [x] 6. Seeded RNG helper (Mulberry32 or similar) — files: `src/lib/demoData/rng.ts` — `[group-3]` — Mulberry32 + xmur3 string seeding; API: next/nextInt/nextFloat/pick/chance.

### Group 4 — generator
- [x] 7. Implement `generateDemoTransactions({ userId, currency, now, rng? })` with running-balance-guard algorithm — files: `src/lib/demoData/generator.ts` — `[group-4]` — zero-decimal currencies (HUF/JPY) rounded to int; 1–2 starter-balance incomes at t=0; per-category title arrays; exports `DEMO_EXPENSE_CATEGORIES` / `DEMO_INCOME_CATEGORIES`.

### Group 5 — generator tests + lib composition
- [x] 8. Unit tests for the generator (count, balance invariant, category coverage, currency scaling, determinism) — files: `tests/demoData.generator.test.ts` — `[group-5]` — 16 tests; balance invariant verified across 5 seeds; generator switched from `nanoid()` to RNG-backed id so determinism test now asserts full equality.
- [x] 9. Implement `createDemoDataForUser` / `removeDemoDataForUser` / `hasDemoDataForUser` (single `withLock` + `readDb` + `writeDb` + audit entry) — files: `src/lib/demoData/index.ts` — `[group-5]` — lock is non-reentrant, so DB update runs inside `withLock` via inline tmp+rename; audit append happens as a separate locked step (matches existing `transactions.ts` pattern).

### Group 6 — lib integration tests
- [x] 10. Integration tests against a temp DB (single write, single audit, idempotence guard, remove filters by source) — files: `tests/demoData.lib.test.ts` — `[group-6]` — 11 tests; no `AUTH_SECRET` needed (lib is pure of auth imports).

### Group 7 — server actions
- [x] 11. `createDemoDataAction` + `removeDemoDataAction` with `requireSession()` + `revalidatePath('/app')` — files: `src/actions/demoData.ts` — `[group-7]` — currency read from `session.user.currency`; shape `{ok,count}` / `{ok:false,error:"already_exists",message}` mirroring delete/restore actions.

### Group 8 — action tests
- [x] 12. Server-action-level tests (happy paths, "already exists" rejection, auth redirect, audit entry shape) — files: `tests/demoData.actions.test.ts` — `[group-8]` — 8 tests; mocks `next/headers`, `next/navigation`, `next/cache`; seeds real JWT via `signSessionToken` so `requireSession()` exercises the real code path.

### Group 9 — UI button
- [x] 13. `<DemoDataButton hasDemoData={boolean} />` client component with confirm UX and `useTransition` — files: `src/app/app/DemoDataButton.tsx` — `[group-9]` — Tailwind semantic tokens matching existing `src/app/app/` components; inline `role="status"` feedback auto-dismissing after 6s; `window.confirm` for remove; full production build clean.

### Group 10 — wire-up
- [x] 14. Render `<DemoDataButton>` in `/app/page.tsx`; derive `hasDemoData` from loaded transactions — files: `src/app/app/page.tsx` — `[group-10]` — placed below `<TransactionForm>` in the aside; aside got `space-y-6` for consistent gap. Production build clean (`/app` = 4.42 kB).
