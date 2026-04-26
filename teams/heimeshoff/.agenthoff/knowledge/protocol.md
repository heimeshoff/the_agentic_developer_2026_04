# Protocol

Chronological log of everything that happens in this project.
Newest entries on top.

---

## 2026-04-26 -- Model / Refined: full Forecasting backlog + cross-BC contracts

**Type:** Model / Refine (autonomous batch)
**BC:** forecasting + cash-inflow + cash-outflow + tax-obligations
**Status after:** all in backlog (none promoted)

**Summary:** Refined every previously-captured task to ready-for-promotion
shape, making committed decisions on open questions instead of deferring.

**Forecasting refinements:**
- `forecasting-001` — resolved 3 open questions (state carry: re-state in
  prompts; CSV wizard: stay inside Prompt 3; Sankey lib: Recharts with
  static-block fallback).
- `forecasting-003` — committed Option 1 (past-fixed, trailing 12 months,
  paid-only). Independent of horizon and scenario.
- `forecasting-004` — committed known-only + user-entered-estimate path
  (engine never synthesizes; user can record an `estimated: true`
  reconciliation; reconciliation affects both projections equally).
- `forecasting-005` — committed integer-cents persistence in SQLite,
  no auto-rebase on CSV import.
- `forecasting-006` — committed concrete EOY edge rule, per-card scenario
  binding for "until zero", 5-year hard upper bound.
- `forecasting-007` — engine signature pinned: `projectPessimistic
  (PessimisticSnapshot) → PessimisticResult`. Per-event step granularity,
  trailing-12mo monthly-bucket variable averages, structured Cadence
  type, full structured-clone worker boundary, full input/output schemas.
- `forecasting-008` — engine signature pinned: `projectOptimistic
  (OptimisticSnapshot) → OptimisticResult`. Reuses 007's iteration
  model, adds a `'contracted-income'` event between paid-income and
  subscription in the canonical sort order. Delta-vs-pessimistic stays
  out of the engine (computed by the caller).
- `forecasting-009` — aggregation signature pinned: `aggregateSankey
  (SankeyInput) → SankeyOutput`. Tax flows render as a single top-level
  `taxes` node. Income side aggregates per-customer with `Other income`
  bucket. Daily window shift handled via recompute-on-read against the
  `sankey-window` cache key.

**New tasks created during the pass:**
- `forecasting-011` — host runtime decision (Electron + TypeScript +
  SQLite via better-sqlite3 + Vite + electron-builder + Node Worker).
  Blocks 002, 005, 007, 008, 009.
- `cash-inflow-001` — changed-signal contract.
- `cash-inflow-002` — paid + contracted income read-model.
- `cash-outflow-001` — changed-signal contract + batch suspend/release.
- `cash-outflow-002` — transactions, category tree, subscriptions,
  variable-category averages read-model. (Initially filed twice by
  parallel orchestrators with different filenames; the redundant
  `cash-outflow-002-categorized-expense-read-model.md` was deleted; the
  comprehensive `cash-outflow-002-read-model.md` retained.)
- `tax-obligations-001` — changed-signal contract.
- `tax-obligations-002` — reconciliation read-model with `estimated`
  flag (filed by 004 refinement).
- `tax-obligations-003` — prepayment schedule read-model (filed by 007
  refinement).

**Naming fix:** `forecasting-010`'s id was changed from
`forecasting-010-recompute-cost-spike` to `forecasting-010` for
consistency; `forecasting-002.depends_on` updated accordingly.

**ADRs written:** none. Every refinement records its decisions in the
task body so the eventual ADR (written when the task is worked) is a
transcription, not a re-litigation.

**Project-wide conventions pinned:** integer minor units (cents) for all
money, ISO-8601 strings for all dates across the worker boundary,
structured-clone-safe plain objects only, banker's rounding for any
display-time conversions.

---

## 2026-04-26 -- Model / Refined: forecasting-002 - Recompute strategy

**Type:** Model / Refine
**BC:** forecasting
**Status after:** backlog
**Summary:** Refactored the decision space from three conflated options
(eager / on-demand / hybrid) into four near-orthogonal axes — Trigger,
Granularity per output, Threading, CSV-import boundary — and recorded a
recommendation (eager-with-debounce + independent zero-day/Sankey caches +
worker thread + explicit suspend/release on CSV import), with
stale-with-banner as fallback if the spike shows compute >500ms. Sharpened
ACs to spell out per-output cache keys, the upstream `*.changed` event
list, the suspend/release contract, and three concrete user-visible
scenarios. Surfaced a cross-context implication: each upstream BC needs to
expose a coarse-grained, payload-free "changed" signal — to be tracked as
sub-tasks in those BCs when they're refined.
**Split into:** forecasting-010-recompute-cost-spike (timeboxed
half-day measurement spike that blocks forecasting-002).
**ADRs written:** none (ADR is written when the task is worked).

---

## 2026-04-26 -- Model / Captured: Forecasting BC domain backlog (forecasting-002 through forecasting-009)

**Type:** Model / Capture
**BC:** forecasting
**Filed to:** backlog
**Summary:** Captured the Forecasting BC's domain core as eight backlog tasks:
three decisions (recompute strategy, Sankey aggregation window, tax
reconciliation handling) covering the README's open questions, and five
features (starting balance, horizon resolution, pessimistic projection
engine, optimistic projection engine, Sankey aggregation by hierarchical
category). Dependencies wire the decisions as blockers for the engines and
Sankey aggregation; the optimistic engine depends on the pessimistic. All
tasks need refinement — particularly the cross-BC data-shape contracts with
Cash Inflow, Cash Outflow, and Tax Obligations — before promotion to todo.

---

## 2026-04-25 -- Model / Captured: forecasting-001 - Frontend prompting strategy for claude.ai/design

**Type:** Model / Capture
**BC:** forecasting (cross-cutting — touches all four BCs)
**Filed to:** backlog
**Summary:** Captured a five-prompt strategy for generating the frontend via
claude.ai/design: a design-system-and-shell prompt first, then one prompt
per bounded context (Dashboard / Income / Expenses / Taxes). Recorded as a
`decision`-type task; will produce an ADR when worked. Verbatim draft prompts
are stored in the task's Notes section pending validation against
claude.ai/design.

---

## 2026-04-25 -- Brainstorm: Personal Cashflow Tool

**Type:** Brainstorm
**Outcome:** vision created
**BCs identified:** Cash Inflow, Cash Outflow, Tax Obligations, Forecasting
**Summary:** Established the vision for a local Windows-only personal cashflow
tool driven by bank CSV imports. Centerpiece is the two-projection
zero-money-day calculation (pessimistic = paid income only, optimistic =
paid + contracted), with the Sankey diagram of hierarchical-category flow as
co-equal headline view. Income modelled in binary states (contracted / paid),
no lead pipeline. Expenses split into subscriptions, variable averages, and
tax obligations (their own context with quarterly prepayment + annual
reconciliation rhythm).
**ADRs written:** 0001 (local-only personal tool), 0002 (binary income
states), 0003 (two-projection model)

---
