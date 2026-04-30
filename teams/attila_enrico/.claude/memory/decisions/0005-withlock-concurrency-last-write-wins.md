# 0005 — Last-write-wins concurrency via in-process `withLock`

- **Status:** Accepted
- **Date:** 2026-04-23
- **Origin:** F07 edit-delete-transactions (`01-questions.md` Edge cases Q1; `03-plan.md` risk 6). F06 confirmed and reused the same model.

## Context

The app's persistence layer is a single JSON file (`data/db.json`) read and rewritten whole. Concurrent server actions (e.g., two tabs of the same user editing different rows) need their writes serialised to avoid lost updates from interleaved read-modify-write cycles.

Two viable models:

- **Last-write-wins via a single in-process mutex (`withLock`)** — every read-modify-write block runs inside the lock; cheap, simple, no schema impact.
- **Optimistic concurrency control (OCC)** — every row carries a version; updates assert the version they read; failures bubble up as conflicts the user resolves. Sound, but the UX has to handle conflict reconciliation, and the workshop scope doesn't justify it.

## Decision

Use the in-process `withLock` from `src/lib/db.ts` for all mutation paths. Every server action that mutates state runs its `readDb` → mutate → `writeDb` → `appendAuditEntry` sequence inside the lock (or in tightly sequential locked steps when re-entrancy isn't supported — see below). No version columns, no conflict UX. Two tabs editing the same row produce a last-write-wins outcome; the audit log preserves both writes so nothing is observationally lost.

Implementation note (from F06 tasks.md): the lock is non-reentrant. When a single logical operation needs to write both the DB and the audit log, the audit append happens as a *separate* locked step, not nested inside the DB write. This matches the existing pattern in `src/lib/transactions.ts`.

## Consequences

**Positive**
- Correct under all single-process write loads. The workshop runs as one Node process; this is the entire concurrency surface.
- Zero schema overhead — no version columns, no conflict envelope on responses.
- Simple to reason about: every mutation point is `withLock(...)`.

**Negative / costs**
- Two concurrent edits to the same row silently clobber. The user sees the loser's edit reflected in their tab until a refresh; the audit log is the only trace of the lost write.
- Does not survive multi-process deployment. Any future move to multi-process, multi-instance, or shared file storage requires rethinking — likely OCC or a real database.
- No coordination across processes; if anything else opens `data/db.json`, races are possible.

**Neutral**
- The audit log being written outside the same atomic step (non-reentrant lock) means a crash between DB write and audit append could lose an audit entry but not corrupt data. Acceptable risk at workshop scale.

## Related

- [0003 — Audit log](0003-append-only-audit-log.md) — relies on `withLock` for serialised appends; documents the non-reentrancy + separate-step pattern.
