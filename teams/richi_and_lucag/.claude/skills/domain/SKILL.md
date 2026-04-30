---
name: domain
description: Strategic DDD domain modeling skill for this team. Invoke with /domain. Reads memory/project/INDEX.md to learn the active project, then grounds in the active research.md artifact. Leads a structured conversation to co-build a domain.md following Domain-Driven Design strategic patterns — core domain identification, subdomain classification, bounded context discovery, context mapping, ubiquitous language, and key aggregates. Emits glossary proposals for accepted ubiquitous-language terms. Use whenever the team needs to translate research insights into a shared domain model before moving to feature planning.
---

# Domain Modeling

Leads a structured conversation grounded in `research.md` to produce `domain.md` — a DDD strategic domain model for the active project.

## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. The active session's `research.md` (resolved from INDEX). Also read the active `vision.md` for product context.
4. `memory/project/glossary.md` — to avoid proposing terms already accepted.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.

## Flow

```
RESOLVE RESEARCH → FRAME DOMAIN → SUBDOMAINS → BOUNDED CONTEXTS
  → UBIQUITOUS LANGUAGE → CONTEXT MAP → KEY AGGREGATES → SAVE
```

Work through these phases **one at a time**. Complete each phase before opening the next.

---

## Step 1: Resolve research artifact

Resolve the active session's `research.md` via INDEX. Read it before starting the conversation.

If INDEX has no research pointer for the active session, stop and tell the user to run `/research` (or `/business-research`) first.

---

## Step 2: Frame the domain (opening synthesis)

Synthesize **3–5 key insights** from `research.md` most relevant to domain design — competitor gaps, user pain points, recurring patterns. Present them briefly. Then ask a single opening question:

> "Based on this, what is the core problem this product solves — in your own words?"

This is co-creative: you bring structure, the user brings domain expertise. Their answer to this question anchors everything that follows.

---

## Step 3: Subdomain classification

Guide the user through classifying the product's subdomains:

- **Core domain** — what's uniquely differentiating; the reason this product exists
- **Supporting subdomains** — necessary but not the edge; build, don't buy
- **Generic subdomains** — commodity; buy or use off-the-shelf

Propose candidates drawn from research and vision. Ask the user to validate, redirect, or add. Keep it conversational — one candidate cluster at a time.

---

## Step 4: Bounded context discovery

Help the user find natural language and responsibility boundaries.

A useful diagnostic: look for places where the **same word means something different** depending on context.

Ask the user to walk through **one or two core user scenarios** (not features — scenarios). Listen for language shifts and natural seams. Propose bounded context candidates from what you hear; let the user refine.

---

## Step 5: Ubiquitous language per context

For each bounded context, define **5–10 key terms**. These are the precise words the team will use in code, conversations, and documents — no synonyms allowed within a context.

Gather these conversationally:

> "Within [Context], when you say [X], what do you mean exactly?"

Preserve the user's language. The ubiquitous language belongs to the domain expert, not the facilitator.

Cross-check each term against `memory/project/glossary.md`:
- If the term already has an accepted definition that matches: reuse it.
- If it conflicts: flag the conflict to the user, propose an update, do not silently overwrite.
- If new: queue it for the `## Glossary Proposals` section in Step 8.

---

## Step 6: Context map

Sketch the relationships between bounded contexts:

- Which contexts are **upstream** (their model shapes others)?
- Where is an **Anti-Corruption Layer** needed to translate between incompatible models?
- Is anything **Shared Kernel** territory (truly shared model/code between two contexts)?

Stay lightweight — surface dependencies and translation points, do not over-engineer.

---

## Step 7: Key aggregates per context

For each bounded context, identify **1–3 central aggregates**: the "things" that hold the core business rules and invariants. Don't go deep on structure — name each one and state its primary invariant in one sentence.

---

## Step 8: Memory Write Transaction

Write order, no skipping:

1. Save `domain.md` inside the active session folder resolved from INDEX:
   `<active-session-folder>/domain.md`. Embed a `## Glossary Proposals` section inside the artifact carrying every new or changed term, with the same shape as the response-level proposals.
2. Verify the file exists and is non-empty.
3. Update `memory/project/INDEX.md` — bump the `domain` row in canonical artifacts. Refresh `Canonical artifact set complete` and `Last reindex` as appropriate.
4. Replace `memory/task/state.md` wholesale with the new snapshot (phase = post-domain, next action = `/tactical-ddd`).
5. Run the Decision Gate. Append qualifying entries to `memory/project/decisions.md`. Common candidates here: bounded context boundaries, ACL placements, "we treat X and Y as separate contexts because their language differs."
6. Output the same glossary candidates as a top-level `## Glossary Proposals` section in your final response. Do **not** edit `glossary.md` — proposals are accepted by humans separately.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.

---

## Step 9: Decision candidates

End the session with this block:

```
Decision candidates from this session:
1. [candidate] — append: yes/no — reason
2. [candidate] — append: yes/no — reason
```

Bounded context boundaries and ACL choices typically qualify. Picking a default term over its synonym does not — that belongs in the glossary, not decisions.

---

## domain.md template

Adapt sections to what emerged in conversation. Drop sections with nothing useful; add sections if a clear theme emerged.

```markdown
# Domain Model: [Active project name]

_Date: YYYY-MM-DD | Grounded in: [relative path to research.md]_

---

## Core Domain

[What makes this product uniquely valuable — the irreplaceable heart of the business. One short paragraph.]

## Subdomains

| Subdomain | Type | Rationale |
|-----------|------|-----------|
| [Name] | Core / Supporting / Generic | [One-line reason] |

## Bounded Contexts

### [Context Name]

**Responsibility**: [One sentence — what this context owns and nothing else.]

**Ubiquitous Language**:

| Term | Definition within this context |
|------|-------------------------------|
| [Term] | [Precise definition — no synonyms] |

**Key Aggregates**:

- `[AggregateName]` — [primary invariant it enforces]

---

[Repeat for each bounded context]

## Context Map

[Describe relationships between bounded contexts: upstream → downstream, ACL boundaries, Shared Kernel if any. Prose or simple table.]

## Glossary Proposals

[Candidate terms emitted by this session. Each: term, candidate definition, bounded context, rationale. Mirror this section in the final response so the human can accept them into glossary.md.]

## Open Modeling Questions

[Unresolved decisions to revisit in /tactical-ddd. Number them so they can be referenced.]

1. [Question]
```

---

## Facilitation principles

- **Lead with synthesis, not interrogation.** Before each phase, share what you've inferred from `research.md` and ask the user to validate.
- **One thread at a time.** Complete one phase before opening the next. Ask only one question per turn.
- **Propose, don't just ask.** "I'd suggest bounded contexts around X, Y, Z — does that feel right?" moves faster than "what are the bounded contexts?"
- **Stay strategic.** If the conversation drifts toward implementation, redirect: "Let's hold that for /tactical-ddd."
- **Embrace ambiguity.** It is correct for some boundaries to be unclear at this stage. Capture those as Open Modeling Questions rather than forcing premature resolution.
