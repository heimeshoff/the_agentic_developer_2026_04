---
id: cash-inflow-001
title: Expose changed-signal for Forecasting consumers
status: backlog
type: feature
context: cash-inflow
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-011]
blocks: [forecasting-002, forecasting-007, forecasting-008]
tags: [cross-bc-contract, event, customer-supplier]
---

## Why

`forecasting-002`'s recommended recompute strategy is eager-with-debounce,
keyed on a coarse-grained "changed" signal from each upstream BC. Cash
Inflow is one of three upstream BCs (per the context map: customer-supplier,
Forecasting as customer). Without a `cash-inflow.changed` signal,
Forecasting cannot know its cached projection is stale, and the "numbers
update immediately" UX promise from `forecasting-001` Prompt 1 doesn't hold.

This is a thin, BC-owned contract — it lives in Cash Inflow because Cash
Inflow is the emitter.

## What

Cash Inflow exposes a single, payload-free, fire-and-forget signal:

- **Name:** `cash-inflow.changed`
- **Mechanism:** an `EventEmitter` (Node) or equivalent in the chosen
  runtime (per `forecasting-011`). Exact shape: `events.on('cash-inflow.changed', handler)` /
  `events.emit('cash-inflow.changed')`.
- **Payload:** none. Subscribers re-read Cash Inflow's read API to learn
  what changed, or simply trigger their own recompute.
- **Idempotent:** firing twice in close succession is fine; subscribers
  must handle without breakage.
- **Granularity:** one signal for the whole BC. Not per-entity, not
  per-state-transition. Forecasting doesn't need to know *what* changed,
  only *that* something changed.

### Triggers

The signal fires after any of these state changes commit:

- Contract created
- Contract edited (any field)
- Contract deleted
- Contract status transition: `contracted → paid`, `contracted → overdue`,
  `overdue → paid`
- Paid-income row detected and persisted from a CSV import (per
  Cash Inflow's CSV ingestion path, when that's modeled)

The signal does **not** fire for:

- Read-only operations
- Failed writes (transaction rolled back)
- UI-only state changes (filter, sort, etc.)

## Acceptance criteria

- [ ] Cash Inflow exports an event-emitter (or equivalent) with a single
      named event `cash-inflow.changed`.
- [ ] Every state-changing repository / service method fires the signal
      exactly once after the underlying SQLite transaction commits, never
      before.
- [ ] Failed transactions (rollback) do **not** fire the signal.
- [ ] Forecasting subscribes during app startup and treats receipt as
      "invalidate my cache → schedule recompute" per `forecasting-002`.
- [ ] Tests cover each trigger listed in the "Triggers" section above —
      one test per trigger, asserting the signal fires.
- [ ] Tests cover the negation: rolled-back transactions do not fire, and
      read-only operations do not fire.
- [ ] The signal is documented in Cash Inflow's README under a
      "Cross-context contract" section so consumers know it exists.

## Notes

### Mechanism choice

Once `forecasting-011` lands the host runtime as Electron + Node, the
mechanism is a Node `EventEmitter` shared across BCs (single-process
single-user, no IPC needed). If `forecasting-011` lands differently, this
task's mechanism notes update accordingly — but the contract (one signal
per BC, fire-and-forget, no payload, idempotent) holds regardless.

### Cross-BC

This is one of three sibling tasks: `cash-inflow-001`, `cash-outflow-001`,
`tax-obligations-001`. They share the same pattern; only the trigger list
differs per BC. Treat them as a pattern, not as independent features.
