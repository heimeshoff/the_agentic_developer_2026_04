# Vision: Debt Recovery Program

## Purpose
Millions of people are deep in debt not because they are irresponsible, but because their financial reality is invisible to them. Money leaves — through subscriptions, obligations, and daily spending — and they don't know where it went until the end of the month, when the damage is done. This is a government-mandated debt recovery program. Participants are enrolled and paired with a counselor. The application is the foundation of their journey: make the invisible visible, and change becomes possible.

## Core Domain
**Financial visibility.** The one thing this system must do excellently is show a participant exactly where their money goes — every drain, every obligation, every incoming amount — in a way that is clear, honest, and actionable. Budgeting, savings recommendations, and debt payoff strategy are only meaningful once the participant can *see*. Visibility is the unlock. Everything else serves it.

## Ubiquitous Language
| Term | Definition |
|------|-----------|
| Participant | A person enrolled in the debt recovery program. Never called "user" — they are on a journey. |
| Counselor | A program advisor who monitors participant progress and can intervene or guide. |
| Drain | Any recurring expense that depletes available funds — subscriptions, utilities, memberships. |
| Obligation | A structured debt commitment with fixed terms — mortgage, car loan, personal loan. |
| Available | The money remaining after all obligations and drains are accounted for in a given period. |
| Recovery Plan | The participant's structured path from current financial state toward debt-free. |
| Debt-Free Date | The projected date on which all obligations are settled, based on current behaviour. |
| Snapshot | A point-in-time summary of a participant's financial picture, used by counselors to assess progress. |
| Conversation | The persistent in-app exchange between exactly one Counselor and one Participant. |
| Message | A single, append-only communication within a Conversation, authored by either the Counselor or the Participant. |

## Bounded Contexts

**Participant Portal**
The participant's personal view. Tracks income, drains, and obligations. Surfaces available funds. Shows the full picture of where money goes. This context owns the participant's lived financial reality.

**Recovery Plan**
The structured path forward. Given what the participant earns and spends, what is the optimal order to eliminate debt? Where are the savings opportunities? What is the projected debt-free date? This context owns strategy and projection.

**Counselor Dashboard**
The counselor's view across their caseload. Shows snapshots of participant progress, flags participants who are stalled or at risk, and surfaces when human intervention is needed. This context owns oversight and accountability.

**Conversations**
The communication surface between Counselor and Participant. Owns the persistent in-app exchange, message history, read state, and unread-count surfacing. This context owns the human relationship that makes accountability real — counselor–participant interaction happens in-app, not offline.

## Actors

**Participant**
Enrolled in the program — attendance is not optional. They are deep in debt, experiencing monthly financial surprises, and carry anxiety about facing their numbers. They need the application to feel safe, not shameful. Success for them looks like understanding where their money goes and seeing a credible path out.

**Counselor**
Manages a caseload of participants. Needs to quickly identify who is progressing, who is stalled, and who needs an urgent conversation. Does not manage individual transactions — observes patterns and intervenes at the right moments.

## In Scope
- Income tracking (salary, irregular income)
- Drain tracking (subscriptions, recurring expenses)
- Obligation tracking (mortgage, loans with terms and balances)
- Budget visualisation — where money goes, what is available
- Savings and investment opportunity recommendations based on available funds
- Debt payoff progress and projected debt-free date
- Counselor view of participant snapshots and progress signals
- In-app messaging between Counselor and Participant (persistent conversation, read state, unread surfacing)

## Out of Scope
- Executing financial transactions or payments
- Investment management or brokerage
- Tax preparation or filing
- Loan origination, restructuring, or negotiation
- Onboarding or enrollment into the program (handled separately by the government)
- Authentication and account management (handled by program infrastructure)

## Strategic Direction
We bet that **seeing is changing**. The participant does not lack willpower — they lack visibility. The moment they can see the full picture of where their money goes, the path forward becomes legible. The counselor relationship makes accountability real and human. This application does not lecture or shame. It illuminates, projects, and supports. Every design decision should ask: does this help the participant see more clearly?

## Open Questions
- Are there program milestones or thresholds that trigger automatic counselor alerts?
- How is income handled when it is irregular or variable month to month?
- Does the recovery plan recommend specific debt payoff strategies (avalanche, snowball) or let counselors prescribe that?
