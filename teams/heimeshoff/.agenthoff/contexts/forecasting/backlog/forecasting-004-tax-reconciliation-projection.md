---
id: forecasting-004
title: Tax reconciliation handling in projections
status: backlog
type: decision
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: [tax-obligations-002]
blocks: [forecasting-007, forecasting-008]
tags: [taxes, projection-engine, cross-context]
---

## Why

Tax Obligations has two distinct cashflow events:

- **Quarterly prepayments** — known dates, known amounts (set externally by
  the finance department), straightforward to project.
- **Annual reconciliation** — a refund or shortfall set by external
  assessment, often only known after year-end. Real impact on runway: a
  shortfall can dominate a quarter; a refund can extend the zero-money day
  by weeks.

How Forecasting represents this gap during the year is a domain decision,
not an implementation detail. Settling it now unblocks `forecasting-007`
(pessimistic engine) and `forecasting-008` (optimistic engine) — both
need a definite rule for "what does tax reconciliation contribute to the
trajectory?"

## What

### Decision space (validated and extended)

Original three options reviewed:

1. **Estimated always** — engine produces a heuristic estimate (prior-year
   reconciliation, or net-income × rate) and applies it at the expected
   reconciliation date. User can override. **Rejected** — see rationale.
2. **Known-only** — engine projects nothing for reconciliation until a
   value exists in Tax Obligations. Once entered, it appears as a known
   future inflow/outflow on its date.
3. **Estimated when year is closing** — no estimate during most of the
   year; once within N months of year-end, engine surfaces an estimate or
   prompts the user. **Rejected** — see rationale.

**Missed option, now first-class:**

4. **User-entered estimate with explicit `estimated: true` flag** — the
   tool itself never invents a reconciliation amount, but the user can
   record an *estimated* reconciliation in Tax Obligations. The
   projection treats it as a known cashflow on its date; the Dashboard
   badges it visibly as "estimate" so it isn't mistaken for a confirmed
   value. The user can replace the estimate with the real assessment at
   any time (one transition: `estimated → confirmed`).

Options 2 and 4 are not exclusive: 2 is the default state (no
reconciliation in the projection); 4 is the user's escape hatch when
they want to stress-test runway against an expected shortfall.

### Decision: option 2 + option 4 (committed)

**Forecasting includes a reconciliation in projections only if Tax
Obligations holds a corresponding record. The record may be either
`confirmed` (real assessment) or `estimated: true` (user's own guess).
The engine treats both identically as a single cashflow step on the
record's date; the visual treatment differs only in the Dashboard.**

The engine itself never estimates. Tax Obligations never estimates. The
*user* may estimate, in which case the system records and surfaces it
as a user-owned estimate.

### Rationale

- **Vision symmetry.** Vision states "income is binary: contracted or
  paid" and "no probability scoring on income." The same principle
  generalizes to taxes: the tool shouldn't invent numbers it can't
  justify. An auto-estimate, however well-tuned, is exactly what the
  vision rules out for income.
- **Trust preservation.** The headline output is the zero-money day. If
  the engine silently shifts that date by a heuristic the user didn't
  supply, the headline becomes harder to trust. Known-only keeps the
  engine honest.
- **Reconciliation amount is genuinely unknowable.** It depends on full-
  year net income vs prepayments vs externally-set assessment changes —
  a forecast based on prior-year data is wrong in any year where income
  shape changes (which, for a contract-driven earner, is most years).
- **Stress-testing is a user concern, not an engine concern.** When the
  user wants "what if I owe €5k?", they enter that number themselves.
  The engine is unchanged; only the UI distinguishes the source.
- **Option 3 (estimate at year-end) requires picking a heuristic that
  will be wrong** and a threshold (N months) that's arbitrary. It also
  splits behavior across the year, which complicates testing and
  documentation. The user-entered-estimate path subsumes the legitimate
  use case (late-year planning) without the cost.
- **No new domain primitive.** Reconciliation already exists in Tax
  Obligations. Adding a flag (`estimated: bool`) is cheaper than adding
  a heuristic engine.

### Pessimistic vs optimistic — settled

**Reconciliation affects both projections equally.**

The pessimistic-vs-optimistic axis is *exclusively* about contracted
income. It is not a "certain vs uncertain" axis. Subscriptions, variable
categories, and tax prepayments all appear in both projections — they
are known/scheduled cashflows, not contingent ones. A reconciliation
record (whether confirmed or user-flagged-estimate) is in the same
category: once it exists in Tax Obligations, it's a known cashflow on
a known date, so it belongs in both projections.

Rule of thumb for future ambiguity: if the cashflow's existence depends
on a contract being honored, it's optimistic-only. Otherwise it's in
both.

### Dashboard / UX treatment

- A confirmed reconciliation renders identically to a tax prepayment
  (no special badge).
- A reconciliation with `estimated: true` renders with a visible "est."
  badge wherever the figure appears in the projection breakdown, and
  the Dashboard shows a small footnote on the zero-money-day card:
  *"Includes user-entered tax reconciliation estimate of €X on
  YYYY-MM-DD."*
- The badge color/text spec is deferred to the Dashboard task; the
  ADR records only the *requirement* that the user can never confuse
  estimated for confirmed.

## Acceptance criteria

- [ ] ADR in `.agenthoff/knowledge/decisions/` recording option 2 + 4 as
      the committed choice and the rationale above.
- [ ] ADR explicitly states reconciliation affects **both** projections
      (pessimistic and optimistic) and explains why
      pessimistic-vs-optimistic is the contracted-income axis only.
- [ ] ADR specifies the engine rule: "iterate over reconciliation
      records exposed by Tax Obligations; treat each as a single
      cashflow step on its date, signed (refund positive, shortfall
      negative); ignore the `estimated` flag for arithmetic; surface
      the flag for downstream UI rendering."
- [ ] ADR specifies the Dashboard rule: any cashflow step originating
      from a reconciliation with `estimated: true` is visibly marked as
      an estimate in any breakdown view, and the zero-money-day card
      footnotes the inclusion when at least one estimated reconciliation
      is in the horizon.
- [ ] ADR cross-references `tax-obligations-002` (the read-model task)
      as the upstream contract this decision depends on.
- [ ] ADR notes the explicit non-goal: the engine itself does not
      synthesize a reconciliation amount under any circumstances, even
      at year-end.
- [ ] ADR cross-references `forecasting-007` and `forecasting-008` as
      the consumers of this rule.

## Cross-context implications

This decision requires Tax Obligations to expose a reconciliation
read-model that is **richer than what `tax-obligations-001-changed-signal`
implies**. The change-signal is payload-free; the projection engine
needs actual reconciliation records to iterate over.

Specifically, Tax Obligations must expose, per reconciliation record:

- `tax_year` (which accounting period it belongs to)
- `amount` (signed: positive = refund / inflow, negative = shortfall /
  outflow)
- `date` (the cashflow date — when the refund lands or the shortfall is
  due)
- `estimated: bool` (true if user-entered guess, false if confirmed
  assessment)
- `created_at` / `updated_at` (for cache invalidation if needed)

This is **new** with respect to `tax-obligations-001`. A new task is
filed: `tax-obligations-002-reconciliation-read-model.md`. This task's
`depends_on` is updated to point at it.

No write-back from Forecasting is implied — Forecasting remains a pure
customer per the context map.

## Notes

### Why this isn't an open question anymore

The README open question — *"How are tax reconciliation events folded
into projections — as a known future income/expense once the year is
closing, or always estimated?"* — is now answered: **as a known
record, never auto-estimated; the user may flag a record as their own
estimate, and the tool surfaces that flag visibly.**

The Forecasting README should be updated to reflect this when the ADR
lands.

### Interaction with `forecasting-002` recompute strategy

A reconciliation entry (estimated or confirmed) flows through the same
`tax-obligations.changed` signal already specified in
`tax-obligations-001`. The recompute strategy decided in
`forecasting-002` (eager-with-debounce) handles it without modification
— a reconciliation edit is just one more "tax obligations changed"
event. No new triggers.

### Interaction with overdue reconciliations

Open detail for the worker: if a reconciliation's date passes and it's
still flagged `estimated`, does the engine still include it in the
projection? Suggested convention (to confirm in the ADR): yes, as long
as the date is within the horizon, regardless of whether it has passed.
The user owns the value; the engine doesn't second-guess the date.
Different from the contracted-income overdue rule because reconciliations
have no "expected payment from a counterparty" semantics.
