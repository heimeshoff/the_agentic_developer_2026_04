# Bounded Context — Recovery Plan

## Purpose
Own strategy and projection. Given what the participant earns, owes, and spends, compute the optimal path to debt-free and surface where free funds can do more. Visibility is the unlock; this context turns visibility into a credible plan.

## Ubiquitous Language
| Term | Meaning in this context |
|------|------------------------|
| Recovery Plan | The structured forward path from current financial state to debt-free. The aggregate root of this BC. |
| Payoff Order | The recommended sequence in which Obligations should be eliminated. Strategy-driven (e.g. avalanche, snowball — see open question). |
| Debt-Free Date | The projected date on which all Obligations are settled, given current behavior. A projection, not a commitment — it moves as behavior moves. |
| Savings Opportunity | A recommendation surfaced when Available consistently exceeds a threshold — money that could compound rather than idle. |
| Available | Input from Participant Portal. The fuel the plan strategizes against. |
| Obligation | Input from Participant Portal. The targets the plan sequences and projects against. |

## Core Concepts
- **Recovery Plan** is the aggregate root — one per Participant.
- **Payoff Order** and **Debt-Free Date** are derived projections, recomputed on input changes.
- **Savings Opportunity** is a published recommendation, not an executed action.

## Responsibilities
- Compute Payoff Order across the Participant's Obligations.
- Project Debt-Free Date from current behavior.
- Surface Savings Opportunities when Available permits.
- Re-project on every change to the input substrate.

## Invariants
- Debt-Free Date is **always** a projection — never communicated as a guarantee.
- Payoff Order respects each Obligation's fixed terms (minimums, schedules) — the plan optimizes free dollars only.
- A negative or zero Available means no payoff acceleration and no Savings Opportunity is recommended; the plan still projects, but flags the participant as constrained.

## Out of Scope (translated to other contexts)
- Tracking the underlying income, drains, obligations → **Participant Portal**.
- Counselor-facing progress flags derived from this projection → **Counselor Dashboard**.
- Loan negotiation, restructuring, origination, transaction execution → external / out of project.

## Open Questions (from VISION)
- Does the plan prescribe a payoff strategy (avalanche vs snowball), or does the counselor choose?
- How is variable / irregular income handled when projecting?

## Context Relationships
- **Downstream of Participant Portal** — consumes income, drains, obligations, Available.
- **Visible to Participant**; **Debt-Free Date** also surfaces into the **Counselor Dashboard** as a progress dimension.
