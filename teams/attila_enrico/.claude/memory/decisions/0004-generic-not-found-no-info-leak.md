# 0004 — Generic `not_found` for ownership / missing / deleted rows

- **Status:** Accepted
- **Date:** 2026-04-23
- **Origin:** F07 edit-delete-transactions (`01-questions.md` Edge cases Q2; `03-plan.md` decision 5)

## Context

Server actions that take a transaction `id` (`updateTransactionAction`, `deleteTransactionAction`, `restoreTransactionAction`) had to decide what to return when:

1. The id doesn't exist.
2. The id exists but belongs to another user.
3. The id exists, belongs to the caller, but is already soft-deleted (for update/delete paths).

Distinct error codes per case (`not_found` vs `forbidden` vs `gone`) leak the existence of other users' rows: a `forbidden` response is a positive existence signal. The product is single-user-per-account with no shared/household scope, so there is no legitimate UX reason to distinguish.

## Decision

Collapse all three cases into a single `{ ok: false, error: "not_found" }` response. Implemented via a private helper `findOwnedTransaction(db, userId, id): Transaction | null` in `src/lib/db.ts` that returns `null` whenever:

- the row is missing, OR
- `userId` mismatches, OR
- `deletedAt` is set (for paths where deleted rows should be invisible — update, delete; the restore path drops the last check).

Every mutation that takes an `id` routes through this helper. Mapping `null` → `not_found` happens at the server-action boundary. Client-side, a single non-technical message is shown ("This transaction is no longer available").

## Consequences

**Positive**
- No existence leak: an attacker probing ids gets the same response whether the id is unknown, owned by someone else, or soft-deleted.
- One error path through the action layer — simpler client handling.
- The helper is reusable for any future row-mutating feature; the pattern generalises beyond transactions.

**Negative / costs**
- Slight UX hit: a user who genuinely deleted a row in another tab and then clicks edit on a stale list sees the same generic message as a probe attempt. Mitigated by `revalidatePath('/app')` refreshing the list immediately after the failure.
- Debugging mutation failures requires the audit log or server logs — the client can't tell why a row was rejected.

**Neutral**
- This applies to row-level actions only. Bulk / unauthenticated / form-validation errors keep their distinct shapes.

## Related

- [0002 — Soft delete](0002-soft-delete-via-deletedAt.md) — adds the third case (soft-deleted) that this decision collapses into the same response.
- [0003 — Audit log](0003-append-only-audit-log.md) — provides the only place where the real failure cause is observable, by design.
