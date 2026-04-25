# Tax Obligations

## Purpose

Models the user's tax regime: quarterly tax prepayments at amounts set by
external assessment, plus an annual reconciliation event that produces either
a refund or a shortfall and resets next year's prepayment amounts.

## Classification

Core.

## Ubiquitous language

- **Prepayment** — quarterly fixed-amount tax payment.
- **Assessment** — externally-issued statement (from the finance department) that
  sets the prepayment amount.
- **Reconciliation** — annual event producing a refund (income) or shortfall
  (expense).
- **Tax year** — accounting period within which prepayments and reconciliation
  belong.

## Open questions

- How is reconciliation entered — manually as a single event, or modelled as a
  computation the tool performs?
- How is the assessment amount captured — fixed entry by the user, or
  rule-driven from prior years?
- How are tax-year boundaries handled when projecting across them?
