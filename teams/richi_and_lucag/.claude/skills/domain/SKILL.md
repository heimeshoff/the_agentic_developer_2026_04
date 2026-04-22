---
name: domain
description: Strategic DDD domain modeling for the homeowner-fintech personal finance product. Invoke with /domain. Reads a research.md artifact and leads a structured conversation to co-build a domain.md following Domain-Driven Design strategic patterns — core domain identification, subdomain classification, bounded context discovery, context mapping, ubiquitous language, and key aggregates. Use this skill whenever the team needs to translate research insights into a shared domain model before moving to feature planning — even if the user doesn't say "DDD" or "domain model" explicitly.
---

# Domain Modeling

Leads a structured conversation grounded in a `research.md` artifact to produce `domain.md` — a DDD strategic domain model for the homeowner personal finance product.

## Flow

```
LOCATE RESEARCH → FRAME DOMAIN → SUBDOMAINS → BOUNDED CONTEXTS
  → UBIQUITOUS LANGUAGE → CONTEXT MAP → KEY AGGREGATES → SAVE
```

Work through these phases **one at a time**. Complete each phase before opening the next.

---

## Step 1: Locate research artifact

Find all `research.md` files under `teams/richi_and_lucag/exercise_one/`. 

- If there is exactly one, use it automatically — tell the user which file you're grounding in.
- If there are multiple, list them and ask which one to use.

Read the artifact before starting the conversation.

---

## Step 2: Frame the domain (opening synthesis)

Synthesize **3–5 key insights** from `research.md` most relevant to domain design — competitor gaps, user pain points, financial patterns. Present them briefly. Then ask a single opening question:

> "Based on this, what is the core problem this product solves — in your own words?"

This is co-creative: you bring structure, the user brings domain expertise. Their answer to this question anchors everything that follows.

---

## Step 3: Subdomain classification

Guide the user through classifying the product's subdomains:

- **Core domain** — what's uniquely differentiating; the reason this product exists
- **Supporting subdomains** — necessary but not the edge; build, don't buy
- **Generic subdomains** — commodity; buy or use off-the-shelf

Propose candidates drawn from research (e.g., mortgage tracking, savings opportunity detection, expense categorization). Ask the user to validate, redirect, or add. Keep it conversational — one candidate cluster at a time.

---

## Step 4: Bounded context discovery

Help the user find natural language and responsibility boundaries.

A useful diagnostic: look for places where the **same word means something different** depending on context. For example, "payment" may mean different things in mortgage management vs. utility billing vs. insurance.

Ask the user to walk through **one or two core user scenarios** (not features — scenarios, like "a homeowner notices their energy bill spiked and wonders if they're overpaying"). Listen for language shifts and natural seams. Propose bounded context candidates from what you hear; let the user refine.

---

## Step 5: Ubiquitous language per context

For each bounded context, define **5–10 key terms**. These are the precise words the team will use in code, conversations, and documents — no synonyms allowed within a context.

Gather these conversationally:

> "Within [Context], when you say [X], what do you mean exactly?"

Preserve the user's language. If they call it "a savings signal" rather than "a savings opportunity", use their term — the ubiquitous language belongs to the domain expert, not the facilitator.

---

## Step 6: Context map

Sketch the relationships between bounded contexts:

- Which contexts are **upstream** (their model shapes others)?
- Where is an **Anti-Corruption Layer** needed to translate between incompatible models?
- Is anything **Shared Kernel** territory (truly shared model/code between two contexts)?

Stay lightweight — the goal is to surface dependencies and translation points, not to over-engineer.

---

## Step 7: Key aggregates per context

For each bounded context, identify **1–3 central aggregates**: the "things" that hold the core business rules and invariants. Don't go deep on structure — just name each one and state its primary invariant in one sentence.

---

## Step 8: Save artifact

Save to:

```
exercise_one/YYYY-MM-DD-<scope-slug>/domain.md
```

- Use the **same session folder** as the grounding `research.md` if one exists (same date prefix and slug).
- If none matches, create a new folder following the convention.
- `<scope-slug>` = 2–4 word kebab-case label (e.g., `homeowner-core-domain`, `finance-bounded-contexts`).

Tell the user the full path once saved.

---

## domain.md template

Adapt sections to what emerged in conversation. Drop sections with nothing useful; add sections if a clear theme emerged.

```markdown
# Domain Model: Homeowner Personal Finance

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

[Describe relationships between bounded contexts: upstream → downstream, ACL boundaries, Shared Kernel if any. Prose or simple table. Flag any places where the team will need an explicit translation layer.]

## Open Modeling Questions

[Unresolved decisions to revisit in /plan. Number them so they can be referenced.]

1. [Question]
```

---

## Facilitation principles

- **Lead with synthesis, not interrogation.** Before each phase, share what you've inferred from `research.md` and ask the user to validate — don't ask cold questions they have to answer from scratch.
- **One thread at a time.** Complete one phase before opening the next. Ask only one question per turn.
- **Propose, don't just ask.** "I'd suggest bounded contexts around X, Y, Z — does that feel right?" moves faster than "what are the bounded contexts?"
- **Stay strategic.** If the conversation drifts toward implementation details or specific features, redirect: "Let's hold that for /plan — right now we're mapping the domain."
- **Embrace ambiguity.** It is correct for some boundaries to be unclear at this stage. Capture those as Open Modeling Questions rather than forcing premature resolution.