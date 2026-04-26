---
id: forecasting-005
title: Starting balance — seed of projection math
status: backlog
type: feature
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: [forecasting-011]
blocks: [forecasting-007]
tags: [domain-core, projection-input]
---

## Why

Every projection starts from the user's current bank balance. Without a
trustworthy seed, the zero-money-day number is meaningless. Vision and the
Dashboard prompt both treat starting balance as a first-class, inline-editable
value at the top of the headline view.

This is the simplest piece of state in Forecasting and the one every other
projection task depends on, so it's worth having explicit and isolated.

## What

A single mutable value owned by Forecasting:

- A monetary amount in the user's currency.
- A timestamp recording when it was last set / edited (so the user can see
  "as of when").
- Persisted locally; survives app restart.

Editable inline from the Dashboard header (per the Prompt 1 sketch in
`forecasting-001`). No history view in v1 — only the current value matters
for the projection seed.

## Acceptance criteria

- [ ] Starting balance is stored in SQLite (per `forecasting-011`) as a
      single-row `starting_balance` table with columns `(amount_cents
      INTEGER NOT NULL, updated_at TEXT NOT NULL ISO-8601, currency TEXT
      NOT NULL DEFAULT 'EUR')`. Survives app restart.
- [ ] Value can be edited from the Dashboard; edit fires the
      `starting-balance.changed` internal signal which feeds the recompute
      scheduler from `forecasting-002`.
- [ ] The "as of" timestamp (`updated_at`) updates on each edit and is
      visible inline next to the value (e.g. "as of 26 Apr 2026, 14:23").
- [ ] Monetary representation is **integer minor units** (cents): a value
      of 1234567 displays as "12,345.67". Banker's rounding for any display
      conversions. Same convention propagates to Cash Inflow / Cash Outflow
      / Tax Obligations — captured as a project-wide convention in this
      task's ADR-of-record (notes section), not duplicated elsewhere.
- [ ] No currency-conversion logic in v1; `currency` column exists for
      future-proofing but is treated as constant ("EUR" default; user can
      change it once at setup).
- [ ] Empty / unset starting balance is represented as the absence of any
      row in `starting_balance`. Projection compute checks for this and
      surfaces a "set your starting balance" prompt rather than a
      misleading €0.00.
- [ ] Edit is optimistic-UI: the value updates instantly, the recompute
      runs in the background per `forecasting-002`'s scheduler.

## Notes

### Resolved decisions

- **Auto-rebase on CSV import:** **NOT in v1.** A rebase prompt would
  introduce ambiguity about which value is canonical (the user-set seed
  vs the CSV-derived running total). The user can manually edit the seed
  any time, which is sufficient. Revisit if v2 user feedback demands it.
- **Decimal precision:** Integer minor units stored, two-decimal display,
  banker's rounding. This is now the project-wide convention (see ACs).

### Cross-BC

The starting balance is canonical to Forecasting and read by the projection
engine; no other BC reads or writes it. The integer-cents convention this
task pins down is a project-wide monetary representation rule that
upstream BCs are expected to follow.
