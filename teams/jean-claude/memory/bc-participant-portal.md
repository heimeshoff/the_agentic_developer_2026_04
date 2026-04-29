# Bounded Context — Participant Portal

## Purpose
Own the participant's lived financial reality. Make every flow of money visible — what comes in, what leaves, what remains. This is where the strategic bet *seeing is changing* lives. Tone is clarity, never shame.

## Ubiquitous Language
| Term | Meaning in this context |
|------|------------------------|
| Participant | The enrolled person, viewing *their own* financial picture (first-person voice). Never "user". |
| Income | Money flowing in. May be regular (salary) or irregular. Tracked by source, frequency, amount. |
| Drain | A recurring expense that depletes funds — subscriptions, utilities, memberships. Has a name, category, frequency, amount. |
| Obligation | A structured debt commitment with fixed terms and an outstanding balance — mortgage, car loan, personal loan. |
| Available | The money remaining in a period after all drains and obligation payments are subtracted from income. The headline number of this BC. |
| Period | The cadence over which Available is computed. Default: monthly. All non-monthly amounts are normalized to a monthly equivalent for comparison. |

## Core Concepts
- **Participant** is the aggregate root of this context (singular — the self).
- **Income**, **Drains**, **Obligations** are owned collections.
- **Available** is a derived value, not stored.

## Responsibilities
- Record and edit income, drains, obligations.
- Compute and surface Available for the current period.
- Present the full picture in a way that is honest, calm, actionable.

## Invariants
- `Available = Income − Σ(monthly-equivalent drains) − Σ(monthly-equivalent obligation payments)`.
- Any amount entered at a non-monthly cadence (weekly, yearly, one-off) carries a *monthly equivalent* projection alongside its native value.
- Available may be negative — that fact is itself the signal; do not hide or floor it at zero.

## Out of Scope (translated to other contexts)
- Optimal payoff order, savings recommendations, debt-free projection → **Recovery Plan**.
- Cross-participant views, progress signals → **Counselor Dashboard** (via Snapshot).
- Authentication, enrollment, payment execution → external program infrastructure.

## Context Relationships
- **Upstream of Recovery Plan** — publishes income, drains, obligations as the input substrate for strategy.
- **Upstream of Counselor Dashboard** — publishes a Snapshot (point-in-time summary) for caseload oversight.
