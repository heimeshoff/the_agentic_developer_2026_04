---
id: forecasting-009
title: Sankey aggregation by hierarchical category
status: backlog
type: feature
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-003, forecasting-002, forecasting-011, cash-inflow-001, cash-outflow-001, cash-outflow-002, tax-obligations-001, tax-obligations-002]
blocks: []
tags: [domain-core, sankey, visualization, headline]
---

## Why

The Sankey is co-equal with the zero-money-day number as the headline
output (per vision). Its job is to make money flow visible: from income
sources, through hierarchical category parents, into leaf categories — so
"leaks the user didn't notice" become a visual fact rather than a feeling.

The aggregation that feeds it is a Forecasting concern (the context map is
explicit: "Sankey visualization spans all four contexts but lives
operationally inside Forecasting, as a derived view"). The rendering is a
UI concern handled by Prompt 1 in `forecasting-001`.

This task refines into a precise pure function over snapshot inputs,
keyed by the past-fixed trailing-12mo window committed in
`forecasting-003`, run on the worker thread per `forecasting-002` /
`forecasting-011`, with a recompute-on-read cache invalidation that
handles the daily window shift.

## What

A pure aggregation function in the Forecasting BC that runs on the
Node Worker thread (`forecasting-011`) and produces a Sankey-shaped data
structure in plain, structured-clone-compatible objects.

### Inputs (snapshot shape, all serializable plain objects)

```ts
type IsoDate = string;        // 'YYYY-MM-DD'
type Cents = number;          // integer minor units, signed where relevant

interface SankeyWindow {
  start: IsoDate;             // inclusive; trailing-12mo lower bound or earliest imported row
  end: IsoDate;               // inclusive; today (local date)
}

interface PaidIncomeRow {
  id: string;
  date: IsoDate;              // must satisfy window.start <= date <= window.end
  amount: Cents;              // positive
  source: string;             // free-text source label from the CSV row
  customer: string | null;    // matched-contract customer if any; null = "Other income"
}

interface CategoryNode {
  id: string;
  parentId: string | null;    // null for tree roots
  name: string;
}

interface CategorizedExpenseRow {
  id: string;
  date: IsoDate;              // must satisfy window.start <= date <= window.end
  amount: Cents;              // positive (sign is implicit in flow direction)
  categoryId: string | null;  // null = "Uncategorized" leaf
}

interface TaxOutflowRow {
  id: string;
  date: IsoDate;              // must satisfy window.start <= date <= window.end
  amount: Cents;              // signed: positive = inflow (refund), negative = outflow (prepayment / shortfall)
  kind: 'prepayment' | 'reconciliation';
  // Reconciliation rows are included only if estimated === false AND date <= today.
  // Estimated reconciliations are filtered upstream by the Forecasting input gateway,
  // never reach the aggregation function.
}

interface SankeyInput {
  window: SankeyWindow;
  paidIncome: PaidIncomeRow[];
  expenses: CategorizedExpenseRow[];
  categoryTree: CategoryNode[]; // current tree (not historical), per forecasting-003
  taxFlows: TaxOutflowRow[];
}
```

### Output (plain objects, structured-clone-safe)

```ts
type SankeyNodeKind =
  | 'income-customer'   // left column, one per distinct customer + 'Other income'
  | 'income-aggregate'  // single virtual 'All income' middle column on the income side
  | 'category'          // any node from the category tree (parents and leaves)
  | 'uncategorized'     // distinguished leaf for null-categoryId expenses
  | 'taxes';            // single top-level outflow node, sibling to category roots

interface SankeyNode {
  id: string;            // stable across recomputes given same inputs
  kind: SankeyNodeKind;
  label: string;
  totalCents: Cents;     // sum of inflow/outflow weight passing through this node, unsigned
  percentOfTotal: number; // 0..100, share of total flow on its side (income or outflow)
  // Click-through hint for forecasting-001 Prompt 1:
  drillTarget:
    | { kind: 'expenses-leaf'; categoryId: string }
    | { kind: 'expenses-uncategorized' }
    | { kind: 'taxes' }
    | { kind: 'income-customer'; customer: string | null }
    | null;             // null for purely structural nodes (e.g. 'income-aggregate')
}

interface SankeyEdge {
  fromNodeId: string;
  toNodeId: string;
  amountCents: Cents;    // unsigned weight; direction encoded by from/to
}

interface SankeyOutput {
  window: SankeyWindow;       // echoed for cache reasoning
  nodes: SankeyNode[];
  edges: SankeyEdge[];
  totals: {
    inflowCents: Cents;       // total income weight
    outflowCents: Cents;      // total expense + tax outflow weight
    netCents: Cents;          // inflow - outflow (signed; the conservation residual)
  };
  isEmpty: boolean;           // true iff inflowCents === 0 && outflowCents === 0
  truncatedToDataRange: boolean; // true if window shrank because <12mo of data exists
}
```

### Function signature

```ts
function aggregateSankey(input: SankeyInput): SankeyOutput;
```

Pure. Deterministic. No I/O. Safe to call on the worker thread; arguments
and return are structured-clone-compatible per `forecasting-011`.

### Aggregation rules (committed)

1. **Income side.** One left-column node per distinct `customer` value
   in `paidIncome`. Rows with `customer === null` aggregate into a single
   `Other income` node. All income nodes feed a single
   `income-aggregate` virtual node which is the single "split point"
   into outflows. Rationale: keeps left-side cardinality bounded by
   number of customers (small in practice), preserves customer
   information for hover tooltips, gives the renderer a clean center
   pivot.

2. **Outflow side — categorized expenses.** Build the flow graph from
   the `categoryTree` as it is *now* (per `forecasting-003`).
   Each `CategorizedExpenseRow` contributes its `amount` to its
   `categoryId` leaf, and that amount is rolled up to every ancestor.
   Each parent node's `totalCents` equals the sum of its descendants'
   leaf totals; edges represent the parent → child flows weighted by
   the child's subtree total. Depth is unbounded.

3. **Outflow side — uncategorized.** Rows with `categoryId === null`
   feed a distinguished `uncategorized` leaf, sibling to the top-level
   category roots. Never silently dropped.

4. **Outflow side — taxes (settles open Q1).** Tax flows render as a
   **single top-level `taxes` node, sibling to the category-tree roots
   and the `uncategorized` leaf** — *not* merged into the category
   tree. Rationale:
   - Taxes live in the Tax Obligations BC; categorized expenses live
     in Cash Outflow. Merging them inside Cash Outflow's tree would
     conflate two BCs visually and break the click-through (the
     `taxes` node drills to the Taxes tab; expense leaves drill to
     the Expenses tab — different tabs, different read paths).
     `forecasting-003`'s rationale already flagged this as the clean
     default.
   - A separate outflow column is rejected because the renderer
     (`forecasting-001` Prompt 1) describes a single hierarchical
     right-side flow; a separate column is layout drift, not a domain
     distinction.
   - Tax inflows (refunds, signed `amount > 0`) feed *into* the
     `income-aggregate` node from the right via a back-flow? No —
     taxes are a single signed bucket on the outflow side. A refund
     reduces the `taxes` node's total but does not appear on the
     income side. If `taxes.totalCents` would go negative (refunds
     exceed prepayments+shortfalls in the window — rare but
     possible), clamp to zero in node weight and surface the signed
     net via `totals.netCents` so conservation is preserved at the
     totals level.

5. **Conservation.** `totals.inflowCents === sum(income leaf totals)`.
   `totals.outflowCents === sum(category-roots + uncategorized + taxes)
   .totalCents`. `totals.netCents === inflow - outflow`. Edge weights
   on each side sum to their side's total. The function asserts these
   identities and throws on violation (test signal, not a runtime
   user-facing error).

6. **Estimated reconciliations excluded (settles open Q5).** Tax
   reconciliation records with `estimated: true` are excluded from the
   Sankey input upstream — they have not realized as bank movements
   and `forecasting-003` is realized-only. Reconciliations with
   `estimated: false` are included iff their `date` falls inside the
   window AND `date <= today`. This filter is applied by the
   Forecasting input gateway when it builds `SankeyInput.taxFlows`,
   not by `aggregateSankey` itself, so the aggregation function stays
   purely about shape.

7. **Empty / truncated windows.** If both `paidIncome` and `expenses`
   and `taxFlows` are empty, return `isEmpty: true` with empty
   `nodes`/`edges`, zero totals. If imported data covers less than
   12 months, the gateway sets `window.start` to the earliest imported
   row's date and sets `truncatedToDataRange: true`; the aggregation
   function does not concern itself with detecting truncation, only
   with passing the flag through.

### Sankey-vs-projection sharing — confirmed (settles open Q2)

`forecasting-002` settled this: the Sankey has its own cache, its own
key, its own trigger surface. The implication for `aggregateSankey`:

- It does **not** read horizon, scenario, contracted income, starting
  balance, subscriptions, or variable-category averages. None of those
  are in `SankeyInput` and none should ever be added.
- It is invoked by Forecasting's Sankey scheduler in response to
  `cash-inflow.changed`, `cash-outflow.changed`,
  `tax-obligations.changed`, and the daily window-shift trigger
  (below). It is *not* invoked by `horizon.changed` or
  `scenario.changed`.
- The projection engine (`forecasting-007` / `forecasting-008`) and
  the Sankey aggregation function are siblings under the same worker;
  they share serialization conventions but no cache and no input
  shape.

### Daily cache invalidation (settles open Q4)

**Mechanism: recompute-on-read with date check.** No scheduled timer,
no system-clock watcher.

The Sankey cache key from `forecasting-002` is `(sankey-window,
paid-income-snapshot, outflow-snapshot, tax-snapshot)`. Because
`sankey-window` is `{ start, end }` ISO date strings derived from
"today's local date minus 12 months" → "today's local date", the cache
key *automatically* changes the moment the day rolls over. Concretely:

- On every read of the cached Sankey (Dashboard mount, refocus, manual
  refresh), the Sankey scheduler computes the current
  `sankey-window` from the current local date.
- It then looks up the cache by the full key. If the key matches a
  cached entry, return it. If the date component differs, that's a
  natural cache miss and a recompute fires.
- No timer is registered. No midnight tick is scheduled. The
  invalidation is a side effect of "what window is correct *right
  now*?" being asked at every read.
- Edge case: if the app is open across midnight and the user is
  staring at the Dashboard, the displayed Sankey is stale until the
  user interacts (mouse-over, navigates, refocuses). Acceptable —
  vision is "user opens the tool when they want to look"; staring at
  it across midnight is not a path we optimize for. A single
  `requestIdleCallback` on focus / window-show could refresh the
  Sankey opportunistically; that polish is left to
  `forecasting-001`'s next pass and is not a correctness requirement
  here.

Rationale: a scheduled timer means coordinating across the worker
boundary, dealing with timezone quirks, handling app-suspend/resume
on Windows, and managing yet another lifecycle. Recompute-on-read is
trivially correct, has no extra surface, and the cost is paid only
when the user is actually looking — which is exactly when freshness
matters.

### Income-side hierarchy — committed (settles open Q3)

**Per-customer.** One left-column node per distinct `customer` value
plus an `Other income` bucket for paid-income rows with no matched
contract. Rationale:

- Cash Inflow's read shape already carries `customer`; collapsing to a
  single "Income" node throws away information the user can recognize
  ("Acme paid me €X this year").
- The cardinality is bounded — a single-user contractor has a small
  number of repeat customers per year. Even with 20 customers + an
  Other bucket, the left side is a manageable column.
- Contracted income is excluded entirely (per `forecasting-003`), so
  per-contract is not a meaningful grouping; per-customer is.
- Click-through metadata: each income node carries a `drillTarget`
  with `kind: 'income-customer'` so the Dashboard could later filter
  the Income tab by customer; not required for v1, but the data is
  already in `paidIncome` so the metadata is free.

## Acceptance criteria

- [ ] `aggregateSankey(input: SankeyInput): SankeyOutput` exists,
      is pure, deterministic, and structured-clone-safe across the
      worker boundary per `forecasting-011`.
- [ ] Output node + edge list satisfies money conservation:
      `totals.inflowCents === totals.outflowCents + totals.netCents`
      and side-totals match the sum of their edges to within zero
      (integer cents, no rounding error).
- [ ] Hierarchy preserved: parent category totals equal the sum of
      their descendants' leaf totals; depth unbounded.
- [ ] Per-node `totalCents` and `percentOfTotal` populated.
- [ ] Window sourced from `forecasting-003`'s decision: trailing 12
      months ending today (local date), paid-only, no contracted
      income, no projected expenses.
- [ ] Daily cache invalidation works via recompute-on-read against
      the `sankey-window` component of the cache key (no scheduled
      timer required).
- [ ] Tax flows render as a **single top-level `taxes` node** sibling
      to category-tree roots and to the `uncategorized` leaf, never
      merged into the category tree.
- [ ] `estimated: true` reconciliations are excluded from
      `SankeyInput.taxFlows` by the Forecasting gateway; the
      aggregation function never sees them.
- [ ] Income side aggregates per-customer with an `Other income`
      bucket for null-customer rows.
- [ ] Click-through `drillTarget` is preserved on every leaf:
      `expenses-leaf` (with categoryId), `expenses-uncategorized`,
      `taxes`, `income-customer` (with customer or null).
- [ ] Uncategorized expenses go to a distinguished `uncategorized`
      leaf, never silently dropped.
- [ ] Empty window → `isEmpty: true`, empty nodes / edges, zero
      totals; UI renders the empty state defined in
      `forecasting-001`.
- [ ] Truncated data range (<12mo imported) → `truncatedToDataRange:
      true`; window pinned to earliest imported row → today.
- [ ] Unit tests cover: simple flat hierarchy; deep hierarchy
      (>=4 levels); uncategorized rows present and absent; tax
      flows present (prepayments only, prepayments + confirmed
      reconciliation refund, prepayments + confirmed shortfall);
      empty window; truncated window; multi-customer income; single
      customer; null customer; estimated reconciliation correctly
      filtered out by gateway (asserted at gateway boundary, not in
      `aggregateSankey`); daily window shift produces a fresh
      computation through cache miss.
- [ ] Conservation assertion in code: function throws on internal
      inconsistency (defensive guard for the test suite, never
      surfaced to the UI).

## Cross-BC contract

Forecasting reads:

- **Cash Inflow:** paid-income rows filterable by date range, each
  exposing `id`, `date`, `amount`, `source`, `customer`. Contract is
  whatever Cash Inflow's read-model task specifies (see
  `cash-inflow-002` if filed; otherwise to be filed when
  `forecasting-007` is refined).
- **Cash Outflow:** categorized expense rows filterable by date
  range + the current category tree, per `cash-outflow-002`
  (filed by this task — see Sub-tasks below). The hierarchy as of
  *now*, not as of when each row was originally categorized.
- **Tax Obligations:** prepayment outflows (signed) and confirmed
  reconciliation rows (signed) within the date range, per
  `tax-obligations-002`. Estimated reconciliations are filtered
  out at the Forecasting gateway, not at the Tax Obligations
  query surface.

Forecasting writes nothing back to any of them — pure read-side
aggregation per the context map.

## Sub-tasks

- `cash-outflow-002` — filed: read-model exposing categorized
  expense rows by date range plus the current category tree. This
  task `depends_on` it. If `forecasting-007`'s parallel refinement
  also files / files first, the task is shared and this dependency
  is the same edge.

## Notes

### What was settled at refinement (verbatim)

| # | Question | Answer |
|---|---|---|
| 1 | Tax-flow display shape | **Single top-level `taxes` node, sibling to category-tree roots and `uncategorized`. Not merged into the tree, not a separate column.** |
| 2 | Sankey-vs-projection sharing | **Confirmed independent per `forecasting-002`. `aggregateSankey` reads no horizon / scenario / contracted-income / starting-balance / subscriptions / averages. Invoked only on Cash Inflow / Cash Outflow / Tax Obligations changed signals + daily window shift.** |
| 3 | Income-side hierarchy | **Per-customer, with an `Other income` bucket for null-customer paid rows.** |
| 4 | Daily cache invalidation | **Recompute-on-read, driven by the `sankey-window` component of the existing cache key (the date span shifts at midnight, the key naturally changes, the lookup misses, recompute fires). No scheduled timer.** |
| 5 | Reconciliation flows | **Confirmed reconciliations within the window are included as signed tax flows. Estimated reconciliations are excluded — Sankey is realized-only per `forecasting-003`. Filter applied at the gateway, not in `aggregateSankey`.** |

### Why these decisions, compressed

- The `taxes` node placement preserves BC separation visually and
  makes click-through routing simple (different drill target → different
  tab).
- Recompute-on-read is the cheapest correct mechanism in a single-user
  desktop app where the user opens the tool to look. Timers are
  overkill.
- Per-customer income preserves user-recognizable information at
  bounded cardinality.
- Estimated reconciliations follow the same realized-only rule that
  drove the entire `forecasting-003` decision; including them would
  re-litigate that committed window.

### Not in scope

- Rendering, hover tooltips, click-through navigation — all owned by
  `forecasting-001` Prompt 1.
- Projection-side computation — owned by `forecasting-007` /
  `forecasting-008`.
- The change-signal subscription wiring — owned by
  `cash-inflow-001`, `cash-outflow-001`, `tax-obligations-001`.
- The category-tree hierarchy ownership — owned by Cash Outflow and
  exposed via `cash-outflow-002`.
