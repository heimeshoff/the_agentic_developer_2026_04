# Cash Outflow

## Purpose

Tracks expenses imported from bank CSV and classifies them into a user-defined
hierarchical category tree. Hosts the categorization workflow: rule-based
auto-detection, learning from first manual classification, manual override
always available on any row.

## Classification

Supporting.

## Ubiquitous language

- **Transaction** — a single row from the bank CSV.
- **Subscription** — recurring fixed expense with known amount and cadence
  (rent, software).
- **Variable category** — expense category projected forward as an average of
  past spending in that category (groceries, fuel).
- **Category** — hierarchical tag applied to transactions; categories have parents.
- **Categorization rule** — auto-assignment from a learned or user-defined pattern.

## Open questions

- Specific bank CSV format(s) supported in v1.
- Sensitivity of "learning" — exact match on description, or fuzzy?
- Splitting a single transaction across multiple categories?
