# Vision: Personal Cashflow Tool

> Working title — rename freely.

## Purpose

A local, single-user budgeting and cashflow-projection tool for someone with bursty,
contract-driven income. It ingests bank CSV exports, classifies transactions into a
user-defined hierarchical category tree, and projects forward to answer two questions:

1. *Where is my money bleeding that I didn't notice?*
2. *How long will my money last?*

The signature output is the **zero-money day** — the date on which the projected
balance hits zero — computed under two scenarios (paid-only vs paid-plus-contracted)
at a user-selected time horizon. The Sankey diagram of money flowing through the
hierarchical categories is co-equal with the zero-day number as the headline view.

## Users

A single user (the owner) running it on a personal Windows 11 machine. No
collaborators, no advisors, no external integrations. The user is a contract-based
earner whose income arrives unevenly and whose expenses split between fixed
subscriptions, averaged variable spending, and a tax regime with its own rhythm.

## The problem

Bursty income plus uneven expenses produces a chronic background sense of "am I OK?"
that off-the-shelf budgeting tools don't answer well. They assume steady paychecks
and steady spending, and they tend to confuse *probable* income (leads, deals in
pipeline) with *contracted* income, which makes their projections fantasy. The user
wants:

- A clear view of where money is going, so leaks become visible.
- A clear date for when it runs out, so decisions about taking on work or cutting
  cost can be made with a number rather than a feeling.

## What success looks like

v1 is worth shipping when:

- After importing a CSV and entering subscriptions, taxes, and current contracts,
  the Sankey reveals at least one leak the user didn't know about.
- The two zero-day dates (pessimistic and optimistic) are visible and trustworthy —
  changing the input data updates them immediately.
- The user can switch the projection lens between rolling 12 months / EOY / "until
  the balance hits zero" without re-entering anything.
- Recurring transactions auto-categorize after their first manual classification.
- The tool is opened by choice, not by necessity — i.e. it's not painful to use.

## Non-goals

- ❌ No lead or sales-pipeline tracking — only confirmed contracts count as
  potential income.
- ❌ No probability scoring on income — income is binary: contracted or paid.
- ❌ No multi-user features, no cloud sync, no telemetry. Local-only; data stays
  on disk on the user's machine.
- ❌ No investment or asset tracking. This is cashflow, not net worth.
- ❌ No goal-based saving ("save €X by date Y"). The tool reports runway; it
  doesn't set targets.
- ❌ No debt-amortisation engine. Loans appear as recurring expenses if they show
  up in the CSV; the tool does not model the loan itself.
- ❌ No mobile companion, no notifications, no scheduled emails. The user opens
  the tool when they want to look.

## Ubiquitous language (seed)

- **Paid income** — money already received and present in the CSV.
- **Contracted income** — confirmed contract with an expected payment date, not
  yet paid. Counts only in the optimistic projection.
- **Subscription** — recurring fixed expense (rent, software, etc.). Known
  amount, known cadence.
- **Variable category** — expense type whose future is projected as an average
  of past spending in that category (groceries, fuel).
- **Tax obligation** — quarterly prepayment plus annual reconciliation. Distinct
  from subscriptions because the amount is set externally and updates yearly.
- **Category** — a hierarchical tag applied to transactions; categories have parents.
- **Categorization rule** — auto-assignment of a category, often inferred from a
  prior manual tagging of similar transactions.
- **Starting balance** — user-maintained current bank balance; the seed of all
  projection math.
- **Horizon** — selected projection window: rolling 12 months, end of calendar
  year, or until-zero.
- **Pessimistic projection** — projection using paid income only.
- **Optimistic projection** — projection including contracted-but-unpaid income.
- **Zero-money day** — the date at which the projected balance reaches zero,
  computed for both scenarios.

## Open questions

- How are bank CSVs structured (columns, encoding, date formats)? Different banks
  have different schemas — does v1 support one bank or several?
- What happens when a contracted income passes its expected date without being
  paid? Auto-flag as overdue, drop from optimistic, user-decided?
- For the annual tax reconciliation event — is the result entered manually once
  a year, or does the tool need to model it natively?
- Sankey input window: does it sum over the chosen horizon, or always over a
  fixed past window (e.g. last 12 months actual)?
