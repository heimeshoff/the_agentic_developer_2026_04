---
id: forecasting-003
title: Sankey aggregation window — past-fixed vs horizon-driven
status: backlog
type: decision
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: []
blocks: [forecasting-009]
tags: [sankey, visualization, aggregation]
---

## Why

The Sankey is co-equal with the zero-money-day number as the headline output.
Whether it summarizes a fixed past window, moves with the user's horizon
selection, or carries its own window control changes its meaning entirely
and changes what data shape `forecasting-009` has to produce.

This task commits to a path at refinement so that `forecasting-009`
(aggregation) and `forecasting-001` (Dashboard prompt) can refine against a
known choice. The ADR is still written when the task is worked; this body
records the commit and the reasoning so the ADR is a transcription, not a
re-litigation.

The diagnostic-vs-predictive question matters because:

- A past-fixed Sankey answers *"where has my money been going"* — diagnostic,
  unambiguous, every flow is a real categorized transaction the user can
  click into.
- A horizon-driven Sankey answers *"where will money flow under this
  projection"* — predictive, but conflates real categorized rows with
  synthesized "projected groceries" / "projected fuel" flows derived from
  category averages. Click-through and "uncategorized" lose their meaning.
- A split-mode Sankey defers the question to the user, adding a control to
  a Dashboard whose tone is explicitly "calm, low-decoration."

Without a settled answer the diagram is ambiguous and the user can't trust it.

## What

### Decision space (refined)

The original three options stand. A fourth was considered and surfaced for
completeness but is not the pick:

1. **Past-fixed (trailing 12 months, paid-only).** Sankey always shows a
   fixed past window of *actual* paid income vs categorized expenses vs
   tax outflows. Independent of the horizon selector and of the
   pessimistic/optimistic scenario.
2. **Horizon-driven.** Sankey aggregates over the same window the
   projection uses; switching horizon changes the Sankey too. Mixes
   actuals (past portion) with synthesized projection flows (future
   portion).
3. **Split-mode.** Sankey has its own window control independent of the
   horizon selector. User chooses what they want it to show.
4. **Past-fixed with user-selectable lookback** (6mo / 12mo / 24mo).
   Same semantics as Option 1 but adds a small lookback control. Surfaced
   for completeness; rejected as premature configurability.

### Committed pick: Option 1 — Past-fixed, trailing 12 months, paid-only

The Sankey shows actual flows over the trailing 12 calendar months ending
today, computed from paid income (Cash Inflow), categorized expenses
(Cash Outflow), and realized tax outflows (Tax Obligations). It does not
move with the horizon selector. It does not include contracted-but-unpaid
income. It does not include any projected expenses.

### Rationale (project-grounded)

- **Vision verb is past-tense.** "Leaks the user didn't notice" is
  retrospective. Leaks are visible only in real categorized transactions,
  not in synthesized projection flows.
- **`forecasting-002` already committed to it.** The Sankey cache key in
  that decision is `(sankey-window, paid-income-snapshot,
  outflow-snapshot, tax-snapshot)` — explicitly *no* `horizon`, *no*
  `scenario`, *no* `contracted-income-snapshot`. That cache shape is only
  coherent if the window is past-fixed and paid-only. Picking any other
  option here would force `forecasting-002` to be re-opened.
- **Categorization is a property of real transactions.** Cash Outflow's
  category tree, categorization rules, "uncategorized" leaf, and
  click-through-to-Expenses all describe historical rows. Projected
  expenses come from category averages — they're a function *over* the
  tree, not nodes *in* it. A horizon-driven Sankey would need synthetic
  edges with no real rows behind them; the click-through in
  `forecasting-001` Prompt 1 ("Click a leaf: drill into the Expenses tab
  pre-filtered") would have nothing to drill into.
- **Headline equality is preserved without coupling.** "Co-equal with
  zero-day" means *equal weight on the page*, not *moves in lockstep*.
  Zero-day answers "how long?" — predictive. Sankey answers "where from
  / where to?" — diagnostic. They are co-equal precisely because they
  answer different headline questions; coupling them would collapse two
  questions into one.
- **Tone constraint rules out split-mode.** Prompt 0 commits to "calm,
  financial, low-decoration" and Prompt 1 already carries a horizon
  selector, two zero-day cards, the Sankey, and an inline starting
  balance. Adding a second window selector to the headline is the
  opposite of calm.
- **Single-user local Windows 11 with contract-driven income** — the
  user's mental model already separates "what happened" (CSV ingest +
  categorization) from "what's coming" (contracts + projection).
  Past-fixed Sankey lines up with that mental model. Horizon-driven
  forces a hybrid mental model the rest of the tool doesn't reinforce.
- **No goals / no targets** (vision non-goal) — Sankey is reportage of
  fact, not progress against plan. Past-only fits.
- **Trailing 12 months specifically:** matches the category-tree
  "last-12-months total" already specified in `forecasting-001` Prompt 3
  (Expenses page shows each node's "last-12-months total in muted
  text"). Using the same window in two places means the Sankey leaf
  total and the tree-node muted total are the same number; using
  different windows would require explaining why.

### Until-zero horizon — explicit answer

When the user selects "Until zero" in the horizon selector, the Sankey
**stays fixed at trailing 12 months**. It does not extend to the
zero-day. It does not fall back to a shorter window. The horizon
selector only drives the zero-day cards; the Sankey is invariant under
horizon change.

### Empty / partial data

- If the user has fewer than 12 months of imported data, the Sankey shows
  whatever range exists (from earliest imported row to today) and the
  empty-state copy in `forecasting-009` adjusts accordingly.
- If no data exists at all, the Sankey shows the empty state defined in
  `forecasting-009`.

## Acceptance criteria

- [ ] ADR in `.agenthoff/knowledge/decisions/` recording the choice
      (Option 1, past-fixed, trailing 12 months, paid-only) and the
      rationale above.
- [ ] ADR records the three rejected options and the fourth surfaced
      option with one-line reason each was passed over.
- [ ] ADR explicitly states the data sources feeding the Sankey:
      - Cash Inflow: **paid income only** (no contracted).
      - Cash Outflow: **categorized expense rows** in the trailing 12
        months, plus the category hierarchy as of *now* (not as of when
        the row was originally categorized).
      - Tax Obligations: **realized prepayment outflows + reconciliation
        outflows/inflows** that fell inside the 12-month window.
- [ ] ADR confirms what happens under "Until zero" horizon: Sankey stays
      fixed at trailing 12 months; no extension, no fallback.
- [ ] ADR confirms the Sankey is invariant under both horizon change and
      pessimistic/optimistic scenario change. Only changes to the
      underlying paid-income / outflow / tax-outflow data, or the
      passage of time (rolling window), invalidate the Sankey cache.
- [ ] ADR specifies handling when imported data covers less than 12
      months: window shrinks to "earliest imported row → today", and
      this is reflected as a small note near the Sankey (defined by
      `forecasting-009` / `forecasting-001`).
- [ ] ADR records that the trailing-12-months window is shared with the
      Cash Outflow category-tree "last-12-months total" display
      (`forecasting-001` Prompt 3) — same window, same number.
- [ ] ADR notes that this decision is the reason the Sankey cache key
      in `forecasting-002` excludes `horizon`, `scenario`, and
      `contracted-income-snapshot`.

## Cross-task implications

This commit produces concrete answers for downstream refinement. They are
recorded here so `forecasting-009`'s refinement can cite them.

### For `forecasting-009` (Sankey aggregation by hierarchical category)

- **Window input is settled:** trailing 12 calendar months ending today,
  paid-only, no contracted income, no projected expenses. The window is
  not a parameter the aggregation accepts from the UI — it's a
  Forecasting-internal constant (recomputed daily as time advances).
- **Two of its three open questions collapse:**
  - *"Sankey-vs-projection sharing recompute trigger?"* — answered:
    independent (already settled in `forecasting-002`; this decision
    confirms the *reason*).
  - *"Income-side hierarchy: contracted included?"* — answered: **no**.
    Income side is paid-only, aggregated by source/customer.
- **One open question remains:** how tax flows are displayed (top-level
  "Taxes" node vs merged into category tree vs separate column).
  `forecasting-009`'s refinement needs to settle this. Past-fixed
  framing makes it slightly easier — tax outflows are real rows with
  real dates, so a top-level "Taxes" outflow node is a clean default.
- **Cache invalidation:** rolls forward as time advances. The window
  itself shifts each day, which means Sankey cache must invalidate at
  midnight (or on first read after a day boundary). Add this to
  `forecasting-009`'s acceptance criteria when it's refined.
- **"Uncategorized" leaf still applies** — uncategorized historical rows
  go to a distinguished leaf, as already specified in `forecasting-009`.

### For `forecasting-001` (Frontend prompting strategy)

- **Prompt 1 (Dashboard) is consistent with this commit as drafted** —
  it already describes the Sankey as "money flowing from income sources
  through hierarchical category parents into leaf categories" and
  click-through to Expenses pre-filtered. Both behaviors require
  past-fixed semantics; the existing prompt does not need changes.
- **One small clarification worth folding into Prompt 1 when**
  `forecasting-001` **is worked:** the Sankey should be labeled with
  its time range ("Last 12 months" or similar) so the user is not
  confused about whether the Sankey is responding to the horizon
  selector. Without this label, users will reasonably expect the Sankey
  to follow the horizon and be confused when it doesn't. This is a
  prompt-level note, not a behavior change. Flagging here for the
  orchestrator to fold into `forecasting-001`'s next refinement pass.
- **Prompt 3 (Expenses) "last-12-months total"** is the same window as
  the Sankey. Confirm this in `forecasting-001`'s ADR so the alignment
  is documented, not accidental.

### For cross-BC data contracts

- **Cash Inflow's read contract:** must expose paid-income rows
  filterable by date range. The change-notification signal already
  required by `forecasting-002` is sufficient; no additional contract
  shape is needed.
- **Cash Outflow's read contract:** must expose categorized expense
  rows filterable by date range, plus the *current* category hierarchy
  (not historical hierarchy). The Sankey reflects the user's current
  understanding of how things should be categorized, not how they were
  categorized at the moment of import. (This is a deliberate UX
  choice — re-categorizing should be visible immediately in the Sankey,
  not only in transactions imported afterward.)
- **Tax Obligations' read contract:** must expose realized outflows
  (prepayments paid within the window) and any reconciliation
  inflows/outflows that fell within the window. Future-dated
  obligations are not part of the Sankey input.
- **No new write-back contracts.** Forecasting remains a pure customer
  per the context map.

## Sub-tasks

None warranted. The commit is small enough that a spike is not needed; the
remaining detail (tax-flow shape in the Sankey) is properly owned by
`forecasting-009`. No new task is filed.

## Notes

### Considerations

- **The "headline pair changes meaning" objection** to past-fixed is
  real but resolves in favor of past-fixed once one accepts that
  co-equal means *equal weight*, not *equal motion*. Zero-day and
  Sankey answer different headline questions; that's why they're both
  on the headline.
- **Reversibility:** if the user later wants horizon-driven, this
  decision is a one-window-function-swap inside the aggregation
  (`forecasting-009`) plus a cache-key change in `forecasting-002`.
  Not free, but not load-bearing on the rest of the architecture.
  Picking past-fixed first does not foreclose horizon-driven later.
- **Why not Option 4 (selectable lookback):** premature configurability.
  The user has no expressed need for a different lookback; 12 months
  matches the category-tree display and matches "rolling 12 months" as
  a common projection horizon, so the same number means the same span.
  If the need surfaces, add the control then.

### Related open question in README

> Sankey window: fixed past 12 months, or driven by selected horizon?

**Answered:** fixed past 12 months, paid-only. The README question can
be removed / marked resolved when this task is worked and the ADR
lands.
