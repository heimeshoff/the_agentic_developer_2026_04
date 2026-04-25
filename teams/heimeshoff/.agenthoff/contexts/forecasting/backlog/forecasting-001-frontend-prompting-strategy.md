---
id: forecasting-001
title: Frontend prompting strategy for claude.ai/design
status: backlog
type: decision
context: forecasting
created: 2026-04-25
completed:
commit:
depends_on: []
blocks: []
tags: [frontend, design-tool, prompting, cross-cutting]
---

## Why

Before any UI is generated, the project needs a settled strategy for how to
prompt claude.ai/design so that the four bounded contexts produce a coherent
single application rather than four disjoint screens.

The risk this avoids: generating each BC's UI in isolation and ending up with
mismatched design systems, drifting terminology, or a Dashboard that loses the
"Sankey co-equal with zero-money day" headline shape.

This is filed under Forecasting because the Dashboard (Forecasting BC) is the
headline view, but the decision is cross-cutting and shapes the prompts used
for Cash Inflow, Cash Outflow, and Tax Obligations as well.

## What

Adopt a five-prompt strategy for claude.ai/design:

1. **Prompt 0 — Design system + shell.** Establishes stack, tone, navigation,
   ubiquitous-language rules. Builds shell + Dashboard placeholder only.
2. **Prompt 1 — Dashboard (Forecasting).** Horizon selector, dual zero-money-day
   cards, Sankey, inline starting-balance.
3. **Prompt 2 — Income (Cash Inflow).** Contracted income table with
   mark-paid action; paid income read-only list; overdue handling.
4. **Prompt 3 — Expenses (Cash Outflow).** Hierarchical category tree, CSV
   import, inline classifier with rule-creation, subscription flag.
5. **Prompt 4 — Taxes (Tax Obligations).** Quarterly prepayment schedule and
   annual reconciliation log.

Each prompt extends the design system established by Prompt 0 rather than
re-establishing one.

## Acceptance criteria

- [ ] ADR written in `.agenthoff/knowledge/decisions/` capturing the strategy,
      the rationale (one prompt per BC, design system first), and the four
      verbatim prompts.
- [ ] ADR explicitly notes the rule "do not enumerate non-goals to the design
      tool" (it tends to generate disabled tabs for them).
- [ ] ADR notes that ubiquitous-language terms (contracted income, paid
      income, variable category, subscription, tax obligation, zero-money day,
      pessimistic/optimistic projection, horizon) must appear unchanged in
      generated UI labels.
- [ ] At least one prompt is run end-to-end through claude.ai/design and the
      result is sanity-checked against the prompt; observations folded back
      into the ADR (so the strategy is validated, not just theorized).
- [ ] If validation reveals a prompt needs revision, the ADR records the
      revision and why.

## Notes

### Open questions before this is ready to work

- Should Prompts 1–4 reference the Prompt 0 output by URL/screenshot, or
  re-state the constraints in plain text? (claude.ai/design's ability to carry
  state across prompts in the same project should be confirmed.)
- Do we want a sixth prompt for the CSV-import wizard as its own flow, or is
  it small enough to live inside Prompt 3?
- The Sankey is treated as a first-class component in Prompt 1. Some Sankey
  libraries don't render well in claude.ai/design's preview — fallback?

### Verbatim draft prompts

These are the prompts as drafted during capture. They go into the ADR body
when this task is worked.

#### Prompt 0 — Design system + shell

```
Build a local-only desktop budgeting app for a single user on Windows 11.
Web stack (React + Tailwind), no auth, no signup, no collaboration.
The app opens straight to a dashboard.

Tone: calm, financial, low-decoration. Information-dense but not busy.
Think: monospace for numbers, generous whitespace around the headline
numbers, muted palette, one accent color reserved for the zero-money-day
date.

Top-level navigation, left rail, four sections in this order:
  Dashboard, Income, Expenses, Taxes
The user is contract-driven: income is bursty, expenses are mixed
fixed/variable, taxes have their own rhythm. Keep the language exact:
"contracted income" (not "expected"), "paid income" (not "received"),
"variable category", "subscription", "tax obligation", "zero-money day".

Build only the shell + Dashboard for now (next prompts will fill the
other sections).
```

#### Prompt 1 — Dashboard (Forecasting BC)

```
Dashboard contents, in order, top to bottom:

1. Horizon selector — segmented control: "Rolling 12 months" /
   "End of year" / "Until zero". Persists. Drives every number on the page.

2. Two zero-money-day cards, side by side, equal weight:
   - Pessimistic (paid income only) — date + days from today
   - Optimistic (paid + contracted) — date + days from today
   Show the delta between them as a small label between the cards.
   If "until zero" can't be computed (positive runway forever in horizon),
   say "Beyond horizon" with the projected end balance instead of a date.

3. Sankey diagram, full width — money flowing from income sources
   (left) through hierarchical category parents into leaf categories
   (right). Co-equal in importance to the zero-day cards. Hover a node:
   amount + % of total. Click a leaf: drill into the Expenses tab
   pre-filtered to that category.

4. Starting balance — small, editable inline at the top-right of the
   page header. This is the seed of all projection math.

No charts other than the Sankey on the dashboard. No goals, no targets,
no progress bars.
```

#### Prompt 2 — Income (Cash Inflow BC)

```
Income page. Two stacked sections:

1. Contracted income — table of contracts:
   columns: customer, amount, expected payment date, status
   (contracted | overdue | paid). Row action: "Mark paid" — sets
   status=paid and a paid-on date.
   Empty state: "No contracts yet." + button "Add contract".

2. Paid income — read-only list of income rows detected from imported
   CSV. Columns: date, amount, source, matched-contract (if any).

A contract that passes its expected date without being marked paid
is shown as "overdue" with a warning chip and is excluded from the
optimistic projection until resolved.

Add-contract form: customer, amount, expected payment date, optional note.
```

#### Prompt 3 — Expenses (Cash Outflow BC)

```
Expenses page. Layout:

Left pane: hierarchical category tree, editable inline (rename,
add child, drag to reparent). Each node shows last-12-months total
in muted text.

Right pane: transactions table, filterable by category, date range,
and "uncategorized only". Columns: date, description, amount,
category, source. Bulk-select + "Apply category" action.

Above the table: CSV import button. After import, the first
unclassified transaction opens an inline classifier: pick a category,
optional checkbox "Apply to similar in future" (this creates a
categorization rule). Subsequent imports auto-categorize via rules;
user can always override.

Subscriptions are a flag on a transaction or rule, not a separate
entity — surface them in the table with a small recurring icon.
```

#### Prompt 4 — Taxes (Tax Obligations BC)

```
Taxes page. Two sections:

1. Prepayments — quarterly schedule for the current tax year. Each
   row: due date, amount (set externally — user-entered), status
   (upcoming | paid). User edits amounts when finance department
   sends a new assessment.

2. Annual reconciliation — single row per closed tax year:
   year, reconciliation result (refund or shortfall, signed amount),
   date entered. New year creates an empty next row when the user
   enters last year's outcome.

Above both: a small note that prepayments and reconciliations are
modelled as user-entered facts; no integration with any tax authority.
```

### Rationale notes for the ADR

- One prompt per BC keeps each screen's ubiquitous language clean — the
  design tool reflects words back into labels.
- Prompt 0 first prevents four disjoint design systems.
- Dashboard prompt restates the Sankey/zero-day equality explicitly because
  it's the easiest headline to lose to under-specification.
- Non-goals are deliberately omitted from prompts; mentioning them tends to
  produce disabled-but-present UI surfaces for them.
