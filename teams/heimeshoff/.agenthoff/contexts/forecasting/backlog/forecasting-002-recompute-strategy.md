---
id: forecasting-002
title: Recompute strategy — eager on input change vs on-demand
status: backlog
type: decision
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-010, forecasting-011]
blocks: [forecasting-007]
tags: [architecture, performance, projection-engine]
---

## Why

Forecasting reads from Cash Inflow, Cash Outflow, and Tax Obligations and
produces zero-money-day plus the Sankey aggregation. Whether projection is
recomputed eagerly on every upstream change, batched, or computed on demand
shapes the entire shape of the projection engine — caching, invalidation,
event flow, threading, and the perceived responsiveness of the UI.

This is a foundational decision: it has to be settled before the projection
engine (`forecasting-007`) is built, because choosing eager-recompute later
forces a rewrite of the engine's I/O assumptions and of the upstream BCs'
notification surface.

The Dashboard prompt in `forecasting-001` commits explicitly to "numbers
update immediately" UX — which constrains, but does not fully decide, the
recompute strategy.

## What

### Decision space (refined)

The original three options (eager / on-demand / hybrid) collapse one axis
that should stay separated. The actual decision space is **four
near-orthogonal choices**:

**A. Trigger** — when does recompute fire?
1. **Eager** — every upstream change fires a recompute.
2. **Eager-with-debounce** — same, but bursts (CSV import) coalesce
   into a single recompute on the trailing edge.
3. **On-demand** — upstream changes mark stale; recompute runs when the
   user looks at the Dashboard or changes the horizon.
4. **Stale-with-banner** — on-demand, but the UI shows the previous
   value with a "stale / recomputing…" indicator while a background
   refresh runs.

**B. Granularity per output** — does zero-day projection share a trigger
with the Sankey aggregation?
1. **Coupled** — one staleness flag, one recompute pass, both outputs
   refresh together.
2. **Independent** — zero-day and Sankey have separate triggers and
   separate caches. Aligns with `forecasting-009`'s open question and
   with `forecasting-003`'s Sankey-window decision.

**C. Threading** — main thread vs worker?
1. **Main thread** — simplest, but any non-trivial compute janks the UI.
2. **Worker thread** — projection runs off the UI thread; main thread
   stays responsive regardless of compute cost.

**D. CSV-import boundary** — bulk imports are the obvious worst case;
how is the boundary expressed?
1. **No special handling** — rely on debounce alone.
2. **Explicit suppress/release** — the import flow opens a "suspend
   recomputes" boundary, runs all row inserts, then releases and
   triggers one recompute.

These axes were the missed dimensions in the original three-option
framing. Treating them separately produces a cleaner ADR.

### Recommendation (to be confirmed in the ADR)

**A2 + B2 + C2 + D2**:

- **Eager-with-debounce** trigger (~150–300ms trailing). Fits the
  Dashboard's "numbers update immediately" promise without thrashing
  on bursts. The exact debounce window is informed by the spike
  (`forecasting-010`).
- **Independent triggers for zero-day vs Sankey**. The Sankey window
  (`forecasting-003`) is decoupled from the projection horizon, so the
  two outputs naturally have different invalidation surfaces. Sharing a
  trigger would mean recomputing one when only the other's inputs
  changed.
- **Worker thread** for the compute step. The projection engine
  (`forecasting-007`) is already specified as pure given a snapshot —
  trivially relocatable to a worker. Main-thread keeps the UI fluid even
  when a 10k-row CSV lands.
- **Explicit suspend/release on CSV import**. CSV import is the only
  upstream operation that can fire thousands of changes in one logical
  user action. Wrapping it in a "suspend recomputes" boundary is
  cheaper and more predictable than relying on debounce to swallow
  the burst.
- **Stale-with-banner is the fallback UX** if the spike shows compute
  >500ms at realistic volume — kept in reserve, not in the v1 path.

### Rationale (project-grounded)

- **Single-user, local-only, Windows 11**: no concurrency, no
  multi-tenant cost amplification. The simplest model that meets the UX
  promise wins. Eager-with-debounce is that model.
- **Contract-driven user with bursty CSV imports**: the burst case is
  the only case where naive eager fails; debounce + suspend/release
  handle it without leaking complexity into the rest of the system.
- **Sankey co-equal with zero-day**: the Sankey is not a side panel;
  it's headline. Treating it as a second-class consumer of the same
  trigger would produce stale Sankey while zero-day is fresh (or vice
  versa). Independent caches respect the headline equality.
- **Projection engine yet-to-be-built** (`forecasting-007`): cheapest
  moment to commit to "engine is pure, runs in worker, called by
  scheduler" — costs nothing now, costs a rewrite later.
- **The "numbers update immediately" UX expectation** in `forecasting-001`
  Prompt 1: rules out pure on-demand. Eager-with-debounce delivers
  immediacy; stale-with-banner is the graceful-degradation path if
  measured cost makes pure eager untenable.

## Acceptance criteria

- [ ] ADR in `.agenthoff/knowledge/decisions/` recording the chosen
      strategy across all four axes (Trigger, Granularity, Threading,
      Import boundary).
- [ ] ADR names the trigger boundary explicitly: which upstream
      events do or do not cause recompute. Concretely, lists
      `cash-inflow.changed`, `cash-outflow.changed`,
      `tax-obligations.changed`, `starting-balance.changed`, and
      `horizon.changed` and states the response of each on each cache.
- [ ] ADR specifies the cache key for each output:
      - Zero-day: `(horizon, scenario, paid-income-snapshot,
        contracted-income-snapshot, outflow-snapshot, tax-snapshot,
        starting-balance)`.
      - Sankey: `(sankey-window, paid-income-snapshot,
        outflow-snapshot, tax-snapshot)` — note: no `horizon`, no
        `scenario`, no `contracted-income-snapshot` unless
        `forecasting-003` decides Sankey includes contracted.
- [ ] ADR specifies the debounce window (numeric value in ms) and
      cites the spike (`forecasting-010`) as evidence.
- [ ] ADR specifies the threading boundary: which compute runs on
      worker, what serialization format crosses the boundary, who
      owns the cache (main-thread cache, worker-thread cache, or
      shared-mem) and why.
- [ ] ADR specifies the CSV-import suspend/release contract: API
      shape (`beginBatch()` / `endBatch()` or equivalent), guarantees
      (no recompute until `endBatch`; one recompute fired after), and
      failure mode (what if `endBatch` is never called).
- [ ] ADR specifies the user-visible behavior in three scenarios:
      (a) editing starting balance — what does the user see and when;
      (b) marking a contract paid — same; (c) importing a 5k-row CSV
      — same. Each scenario answers "what happens at t=0, t=200ms,
      t=after-recompute".
- [ ] ADR names the fallback to stale-with-banner: what threshold of
      measured compute time triggers adopting it, and what the UI
      indicator looks like (text, position, color).
- [ ] ADR notes the cross-context contract: Cash Inflow, Cash Outflow,
      and Tax Obligations each expose a coarse-grained "changed"
      signal that Forecasting subscribes to. (See cross-context
      implications below.)

## Cross-context implications

This decision **requires a thin contract from each upstream BC**:

- **Cash Inflow**, **Cash Outflow**, **Tax Obligations** each need to
  expose a coarse-grained change-notification signal — one signal per
  BC is sufficient for v1. No payload required; the signal just tells
  Forecasting "your cached projection is stale, recompute".
- **Starting balance** lives in Forecasting itself (`forecasting-005`),
  so its change-notification is internal and not a cross-context
  contract.
- The signal can be implemented as a domain event, an observable, or a
  pub/sub channel — the *shape* (one signal per BC, fire-and-forget,
  no payload, idempotent) is the contract; the *mechanism* is an
  implementation detail of the host process.
- This must be reflected in each upstream BC's tactical model. Tasks
  to track this — one per BC — should be created when those BCs are
  refined; flagging here for the orchestrator/owner.

No write-back is implied — Forecasting remains a pure customer per
the context map.

## Sub-tasks created

- `forecasting-010-recompute-cost-spike` — measurement spike to
  validate the debounce window and the eager-vs-stale-with-banner
  threshold empirically. `forecasting-002` now `depends_on` this
  spike.

## Notes

### Considerations

- This is a single-user local tool. Recompute cost is bounded by the
  user's data volume, not by concurrent load. Likely cheap enough that
  eager wins on simplicity — confirmed-pending the spike.
- Sankey aggregation has its own cost and its own window
  (`forecasting-003`); the recommendation explicitly decouples its
  trigger from the zero-day projection's.
- The projection engine (`forecasting-007`) is already specified as
  pure given a snapshot. That property is what makes worker-threading
  and snapshot-keyed caching trivial. Preserve it.
- "Per-output-different (zero-day vs Sankey)" was missing from the
  original three-option framing; "worker-thread vs main-thread" was
  also missing. Both are now first-class axes in the decision space.

### Related open question in README

> Recompute on every input change vs batch / on demand?
