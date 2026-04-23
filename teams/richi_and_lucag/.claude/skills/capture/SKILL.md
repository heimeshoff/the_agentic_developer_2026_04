---
name: capture
description: Idea and task capture skill for the homeowner-fintech personal finance product. Invoke with /capture. Three modes — Quick (fast brain-dump with minimal friction), Deep (structured interview that extracts tasks with acceptance criteria), Refine (cleans up and re-prioritises existing tasks). Reads vision.md, research.md, and domain.md as grounding. Outputs to docs/tasks.md. Use whenever the team has new ideas to capture, wants to extract tasks from a conversation, or needs to groom the backlog.
---

# Capture

Manages the team's task backlog in `docs/tasks.md` through three modes.

## Flow

```
MODE DETECTION → LOAD CONTEXT → CAPTURE → WRITE TO TASKS.MD
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

Silently read whichever of these exist under `teams/richi_and_lucag/exercise_one/`:
- `*/vision.md` — the product vision
- `*/research.md` — any research artifacts
- `*/domain.md` — the strategic domain model

Also read `teams/richi_and_lucag/docs/tasks.md` if it exists.

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
  - **Context**: [why this matters to the homeowner or the product]
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
- **Stale items** — anything that contradicts the current vision.md or domain.md

Present a summary of issues found: *"I found N items with gaps, M possible duplicates, and K that may be out of scope. Walk through them one by one, or accept all suggested fixes?"*

Apply changes only after user confirms each fix (or confirms "accept all").

---

## Step 4: Write to docs/tasks.md

Path: `teams/richi_and_lucag/docs/tasks.md`

**On first write**: create the file with full structure (see template below).

**On subsequent writes**:
- New items from Quick/Deep go into **Backlog**, sorted by Priority (High first).
- Do not touch **In Progress** or **Done** sections — those are Worker-managed.
- Add a datestamp comment at the top of the batch: `<!-- captured YYYY-MM-DD -->`

Tell the user the path and how many items were added or changed.

---

## tasks.md template

```markdown
# Tasks

_Product: Homeowner Personal Finance App_
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

- **Stay product-relevant.** If a captured idea is out of scope per vision.md, flag it: *"This looks outside the current scope — should I capture it as a parking-lot item or skip it?"*
- **Prefer action-oriented titles.** "Detect refinancing eligibility signal" beats "refinancing."
- **Don't over-engineer in Deep mode.** Acceptance criteria should be 1–3 bullets, not a full spec.
- **Refine is non-destructive.** Never delete a task in Refine mode — mark as `[DUPLICATE of #X]` or `[OUT OF SCOPE]` and let the user confirm removal.
