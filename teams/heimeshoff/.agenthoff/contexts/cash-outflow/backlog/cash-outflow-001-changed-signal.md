---
id: cash-outflow-001
title: Expose changed-signal for Forecasting consumers
status: backlog
type: feature
context: cash-outflow
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-011]
blocks: [forecasting-002, forecasting-007, forecasting-008, forecasting-009]
tags: [cross-bc-contract, event, customer-supplier]
---

## Why

`forecasting-002`'s recommended recompute strategy requires a coarse-grained
"changed" signal from each upstream BC. Cash Outflow is the largest of the
three upstream BCs by data volume — CSV imports drop thousands of
transactions in a single user action — so it's also the BC where the
batch/suspend boundary from `forecasting-002` matters most.

This is a thin, BC-owned contract — it lives in Cash Outflow because Cash
Outflow is the emitter.

## What

Cash Outflow exposes a single, payload-free, fire-and-forget signal **plus**
a batch-suspend pair to support `forecasting-002`'s CSV-import suspend/release
boundary.

### Signal

- **Name:** `cash-outflow.changed`
- **Mechanism:** an `EventEmitter` (Node) or equivalent (per `forecasting-011`).
- **Payload:** none.
- **Idempotent:** yes.
- **Granularity:** one signal for the whole BC.

### Batch suspend/release

- **API:** `cashOutflow.beginBatch()` / `cashOutflow.endBatch()`.
- **Semantics:** between `beginBatch` and `endBatch`, state-changing
  operations execute normally but the changed signal is suppressed.
  `endBatch` fires the signal exactly once if any state changed during
  the batch, regardless of how many operations occurred.
- **Failure mode:** if `endBatch` is never called (e.g. exception during
  CSV import), the suspend is released and the signal fires after a
  configurable timeout (default 30s) so Forecasting doesn't hang stale
  forever. The timeout itself is a safety net, not the primary path.

### Triggers

The signal fires after any of these state changes commit (and outside of
an active batch):

- Transaction created (e.g. CSV row imported)
- Transaction edited (category change, manual override, subscription flag)
- Transaction deleted
- Categorization rule created / edited / deleted
- Category created / renamed / deleted / reparented in the hierarchy
- Subscription marked / unmarked

Does **not** fire for: read-only operations, rolled-back transactions,
UI-only state, or any operation inside an active batch (only the
`endBatch` consolidates).

## Acceptance criteria

- [ ] Cash Outflow exports an event-emitter with `cash-outflow.changed`.
- [ ] `beginBatch()` / `endBatch()` API exists, is reentrant-safe (nested
      `beginBatch` is idempotent — only the outermost `endBatch` fires).
- [ ] Every state-changing repository / service method fires the signal
      exactly once after commit, **unless** an outer batch is active.
- [ ] `endBatch()` fires the signal if and only if at least one state
      change occurred during the batch.
- [ ] Failed transactions (rollback) do not fire the signal, even inside
      a batch.
- [ ] CSV-import flow is wrapped in `beginBatch / endBatch` so a 5k-row
      import causes one signal, not 5,000.
- [ ] Safety timeout: if `endBatch` is not called within 30s of
      `beginBatch`, the suspend releases and (if any change happened)
      the signal fires; a warning is logged.
- [ ] Tests cover: each trigger fires (outside batch), batched operations
      consolidate to one fire, nested batches fire only once at outer
      end, exception in batch still releases and fires.
- [ ] Documented in Cash Outflow's README under "Cross-context contract".

## Notes

### Mechanism choice

Per `forecasting-011`: Electron + Node `EventEmitter`. The batch
suspend/release lives in the Cash Outflow service layer, not in the
event emitter itself — the emitter just doesn't get called inside a
batch. Simpler than building suspension into the emitter.

### Cross-BC

Sibling tasks: `cash-inflow-001`, `tax-obligations-001`. Cash Outflow is
the only one that needs the batch primitive (CSV is its only bulk-input
path). The other two have low-volume operations and don't need it.

### Why batch is here, not in Forecasting

`forecasting-002` describes the suspend/release contract conceptually but
the *implementation* lives at the source of the bursts — Cash Outflow.
Forecasting just subscribes to the signal and doesn't need to know about
batching at all.
