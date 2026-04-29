# Bounded Context — Counselor Dashboard

## Purpose
Own oversight and accountability across a counselor's caseload. Help the counselor see — at a glance — who is progressing, who is stalled, and where a human conversation is overdue. Counselors triage; they do not investigate transactions.

## Ubiquitous Language
| Term | Meaning in this context |
|------|------------------------|
| Counselor | A program advisor monitoring a set of Participants. The actor of this BC. |
| Caseload | The set of Participants assigned to one Counselor. The unit of work. |
| Snapshot | A point-in-time summary of a Participant's financial picture, published from the Participant Portal for counselor consumption. Read-only here. |
| Progress Signal | A derived flag over a Participant — *on-track*, *stalled*, *at-risk*. The screening lens of the dashboard. |
| Intervention | A counselor action triggered by a Progress Signal. The application surfaces the need; the act itself may live offline (open question). |
| Participant | The same person as in the Participant Portal — but here viewed as one row among many, not as a self. |

## Core Concepts
- **Counselor** is the actor; the **Caseload** is the navigable surface.
- **Snapshot** is a value object copied in from the Participant Portal — never edited here.
- **Progress Signal** is derived (from Snapshots over time and from the Recovery Plan's Debt-Free Date trajectory).

## Responsibilities
- List the Caseload with current Snapshots.
- Compute and surface Progress Signals.
- Flag Participants who need Intervention; rank by urgency.

## Invariants
- The Counselor never edits Participant data — this BC is **read-only** with respect to the Participant Portal.
- A Progress Signal is *informational*, not a verdict — it is meant to prompt a counselor judgment, not replace it.
- Participants must not appear in more than one Counselor's Caseload at a time (assignment is exclusive).

## Out of Scope (translated to other contexts)
- Editing income, drains, obligations → **Participant Portal**.
- Computing Debt-Free Date or Payoff Order → **Recovery Plan**.
- Communication / messaging mechanics — currently undefined; see open questions.

## Open Questions (from VISION)
- Are there program milestones / thresholds that automatically raise an Intervention signal?

## Context Relationships
- **Downstream of Participant Portal** — consumes Snapshots.
- **Downstream of Recovery Plan** — consumes Debt-Free Date as a progress dimension when computing Signals.
- **Downstream of Conversations** — consumes *last-interaction-at* and *unread count* as additional Progress Signal inputs (a Conversation gone quiet is itself a signal).
- **Upstream of Conversations** — Caseload assignment determines who may converse with whom.
