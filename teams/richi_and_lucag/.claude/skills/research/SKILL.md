---
name: research
description: General-purpose research skill for this team. Invoke with /research. Reads memory/project/INDEX.md to learn the active project and grounds in the active vision. Complements /business-research (which covers competitive analysis and customer journeys) by handling technical, regulatory, UX pattern, and open-ended topic research. Always produces an unopinionated research.md artifact saved to the active session folder. Use when the team needs depth on a topic that is not a competitor landscape or customer journey map.
---

# Research

Produces an unopinionated `research.md` artifact on any topic relevant to the active project.

## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. The active `vision.md` (resolved from INDEX). If absent, stop and ask the user whether to proceed without grounding.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.

## Scope vs /business-research

| Use `/research` for | Use `/business-research` for |
|---|---|
| Technical approaches (e.g., how an integration works) | Competitor feature/pricing landscape |
| Regulatory / compliance topics | Customer journey mapping |
| UX patterns and design precedents | Positioning gaps |
| Data sources | Sub-segment targeting |
| Open-ended exploratory topics | Market sizing |

If the request overlaps with competitor or customer-journey territory, suggest `/business-research` instead.

---

## Flow

```
RESOLVE VISION → MODE DETECTION → INTERVIEW → PARALLEL RESEARCH AGENTS → SYNTHESIS → SAVE
```

---

## Step 1: Resolve vision

Resolve the active session's `vision.md` from INDEX and read it silently before proceeding. Use it to calibrate research scope.

---

## Step 2: Mode detection

Detect the research mode from the invocation prompt:

- **technical** — APIs, integrations, algorithms, data sources, architecture patterns
- **regulatory** — laws, compliance requirements, disclosure rules
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
1. Which activity or product category is in scope?
2. Which jurisdiction?

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
- Product context quoted directly from the active `vision.md`
- The specific research question for that agent (not a generic brief)

**Standard agent set by mode:**

| Mode | Agent 1 | Agent 2 | Agent 3 |
|---|---|---|---|
| technical | Deep-dive on primary integration/approach | Alternative approaches and trade-offs | Failure modes and known limitations |
| regulatory | Federal/national rules and requirements | Sub-jurisdictional variations | Enforcement history / edge cases |
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

## Step 6: Memory Write Transaction

Write order, no skipping:

1. Save `research.md` inside the active session folder resolved from INDEX:
   `<active-session-folder>/research.md`. If a `research.md` already exists for the active session, propose the new file as `research-<scope-slug>.md` rather than overwriting silently.
2. Verify the file exists and is non-empty.
3. Update `memory/project/INDEX.md` — bump the `research` row in canonical artifacts. Refresh `Canonical artifact set complete` and `Last reindex` as appropriate.
4. Replace `memory/task/state.md` wholesale with the new snapshot (phase = post-research, next action = `/domain`).
5. Run the Decision Gate. Append qualifying entries to `memory/project/decisions.md`.
6. Output any glossary candidates as a `## Glossary Proposals` section in the final response. Do not edit `glossary.md`.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.

---

## Step 7: Decision candidates

End the session with this block:

```
Decision candidates from this session:
1. [candidate] — append: yes/no — reason
2. [candidate] — append: yes/no — reason
```

Research output (facts, sources) is not a decision. A candidate qualifies only when the team chose to *act* on what the research surfaced — e.g., "we will integrate via Provider X, not Y" — and that choice forecloses an alternative.

---

## research.md template

```markdown
# Research: [Topic]

_Date: YYYY-MM-DD | Mode: [technical | regulatory | ux-patterns | exploratory]_
_Grounded in: [relative path to vision.md from INDEX]_

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
