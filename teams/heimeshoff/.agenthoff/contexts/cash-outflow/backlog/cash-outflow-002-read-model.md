---
id: cash-outflow-002
title: Expose transactions, categories, subscriptions, and variable-category averages read-model
status: backlog
type: feature
context: cash-outflow
created: 2026-04-26
completed:
commit:
depends_on: [cash-outflow-001, forecasting-011]
blocks: [forecasting-007, forecasting-008, forecasting-009]
tags: [cross-bc-contract, read-model, customer-supplier]
---

## Why

`cash-outflow-001` exposes a payload-free change signal plus the batch
suspend/release pair. It is **not** enough for the projection engines
or the Sankey aggregator: they need actual data shapes — categorized
transaction rows, the category tree, subscription definitions, and
precomputed variable-category averages.

This task defines the four read-model contracts Cash Outflow exposes to
Forecasting. Forecasting reads, never writes — pure customer-supplier
per the context map.

## What

Cash Outflow exposes four read-only queries (all synchronous,
side-effect-free, safe to call from the projection worker thread):

1. `getTransactions(range: { from: string; to: string })` — categorized
   expense rows in a date range. Used by the Sankey
   (`forecasting-009`) for the trailing-12-months window.
2. `getCategoryTree()` — the current hierarchical category tree. Used
   by the Sankey to render hierarchical flow nodes.
3. `getSubscriptions(range?: { from?: string; to?: string })` —
   subscription definitions whose active range overlaps the given
   range. Used by the projection engines.
4. `getVariableCategoryAverages(asOf: string)` — precomputed
   monthly-average outflow per variable category over the trailing
   12 calendar months ending `asOf`. Used by the projection engines.

### Transaction row shape

```ts
type TransactionRow = {
  id: string;
  postedDate: string;        // ISO-8601 YYYY-MM-DD
  amountCents: number;       // signed: negative for outflow, positive for refund/credit
  description: string;       // raw bank-CSV description
  categoryId: string | null; // null = uncategorized
  isSubscription: boolean;   // true if this row originated from a subscription occurrence
  createdAt: string;
  updatedAt: string;
};
```

Notes:

- `categoryId: null` represents the "Uncategorized" leaf for Sankey
  rendering per `forecasting-009`.
- Transactions are read-side only; categorization changes (manual
  override, rule-driven recategorization) update the row in place and
  fire `cash-outflow.changed`.

### Category tree shape

```ts
type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;   // null = root-level category
  isVariable: boolean;       // true = projected as monthly average; false = fixed/subscription-tracked
  createdAt: string;
  updatedAt: string;
};

function getCategoryTree(): CategoryNode[];
```

The query returns a **flat array** of nodes; the consumer reconstructs
the tree by `parentId`. This avoids serializing nested objects across
the worker boundary (structured-clone copies the whole tree even when
only one node was touched) and keeps the shape stable across mutations.

The tree is returned as-of-now, not as-of-the-transaction-date — per
`forecasting-003`'s commit, the Sankey reflects the user's current
understanding of how things should be categorized, not the historical
hierarchy.

### Subscription shape

```ts
type SubscriptionRow = {
  id: string;
  amountCents: number;        // signed: typically negative for outflow
  cadence: Cadence;           // structured cadence object — see below
  startDate: string;          // ISO-8601 YYYY-MM-DD; first day this subscription is active
  endDate?: string;           // ISO-8601 YYYY-MM-DD; last day active; absent = open-ended
  categoryId: string;         // subscriptions are always categorized
  description: string;        // user-provided label ("Rent", "Spotify", etc.)
  createdAt: string;
  updatedAt: string;
};

type Cadence =
  | { period: 'daily';   anchor: string }
  | { period: 'weekly';  anchor: string; dayOfWeek?: 0|1|2|3|4|5|6 }
  | { period: 'monthly'; anchor: string; dayOfMonth?: 1..31 }
  | { period: 'yearly';  anchor: string; month?: 1..12; dayOfMonth?: 1..31 };
```

`Cadence` is the same structure committed in `forecasting-007`'s engine
contract. Cash Outflow stores it canonically (one row per subscription
with a JSON-serialized cadence column, or a normalized columnar form —
implementation choice) and returns it in the read-model verbatim.

Validation: the `dayOfMonth: 31` clamping rule is a projection-engine
concern; Cash Outflow stores the raw value and trusts the engine to
apply month-length math.

### Variable-category averages shape

```ts
type VariableCategoryAverage = {
  categoryId: string;
  monthlyAvgCents: number;   // signed: typically negative for outflow
  // The window over which the average was computed:
  windowFrom: string;        // ISO-8601 YYYY-MM-DD; (asOf - 12 calendar months)
  windowTo: string;          // ISO-8601 YYYY-MM-DD; asOf
  computedAt: string;        // ISO-8601 timestamp; for staleness debugging
};

function getVariableCategoryAverages(asOf: string): VariableCategoryAverage[];
```

Computation rule (committed):

- For each category with `isVariable: true`, sum
  `transactions.amountCents` where `postedDate` is within the trailing
  12 calendar months ending on `asOf` AND `categoryId === thatCategory.id`.
- Divide by 12. Round half-to-even (banker's rounding) to the nearest
  integer cent.
- A category with zero transactions in the window returns
  `monthlyAvgCents: 0` rather than being omitted — this keeps the read
  shape stable and lets Forecasting reason about "we know this category
  exists, it just has no recent activity".

Performance note: this is computed on demand, in SQLite, as a
`SUM / 12` over an indexed `(categoryId, postedDate)` query. For v1
data volumes (single user, a few thousand transactions / year) this is
sub-millisecond. If profiling later shows it's a hot spot, materialize
into a `category_averages` cache table refreshed on
`cash-outflow.changed`.

### Range / asOf semantics

- `getTransactions` requires a range; full-history reads are not part
  of the projection or Sankey use cases.
- `getSubscriptions` accepts an optional range; a subscription is
  returned if its active interval (`[startDate, endDate ?? +∞)`)
  overlaps the requested range. Without a range: all subscriptions.
- `getVariableCategoryAverages` requires `asOf`. The window is always
  trailing 12 calendar months ending on `asOf`.

## Acceptance criteria

- [ ] `getTransactions({ from, to })` returns rows in the shape above,
      sorted by `postedDate` ascending.
- [ ] `getCategoryTree()` returns the flat node array; consumer
      reconstructs tree by `parentId`.
- [ ] `getSubscriptions(range?)` returns active-overlapping
      subscriptions in the shape above; cadence is structured per
      `Cadence` typedef.
- [ ] `getVariableCategoryAverages(asOf)` returns one row per
      `isVariable: true` category, with `monthlyAvgCents` computed by
      the rule above (sum / 12, banker's rounding).
- [ ] All queries are synchronous, side-effect-free, safe to call from
      the projection worker thread.
- [ ] All date fields are ISO-8601 strings (no `Date` objects).
- [ ] All money fields are integer cents (`number`), per `forecasting-005`.
- [ ] Cadence representation matches `forecasting-007`'s `Cadence` type
      exactly.
- [ ] Variable-category averages include zero-activity categories with
      `monthlyAvgCents: 0` (not omitted).
- [ ] Categorized expense rows respect the **current** category tree,
      not the historical one (per `forecasting-003`'s commit).
- [ ] Tests cover:
  - Transactions: empty range, populated range, uncategorized rows
    (`categoryId: null`).
  - Category tree: flat root-only, deep hierarchy, deleted nodes
    excluded.
  - Subscriptions: open-ended (`endDate` absent), closed-ended,
    overlap edge cases (active starts after range, active ends before
    range, active spans entire range).
  - Variable averages: zero-activity category, populated category,
    leap-year window edge.
- [ ] Documented in Cash Outflow's README under "Cross-context
      contract" alongside the change signal and batch primitive.

## Notes

### Why precompute the averages here

The projection engine receives `monthlyAvgCents` as data, not as a
formula. This:

- Keeps the engine pure-by-snapshot (nothing in the engine depends on
  the historical transaction store).
- Lets Cash Outflow optimize the computation later (e.g. cache table)
  without changing the engine contract.
- Means the engine's worker thread doesn't read SQLite at all — which
  is what `forecasting-002`'s threading model assumes.

### Why the category tree is flat

Structured-clone copies the entire serialized graph; a nested-tree
shape would copy the whole tree on every mutation. Flat-with-parentId
serializes once and lets the consumer build the tree it needs.

### Why one read-model task spans four queries

The four queries share a single domain root (the Cash Outflow store)
and a single change signal (`cash-outflow.changed`). Splitting them
into four tasks would multiply ceremony without separating concerns —
the consumer (Forecasting's projection + Sankey engines) needs all
four available in one coherent read-side surface. Filed as one task
with four queries.

### Cross-BC

Sibling read-model tasks: `cash-inflow-002`, `tax-obligations-002`
(reconciliations), `tax-obligations-003` (prepayments). Same shape
pattern.
