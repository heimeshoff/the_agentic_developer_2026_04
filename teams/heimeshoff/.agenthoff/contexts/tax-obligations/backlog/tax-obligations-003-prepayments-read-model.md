---
id: tax-obligations-003
title: Expose prepayment schedule read-model for Forecasting
status: backlog
type: feature
context: tax-obligations
created: 2026-04-26
completed:
commit:
depends_on: [tax-obligations-001, forecasting-011]
blocks: [forecasting-007, forecasting-008, forecasting-009]
tags: [cross-bc-contract, read-model, customer-supplier]
---

## Why

`tax-obligations-002` covers reconciliation records. Tax Obligations
also exposes **quarterly prepayments**, which are a distinct domain
concept (different lifecycle, different cadence, different cashflow
shape) and which the projection engines need to iterate over for
`forecasting-007` and `forecasting-008`. The Sankey
(`forecasting-009`) also needs realized prepayment outflows for the
trailing-12-months window.

The change-signal contract (`tax-obligations-001`) already enumerates
prepayment-related triggers; this task fills in the **data shape** the
read API exposes for those triggers' consumers.

## What

Tax Obligations exposes a read-only query for prepayment records:

```ts
function getPrepayments(range?: { from?: string; to?: string }): PrepaymentRow[];
```

Synchronous, side-effect-free, safe to call from the projection worker
thread per `forecasting-002`'s threading model.

### Prepayment row shape

```ts
type PrepaymentRow = {
  id: string;
  taxYear: number;            // accounting year this prepayment belongs to
  dueDate: string;            // ISO-8601 YYYY-MM-DD; when the prepayment is due
  amountCents: number;        // signed: negative for outflow (prepayments are outflows)
  paid: boolean;              // true once the user has confirmed the payment landed
  paidDate?: string;          // ISO-8601 YYYY-MM-DD; when paid (set together with paid=true)
  createdAt: string;
  updatedAt: string;
};
```

Notes:

- `amountCents` is **signed negative** to represent the cashflow
  direction (outflow). This matches `tax-obligations-002`'s
  reconciliation convention (signed: positive = refund/inflow,
  negative = shortfall/outflow). Same project-wide integer-cents
  convention from `forecasting-005`.
- `paid: true` + `paidDate` is the realized outflow; `paid: false` is
  the future-due obligation.
- `dueDate` may be in the past for an unpaid prepayment (the user
  forgot to mark it paid). The projection engine's contract per
  `forecasting-007` is: **skip prepayments with `dueDate < asOf`**
  regardless of the `paid` flag — past-due unpaid prepayments are a
  data-quality issue for the user to resolve, not a projection event
  the engine should re-run. (If the user marks it paid retroactively,
  the next CSV import / reconciliation will roll it into the starting
  balance.)

### Lifecycle

- A user creates a prepayment record when an external assessment
  arrives (typically four per tax year, one per quarter).
- A user marks a prepayment as paid (`paid: false → true`, `paidDate`
  set) after the bank confirms the transaction.
- A user may edit `amountCents` or `dueDate` if the assessment is
  revised.
- A user may delete a prepayment (rare; correcting a typo).

Each create / edit / mark-paid / delete fires `tax-obligations.changed`
per `tax-obligations-001`. No new event types.

### Range filtering

- For the projection engines: pass `{ from: asOf, to: horizonTo }` to
  get prepayments inside the projection window.
- For the Sankey: pass `{ from: asOf - 12 months, to: asOf }` to get
  realized prepayment outflows in the trailing-12-months window. The
  Sankey filters to `paid: true` after the read.
- Without a range: returns all prepayments. Cheap enough at v1 volume.

`getPrepayments` returns rows sorted by `dueDate` ascending.

## Acceptance criteria

- [ ] `getPrepayments(range?)` returns rows matching the shape above,
      sorted by `dueDate` ascending.
- [ ] `paid: true` rows include `paidDate`; `paid: false` rows omit it
      (or set it to `null`/`undefined`).
- [ ] `amountCents` is signed-negative for the outflow direction.
- [ ] Range filtering is inclusive on both ends and applies to
      `dueDate`.
- [ ] Query is synchronous, side-effect-free, safe to call from the
      projection worker thread.
- [ ] All date fields are ISO-8601 strings.
- [ ] All money fields are integer cents.
- [ ] Every create / edit / mark-paid / delete fires
      `tax-obligations.changed` per `tax-obligations-001`'s already
      enumerated trigger list.
- [ ] Tests cover: empty store, all-future, all-past, mixed paid/unpaid,
      range filter on dueDate, sort ordering, edit propagation,
      mark-paid transition.
- [ ] Documented in Tax Obligations's README under "Cross-context
      contract" alongside the change signal and the reconciliation
      read-model.

## Notes

### Why a separate task from `tax-obligations-002`

Reconciliations and prepayments are distinct domain concepts with
distinct row shapes (reconciliation has `estimated`, prepayment has
`paid` + `paidDate`; reconciliation amount is bidirectional, prepayment
is one-directional). Folding them into one query would require an
overloaded record type or a discriminated union, both of which obscure
the domain. Two queries with parallel shapes is clearer.

### Why the engine skips past-due unpaid

Per `forecasting-007`'s engine contract: `dueDate < asOf` prepayments
are skipped, regardless of `paid` flag. This is the cleanest rule
because:

- If `paid: true`, the outflow is already in starting balance — don't
  double-count.
- If `paid: false` and `dueDate < asOf`, the user has either forgotten
  to mark it paid (data-quality issue) or the prepayment was never
  made (user owes it but hasn't paid yet — still data-quality, the
  engine can't know which). Either way, projecting it as a future
  outflow is wrong.

This rule is enforced in the engine, not in this read-model. The
read-model returns rows verbatim; the engine filters.

### Cross-BC

Sibling read-model tasks: `cash-inflow-002`, `cash-outflow-002`,
`tax-obligations-002` (reconciliations).
