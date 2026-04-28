---
id: cash-inflow-002
title: Expose paid + contracted income read-model for Forecasting
status: backlog
type: feature
context: cash-inflow
created: 2026-04-26
completed:
commit:
depends_on: [cash-inflow-001, forecasting-011]
blocks: [forecasting-007, forecasting-008, forecasting-009]
tags: [cross-bc-contract, read-model, customer-supplier]
---

## Why

`cash-inflow-001` exposes a payload-free change signal — enough to tell
Forecasting "your cache is stale". It is **not** enough for the
projection engines: `forecasting-007` (pessimistic) needs paid-income
rows so it can credit pending bank-side transactions on their posted
dates, and `forecasting-008` (optimistic) needs contracted-income rows
so it can credit them at expected payment dates.

This task defines the read-side contract Cash Inflow exposes to
Forecasting. Forecasting reads, never writes — pure customer-supplier
per the context map.

## What

Cash Inflow exposes two read-only queries:

- `getPaidIncome(range?: { from?: string; to?: string })` — paid-income
  rows.
- `getContractedIncome()` — contracted-income rows whose status is
  `contracted` (not `paid`, not `overdue`).

Both are synchronous (per `forecasting-011`'s `better-sqlite3` choice)
and side-effect-free; safe to call from the projection worker thread.

### Paid-income row shape

```ts
type PaidIncomeRow = {
  id: string;
  postedDate: string;       // ISO-8601 YYYY-MM-DD; the bank's "posted" / "value" date
  amountCents: number;      // signed; positive for credit
  source?: string;          // free-text counterparty (used by Sankey for income-side hierarchy)
  contractId?: string;      // present when this paid row reconciled against a known contract
  createdAt: string;        // ISO-8601 timestamp
  updatedAt: string;        // ISO-8601 timestamp
};
```

Notes:

- `postedDate` is the **bank-reported posting date**. Some banks expose
  pending future-dated transactions whose `postedDate > today`. These
  are returned by the query; the projection engine treats
  `postedDate > asOf` as "future paid" (event added to projection) and
  `postedDate <= asOf` as "already in starting balance" (skipped). See
  `forecasting-007`'s contract.
- `amountCents` follows the project-wide integer-minor-units convention
  pinned in `forecasting-005`.

### Contracted-income row shape

```ts
type ContractedIncomeRow = {
  id: string;
  expectedPaymentDate: string; // ISO-8601 YYYY-MM-DD
  amountCents: number;          // signed; positive
  customer: string;             // counterparty
  status: 'contracted';         // query filters: never 'paid' or 'overdue'
  createdAt: string;
  updatedAt: string;
};
```

Notes:

- The query returns **only** rows whose current status is `contracted`.
  `paid` rows surface through `getPaidIncome` instead. `overdue` rows
  are excluded from the optimistic projection per `forecasting-008`.
- Once an unpaid contracted row's `expectedPaymentDate` passes, Cash
  Inflow's own logic transitions it to `overdue`; that transition fires
  `cash-inflow.changed` per `cash-inflow-001`.

### Range filtering

`getPaidIncome` accepts an optional `{ from?, to? }` range:

- For the projection engine: pass `{ from: asOf }` to get future-dated
  paids only (used directly).
- For the Sankey aggregation (`forecasting-009`): pass
  `{ from: asOf - 12 months, to: asOf }` to get trailing-12-months
  history.
- Without a range: returns everything. Cheap enough for a single-user
  local DB.

`getContractedIncome` does not need a range filter for v1 — the entire
unpaid contract list is small and Forecasting filters in-memory.

## Acceptance criteria

- [ ] `getPaidIncome(range?)` returns rows matching the shape above,
      sorted by `postedDate` ascending.
- [ ] `getContractedIncome()` returns rows matching the shape above,
      sorted by `expectedPaymentDate` ascending, status filter applied
      (only `contracted`).
- [ ] Both queries are synchronous, side-effect-free, safe to call
      from the projection worker thread.
- [ ] Range filtering on `getPaidIncome` is inclusive on both ends.
- [ ] Date fields are ISO-8601 strings (no `Date` objects), per
      `forecasting-011`'s structured-clone contract.
- [ ] Money fields are integer cents (`number`), per `forecasting-005`.
- [ ] Tests cover: empty store, only paid, only contracted, mixed,
      future-dated paid, range filter on paid, status filter excluding
      `paid` and `overdue` from contracted query.
- [ ] Documented in Cash Inflow's README under "Cross-context contract"
      alongside the change signal.

## Notes

### Why two queries, not one

Paid and contracted are distinct domain states with distinct semantics.
The pessimistic engine reads paid-future only; the optimistic engine
reads both; the Sankey reads paid only. Splitting the queries keeps
each consumer's intent clear at the call site rather than relying on
filter parameters.

### `postedDate` vs other date fields

A bank CSV typically distinguishes "transaction date" (when the user
made the purchase / the counterparty initiated transfer) from "posted
date" / "value date" (when the bank actually moved the money in/out
of the account balance). For projection math, **only the posted date
matters** — that's the date the running balance changes.

If Cash Inflow's CSV ingestion captures both, the read-model exposes
`postedDate` as the projection-relevant one. Other date fields can
exist on the underlying record but are not part of this read contract.

### Cross-BC

Sibling read-model task: `cash-outflow-002`. Both follow the same
shape pattern: shape + range filter + sort.

The reconciliation question (CSV-detected paid rows vs manually-tracked
contracts — Cash Inflow's own open question in its README) is upstream
of this read-model, not part of it. Whatever Cash Inflow decides about
auto-reconciliation, the resulting paid rows surface through this
query unchanged.
