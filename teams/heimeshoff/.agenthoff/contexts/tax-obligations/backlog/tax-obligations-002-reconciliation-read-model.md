---
id: tax-obligations-002
title: Expose reconciliation read-model for Forecasting
status: backlog
type: feature
context: tax-obligations
created: 2026-04-26
completed:
commit:
depends_on: [tax-obligations-001]
blocks: [forecasting-004, forecasting-007, forecasting-008]
tags: [cross-bc-contract, read-model, customer-supplier]
---

## Why

`forecasting-004` commits to a "known-only with user-flagged estimates"
rule for tax reconciliation in projections. Implementing that rule
requires Forecasting to *iterate over* reconciliation records, which is
strictly more than `tax-obligations-001` (a payload-free change signal)
provides.

The change signal tells Forecasting "something changed, recompute".
This task tells Forecasting "here is the data shape to read when you
recompute".

## What

Tax Obligations exposes a read-only query returning reconciliation
records. One record per (tax_year, reconciliation event). Records are
mutable (the user can edit or upgrade an estimate to confirmed); the
read returns the current state.

### Record shape

Each reconciliation record contains:

- **`tax_year`** — integer, the accounting period the reconciliation
  belongs to (e.g. `2025`).
- **`amount`** — signed decimal in the user's currency. Positive value
  represents a refund (cash inflow on the date); negative value
  represents a shortfall (cash outflow on the date).
- **`date`** — calendar date when the cashflow is expected to hit the
  bank (refund payout date, or shortfall due date). Set by the user
  based on the assessment.
- **`estimated`** — boolean. `true` if the user entered the record as
  their own guess (no formal assessment yet); `false` if it represents
  a confirmed external assessment.
- **`created_at`** / **`updated_at`** — timestamps, for cache /
  staleness reasoning if Forecasting needs them.

### Lifecycle

- A user creates a reconciliation record with `estimated: true` to
  stress-test their projection (e.g. "I expect to owe ~€5000 in March").
- A user creates a reconciliation record with `estimated: false` when
  the actual assessment lands.
- A user may upgrade an existing `estimated: true` record to
  `estimated: false` (in place; same record id, updated `amount` /
  `date` / flag, `updated_at` advanced). This is the only valid
  transition for the flag.
- A user may delete a record entirely (typo, wrong year, etc.).

Each create / edit / upgrade / delete fires `tax-obligations.changed`
per `tax-obligations-001`. No new event types.

### Query surface

- A function returning **all reconciliation records** within a
  caller-supplied date range (Forecasting passes its horizon bounds).
- Records are returned sorted by `date` ascending.
- The query is read-only and side-effect-free; safe to call from
  Forecasting's worker thread per `forecasting-002`'s threading
  decision.

The exact API surface (Promise/sync, function name) is an implementation
detail of `forecasting-011`'s host-process choice and is settled there.

## Acceptance criteria

- [ ] Tax Obligations exposes a function returning reconciliation
      records with the shape above.
- [ ] Records are returned sorted by `date` ascending.
- [ ] The query accepts an optional date range filter; without it,
      returns all records.
- [ ] `estimated: true → false` upgrade is supported in-place (same
      record id, `updated_at` advanced, no orphan record).
- [ ] Deletion is supported and removes the record from query results.
- [ ] Every create / edit / upgrade / delete fires
      `tax-obligations.changed` (sanity-check against
      `tax-obligations-001`'s trigger list — reconciliation triggers
      are already enumerated there; this task adds the `estimated`
      flag to the data, not new event types).
- [ ] Tests cover: empty store, one estimated record, one confirmed
      record, mixed, upgrade in place, delete, date-range filter.
- [ ] Documented in Tax Obligations's README under "Cross-context
      contract" alongside the change signal.

## Notes

### Why a separate task and not folded into `tax-obligations-001`

`tax-obligations-001` is the change-notification contract — it's
deliberately payload-free per the recompute strategy in
`forecasting-002`. The read-model is a different contract (data shape
+ query surface) and would have polluted the change-signal task. They
share triggers but not surface area.

### Why `estimated` is a flag, not a separate type

The cashflow arithmetic is identical for confirmed and estimated
reconciliations — both contribute one signed cashflow step on a given
date. Only the UI rendering differs. A boolean flag on a single record
type is the cheapest way to carry that distinction across the
context-map boundary without forcing Forecasting to know about two
record kinds.

### Sibling read-models

Cash Inflow and Cash Outflow will have analogous read-model tasks when
their backlog is refined for `forecasting-007` / `forecasting-008`.
This task is the Tax Obligations equivalent.
