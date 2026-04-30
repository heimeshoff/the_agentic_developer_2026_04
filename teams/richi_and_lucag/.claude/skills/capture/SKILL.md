---
name: capture
description: Idea and task capture skill for this team. Invoke with /capture. Three modes — Quick (fast brain-dump with minimal friction), Deep (structured interview that extracts tasks with acceptance criteria), Refine (cleans up and re-prioritises existing tasks). Reads memory/project/INDEX.md to learn the active project, then loads vision/research/domain artifacts as grounding. Outputs to docs/tasks.md, initialising it if missing. Use whenever the team has new ideas to capture, wants to extract tasks from a conversation, or needs to groom the backlog.
---

# Capture

Manages the team's task backlog in `docs/tasks.md` through three modes.

## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. The active session's `vision.md`, plus any `research.md` or `domain.md` listed under canonical artifacts.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.

## Flow

```
MODE DETECTION → LOAD CONTEXT → CAPTURE → WRITE TO TASKS.MD (transactional)
```

---

## Step 1: Mode detection

Detect mode from the invocation prompt:
- **quick** — fast brain-dump, minimal friction, anything goes
- **deep** — structured extraction, each item gets context + acceptance criteria + priority
- **refine** — read existing tasks, improve wording, fill gaps, re-prioritise

If the mode is absent, ask: *"Quick capture, deep extraction, or refine existing tasks?"*

---

## Step 2: Load context

Resolve and read whichever of the canonical artifacts INDEX lists for the active session: vision, research, domain.

Also read `docs/tasks.md`. If it does not exist, initialise it now using the template below before continuing — this skill no longer punts on the missing file.

Use this context to:
- Validate that captured items are in-scope for the product
- Pre-fill context fields in Deep mode
- Identify duplicates in Refine mode

---

## Step 3A: Quick mode

Tell the user: *"Quick capture — dump everything on your mind. I'll clean it up. Go."*

Accept free-form input — one line or ten paragraphs. When the user signals done (or sends a blank line), convert each distinct idea into a minimal task entry:

```
- [ ] **[Title]** — [one-line description]
```

Show the converted list and ask: *"Anything to add, remove, or rename before I save?"*

---

## Step 3B: Deep mode

For each idea (or for each item already in the backlog if starting from existing context), conduct a brief extraction interview. One item at a time.

Questions per item:
1. *"What needs to be built or decided?"* → Title
2. *"Why does this matter — what user problem does it solve?"* → Context
3. *"How will you know it's done? What does a working version look like?"* → Acceptance criteria
4. *"Priority: High (blocks something), Medium (important but not blocking), or Low (nice to have)?"* → Priority

After 3 items, ask: *"Keep going or save what we have?"*

Each item is formatted as:

```markdown
- [ ] **[Title]** — [one-line description]
  - **Context**: [why this matters to the user or the product]
  - **Acceptance**: [observable, testable definition of done]
  - **Priority**: High / Medium / Low
  - **Source**: deep-capture / YYYY-MM-DD
```

---

## Step 3C: Refine mode

Read `docs/tasks.md`. For each item in Backlog, scan for:
- **Missing fields** — no Context, no Acceptance, no Priority
- **Vague titles** — rewrite to be action-oriented ("Add X" or "Detect Y")
- **Duplicates** — flag and propose merging
- **Stale items** — anything that contradicts the active vision/domain

Present a summary of issues found: *"I found N items with gaps, M possible duplicates, and K that may be out of scope. Walk through them one by one, or accept all suggested fixes?"*

Apply changes only after user confirms each fix (or confirms "accept all").

---

## Step 4: Memory Write Transaction

Write order, no skipping:

1. Save the changes to `docs/tasks.md`. On first write, use the template below.
   - New items from Quick/Deep go into **Backlog**, sorted by Priority (High first).
   - Do not touch **In Progress** or **Done** sections — those are Worker-managed.
   - Add a datestamp comment at the top of the batch: `<!-- captured YYYY-MM-DD -->`
2. Verify the file exists and is non-empty.
3. `docs/tasks.md` is not a project memory artifact — INDEX does not point at it. Skip the INDEX update unless this run also touched a session artifact.
4. Replace `memory/task/state.md` wholesale only if the team's next action changes (e.g., backlog now has a high-priority task that supersedes the current next). Otherwise leave state.md alone.
5. Run the Decision Gate. Append qualifying entries to `memory/project/decisions.md`. Most capture sessions produce zero ADRs; flagging an idea as out-of-scope rarely qualifies.
6. Output any glossary candidates as a `## Glossary Proposals` section in the final response. Do not edit `glossary.md`.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.

Tell the user the path and how many items were added or changed.

---

## Step 5: Decision candidates

End the session with this block:

```
Decision candidates from this session:
1. [candidate] — append: yes/no — reason
2. [candidate] — append: yes/no — reason
```

Backlog edits, priority changes, and renames do not qualify. Only escalations like "we are abandoning feature area X" qualify, and only if that decision has a *why* and a rejected alternative.

---

## tasks.md template

```markdown
# Tasks

_Last updated: YYYY-MM-DD_

---

## Backlog

<!-- Items waiting to be worked. Sorted: High → Medium → Low priority. -->

## In Progress

<!-- Items currently being worked in a worktree. Worker-managed. -->

## Done

<!-- Completed items. Worker-managed. -->
```

---

## Facilitation principles

- **Stay product-relevant.** If a captured idea is out of scope per the active vision.md, flag it: *"This looks outside the current scope — should I capture it as a parking-lot item or skip it?"*
- **Prefer action-oriented titles.** Action verb + object beats noun-only.
- **Don't over-engineer in Deep mode.** Acceptance criteria should be 1–3 bullets, not a full spec.
- **Refine is non-destructive.** Never delete a task in Refine mode — mark as `[DUPLICATE of #X]` or `[OUT OF SCOPE]` and let the user confirm removal.
