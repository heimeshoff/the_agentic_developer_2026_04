---
id: 0002
title: Binary income states — no probability scoring, no lead pipeline
status: accepted
date: 2026-04-25
scope: global
---

# Binary income states — no probability scoring, no lead pipeline

## Context

The owner has bursty, contract-driven income. Off-the-shelf tools and CRMs
typically model income through a probabilistic pipeline (lead → qualified →
proposed → won, with percentage weights). The owner explicitly rejected that
model: leads and close-rates are out of scope.

## Decision

Income has exactly two states:

1. **Contracted** — a signed contract with an expected payment date, not yet paid.
2. **Paid** — money received, visible in the bank CSV.

There is no probability percentage, no lead funnel, no "verbal yes" intermediate
state. A contract is binary: it is either contracted or paid (or eventually,
overdue / cancelled — to be decided).

## Consequences

- The two zero-day projections are clean: pessimistic uses paid only, optimistic
  uses paid + contracted. No weighted in-between.
- Data entry stays minimal — the user records a contract once when signed.
- Contracts that fall through must be cancelled explicitly; there is no
  graceful "this lead is going cold" transition.
- The tool is unsuitable as a sales/CRM tool, and that is intentional.
