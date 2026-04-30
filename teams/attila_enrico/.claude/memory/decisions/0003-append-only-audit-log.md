# 0003 — Append-only audit log in `data/audit.json`

- **Status:** Accepted
- **Date:** 2026-04-23
- **Origin:** F07 edit-delete-transactions (`exercise_one/.features/edit-delete-transactions/01-questions.md` follow-up; `03-plan.md` decision 1)

## Context

F07 needed an audit trail for create / update / delete / restore mutations on transactions. Two shapes were considered:

- **Embedded revision history** on each `Transaction` row — keeps row-centric locality, but bloats the transactions store, complicates list queries, and couples observability to live data.
- **Separate append-only event log** — observational, easy to grow, zero impact on list queries.

F06 (demo-data) added two more action variants on top.

## Decision

A separate `data/audit.json` store, read/written through `src/lib/audit.ts`, with a discriminated-union `AuditEntrySchema` keyed on `action`:

- `create` / `update` / `delete` / `restore` — `{ id, transactionId, userId, action, at, before: Transaction | null, after: Transaction | null }`
- `demo_data_created` / `demo_data_removed` — `{ id, userId, action, at, count: number }` (no per-row before/after; F06 emits one summary entry per batch, not 500 individual rows)

Writes go through `appendAuditEntry(entry)`, which validates with Zod, takes the same in-process `withLock` as the transactions store, and rewrites the file atomically (tmp + rename). Every mutation server action calls it on success. **Reads never go through the audit log** — it's observational, not load-bearing for correctness.

The file is gitignored (existing `data/` pattern covers it).

## Consequences

**Positive**
- List queries stay clean; the audit log can change shape independently.
- Discriminated union keeps the schema honest: legacy variants are unchanged, new actions add new variants without breaking on-disk parsing of existing rows.
- Single helper (`appendAuditEntry`) means new mutation paths can't forget the log — the type system flags missing variants.

**Negative / costs**
- Whole-file rewrite per append. Fine at workshop scale; would need streaming/segmented append at real scale.
- The log grows without bound. No retention policy; not currently a concern.
- No reader UI yet; the log is pure observability for developer debugging until something consumes it.

**Neutral**
- `before`/`after` are full `Transaction` snapshots on row-level actions, which lets us reconstruct any past state without inspecting historical row revisions.
- F06 chose summary entries (one per batch) over per-row entries to avoid flooding the log with 500 near-identical rows.

## Related

- [0002 — Soft delete](0002-soft-delete-via-deletedAt.md) — the `delete` and `restore` action variants exist because of soft-delete; without it, `restore` would be meaningless and `before`/`after` would have nowhere to live.
- [0005 — `withLock` concurrency model](0005-withlock-concurrency-last-write-wins.md) — `appendAuditEntry` shares the same lock, so two-tab edits write two audit entries even though the second clobbers the first transaction value. Nothing is observationally lost.
