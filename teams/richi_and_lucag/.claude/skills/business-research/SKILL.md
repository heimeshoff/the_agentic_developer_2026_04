---
name: business-research
description: Structured business research for the homeowner-fintech personal finance product. Invoke with /business-research. Supports two modes — (1) competitive analysis: maps the competitor landscape, features, pricing, and positioning gaps; (2) customer journey: traces the homeowner's financial path, pain points, decision triggers, and emotional states. Delegates web searches to multiple parallel specialized agents for depth and speed. Always produces an unopinionated research.md artifact saved to the team's session folder. Use this skill whenever market intelligence, competitor data, user journey insight, or factual grounding is needed before making a product decision — even if the user doesn't say "research" explicitly.
---

# Business Research

Produces an unopinionated `research.md` artifact by combining a short user interview with parallel web research agents.

## Flow

```
MODE DETECTION → INTERVIEW → PARALLEL RESEARCH AGENTS → SYNTHESIS → SAVE ARTIFACT
```

---

## Step 1: Mode detection

Detect the research mode from the invocation prompt:

- **competitive-analysis** — competitor landscape, features, pricing, positioning, gaps
- **customer-journey** — homeowner's path through financial management: pain points, triggers, emotional states, existing tool behavior

If the mode is absent or ambiguous, ask before proceeding. Do not guess.

---

## Step 2: Interview

Before searching the web, interview the user. Keep it to **3–5 questions**. The goal is to narrow the search scope so agents return signal, not noise.

**For competitive-analysis:**
1. Which competitors are already on your radar, if any?
2. What angle matters most — features, pricing, positioning, UX, or something else?
3. Any specific homeowner sub-segment to focus on? (e.g., first-time buyers, long-term owners, investors)

**For customer-journey:**
1. Which homeowner segment? (e.g., first-time buyer, long-term owner, landlord)
2. Which stage of the journey? (awareness of a problem, active tracking, distress/repair event, refinancing decision)
3. What moment or pain point are you most curious about?

Wait for the user's answers before proceeding.

---

## Step 3: Parallel research agents

Spawn all research agents in the **same turn** so they run concurrently. Do not run them sequentially.

Read the mode-specific agent briefs now:
- competitive-analysis → `references/competitive-analysis.md`
- customer-journey → `references/customer-journey.md`

Each brief defines exactly which agents to spawn and what to pass each one. When calling each agent, include:
- The user's interview answers as context
- The domain context: *personal finance app for homeowners focused on surfacing savings opportunities — refinancing signals, insurance comparison, subscription creep, energy bills, maintenance costs*
- The specific research question for that agent (not a generic "research X")

Use `web-search-researcher` as the subagent type for all research agents.

---

## Step 4: Synthesize

Once all agents return, synthesize their findings into a single `research.md`. The synthesis rules are strict:

- **Facts only.** No recommendations, no opinions, no "you should". Those belong in `/domain`, not here.
- **Cite sources.** Every non-obvious claim traces to a URL or named publication.
- **Surface patterns.** Noting that three separate sources mention the same pain point is a fact, not an opinion.
- **Declare gaps.** If something couldn't be confirmed, say so explicitly rather than omitting it.

---

## Step 5: Save artifact

Save to:

```
exercise_one/YYYY-MM-DD-<scope-slug>/research.md
```

- `YYYY-MM-DD` = today's date
- `<scope-slug>` = 2–4 word kebab-case label derived from the topic (e.g., `competitor-landscape`, `first-time-buyer-journey`, `refinancing-awareness`)

The path is relative to `teams/richi_and_lucag/`.

Tell the user the full path once saved.

---

## research.md template

Adapt sections to what was actually found. Drop sections with nothing useful; add sections if a clear theme emerged that doesn't fit the template.

```markdown
# Research: [Topic]

_Date: YYYY-MM-DD | Mode: [competitive-analysis | customer-journey]_

---

## Context & Scope

[What was researched and why. Any constraints on scope.]

## [Primary Section]

[e.g., "Competitor Landscape" for competitive-analysis, "Journey Map" for customer-journey]

## [Secondary Section]

[e.g., "Feature & Pricing Gaps" or "Key Pain Points & Triggers"]

## [Additional Section if a clear theme emerged]

## Open Questions

[Things that surfaced but couldn't be answered from web research alone — worth validating with users or a follow-up session.]

## Sources

[URL or publication name for each key claim.]
```

---

## Reference files

| File | When to read |
|------|-------------|
| `references/competitive-analysis.md` | Step 3, competitive-analysis mode |
| `references/customer-journey.md` | Step 3, customer-journey mode |