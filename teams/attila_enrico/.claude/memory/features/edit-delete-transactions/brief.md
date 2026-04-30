# F07 — Edit & Delete Transactions

- **Slug:** edit-delete-transactions
- **Status:** shipped (smoke-test pending)
- **Created:** 2026-04-23
- **Roadmap row:** [F07](../roadmap.md)
- **Source of truth (full pipeline outputs):** `exercise_one/.features/edit-delete-transactions/` — intake, questions, journeys, plan, tasks. Do not duplicate that content here; treat the source folder as the canonical record.

## Summary

Add inline edit and delete affordances to each row in the `/app` transactions list. Edit opens a modal with the existing add form generalised to add-or-edit. Delete is optimistic: the row vanishes immediately, a soft-delete is committed server-side, and an undo toast offers ~8 seconds to restore. Every mutation (create/update/delete/restore) writes to a new append-only audit log.

This feature originated four cross-cutting patterns now codified as project ADRs.

## Key constraints

- Own transactions only — no shared/household scope.
- All fields editable, including `kind`. Flipping `kind` clears `category` and forces re-pick before save (kind→category invariant).
- Soft delete with `deletedAt`; restoration is a field flip.
- Optimistic UX with no blocking confirm: row vanishes immediately, server delete fires immediately, undo toast offers restore for ~8 seconds.
- Generic `not_found` response for any failure to resolve a row to the caller — no existence leak.
- Last-write-wins under `withLock`; audit log preserves clobbered values.

## Decisions

Cross-cutting (top-level ADRs born from this feature):

- [0002 — Soft delete via `deletedAt`](../../decisions/0002-soft-delete-via-deletedAt.md)
- [0003 — Append-only audit log](../../decisions/0003-append-only-audit-log.md)
- [0004 — Generic `not_found` for ownership/missing rows](../../decisions/0004-generic-not-found-no-info-leak.md)
- [0005 — Last-write-wins via `withLock`](../../decisions/0005-withlock-concurrency-last-write-wins.md)

Feature-internal (kept here, not promoted):

- See [decisions.md](decisions.md) for the four feature-internal architectural decisions (form generalisation, three-action surface, hybrid optimistic-delete UX, two-layer kind→category invariant).

## Implementation snapshot

- Schema: `deletedAt: z.string().nullable().optional()` on `TransactionSchema`. `listTransactionsByUser` filters soft-deleted.
- Audit: new `src/lib/audit.ts` with `appendAuditEntry`; gitignore covers `data/audit.json`.
- Lib helpers: `findOwnedTransaction`, `updateTransaction`, `softDeleteTransaction`, `restoreTransaction` — all share `withLock`. The `superRefine` kind→category check is reused on the edit input schema via a shared `TransactionFieldsObject` base.
- Server actions: `updateTransactionAction(_prev, formData)` (form action), `deleteTransactionAction(id)` and `restoreTransactionAction(id)` (plain-arg actions, called via `useTransition`). All three call `revalidatePath('/app')` on success.
- UI: `AddTransactionForm` renamed to `TransactionForm` with `{ mode, initial?, onSuccess? }`. New `EditTransactionModal`, `TransactionsList` (client island, owns optimistic `hiddenIds`), `UndoToast` (~8s auto-dismiss).
- Tests: 14 lib transaction tests (added 9 new), 18 audit tests, 4 new action tests. Full suite: 58 tests pass.
- Build: production build clean.

## Open items

- **[group-7] Smoke-test happy paths** still unchecked in `tasks.md`: add, edit including kind change, delete + undo within window, delete + window elapse, attempt edit/delete for foreign id (expect generic not-found). This is the only outstanding step before status moves from "shipped (smoke-test pending)" to plain "shipped".
