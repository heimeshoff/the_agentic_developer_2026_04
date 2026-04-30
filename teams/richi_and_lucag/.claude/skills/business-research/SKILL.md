---
name: business-research
description: Structured business research for this team. Invoke with /business-research. Reads memory/project/INDEX.md to learn the active project and grounds in the active vision/research artifacts. Supports two modes — (1) competitive analysis: maps the competitor landscape, features, pricing, and positioning gaps; (2) customer journey: traces the target user's path, pain points, decision triggers, and emotional states. Delegates web searches to multiple parallel specialized agents. Always produces an unopinionated research.md artifact saved to the active session folder. Use whenever market intelligence, competitor data, user journey insight, or factual grounding is needed before making a product decision.
---

# Business Research

Produces an unopinionated `research.md` artifact by combining a short user interview with parallel web research agents.

## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. The specific canonical artifact path(s) this skill grounds in, resolved from INDEX.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.

## Flow

```
MODE DETECTION → INTERVIEW → PARALLEL RESEARCH AGENTS → SYNTHESIS → SAVE ARTIFACT
```

---

## Step 1: Mode detection

Detect the research mode from the invocation prompt:

- **competitive-analysis** — competitor landscape, features, pricing, positioning, gaps
- **customer-journey** — target user's path through the problem space: pain points, triggers, emotional states, existing tool behavior

If the mode is absent or ambiguous, ask before proceeding. Do not guess.

---

## Step 2: Interview

Before searching the web, interview the user. Keep it to **3–5 questions**. The goal is to narrow the search scope so agents return signal, not noise.

**For competitive-analysis:**
1. Which competitors are already on your radar, if any?
2. What angle matters most — features, pricing, positioning, UX, or something else?
3. Any specific user sub-segment to focus on?

**For customer-journey:**
1. Which user segment?
2. Which stage of the journey? (awareness, active use, distress moment, decision point)
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
- The product context derived from the active `vision.md` (resolved via INDEX) — quote directly from vision rather than paraphrasing
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

## Step 5: Save artifact (Memory Write Transaction)

Write order, no skipping:

1. Save `research.md` inside the active session folder resolved from INDEX:
   `<active-session-folder>/research.md`. If a `research.md` already exists for the active session, propose the new one as `research-<scope-slug>.md` rather than overwriting silently.
2. Verify the file exists and is non-empty.
3. Update `memory/project/INDEX.md`:
   - Bump the `research` row in canonical artifacts to point at the new file.
   - Set `Canonical artifact set complete` based on the full table.
   - Refresh `Last reindex` date if you also reconciled disk state.
4. Replace `memory/task/state.md` wholesale with the new snapshot (phase = post-research, next action = `/domain`).
5. Run the Decision Gate. Append qualifying entries to `memory/project/decisions.md`.
6. Output any glossary candidates as a `## Glossary Proposals` section in the final response. Do not edit `glossary.md`.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.

---

## Step 6: Decision candidates

End the session with this block:

```
Decision candidates from this session:
1. [candidate] — append: yes/no — reason
2. [candidate] — append: yes/no — reason
```

A candidate qualifies (`append: yes`) only if it is irreversible/expensive to reverse, affects product/domain/architecture/workflow, has an explicit *why*, and forecloses at least one alternative. Pure facts and source URLs do not qualify — they are research output, not decisions.

---

## research.md template

Adapt sections to what was actually found. Drop sections with nothing useful; add sections if a clear theme emerged that doesn't fit the template.

```markdown
# Research: [Topic]

_Date: YYYY-MM-DD | Mode: [competitive-analysis | customer-journey]_
_Grounded in: [relative path to vision.md from INDEX]_

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
