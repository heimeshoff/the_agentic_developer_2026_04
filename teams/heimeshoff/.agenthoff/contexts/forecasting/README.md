# Forecasting

## Purpose

Computes the two zero-money-day projections (pessimistic and optimistic) at
user-selected horizons. Aggregates data across Cash Inflow, Cash Outflow, and
Tax Obligations together with the user-maintained starting balance. Drives
both the zero-day number and the Sankey diagram.

## Classification

Core.

## Ubiquitous language

- **Starting balance** — user-maintained current bank balance; the seed for
  projection math.
- **Horizon** — selected projection window: rolling 12 months / EOY / until-zero.
- **Pessimistic projection** — runway computed using paid income only (plus all
  known expenses).
- **Optimistic projection** — runway including contracted-but-unpaid income at
  expected dates.
- **Zero-money day** — date at which the projected balance reaches zero;
  computed for both scenarios.
- **Runway** — number of days/weeks/months between today and the zero-money day.
- **Sankey** — flow visualization of money in vs money out, by hierarchical
  category.

## Open questions

- Recompute on every input change vs batch / on demand?
- Sankey window: fixed past 12 months, or driven by selected horizon?
- How are tax reconciliation events folded into projections — as a known
  future income/expense once the year is closing, or always estimated?
