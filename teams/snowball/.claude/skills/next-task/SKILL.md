---
skill: next-task
---

## Goal

Read the full ROADMAP.md and the current codebase state, then produce and persist a complete task board in `NEXT_TASK.md` — one file that covers all six milestones, uses checkboxes to track completion, and groups tasks that can run in parallel within each milestone.

## Why It Exists

It's easy to lose track of where you are mid-milestone, or to reach for the wrong thing next (too big, too speculative, already done). A persistent, structured board gives a single source of truth for what is done, what is in flight, and what's next — without having to re-derive it from the code every time.

## Steps

1. Read `ROADMAP.md` to extract every scope item from every milestone (M1–M6).
2. Inspect the codebase to determine which items are already complete (check for existing source files, components, features).
3. Decompose each milestone's scope items into concrete, session-sized tasks.
4. For each milestone, identify which tasks have dependencies on each other and group the independent ones into parallel tracks (Track A / Track B / …). A task that must finish before others become available belongs in its own "sequential" step.
5. Mark completed tasks with `- [x]` and pending tasks with `- [ ]`.
6. Write the result to `NEXT_TASK.md` in the exercise root (overwrite if it exists).

## Output Format

```markdown
# Task Board

_Last updated: YYYY-MM-DD_

---

## M1 — Log it and don't lose it

> Acceptance: [one-line summary of M1 success criteria]

### Step 1 — Must do first (sequential)
- [ ] Task that everything else depends on

### Step 2 — Can run in parallel
**Track A**
- [ ] Task A1
- [ ] Task A2

**Track B**
- [ ] Task B1

### Step 3 — Requires Step 2 complete
- [ ] Final integration / sign-off task

---

## M2 — …

[same structure]
```

## Rules

- Every scope item from ROADMAP.md must appear as one or more tasks — do not skip milestones.
- Tasks must be concrete and session-sized (one sitting, one clear done condition).
- Parallel tracks within a step must be genuinely independent (no shared state dependency).
- Future milestones (beyond the current one) should have tasks listed but not checked — they are a roadmap, not a commitment.
- If the current milestone's acceptance test is already fully satisfied, mark all its tasks `[x]` and note "M? complete" at the top of that section.
- After writing the file, report to the user which milestone is currently active and how many tasks remain in it.
