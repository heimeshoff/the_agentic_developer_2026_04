---
id: tax-obligations-001
title: Expose changed-signal for Forecasting consumers
status: backlog
type: feature
context: tax-obligations
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-011]
blocks: [forecasting-002, forecasting-007, forecasting-008, forecasting-009]
tags: [cross-bc-contract, event, customer-supplier]
---

## Why

`forecasting-002`'s recommended recompute strategy requires a coarse-grained
"changed" signal from each upstream BC. Tax Obligations is one of three
upstream BCs, and its events have the largest *amplitude* per fire (a tax
reconciliation can swing zero-day by months) so accurate stale-marking
matters even though volume is low.

This is a thin, BC-owned contract — it lives in Tax Obligations because
Tax Obligations is the emitter.

## What

Tax Obligations exposes a single, payload-free, fire-and-forget signal:

- **Name:** `tax-obligations.changed`
- **Mechanism:** an `EventEmitter` (Node) or equivalent (per `forecasting-011`).
- **Payload:** none.
- **Idempotent:** yes.
- **Granularity:** one signal for the whole BC.

### Triggers

The signal fires after any of these state changes commit:

- Quarterly prepayment created / edited / deleted (amount or due date)
- Prepayment marked paid (status: `upcoming → paid`)
- Annual reconciliation entered (refund amount or shortfall amount for
  a closed tax year)
- Annual reconciliation edited or deleted (rare, but possible if user
  corrects a typo)
- Tax-year boundary advanced (when "current tax year" rolls over —
  whether manual or automatic)

Does **not** fire for: read-only operations, rolled-back transactions,
UI-only state.

## Acceptance criteria

- [ ] Tax Obligations exports an event-emitter with `tax-obligations.changed`.
- [ ] Every state-changing repository / service method fires the signal
      exactly once after the underlying SQLite transaction commits.
- [ ] Failed transactions (rollback) do not fire the signal.
- [ ] Forecasting subscribes during app startup and treats receipt as
      "invalidate my cache → schedule recompute" per `forecasting-002`.
- [ ] Tests cover each trigger listed above — one test per trigger.
- [ ] Tests cover the negation: rolled-back transactions don't fire,
      read-only operations don't fire.
- [ ] Documented in Tax Obligations's README under "Cross-context contract".

## Notes

### Mechanism choice

Per `forecasting-011`: Electron + Node `EventEmitter`. Single-process,
no IPC.

### No batch primitive

Tax Obligations has no bulk-input path (no CSV equivalent — assessments
arrive one at a time, reconciliations are once a year). So unlike
`cash-outflow-001`, no `beginBatch` / `endBatch` is needed. Each user
action fires at most one signal anyway.

### Cross-BC

Sibling tasks: `cash-inflow-001`, `cash-outflow-001`. Same shape, different
trigger lists.
