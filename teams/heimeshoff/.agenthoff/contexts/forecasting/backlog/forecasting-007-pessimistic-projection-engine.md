---
id: forecasting-007
title: Pessimistic projection engine — paid income only
status: backlog
type: feature
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-002, forecasting-004, forecasting-005, forecasting-006, forecasting-011, cash-inflow-002, cash-outflow-002, tax-obligations-002, tax-obligations-003]
blocks: [forecasting-008]
tags: [domain-core, projection-engine, headline]
---

## Why

The pessimistic projection is the conservative half of the headline output
— "what's my zero-money day if no contracted income comes in?" It's the
floor under the user's runway. Building it first establishes the projection
engine's data shape, iteration model, and outputs without the additional
complexity of contracted-income scheduling.

It is the gravitational center of the engine work: every other engine /
aggregator task (`forecasting-008`, `forecasting-009`) reuses the same
worker boundary, the same snapshot shape, and the same per-event
iteration model committed here. Re-litigating any of those later means
rewriting more than this task.

## What

A **pure function** running inside a Node Worker thread (per
`forecasting-002` + `forecasting-011`) that consumes a fully serialized
input snapshot and returns a fully serialized output. No I/O, no SQLite
reads, no event emission inside the compute step — the main process
materializes the snapshot, posts it across the worker boundary, the
worker computes, posts the result back.

### Resolved open questions (committed)

The five open questions from the previous draft are settled below.
Rationale for each is recorded in the "Decision rationale" section so
the eventual ADR is a transcription, not a re-litigation.

#### 1. Step granularity — **per-event**

Iteration steps once per cashflow event between `today` and the horizon
end. An event is any of: paid-income arrival, subscription occurrence,
variable-category occurrence (one per month — see Q4), tax prepayment
due, tax reconciliation date. The trajectory is a stair-step series with
one point per event.

Daily iteration was rejected: ~365× the event count for v1, with no
visible payoff (Dashboard renders zero-day + Sankey, not the trajectory
itself). Weekly was rejected: a compromise nobody asked for that buys
neither precision nor cheapness.

#### 2. Future-dated paid-income rows — **treat as paid**

Some banks expose pending future-dated transactions; the user's CSV
will surface these as `posted_date > today`. They count as paid for
projection purposes — the bank has already committed them to the
running balance, and the user's starting balance reflects that.

This requires Cash Inflow's read-model (`cash-inflow-002`) to expose
`posted_date` on every paid-income row, separate from `received_date`
or any other field. The pessimistic engine reads `posted_date` only;
future-dated paid rows are *not* re-credited as new inflow during
projection iteration (they are already baked into starting balance).

The engine therefore distinguishes:

- **Paid-income rows with `posted_date <= today`** — already in starting
  balance; engine ignores them entirely (no double-counting).
- **Paid-income rows with `posted_date > today`** — pending bank-side;
  starting balance does *not* yet include them; engine adds each as a
  positive cashflow event on its `posted_date`.

The contract is enforced upstream: starting balance is *as-of-today*,
including all transactions the bank has already posted. Cash Inflow's
read-model must be unambiguous about this split.

#### 3. Engine API surface — **trajectory + zero-day + runway, NOT sankey aggregates**

The engine returns `{trajectory, zeroDay, runway}`. It does **not**
return sankey-aggregate totals.

This corrects a framing in earlier drafts that bundled sankey
aggregates into the projection engine. The Sankey is past-fixed
(trailing 12 months, paid-only) per `forecasting-003`, has no
scenario / horizon dependency, and is computed by a different engine
(`forecasting-009`) over different inputs. Bundling its aggregation
into the projection engine would force one cache key to span both
purposes, which `forecasting-002` explicitly forbids (zero-day cache
includes `horizon` + `scenario`; Sankey cache excludes both).

The trajectory series *is* exposed (cheap byproduct of per-event
iteration; needed by `forecasting-008` to compute the optimistic
delta; future Dashboard iterations may render it). Adding it later
would force a worker-boundary change — cheap to include now, expensive
to bolt on later.

#### 4. Variable-category averaging window — **trailing 12 calendar months, monthly bucket**

Variable categories (groceries, fuel, etc.) are projected forward as
the **trailing 12 calendar months' average monthly spend** in that
category. One synthetic outflow event per category per calendar month
inside the projection horizon, posted on the first of each month.

Trailing 12 months matches:

- The Sankey window (`forecasting-003`).
- The Cash Outflow category-tree "last-12-months total" display
  (`forecasting-001` Prompt 3).
- The "rolling 12 months" horizon option (`forecasting-006`).

Using the same window in three places means the same number means the
same span — the user never has to ask "12 months over what".

The averaging is computed by Cash Outflow's read-model
(`cash-outflow-002`), not by the projection engine itself, so the
engine receives precomputed `monthly_avg_cents` per variable category
and treats it as a known recurring outflow.

#### 5. Subscription cadence representation — **structured object**

A subscription's cadence is represented as:

```ts
type Cadence =
  | { period: 'daily';   anchor: string /* ISO-8601 date */ }
  | { period: 'weekly';  anchor: string /* ISO-8601 date */; dayOfWeek?: 0|1|2|3|4|5|6 }
  | { period: 'monthly'; anchor: string /* ISO-8601 date */; dayOfMonth?: 1..31 }
  | { period: 'yearly';  anchor: string /* ISO-8601 date */; month?: 1..12; dayOfMonth?: 1..31 };
```

`anchor` is the canonical reference date (typically the first occurrence).
The optional `dayOfMonth` / `dayOfWeek` / `month` fields specify the
calendar anchor when the subscription should land on the same calendar
slot each period. If omitted, the engine repeats from `anchor` at the
period interval (e.g. monthly = same day-of-month as `anchor`).

Cron strings rejected: overkill for four cadences, hostile to TypeScript
typing, hard to validate. Interval-in-days rejected: fails for "monthly"
in a calendar-aware sense (28/30/31 day months). Structured object is
typed, structured-clone-safe per `forecasting-011`, and calendar-aware
where it matters.

`dayOfMonth: 31` on a short month (Feb) clamps to the last day of that
month. This is a documented engine convention.

### Engine signature

```ts
function projectPessimistic(snapshot: PessimisticSnapshot): PessimisticResult;
```

Pure, deterministic, side-effect-free. Same `snapshot` produces the
same `result` byte-for-byte (modulo iteration order; the engine sorts
events by date ascending before iteration so output is canonical).

### Input snapshot shape

```ts
type PessimisticSnapshot = {
  // Identity / cache key fields
  horizon: { from: string /* ISO-8601 date */, to: string | 'beyond-horizon' };
  scenario: 'pessimistic';
  asOf: string; // ISO-8601 date — "today" frozen at snapshot time

  // Starting balance (per forecasting-005)
  startingBalanceCents: number; // integer cents, safe-range
  startingBalanceCurrency: string; // 'EUR' for v1

  // Cash Inflow read-model (per cash-inflow-002)
  paidIncomeFuture: Array<{
    id: string;
    postedDate: string; // ISO-8601, > asOf (past-dated paids already in starting balance)
    amountCents: number; // signed, typically positive
    source?: string; // for sankey only; engine ignores
  }>;

  // Cash Outflow read-model (per cash-outflow-002)
  subscriptions: Array<{
    id: string;
    amountCents: number; // signed negative for outflow
    cadence: Cadence; // see above
    startDate: string; // ISO-8601, first day this sub is active
    endDate?: string; // ISO-8601, last day active; absent = open-ended
    categoryId?: string; // for sankey only; engine ignores
  }>;
  variableCategoryAverages: Array<{
    categoryId: string;
    monthlyAvgCents: number; // signed negative for outflow; precomputed by cash-outflow-002
  }>;

  // Tax Obligations read-model (per tax-obligations-002 + tax-obligations-003)
  taxPrepayments: Array<{
    id: string;
    dueDate: string; // ISO-8601
    amountCents: number; // signed negative for outflow (prepayments are outflows)
    paid: boolean; // if true and dueDate <= asOf, already in starting balance — engine skips
  }>;
  taxReconciliations: Array<{
    id: string;
    taxYear: number;
    date: string; // ISO-8601
    amountCents: number; // signed: positive = refund/inflow, negative = shortfall/outflow
    estimated: boolean; // engine ignores for arithmetic; carried through for downstream UI
  }>;
};
```

### Output result shape

```ts
type PessimisticResult = {
  // Per-event balance trajectory, sorted by date ascending.
  // First entry is { date: asOf, balanceCents: startingBalanceCents, event: 'start' }.
  trajectory: Array<{
    date: string; // ISO-8601
    balanceCents: number;
    event:
      | 'start'
      | 'paid-income'
      | 'subscription'
      | 'variable-category'
      | 'tax-prepayment'
      | 'tax-reconciliation';
    sourceId?: string; // id of the originating row, when applicable
    deltaCents: number; // signed change applied at this step (0 for 'start')
    estimated?: boolean; // true only for tax-reconciliation steps with estimated: true
  }>;

  // Zero-money day result.
  zeroDay:
    | { kind: 'reached'; date: string /* ISO-8601 */ }
    | { kind: 'beyond-horizon'; endBalanceCents: number /* projected balance at horizon.to */ };

  // Runway derived from zeroDay.
  runway:
    | { kind: 'reached'; days: number; weeks: number; months: number /* approx, for display */ }
    | { kind: 'beyond-horizon' };

  // Audit trail (kept small for serialization cost).
  meta: {
    asOf: string;
    horizonFrom: string;
    horizonTo: string | 'beyond-horizon';
    eventCount: number;
    snapshotHash?: string; // optional: hash of input snapshot for cache-key debugging
  };
};
```

### Worker-thread serialization contract

The engine runs in a Node Worker thread. The boundary contract enforces
`forecasting-011`'s structured-clone rule:

- **What crosses on input (`postMessage(snapshot)`):**
  - Plain object only — no class instances, no `Map`, no `Set`, no
    `Date`, no `BigInt`.
  - All dates encoded as **ISO-8601 strings** (`YYYY-MM-DD` for date-only
    fields like `postedDate`, `dueDate`, `cadence.anchor`; `YYYY-MM-DDTHH:mm:ss.sssZ`
    only if a timestamp is needed — none are, in v1).
  - All money encoded as **integer cents** (`number`), within safe
    integer range (±2^53). The starting-balance convention from
    `forecasting-005` is the project-wide rule.
  - Booleans, numbers, strings, plain arrays, plain nested objects only.

- **What crosses on output (`postMessage(result)`):**
  - Same rules. The `result.trajectory` is the largest field; for very
    long horizons (until-zero with multi-year runway) it can grow to
    thousands of entries. Acceptable: structured-clone copies it once
    on the way out, the main process holds it in cache, the renderer
    receives the bits it needs through IPC. If profiling later shows
    this is a hot spot, consider transferable `ArrayBuffer` for a
    binary trajectory format — out of scope for v1.

- **Identity preservation:** the worker does *not* preserve object
  identity for `id` strings — they're values, not references. Callers
  must not assume `===` equality between input row ids and trajectory
  `sourceId` (always use `===` on the string value).

- **Error handling:** the worker rethrows any error as a structured
  `{ kind: 'engine-error', message, stack }` posted back; the main
  process handles, logs, and surfaces an empty-state in the Dashboard
  with the previous cached value retained.

### Engine algorithm (committed)

1. Materialize event list:
   - One event per `paidIncomeFuture[i]` with `event: 'paid-income'`,
     `date: postedDate`, `deltaCents: amountCents` (positive).
   - Expand each `subscriptions[i]` into one event per occurrence
     between `max(asOf, startDate)` and `min(horizon.to, endDate ?? horizon.to)`,
     using its `cadence`.
   - For each `variableCategoryAverages[i]`: one event per calendar
     month inside `[asOf, horizon.to]`, posted on the first of the
     month, `deltaCents: monthlyAvgCents`.
   - For each `taxPrepayments[i]` with `paid: false` and
     `dueDate >= asOf` and `dueDate <= horizon.to`: one event,
     `deltaCents: amountCents` (negative). Skip already-paid
     prepayments — they're in the starting balance.
   - For each `taxReconciliations[i]` with `date >= asOf` and
     `date <= horizon.to`: one event, signed amount, `estimated`
     flag carried into the trajectory entry. Per `forecasting-004`,
     overdue estimated reconciliations within the horizon are
     included (the user owns the date).

2. Sort all events by `(date asc, kind asc)` where `kind asc` is a
   stable tiebreaker — for events on the same date, the order is:
   `paid-income`, `subscription`, `variable-category`, `tax-prepayment`,
   `tax-reconciliation`. This makes the "exact zero on a deposit day"
   case deterministic.

3. Iterate, maintaining a running `balanceCents` starting at
   `startingBalanceCents`. For each event:
   - Apply `deltaCents`.
   - Append to trajectory.
   - If `balanceCents <= 0` and `zeroDay` is unset: record
     `zeroDay = { kind: 'reached', date }`. Continue iterating
     (the trajectory is full-horizon; only the *first* zero-crossing
     is the zero-day).

4. After iteration, if `zeroDay` is unset: `zeroDay = { kind: 'beyond-horizon', endBalanceCents }`.

5. Compute `runway` from `(zeroDay, asOf)`.

## Acceptance criteria

- [ ] Engine signature matches `function projectPessimistic(snapshot: PessimisticSnapshot): PessimisticResult` with the input/output shapes above.
- [ ] Engine is pure: same `snapshot` → byte-identical `result` (after canonical sort).
- [ ] Engine runs inside a Node Worker thread per `forecasting-002`; main process posts snapshot, receives result.
- [ ] All worker boundary values comply with `forecasting-011`'s structured-clone contract: no Dates, no BigInts, integer-cents money, ISO-8601 date strings.
- [ ] Step granularity is **per-event** with the canonical sort order documented above.
- [ ] Future-dated paid-income rows (`postedDate > asOf`) are added as positive events; past-dated are skipped (already in starting balance).
- [ ] Variable categories are precomputed by Cash Outflow as `monthlyAvgCents` over the trailing 12 calendar months, and the engine posts one event per category per calendar month inside the horizon.
- [ ] Subscriptions step the balance on cadence-derived dates per the structured `Cadence` representation; `dayOfMonth: 31` clamps to last-day-of-month for short months.
- [ ] Tax prepayments step the balance on `dueDate` for unpaid future ones; paid prepayments and past-dated unpaid prepayments are not double-counted (paid ones in starting balance; past-dated unpaid is a Tax Obligations data-state question, out of engine scope — engine just skips `dueDate < asOf`).
- [ ] Tax reconciliation handling matches `forecasting-004`: every reconciliation record within the horizon contributes a signed cashflow event; `estimated` flag is carried into the trajectory entry, not used for arithmetic.
- [ ] "Beyond horizon" sentinel produced when running balance > 0 at `horizon.to`, with `endBalanceCents` populated.
- [ ] Trajectory is the full per-event series including events past the zero-day (zero-day is recorded only at first crossing; iteration continues so the optimistic engine can compute deltas).
- [ ] Engine returns `{ trajectory, zeroDay, runway, meta }` only — **does not** produce Sankey aggregates (those belong to `forecasting-009`).
- [ ] Unit tests cover:
  - Empty inputs (no rows of any kind) → trajectory is `[{ start }]`, zeroDay is reached on `asOf` if `startingBalanceCents <= 0`, otherwise beyond-horizon at `endBalanceCents = startingBalanceCents`.
  - Only-subscriptions case.
  - Mixed case (paid-income future + subs + variables + taxes + reconciliation).
  - Negative-balance-from-day-one case (`startingBalanceCents <= 0` at `asOf`).
  - Exact-zero edge: balance lands on exactly 0 — counts as zero-day.
  - Beyond-horizon case (positive end balance).
  - `dayOfMonth: 31` clamping in February.
  - Estimated reconciliation: arithmetic identical to confirmed; `estimated: true` propagates to the trajectory entry.
  - Future-dated paid-income with `postedDate > asOf` is added as inflow.
  - Determinism: same snapshot run twice produces byte-identical output.
- [ ] Worker error path: a thrown exception inside compute is posted back as `{ kind: 'engine-error', message, stack }`; main process handles without crashing.

## Decision rationale (for the eventual ADR)

- **Per-event over daily:** trajectory is not user-rendered in v1; daily would multiply iteration cost by ~365× for a 1-year horizon and ~1825× for the 5-year until-zero upper bound. Per-event is O(events) where events = subs + paid-future + reconciliations + variable-months + tax-prepayments — typically a few hundred for a normal horizon.
- **Future-dated paids as inflow:** the bank's running balance is the user's starting balance. Pending transactions are *not* in the running balance until they post. The split (`postedDate <= asOf` skip vs `postedDate > asOf` add) mirrors the bank's own accounting and is the only rule that doesn't double-count or under-count.
- **Trajectory exposed but Sankey not:** `forecasting-008` (optimistic) needs the trajectory to compute the delta to pessimistic. Future Dashboard iterations may render it. Adding it later means breaking the worker boundary. Sankey is a different engine over a different window with a different cache key — bundling collapses two cache keys into one and forces re-computation when only one changed (which `forecasting-002`'s independent caches explicitly avoids).
- **Trailing-12-months for variables:** matches the Sankey window (`forecasting-003`), the category-tree muted-total (`forecasting-001` Prompt 3), and the rolling-12mo horizon. Same number, same span, no user confusion.
- **Structured cadence object:** typed, structured-clone-safe, calendar-aware. Cron strings would force the engine to ship a cron parser into the worker, fail TypeScript exhaustiveness, and be hostile to upgrade if the user later wants "every other month" (which the structured form extends naturally with an `interval` field).

## Cross-BC contracts (sub-tasks filed)

The pessimistic engine reads from three upstream BCs. Beyond the
already-filed `*.changed` signals (`cash-inflow-001`, `cash-outflow-001`,
`tax-obligations-001`) and the reconciliation read-model
(`tax-obligations-002`), three new read-model contracts are needed and
filed as new tasks:

- **`cash-inflow-002`** — paid + contracted income read-model. Provides
  paid-income rows with `postedDate` (so the engine can split past vs
  future-dated). Also provides the contracted-income shape for
  `forecasting-008`. Files: `cash-inflow-002-read-model.md`.

- **`cash-outflow-002`** — transactions, categories, subscriptions, and
  precomputed variable-category averages over trailing 12 months.
  This is the bulk of the cross-BC contract surface. Files:
  `cash-outflow-002-read-model.md`.

- **`tax-obligations-003`** — prepayment schedule read-model.
  `tax-obligations-002` covers reconciliations only; prepayments need
  their own read-model exposing `dueDate`, `amountCents`, `paid` flag.
  Files: `tax-obligations-003-prepayments-read-model.md`.

`forecasting-007.depends_on` is updated to include all three.

## Notes

### Interaction with cache key

The cache key for the pessimistic projection per `forecasting-002` is:
`(horizon, scenario: 'pessimistic', paid-income-snapshot, contracted-income-snapshot, outflow-snapshot, tax-snapshot, starting-balance)`.

For pessimistic, `contracted-income-snapshot` is unused but still part
of the key (it stays in the key for cache uniformity with optimistic;
the engine itself reads only `paidIncomeFuture` from the snapshot).
This is a tiny cache-key bloat in exchange for one cache implementation
covering both engines.

### Interaction with horizon resolution

The `snapshot.horizon` is precomputed by `forecasting-006`'s
`resolveHorizon` *before* the snapshot is materialized. The engine
does not call `resolveHorizon`; it just consumes the resolved bounds.

For `horizon.to === 'beyond-horizon'` (the until-zero case where the
projection never reaches zero): the engine treats the upper bound as
"asOf + 5 years" per `forecasting-006`'s constant. This is the only
place the until-zero search bound enters the engine — and it's
already resolved at snapshot time, so the engine itself just iterates
to whatever date string `horizon.to` is.

Wait — that's wrong. `resolveHorizon` for until-zero needs the
projection result to know the date, but the projection needs the
horizon to know how far to iterate. The cycle is broken at
`forecasting-006`: the engine iterates to the 5-year upper bound for
until-zero; `resolveHorizon` then post-processes the engine output to
produce the displayed `to` value. So in this snapshot:

- `horizon.to` is **always a concrete ISO date** when the engine runs.
- For until-zero, the snapshot uses `asOf + 5 years`.
- The engine reports zero-day or beyond-horizon as usual; the caller
  (Dashboard / horizon resolver) interprets beyond-horizon as the
  "Beyond horizon" sentinel for display.

### Handing off to optimistic (`forecasting-008`)

`forecasting-008` reuses the same engine with one snapshot extension:
`contractedIncome: Array<{...}>`. The engine becomes
`project(snapshot, scenario)` where `scenario === 'optimistic'` adds
contracted-income events to the event list. Refactor at that point;
`forecasting-007` ships with the pessimistic-only signature first.

### Historical paid-income rows

The engine never iterates over historical (`postedDate <= asOf`) paid
income. They are already part of `startingBalanceCents`. Cash Inflow
may still expose them in the read-model (for the Sankey, which needs
trailing 12 months of paid income); the engine snapshot just filters
them out before posting.

### What's intentionally NOT in scope

- Currency conversion (single currency per `forecasting-005`).
- Probabilistic projections (vision non-goal).
- User-editable engine parameters (no goals, no targets).
- Sankey aggregation (separate engine, `forecasting-009`).
- Persistence of the result (the cache from `forecasting-002`'s scheduler is the only persistence; the engine itself is stateless).
