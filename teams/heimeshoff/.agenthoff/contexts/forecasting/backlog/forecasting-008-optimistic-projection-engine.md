---
id: forecasting-008
title: Optimistic projection engine — adds contracted income
status: backlog
type: feature
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-007, cash-inflow-002]
blocks: []
tags: [domain-core, projection-engine, headline]
---

## Why

The optimistic projection is the second of the two headline numbers. It
answers *"what's my zero-money day if my contracted income lands as
expected?"* Together with the pessimistic projection, the pair frames
the runway between worst-case and contract-completed-case — which is the
core question this whole tool exists to answer.

It is deliberately a thin layer on top of `forecasting-007`: same input
snapshot shape (with `scenario: 'optimistic'` and one additional input
array), same iteration model, same worker-boundary serialization, same
output shape. Building it after `forecasting-007` is committed means
this task can be a transcription of differences rather than a
re-derivation.

## What

A pure function running in the same Node Worker thread as
`forecasting-007`, with the same purity / serialization contract per
`forecasting-002` + `forecasting-011`.

### Resolved open questions (committed)

#### 1. Overdue boundary — **end-of-day on `expectedPaymentDate`**

A contract is `contracted` while `today <= expectedPaymentDate`. At
end-of-day on the expected date, if the contract has not been marked
paid, Cash Inflow transitions it to `overdue`. The transition fires
`cash-inflow.changed` per `cash-inflow-001` and is reflected in the
next read of `getContractedIncome()` (which filters out `overdue`).

The optimistic engine therefore *never sees* overdue rows: Cash Inflow's
read-model returns `status: 'contracted'` rows only (per
`cash-inflow-002`). The engine doesn't need to filter — the upstream
contract enforces it.

#### 2. Mark-paid → projection refresh — **via the `cash-inflow.changed` signal**

When the user marks a contract paid, Cash Inflow transitions it from
`contracted` to `paid`. The transition:

- Removes the row from `getContractedIncome()`'s result.
- Adds the row (with its actual `postedDate`) to `getPaidIncome()`'s
  result on the next CSV import / manual entry path. Until the bank
  posts it, the contract sits in a brief "marked paid but not in CSV
  yet" state — Cash Inflow's own modeling concern, out of scope for
  this engine.
- Fires `cash-inflow.changed` per `cash-inflow-001`.

Forecasting subscribes to that signal per `forecasting-002` and treats
it as "invalidate the optimistic *and* pessimistic caches; schedule
recompute". No special wiring needed in the engine itself — it just
re-reads its inputs when called.

The pessimistic engine sees the change because the contract is now in
the paid stream (`getPaidIncome()`); the optimistic engine sees it
because the contract is no longer in the contracted stream
(`getContractedIncome()`). The optimistic-vs-pessimistic delta narrows
by exactly the contract's amount on its date, as expected.

### Engine signature

```ts
function projectOptimistic(snapshot: OptimisticSnapshot): OptimisticResult;
```

Pure, deterministic, side-effect-free. Same iteration model as
`projectPessimistic`, with one additional event type.

### Input snapshot shape

```ts
type OptimisticSnapshot = {
  // Identity / cache key fields
  horizon: { from: string /* ISO-8601 date */; to: string | 'beyond-horizon' };
  scenario: 'optimistic';
  asOf: string; // ISO-8601 date — "today" frozen at snapshot time

  // Starting balance (per forecasting-005)
  startingBalanceCents: number;
  startingBalanceCurrency: string;

  // Cash Inflow read-model — paid (per cash-inflow-002)
  // Same shape as PessimisticSnapshot.paidIncomeFuture; only postedDate > asOf rows.
  paidIncomeFuture: Array<{
    id: string;
    postedDate: string; // ISO-8601, > asOf
    amountCents: number; // positive
    source?: string;
  }>;

  // Cash Inflow read-model — contracted (per cash-inflow-002)
  // NEW vs PessimisticSnapshot. Only status === 'contracted' rows.
  contractedIncome: Array<{
    id: string;
    expectedPaymentDate: string; // ISO-8601, may be past or future
    amountCents: number; // positive
    customer: string;
  }>;

  // Cash Outflow read-model (per cash-outflow-002) — identical to PessimisticSnapshot
  subscriptions: Array<{
    id: string;
    amountCents: number;
    cadence: Cadence;
    startDate: string;
    endDate?: string;
    categoryId?: string;
  }>;
  variableCategoryAverages: Array<{
    categoryId: string;
    monthlyAvgCents: number;
  }>;

  // Tax Obligations read-model (per tax-obligations-002 + -003) — identical to PessimisticSnapshot
  taxPrepayments: Array<{
    id: string;
    dueDate: string;
    amountCents: number;
    paid: boolean;
  }>;
  taxReconciliations: Array<{
    id: string;
    taxYear: number;
    date: string;
    amountCents: number;
    estimated: boolean;
  }>;
};
```

`Cadence` is the same structured type pinned in `forecasting-007`.

### Output result shape

```ts
type OptimisticResult = {
  trajectory: Array<{
    date: string;
    balanceCents: number;
    event:
      | 'start'
      | 'paid-income'
      | 'contracted-income'    // NEW vs PessimisticResult
      | 'subscription'
      | 'variable-category'
      | 'tax-prepayment'
      | 'tax-reconciliation';
    sourceId?: string;
    deltaCents: number;
    estimated?: boolean;
  }>;

  zeroDay:
    | { kind: 'reached'; date: string }
    | { kind: 'beyond-horizon'; endBalanceCents: number };

  runway:
    | { kind: 'reached'; days: number; weeks: number; months: number }
    | { kind: 'beyond-horizon' };

  meta: {
    asOf: string;
    horizonFrom: string;
    horizonTo: string | 'beyond-horizon';
    eventCount: number;
    snapshotHash?: string;
  };
};
```

The result shape is identical to `PessimisticResult` except for the
extra `'contracted-income'` literal in the `event` union. The two types
are deliberately not unified into one — the discriminator on
`scenario` lets each engine's caller use the right type without
runtime checks.

### What this engine does NOT return

- **No delta vs pessimistic.** The Dashboard shows the optimistic-vs-
  pessimistic zero-day delta (per `forecasting-001` Prompt 1), but
  computing it requires both projection results. The optimistic engine
  returns only its own result; the delta is computed by whoever calls
  both engines (the Dashboard's projection scheduler, not the engine).
  Rationale: keeps the engines independent and parallelizable; the
  delta is a presentation concern, not a domain one.
- **No Sankey aggregates.** Same reasoning as `forecasting-007` —
  Sankey is past-fixed and lives in `forecasting-009`.

### Engine algorithm (committed)

The algorithm is `forecasting-007`'s algorithm with one addition.

1. Materialize event list — same as pessimistic, plus:
   - For each `contractedIncome[i]` with
     `expectedPaymentDate >= asOf` and `expectedPaymentDate <= horizon.to`:
     one event with `event: 'contracted-income'`,
     `date: expectedPaymentDate`, `deltaCents: amountCents` (positive),
     `sourceId: id`.
   - **Past-dated contracted rows** (`expectedPaymentDate < asOf`):
     skip. By the upstream contract these would have transitioned to
     `overdue` and not be in the input array; if one slips through it's
     a Cash Inflow data-quality issue, not an engine concern. The
     engine's defensive behavior is to skip silently rather than
     crash — failing loud on a data-quality issue would block the
     Dashboard.

2. Sort all events by `(date asc, kind asc)` — same canonical order as
   pessimistic, with `contracted-income` slotting **after**
   `paid-income` and **before** `subscription` for the same date. The
   tiebreak rationale: paid is the most realized; contracted is
   expected-but-unrealized; subs/variables are projected averages;
   taxes last.

3. Iterate, maintaining `balanceCents`, recording trajectory and the
   first zero-crossing — same as pessimistic.

4. After iteration, populate `zeroDay`, `runway`, `meta` — same as
   pessimistic.

### Implementation reuse

The two engines share enough structure (event materialization, sort,
iterate, zero-day detection, beyond-horizon resolution) that a single
internal `iterate(events, startingBalanceCents, horizon)` helper makes
sense. `projectPessimistic` and `projectOptimistic` differ only in
which rows they materialize into events. The shared helper is a
private function inside the engine module; the public API stays as
two named exports.

This is an implementation note for the worker, not a contract — the
ADR is free to record this or leave it to taste.

## Acceptance criteria

- [ ] Engine signature matches `function projectOptimistic(snapshot:
      OptimisticSnapshot): OptimisticResult` with the input/output
      shapes above.
- [ ] Engine is pure: same `snapshot` → byte-identical `result`
      (after canonical sort).
- [ ] Engine runs in the same Node Worker thread as `projectPessimistic`
      per `forecasting-002`; main process posts snapshot, receives
      result.
- [ ] All worker boundary values comply with `forecasting-011`'s
      structured-clone contract: no Dates, no BigInts, integer-cents
      money, ISO-8601 date strings.
- [ ] Step granularity is per-event with the canonical sort order
      `paid-income` → `contracted-income` → `subscription` →
      `variable-category` → `tax-prepayment` → `tax-reconciliation`
      for events on the same date.
- [ ] Contracted-income events are added only when
      `asOf <= expectedPaymentDate <= horizon.to`. Past-dated rows
      are skipped silently (defensive — should not occur given the
      upstream contract).
- [ ] Engine returns `{ trajectory, zeroDay, runway, meta }` only —
      **does not** compute or return the optimistic-vs-pessimistic
      delta (that belongs to the caller).
- [ ] Engine returns no Sankey aggregates (those belong to
      `forecasting-009`).
- [ ] Marking a contract paid causes both engines to recompute on the
      next call (via `cash-inflow.changed`); the optimistic-vs-
      pessimistic delta narrows by exactly the contract's amount on
      its date.
- [ ] Unit tests cover:
  - No contracts (optimistic == pessimistic byte-for-byte after sort).
  - Single future contract — extends runway by the contract's amount
    on its date.
  - Multiple contracts within horizon — each contributes one event.
  - Contract whose `expectedPaymentDate > horizon.to` — has no effect
    within horizon (event filtered out).
  - Contract whose `expectedPaymentDate < asOf` — silently skipped
    (defensive behavior).
  - Contract paid mid-flight (state transition test): pessimistic
    sees the row appear in paid stream, optimistic stops seeing it
    in contracted; both recompute consistently.
  - Beyond-horizon case (positive end balance with contracts).
  - Determinism: same snapshot run twice produces byte-identical
    output.
- [ ] Worker error path: same as pessimistic — exceptions surface as
      `{ kind: 'engine-error', message, stack }`.

## Decision rationale (for the eventual ADR)

- **Two functions, not one with a flag.** A single `project(snapshot)`
  with a `scenario` field would force the type system to allow
  `contractedIncome` on every snapshot. Two distinct snapshot/result
  types with two distinct functions keep the type system honest and
  the call site explicit.
- **Shared internal helper.** The iterate-and-sort logic is identical;
  factoring it out as a private helper inside the engine module is a
  no-cost win and keeps the two public functions thin.
- **No delta field in the result.** Delta computation needs both
  results; baking it into one engine's output would either couple
  the engines or duplicate state. Letting the caller compute it from
  both `zeroDay` fields keeps the engines independently cacheable
  per `forecasting-002`'s independent-cache decision.
- **Defensive past-dated skip.** Given the upstream contract
  (`cash-inflow-002`'s `getContractedIncome()` returns `status:
  'contracted'` only, and Cash Inflow auto-transitions to `overdue`
  past the expected date), past-dated rows shouldn't reach the
  engine. Silent skip is the engine's *belt-and-braces* response to
  a contract violation; failing loud would block the Dashboard on
  what is fundamentally a data-quality issue.

### Sort-order note for the eventual ADR

`paid-income` → `contracted-income` → `subscription` → ... is the
canonical tiebreak. The ordering reflects degree of certainty: paid
is realized, contracted is expected, subs/variables are projected
averages, taxes are externally set. On a day where both a paid row
and a contracted row land, applying the paid one first lets the
exact-zero edge case (balance lands on 0 after the paid arrival)
behave the same as in the pessimistic engine.

## Cross-context contract

Same as `forecasting-007` plus one additional read:

- `cash-inflow-002.getContractedIncome()` — returns
  `status: 'contracted'` rows only. The optimistic engine reads,
  never writes. The status filter is enforced upstream (Cash Inflow's
  query), not in the engine.

No other BC's contract changes for this engine.
