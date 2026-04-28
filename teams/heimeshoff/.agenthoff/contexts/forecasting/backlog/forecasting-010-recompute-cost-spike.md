---
id: forecasting-010
title: Spike — measure recompute cost at realistic data volume
status: backlog
type: spike
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: []
blocks: [forecasting-002]
tags: [spike, performance, projection-engine, measurement]
---

## Why

`forecasting-002` recommends eager-with-debounce as the recompute
trigger and reserves stale-with-banner as a fallback. Both the
debounce window (~150–300ms) and the threshold for adopting the
fallback depend on **how expensive a full recompute actually is** at
realistic data volumes.

That number is not knowable from first principles — it's a function
of the projection engine's step granularity, the user's data shape,
and the host runtime. A short, timeboxed measurement settles it
empirically before the ADR commits.

## What

A throwaway measurement spike. Build the cheapest possible
implementation of the pessimistic projection (`forecasting-007`'s
shape, minus production polish) plus the Sankey aggregation
(`forecasting-009`'s shape, minus polish). Run on synthetic data
across three volumes and record wall-clock time on a representative
Windows 11 machine.

### Synthetic data shapes

Three datasets, each generated deterministically from a seed:

1. **Small** — 1 year of history, ~1.5k transactions, ~30
   subscriptions, 4 contracts (2 paid + 2 contracted), 4
   prepayments, 1 reconciliation.
2. **Medium** — 3 years of history, ~7.5k transactions, ~50
   subscriptions, 12 contracts, 12 prepayments, 3 reconciliations.
3. **Large** — 5 years of history, ~15k transactions, ~80
   subscriptions, 24 contracts, 20 prepayments, 5 reconciliations.

### Measurements

For each dataset, record:

- Pessimistic projection wall-clock (ms), median of 10 runs after
  warmup.
- Sankey aggregation wall-clock (ms), median of 10 runs after
  warmup.
- Combined wall-clock if computed sequentially.
- Memory footprint of the snapshot input (rough order, not
  precise).

### Reported decisions

The spike's deliverable is a **short note** (in `.agenthoff/knowledge/`,
not a separate doc) that answers:

1. Is medium-dataset recompute under 100ms? (If yes: eager-with-debounce
   is cheap. Set debounce ~150ms.)
2. Is large-dataset recompute under 500ms? (If yes: eager still wins;
   stale-with-banner stays as theoretical fallback. If no: adopt
   stale-with-banner now.)
3. Does worker-thread serialization overhead dominate the win? (Cheap
   to test: run the same compute on main thread vs worker, compare.)

## Acceptance criteria

- [ ] A throwaway script (any language matching the eventual stack —
      probably TS/JS given Prompt 0's React + Tailwind) generates the
      three synthetic datasets deterministically from a seed.
- [ ] The script computes the pessimistic projection and Sankey
      aggregation against each dataset and prints wall-clock per
      run + median over 10 warmup-excluded runs.
- [ ] The script runs both main-thread and worker-thread variants
      for the medium dataset and reports the delta.
- [ ] A short note (~half a page) in `.agenthoff/knowledge/` records
      the numbers, the machine they were measured on, and a one-line
      verdict per question above.
- [ ] `forecasting-002` is updated with the chosen debounce window
      and the chosen primary path (eager-with-debounce vs
      stale-with-banner) before its ADR is written.

## Notes

- This is a spike: production quality is **not** the goal. Hard-coded
  data, no tests, no error handling, throwaway code. Delete after.
- Use the actual projection engine sketch from `forecasting-007` as
  the algorithm — close enough that the measurement transfers. Any
  optimization later (memoization, incremental recompute) only makes
  the real engine faster than the spike.
- Timebox: half a day. If it overruns, the spike is wrong; rescope.
- The spike's note lives in `.agenthoff/knowledge/` (not in
  `decisions/`) because it's evidence, not a decision. The ADR
  written when `forecasting-002` is worked cites the note.
