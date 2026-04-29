# Bounded Context — Conversations

## Purpose
Own communication between Counselor and Participant. The relationship is human and trust-based — this BC carries the words. Anchored by the strategic decision that interaction happens **in-app**, not offline. Without this context, the counselor relationship cannot be operationalized.

## Ubiquitous Language
| Term | Meaning in this context |
|------|------------------------|
| Conversation | The persistent, ongoing exchange between exactly one Counselor and one Participant. The aggregate root of this BC. |
| Message | A single communication within a Conversation. Has an Author, a body, and a sent timestamp. |
| Author | The actor who sent a Message — either *Counselor* or *Participant*. The other party is the implicit recipient. |
| Read State | Per-recipient flag indicating whether a Message has been seen. Tracked per Message, not per Conversation. |
| Inbox | The Counselor's listing of Conversations across their Caseload, typically sorted by recency or unread count. |
| Notification | The in-app surface (badge, indicator) that alerts a recipient to unread Messages. External delivery — push, SMS, email — is out of scope. |

## Core Concepts
- **Conversation** is the aggregate root, scoped to one *(Counselor, Participant)* pair.
- **Messages** are entities within the Conversation, ordered chronologically.
- **Read State** is per-recipient, per-Message — not Conversation-level.

## Responsibilities
- Persist the Conversation between a Counselor and a Participant.
- Append Messages and timestamp them.
- Track Read State and surface unread counts to both sides.
- Provide the Counselor's Inbox across the Caseload.

## Invariants
- A Conversation has exactly **one** Counselor and **one** Participant — no group threads, no broadcasts.
- A Participant has at most one active Conversation at a time, mirroring the exclusive Caseload assignment in the Counselor Dashboard.
- Messages are **append-only** — no edit, no delete. Trust and audit depend on this; treat it as a hard rule.
- Marking a Message read is not retroactive: it does not mark earlier Messages read.

## Out of Scope (translated to other contexts)
- Caseload-wide oversight of stalled Participants → **Counselor Dashboard**.
- Participant's financial picture (Income, Drains, Available) → **Participant Portal**. *Never embed financial data inside a Message — reference the Portal instead.*
- External notification delivery (push, SMS, email) → out of project / external infrastructure.

## Context Relationships
- **Downstream of Counselor Dashboard** — consumes Caseload assignment to determine who may converse with whom.
- **Mutually visible to Participant Portal and Counselor Dashboard** — both surfaces render the same Conversation, viewed from each actor's perspective.
- **Upstream of Counselor Dashboard** — publishes *last-interaction-at* and *unread count* as inputs to Progress Signal computation (a Conversation gone quiet is itself a signal).

## Open Questions
- Are there program-driven touchpoints (e.g. "schedule monthly check-in") that auto-create a Message or prompt the Counselor?
- Are templated / canned Counselor messages within scope?
