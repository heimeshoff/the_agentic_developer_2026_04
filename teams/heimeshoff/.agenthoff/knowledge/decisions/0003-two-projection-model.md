---
id: 0003
title: Two-projection model — pessimistic vs optimistic differ only on contracted income
status: accepted
date: 2026-04-25
scope: global
---

# Two-projection model — pessimistic vs optimistic differ only on contracted income

## Context

The signature output of the tool is the zero-money day: the projected date the
balance reaches zero. Honesty about cash flow requires distinguishing between
money the user definitely has and money the user *expects* but hasn't received.

## Decision

The tool always computes two projections in parallel:

- **Pessimistic** — paid income only, against all known and averaged expenses
  (subscriptions, taxes, variable categories).
- **Optimistic** — same as pessimistic, plus contracted-but-unpaid income at
  expected dates.

Both projections share the same expense model. The only difference is which
income enters the calculation. Both are presented at the same time; the user
sees both zero-money days side by side.

## Consequences

- The gap between the two dates is itself a meaningful signal — wide gap means
  the user is highly dependent on contracted income arriving on time.
- The math is symmetric and easy to reason about.
- Refactoring the projection engine to add a third scenario later is cheap, but
  is not on the v1 roadmap.
- Probabilistic / weighted projections are explicitly excluded (see ADR 0002).
