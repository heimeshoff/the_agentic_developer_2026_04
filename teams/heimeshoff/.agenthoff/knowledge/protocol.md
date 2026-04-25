# Protocol

Chronological log of everything that happens in this project.
Newest entries on top.

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
