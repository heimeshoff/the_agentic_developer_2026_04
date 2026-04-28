# edit-delete-transactions — task list
_Source: `03-plan.md` section 5. Tick items as they complete. `[group-N]` groups may run in parallel; groups run sequentially (1 before 2, etc.)._

## [group-1] — Foundation (schema + audit store + gitignore) ✅
- [x] 1. Add `deletedAt` to `TransactionSchema`; filter soft-deleted in `listTransactionsByUser`; add `findOwnedTransaction` / `updateTransaction` / `softDeleteTransaction` / `restoreTransaction` helpers — files: `src/lib/db.ts` — _also exported `withLock` + `TransactionSchema` (audit.ts needs them); write helpers silently no-op on missing id — callers do ownership check first._
- [x] 2. Create `AuditEntrySchema`, `appendAuditEntry`, `readAuditLog`, `getAuditPath` — files: `src/lib/audit.ts` — _added `AUDIT_PATH` env override and optional `createAuditEntry(partial)` helper; atomic tmp-rename write; schema-validates entry before taking lock._
- [x] 3. Ensure `data/audit.json` is gitignored — `.gitignore` — _no change needed; existing `data/` pattern covers it._

## [group-2] — Domain layer (depends on group-1) ✅
- [x] 4. Extract `TransactionFieldsSchema`; add `updateTransactionForUser`, `softDeleteTransactionForUser`, `restoreTransactionForUser`; wire `appendAuditEntry` into all four mutation paths — files: `src/lib/transactions.ts` — _Zod `.superRefine()` returns `ZodEffects` which can't be `.extend()`ed; worked around by sharing a private `TransactionFieldsObject` base and attaching the refinement to both add-path and update-path schemas. `tsc --noEmit` passes._

## [group-3] — Server actions + unit tests (depends on group-2) ✅
- [x] 5. Unit tests for lib transactions — files: `tests/transactions.test.ts` _(extended, not created — plan said `src/lib/transactions.test.ts` but `vitest.config.ts` only discovers `tests/**`)_. 14 tests total (was 5).
- [x] 6. Unit tests for audit log — files: `tests/audit.test.ts` _(orchestrator moved from `src/lib/audit.test.ts` for the same `vitest.config.ts` reason)_. 18 tests.
- [x] 7. Add `updateTransactionAction`, `deleteTransactionAction(id)`, `restoreTransactionAction(id)` — files: `src/actions/transactions.ts` — _reused existing `_form` slot on `FieldErrors` for the top-level "not available" message; no new error-envelope fields needed._
- _Full suite: 58 tests pass (6 files)._

## [group-4] — Form generalisation + toast primitive ✅
- [x] 8. Rename `AddTransactionForm` → `TransactionForm` with `{ mode, initial?, onSuccess? }`; handle kind-flip category reset and category `<select>` prefill on edit — files: `src/app/app/TransactionForm.tsx`, `src/app/app/AddTransactionForm.tsx` (deleted), `src/app/app/page.tsx` (call site swapped) — _chose controlled `<select>` (not `defaultValue`) for reliable kind-flip reset._
- [x] 9. Build `UndoToast` — files: `src/app/app/UndoToast.tsx` — _bottom-center, dark-on-light to match `SubmitButton`, `role="status"` + `aria-live="polite"`, `z-50`._
- _Orchestrator fix after parallel run:_ narrowed 3x `fieldErrors` accesses in `tests/transactions.test.ts` (task 7's union typecheck clean only while task 5's test file was concurrent and invisible).

## [group-5a] — Edit modal ✅ _(split sequential from group-5; 11 imports 10)_
- [x] 10. `EditTransactionModal` — files: `src/app/app/EditTransactionModal.tsx` — _styled `<div role="dialog">` over native `<dialog>` for direct backdrop-click detection; inline focus trap (Tab/Shift+Tab cycle); `onMouseDown` for close detection (avoids false-fire on drag-out)._

## [group-5b] — List island (depends on 5a) ✅
- [x] 11. `TransactionsList` client island — files: `src/app/app/TransactionsList.tsx` — _inline SVG icons; toast-replacement via `key={toast.transactionId}` (no queue); editing row resolved from live props (avoids stale data); shared inline error line at list top for both delete and restore failures._

## [group-6] — Page wire-up + call-site audit ✅
- [x] 12. `/app/page.tsx` renders `<TransactionsList>`; balance card unchanged — files: `src/app/app/page.tsx` — _also removed unused `formatDate` import._
- [x] 13. Grep audit — files: (none modified) — _12 read sites checked; every one either flows through `listTransactionsByUser` (filtered) or is an authorised mutation path. No leaks._

## [group-7] — Manual verification (human, not a subagent)
- [ ] 14. Smoke-test happy paths: add, edit (including kind change), delete + undo within window, delete + window elapse, attempt edit/delete for a foreign id (expect generic not-found) — files: none
