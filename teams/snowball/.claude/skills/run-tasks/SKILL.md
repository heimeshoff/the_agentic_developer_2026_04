---
skill: run-tasks
---

## Goal

Work through `NEXT_TASK.md` one task at a time, spawning a sub-agent for each unchecked item in the current milestone. Each sub-agent implements the task and ticks its checkbox before returning. The next sub-agent always re-reads `NEXT_TASK.md` first so it sees the latest state.

## Steps

Execute these steps in order every time the skill is invoked:

### 1 — Read current board state

Read `NEXT_TASK.md` from the exercise root. Identify:
- The **active milestone**: the first milestone that has at least one `- [ ]` task.
- The **active step**: within that milestone, the first step that has at least one `- [ ]` task.
- The **next task**: the first `- [ ]` item inside the active step.

If all tasks across all milestones are checked, report "All tasks complete. Nothing to do." and stop.

### 2 — Announce intent

Tell the user:
> "Running task: `<task text>` (M? / Step ?)"

### 3 — Spawn the sub-agent

Use the Agent tool with `subagent_type: "general-purpose"` and the following prompt template (fill in the bracketed values before sending):

```
You are implementing one task for the Snowball personal finance app.

TASK: [exact task text from NEXT_TASK.md]
MILESTONE: [M1–M6 label and title]
STEP: [step label, e.g. "Step 2 – Track A – Data layer"]

CONTEXT FILES TO READ FIRST:
- teams/snowball/exercise_one/CLAUDE.md   — product rules, stack, constraints
- teams/snowball/exercise_one/ROADMAP.md  — milestone definitions
- teams/snowball/exercise_one/NEXT_TASK.md — current board state (read this to understand what's already done)

WORKING DIRECTORY: teams/snowball/exercise_one/

DEFINITION OF DONE:
Implement the task fully. When done:
1. Edit NEXT_TASK.md and change the line:
   `- [ ] [task text]`
   to:
   `- [x] [task text]`
   Do not alter any other line in the file.
2. Verify `pnpm dev` still starts without errors (run it in the background, wait 5 s, then kill it).
3. Return a one-paragraph summary of what you built and the checkbox you ticked.

CONSTRAINTS:
- Only implement what the task says. Do not add scope from other tasks.
- Do not break `pnpm dev`. A half-built feature that errors on start is worse than nothing.
- German number formatting (1.234,56 €) on all EUR amounts.
- No auth, no multi-user, no backend process — static SPA only.
- If the task is a verification/sign-off task (starts with "Verify"), run the check and tick the box only if it passes; otherwise report the failure and stop without ticking.
```

### 4 — Wait for the sub-agent to finish

Do NOT spawn the next sub-agent until the current one returns. Tasks are sequential.

### 5 — Report result

After the sub-agent returns, print its summary to the user.

### 6 — Loop

Go back to Step 1. Re-read `NEXT_TASK.md` (the sub-agent may have ticked more than one box if it was trivial). Find the next unchecked task and repeat.

Continue until either:
- The active milestone has no unchecked tasks remaining → report "Milestone M? complete." and stop.
- A sub-agent returns an error or fails to tick its box → report the failure and stop; do not continue automatically.

## Rules

- Never spawn two sub-agents at the same time. Sequential only.
- Never tick a checkbox yourself — only the sub-agent that did the work ticks it.
- Never skip a step. If Step 1 tasks are incomplete, do not start Step 2.
- The sub-agent always reads `NEXT_TASK.md` as its first action so it sees any prior changes.
- If the user interrupts and then re-runs `/run-tasks`, the skill picks up from the first unchecked task — no state outside `NEXT_TASK.md` is needed.
