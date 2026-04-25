# Cash Inflow

## Purpose

Tracks income in two states: *contracted* (signed but unpaid) and *paid*. Owns
the lifecycle from contract signing through payment receipt.

## Classification

Core.

## Ubiquitous language

- **Contract** — agreement with a customer that creates expected income.
- **Contracted income** — money expected from a contract, not yet received;
  has an expected payment date.
- **Paid income** — money received and present in the bank CSV.
- **Expected payment date** — when the contracted income is anticipated to land.

## Open questions

- Behaviour when the expected date passes without payment (auto-overdue? drop
  from optimistic? user-decided?).
- Reconciliation between CSV-detected income rows and manually-tracked contracts —
  does the tool match them, or does the user mark contracts paid by hand?
