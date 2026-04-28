# Clarifying Questions — Edit and Delete Transactions

_Stage 2 output. Produced by a `general-purpose` subagent with no prior conversation context, grounded in the actual `exercise_one/` codebase. Answer under `## Answers` below. Architectural questions need real answers; cosmetic ones are fine to defer with "your call"._

## Questions

### Scope & users

1. Should a user be able to edit and delete only their own transactions, or is any form of shared/household transaction in scope (noting the current data model only supports single-user `userId` ownership)?
2. Are edit and delete both in scope for this single feature request, or should they ship independently?
3. Should edit support changing every field (title, amount, timestamp, category, AND kind — expense/income), or should `kind` be immutable once created? (A) all fields editable, (B) all except `kind`, (C) something else.

### Data & state

1. When a transaction is edited, do we preserve the original `id` and just overwrite fields, or also record an `updatedAt` / audit trail? (A) overwrite in place, no audit, (B) overwrite + `updatedAt` timestamp, (C) keep revision history.
2. Delete semantics: (A) hard delete (row removed from `data/db.json`), (B) soft delete (flag like `deletedAt`, excluded from lists), (C) trash/restore with a retention window.
3. If the user changes `kind` during edit (assuming it's allowed), should the category auto-reset or should the form force the user to pick a valid category for the new kind before save?

### UI / UX

1. Where should the edit/delete affordances live? (A) inline icons on each list row on `/app`, (B) a dedicated transaction detail page/route, (C) a modal/drawer opened from the list row, (D) other.
2. Should edit reuse the existing `AddTransactionForm` (generalised to add+edit), or be a separate `EditTransactionForm` component?
3. Should delete require confirmation? (A) native `confirm()`, (B) inline "Are you sure?" two-step button, (C) modal dialog, (D) no confirmation + undo toast, (E) no confirmation at all.

### Edge cases & constraints

1. Concurrency: two tabs editing the same transaction, or editing while the add form writes — is last-write-wins acceptable (consistent with current `withLock` serialisation), or do we need optimistic-concurrency checks (e.g. reject stale edits)?
2. Authorisation on the server action: if a user sends an edit/delete request for an `id` that belongs to another user (or doesn't exist), what's the expected response? (A) 404-style generic error, (B) silent no-op, (C) explicit "not found / not yours" message.
3. Are there any transactions that should be non-editable or non-deletable (e.g. imported, locked after a reporting period), or is every transaction freely mutable?

### Non-goals

1. Is bulk edit / bulk delete (multi-select on the list) explicitly out of scope for this feature?
2. Is an undo/restore flow after delete out of scope (i.e. delete is final once confirmed)?

## Answers

### Scope & users
1. **Own transactions only.** No shared/household scope.
2. **Edit and delete ship together** in this feature.
3. **All fields editable**, including `kind` (expense/income).

### Data & state
1. **Audit log — yes.** Exact shape pending follow-up below (revision history embedded per transaction vs. separate append-only event log).
2. **Soft delete.** `deletedAt` timestamp on the row; list queries exclude soft-deleted rows.
3. **Force category re-pick** when `kind` changes during edit (category field cleared and required before save).

### UI / UX
User said "use best practices". Designer-chosen defaults (non-architectural, flagged for veto in chat):
1. Entry point: **inline pencil/trash icons per row** on the `/app` transactions list.
2. Edit uses a **modal dialog** (same fields as add) — the existing `AddTransactionForm` generalised to an add/edit component rather than duplicated.
3. Delete: **no blocking confirm**, instead optimistic soft-delete with an **undo toast** (~8 seconds). Rationale: soft delete + audit log make undo trivial and avoid confirm-dialog fatigue. Toast offers "Undo" which flips `deletedAt` back to null.

### Edge cases & constraints
Not explicitly answered. Defaults:
1. **Concurrency: last-write-wins.** Consistent with the existing `withLock` serialisation of writes. Optimistic-concurrency checks not introduced.
2. **Auth on wrong/missing id: generic 404-style error.** Same response whether the id doesn't exist or belongs to another user — no info leak.
3. **All transactions are freely mutable.** No locked/imported/closed-period concept exists yet.

### Non-goals
Not explicitly answered. Defaults:
1. **Bulk edit / bulk delete: out of scope.** Single-row operations only.
2. **Undo after delete: in scope** (via the toast described above). A dedicated "Trash" view to restore older soft-deleted rows is **out of scope** for this feature.

## Follow-up — resolved
**Audit log shape: (B) — separate append-only event log.** New `data/audit.json` store with entries `{ id, transactionId, userId, action: "create"|"update"|"delete"|"restore", at, before, after }`. Every mutation server action writes an entry. Reads never filter the transactions store through the audit log — it's observational, not load-bearing for correctness.

UX and edge-case defaults listed above stand (not vetoed).

