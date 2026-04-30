# 0002 — Soft delete via `deletedAt` timestamp

- **Status:** Accepted
- **Date:** 2026-04-23
- **Origin:** F07 edit-delete-transactions (`exercise_one/.features/edit-delete-transactions/03-plan.md`)

## Context

F07 introduced the ability to delete transactions. The product UX called for an undo toast (~8s) without a blocking confirmation, plus an audit trail of what was deleted. A hard delete makes both impossible: once the row is gone, undo means re-creating from a snapshot the audit log would have to materialise, and the audit `before`/`after` becomes the only place the row ever existed again.

We needed a deletion model that:

1. Supports cheap, durable undo within and beyond the toast window.
2. Lets the audit log reference live rows by `transactionId` rather than carrying full snapshots forward forever.
3. Keeps list queries simple — one filter, one place.

## Decision

Soft delete: add `deletedAt: z.string().nullable().optional()` to `TransactionSchema`. Mutation paths set `deletedAt` to an ISO timestamp instead of removing the row; restore clears it back to `null`. **Every read site that surfaces transactions to a user must filter `deletedAt == null`.** The canonical filter lives in `listTransactionsByUser`; direct `db.transactions` access is audited at PR time.

Soft-deleted rows are kept indefinitely. There is no scheduled hard-delete job and no Trash view (out of scope for F07 and not currently planned).

## Consequences

**Positive**
- Undo is a single field flip — server-cheap, durable across tabs and reloads.
- Audit log entries can reference `transactionId` with confidence the row still exists.
- `findOwnedTransaction` becomes the single ownership-check helper for both update and delete paths (returns `null` when missing OR deleted OR wrong owner).

**Negative / costs**
- Storage grows monotonically. Acceptable at workshop scale; not at production scale.
- Every new read site is a chance to forget the filter and leak deleted rows. Mitigated by routing all reads through `listTransactionsByUser`; spot-grep `db.transactions` and `readDb` on PRs that touch the list path.
- `kind` invariants (e.g., the kind→category check) must continue to apply to soft-deleted rows in case they're restored.

**Neutral**
- The Trash view is deliberately out of scope. The model supports adding it later without schema change.

## Related

- [0003 — Append-only audit log](0003-append-only-audit-log.md) — depends on this for the `restore` action and for `before`/`after` semantics on `delete` entries.
- [0004 — Generic `not_found` for ownership/missing rows](0004-generic-not-found-no-info-leak.md) — collapses "deleted" into the same response as "missing" / "wrong owner".
