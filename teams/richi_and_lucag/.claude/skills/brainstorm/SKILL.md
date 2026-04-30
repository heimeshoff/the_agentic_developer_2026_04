---
name: brainstorm
description: Vision refinement skill for this team. Invoke with /brainstorm. Reads memory/project/INDEX.md to learn the active project and either loads the active vision or starts a fresh one. Leads a structured interview to co-create or update vision.md — covering problem framing, target users, value proposition, key capabilities, and success signals. Use whenever the team is starting a new initiative or pressure-testing direction.
---

# Brainstorm

Produces a `vision.md` artifact through a structured interview. The product domain is whatever the active session in INDEX.md describes — never assume a fixed domain.

## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. The active session's `vision.md` (resolved from INDEX), if one exists.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.

## Flow

```
RESOLVE ACTIVE VISION → INTERVIEW → SYNTHESIZE → SAVE ARTIFACT (transactional)
```

---

## Step 1: Resolve active vision

Read INDEX.md. If a `vision.md` is listed under canonical artifacts:
- Read it, summarise what's there in 2–3 sentences, then ask: *"Refine the existing vision, or start a fresh session?"*

If none exists in INDEX:
- Proceed directly to the interview. A new session folder will be created on save.

If "fresh session" is chosen, the existing session is marked `superseded` in INDEX during the write transaction (Step 4).

---

## Step 2: Interview

The goal is to surface the sharpest possible answer to: **What does this product do, for whom, and why does it matter?**

Work through these question clusters **one at a time**. Wait for the user's answer before moving to the next. Do not batch multiple clusters in one turn.

### Cluster A — The Problem
1. *"What is the core problem this product solves? Describe it in plain language, as if talking to that user."*
2. *"When does this problem hurt most — what's the specific moment or trigger that makes the user feel it?"*

### Cluster B — The User
3. *"Who is the primary user?"*
4. *"What does this user currently do — spreadsheet, an existing app, nothing? What's broken about that?"*

### Cluster C — The Value
5. *"Finish this sentence: 'This app is the only one that _______.'"*
6. *"What's the single most important thing a user should be able to do on day one?"*

### Cluster D — Success
7. *"How will you know in 6 months that this product is working? What does a successful user look like?"*

### Cluster E — Scope guard
8. *"What is explicitly out of scope — things you'll never build, even if users ask?"*

After all clusters, do a brief synthesis pass: *"Here's what I heard — [3-bullet summary]. Does this feel right, or is anything off?"* Adjust until the user confirms.

---

## Step 3: Synthesize

Draft `vision.md` from the confirmed interview. Rules:
- **No fluff.** Every sentence must be load-bearing.
- **User's language.** Use their words, not product-marketing words.
- **Concrete over abstract.** Specific behaviour beats generic "helps users save money."
- **Decisions are decisions.** Out-of-scope items belong in the Out of Scope section, not footnotes.

---

## Step 4: Memory Write Transaction

Write order, no skipping:

1. Save the artifact:
   - For a refinement: overwrite the active session's `vision.md`.
   - For a fresh session: create `exercise_one/YYYY-MM-DD-<scope-slug>/vision.md` (today's date, 2–4 word kebab-case slug).
2. Verify the file exists and is non-empty.
3. Update `memory/project/INDEX.md`:
   - For a fresh session: add the new session row with `status: active`. Mark the previous active session `superseded` and record `supersedes` on the new vision pointer.
   - For a refinement: leave session lifecycle untouched; refresh the vision pointer's date if needed.
   - Recompute `Canonical artifact set complete` and update `Last reindex` if you reconciled disk state.
4. Replace `memory/task/state.md` wholesale with the new snapshot (phase = post-vision, next action = `/research` or `/domain`).
5. Run the Decision Gate. Append qualifying entries to `memory/project/decisions.md`. Common candidates here: out-of-scope items that foreclose a future product direction.
6. Output any glossary candidates as a `## Glossary Proposals` section in the final response. Do not edit `glossary.md`.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.

---

## Step 5: Decision candidates

End the session with this block:

```
Decision candidates from this session:
1. [candidate] — append: yes/no — reason
2. [candidate] — append: yes/no — reason
```

Only `append: yes` candidates are written to `decisions.md`. A scope-out decision qualifies when it forecloses a real alternative ("we will not do tax filing — chose financial flow over financial compliance"). Vague preferences do not qualify.

---

## vision.md template

```markdown
# Vision: [Short product name or initiative title]

_Date: YYYY-MM-DD_

---

## Problem

[The specific problem this product solves, in the user's language. The trigger moment. Why now.]

## User

[Who they are. What they currently use and why it fails them.]

## Value Proposition

[The one thing this product does that nothing else does. One paragraph max.]

## Day-One Capability

[The single most important thing a user can do on first use.]

## Success Signal

[What a successful user looks like in 6 months. Concrete, observable.]

## Out of Scope

[Explicit list of things this product will never do, even if users ask.]

## Open Questions

[Unresolved questions to carry into /research or /domain.]
```
