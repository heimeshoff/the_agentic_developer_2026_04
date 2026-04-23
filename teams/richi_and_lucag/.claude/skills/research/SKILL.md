---
name: research
description: General-purpose research skill for the homeowner-fintech personal finance product. Invoke with /research. Complements /business-research (which covers competitive analysis and customer journeys) by handling technical, regulatory, UX pattern, and open-ended topic research. Reads vision.md as grounding context. Always produces an unopinionated research.md artifact. Use when the team needs depth on a topic that is not a competitor landscape or customer journey map.
---

# Research

Produces an unopinionated `research.md` artifact on any topic relevant to the homeowner personal finance product.

## Scope vs /business-research

| Use `/research` for | Use `/business-research` for |
|---|---|
| Technical approaches (e.g., how plaid integrations work) | Competitor feature/pricing landscape |
| Regulatory / compliance topics (RESPA, TILA, escrow rules) | Homeowner customer journey mapping |
| UX patterns and design precedents | Positioning gaps |
| Data sources (mortgage rates, insurance APIs) | Sub-segment targeting |
| Open-ended exploratory topics | Market sizing |

If the request overlaps with competitor or customer-journey territory, suggest `/business-research` instead.

---

## Flow

```
LOCATE VISION → MODE DETECTION → INTERVIEW → PARALLEL RESEARCH AGENTS → SYNTHESIS → SAVE
```

---

## Step 1: Locate vision

Find `vision.md` under `teams/richi_and_lucag/exercise_one/`. Read it silently before proceeding.

- If found: use it to calibrate research scope (stay relevant to the product's problem and user).
- If not found: proceed, but note in the output that no vision grounding was available.

---

## Step 2: Mode detection

Detect the research mode from the invocation prompt:

- **technical** — APIs, integrations, algorithms, data sources, architecture patterns
- **regulatory** — laws, compliance requirements, disclosure rules relevant to homeowner finance
- **ux-patterns** — precedents from analogous products, interaction models, design research
- **exploratory** — open-ended topic not fitting the above

If the mode is absent or ambiguous, ask one question: *"What specifically do you want to understand — technical options, regulations, UX patterns, or something else?"*

---

## Step 3: Interview

Keep to **2–3 questions** targeted at narrowing scope. Generic examples by mode:

**technical:**
1. Which specific integration or capability are you evaluating?
2. Are there known constraints (cost, latency, data privacy) to factor in?

**regulatory:**
1. Which financial activity or product category is in scope?
2. Which jurisdiction — US federal, specific states, or both?

**ux-patterns:**
1. Which user flow or moment are you trying to improve?
2. Any analogous products (not direct competitors) you'd like included?

**exploratory:**
1. What question are you trying to answer?
2. What would make this research actionable for the team?

Wait for answers before spawning agents.

---

## Step 4: Parallel research agents

Spawn all research agents **in the same turn** so they run concurrently. Use `web-search-researcher` as the subagent type.

For each agent, include:
- The user's interview answers
- Product context: *personal finance app for homeowners — surfaces savings opportunities around mortgage, insurance, utilities, maintenance, and subscription creep*
- The specific research question for that agent (not a generic brief)

**Standard agent set by mode:**

| Mode | Agent 1 | Agent 2 | Agent 3 |
|---|---|---|---|
| technical | Deep-dive on primary integration/approach | Alternative approaches and trade-offs | Failure modes and known limitations |
| regulatory | Federal rules and requirements | State-level variations | Enforcement history / edge cases |
| ux-patterns | Pattern examples from analogous products | User behavior research / studies | Anti-patterns and failure cases |
| exploratory | Primary topic depth | Adjacent context | Contrarian / minority view |

Adjust agent briefs based on the user's specific question — the table is a starting point, not a rigid template.

---

## Step 5: Synthesize

Combine agent findings into a single `research.md`. Strict rules:
- **Facts only.** No recommendations, no opinions, no "you should."
- **Cite sources.** Every non-obvious claim traces to a URL or named publication.
- **Surface patterns.** Three sources noting the same thing is a pattern — name it.
- **Declare gaps.** If something couldn't be confirmed, say so explicitly.

---

## Step 6: Save artifact

Save to:

```
exercise_one/YYYY-MM-DD-<scope-slug>/research.md
```

- Use the same session folder as the grounding `vision.md` if one exists with the same date.
- Otherwise create a new folder.
- `<scope-slug>` = 2–4 word kebab-case label (e.g., `plaid-integration`, `escrow-regulations`, `savings-detection-patterns`)

Path is relative to `teams/richi_and_lucag/`.

Tell the user the full path once saved.

---

## research.md template

```markdown
# Research: [Topic]

_Date: YYYY-MM-DD | Mode: [technical | regulatory | ux-patterns | exploratory]_
_Grounded in: [relative path to vision.md, or "no vision file found"]_

---

## Context & Scope

[What was researched, why, and any constraints on scope.]

## [Primary Section]

[Main findings on the topic.]

## [Secondary Section]

[Supporting findings, alternatives, or adjacent context.]

## [Additional Section if a clear theme emerged]

## Gaps & Unconfirmed Claims

[Things that surfaced but couldn't be verified — worth a follow-up.]

## Sources

[URL or publication name for each key claim.]
```
