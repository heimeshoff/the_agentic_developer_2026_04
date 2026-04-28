# Context map

## Contexts

### Cash Inflow

- **Purpose:** Tracks income in two states — *contracted* (signed but unpaid) and
  *paid*. Owns the lifecycle from contract signing through payment receipt.
- **Core language:** contract, contracted income, paid income, expected payment date.
- **Classification:** core — the contracted-vs-paid distinction is the unique
  thing this tool models that off-the-shelf tools don't.
- **Key actors:** user (records contracts, marks them paid; possibly reconciled
  against CSV-detected income rows).

### Cash Outflow

- **Purpose:** Tracks expenses imported from CSV and classifies them into a
  hierarchical category tree. Hosts the categorization workflow itself: rule-based
  auto-detection, learning from first manual classification, manual override
  always available.
- **Core language:** transaction, subscription, variable category, hierarchical
  category, categorization rule, manual override.
- **Classification:** supporting — the value here is correctness and low friction,
  not competitive distinctiveness.
- **Key actors:** user (imports CSV, defines categories, corrects misclassifications).

### Tax Obligations

- **Purpose:** Models the user's tax regime: quarterly prepayments at amounts set
  by external assessment, plus an annual reconciliation event that can swing in
  either direction and that resets next year's prepayments.
- **Core language:** prepayment, assessment, reconciliation, refund, shortfall,
  tax year.
- **Classification:** core — has its own rhythm and feedback loop, distinct from
  ordinary expenses.
- **Key actors:** user (records prepayments and the reconciliation outcome);
  external finance department (sets prepayment amounts — modelled as input,
  not integrated).

### Forecasting

- **Purpose:** Computes the two zero-money-day projections (pessimistic, optimistic)
  at the user's selected horizon, fed by the other three contexts plus the
  user-maintained starting balance. Owns the Sankey aggregation.
- **Core language:** starting balance, horizon, projection, scenario, pessimistic,
  optimistic, zero-money day, runway.
- **Classification:** core — the headline output of the tool.
- **Key actors:** user (selects horizon, reads outputs).

## Relationships

- **Forecasting is downstream of Cash Inflow, Cash Outflow, and Tax Obligations**
  — *customer-supplier*, with Forecasting as customer. The three upstream contexts
  publish read-ready data; Forecasting reads to compute projections and writes
  nothing back.

- **Cash Inflow, Cash Outflow, and Tax Obligations are largely independent of
  one another** — *separate ways*. They share no language and have no operational
  coupling inside the system. The conceptual link between this year's net income
  and next year's tax prepayment is real but performed externally (by the finance
  department); only the resulting prepayment number flows in. So Tax Obligations
  is not directly coupled to Cash Inflow within the tool.

- **The Sankey visualization spans all four contexts** but lives operationally
  inside Forecasting, as a derived view of the projected and historical flows.
