# Product Vision

> **Status: DRAFT — in exploration.** This document captures the state of thinking after the 2026-04-23 brainstorm session. Several foundational decisions are still open (see "Open Questions" at the bottom). A follow-up `/brainstorm` is needed before this vision is stable enough to plan against.

---

## One-line pitch (working draft)

A European personal-finance product for people/groups who need a tool that actually understands their local reality — starting in Belgium. *(Exact ICP and wedge still being determined — see Open Questions.)*

---

## What is settled

### Commercial intent
- This is a **commercial product**, not a pet project.
- It must stand on its own as a paid/freemium SaaS, with a defensible commercial story against incumbents.

### Category positioning
- **Category:** personal finance.
- **Positioning:** **EU-native**, differentiated against US-centric incumbents (Mint-successors like Monarch, YNAB, Copilot Money).
- The thesis is that the big winners in personal finance are all US-focused and country-specific European tools are fragmented. A pan-EU product with proper local depth is an open opportunity.

### Geographic strategy
A two-layer architecture:
- **Layer 1 (pan-European, day one):** multi-currency aggregation, bank/card import via PSD2 open-banking aggregator (Tink / GoCardless Bank Account Data / Salt Edge), budgeting, categorization, savings goals, shared-household features, investment tracking.
- **Layer 2 (country-specific, rolled out country-by-country):** tax-advantaged accounts (BE *pensioensparen*, *groepsverzekering*, tax-free dividend allowance; NL *box-3*; FR *PEA*; DE *Riester/Rürup*), capital-gains logic, local mortgage structures, language, reporting obligations, curated local financial products.

**Beachhead country:** Belgium — home turf for the team, feelable pain points, validated by the fact that key European fintechs (Tricount) originated there.

### Explicit non-goals (settled)
- **Not an agentic/AI-driven tool that takes financial actions.** The team (and by extension our target European audience) does not trust AI to manage money. AI may appear as a *helper* (e.g., categorization, summarization) but must not autonomously move, invest, or commit funds. This is a product-positioning decision, not a technical one.

---

## What was explored but *not* settled

During the brainstorm we rotated through several target-user framings. None were locked in:

| Rotation | Framing considered | Outcome |
|---|---|---|
| 1 | Expats living in the EU (13M+ intra-EU, plus non-EU) | Considered, then broadened back out. |
| 2 | General European households | Deemed too broad for an ICP. |
| 3 | Belgian families with kids (dual-income, mortgage, pension complexity) | Briefly converged, then pivoted away. |
| 4 | Groups of people who share finance (couples, flatmates, co-parents, multi-gen, co-owners, partners) | Recognized as a different *category* than household finance, not a sub-segment of it. |
| 5 | Friends coordinating toward a common goal (trip or venture) | Current working direction at the time of pause. |

The last direction (friends + shared goal) is *category-different* from the household-finance framing we started with. It needs to be consciously chosen or rejected in the next session.

---

## Reference context

- **Existing internal research:** `research/personal-finance-architecture-ux.md` — surveys the top open-source personal-finance apps (Maybe, Actual Budget, Firefly III, Wealthfolio, ezBookkeeping). Key finding: nobody solves bank sync natively — all depend on third-party aggregators — and architectures split between server-rendered monoliths and local-first CRDT clients.
- **Belgian heritage in the shared-finance space:** Tricount (~6M users, acquired by Bunq in 2022) validates that there is a real "shared expense" category with European origin; it is shallow (retrospective splitting only) and leaves depth unsolved.

---

## Open questions (to resolve in the next brainstorm)

These *must* be answered before the vision is actionable:

1. **Is this a household-finance product or a shared-goal-coordination product?** These are structurally different products — one is ongoing/daily/all-aspects, the other is episodic/narrow/transactional. You cannot build both as one app. Commit to one.
2. **If household-finance:** what is the household archetype (couples, families with kids, pre-retirees, freelancers)?
3. **If shared-goal-coordination:** is the wedge a **trip** (Tricount-adjacent, low willingness to pay) or a **venture** (co-ownership, partnerships — higher stakes, less served, higher willingness to pay)?
4. **What is the #1 acute pain** for the chosen ICP? A concrete user story from someone the team knows personally would strongly improve PMF credibility.
5. **What is the unfair advantage** vs. the status quo (bank app + spreadsheet + accountant + Tricount)?
6. **Monetization model** — freemium SaaS, premium tier, affiliate on financial products (MiFID/IDD-regulated in EU), B2B2C via banks?
7. **Success criteria** — what does "this is working" look like concretely (users, MRR, retention, NPS) at 6 months and 12 months?
8. **Core features and explicit non-goals** derive from the answers above.

---

## Guidance for the next brainstorm

- Commit to either the household-finance thesis *or* the shared-goal-coordination thesis before designing features.
- Anchor on a real, personal pain story from a team member or someone close — three rotations in one session suggests we are exploring commercially plausible segments rather than the one the team actually feels in their gut.
- Let the chosen ICP drive the feature set, not the reverse.
