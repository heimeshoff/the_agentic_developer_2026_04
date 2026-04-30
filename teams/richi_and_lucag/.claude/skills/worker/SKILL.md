---
name: worker
description: Task execution skill for this team. Invoke with /worker. Reads memory/project/INDEX.md and docs/tasks.md, lets the user select one task, then creates an isolated git worktree to implement it. Reads decisions.md and glossary.md before implementation so chosen names and constraints stay aligned with the team's accepted language and prior commitments. One worker, one worktree, one task at a time. Marks tasks in-progress and done. Use whenever the team is ready to move a task from backlog to implementation.
---

# Worker

Picks one task from `docs/tasks.md` and implements it in an isolated git worktree.

## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. `docs/tasks.md` — the backlog.
4. `memory/project/decisions.md` — prior architectural and product commitments. Contradicting them mid-task is a stop-and-ask moment.
5. `memory/project/glossary.md` — accepted ubiquitous language. Class names, method names, and variable names must match.
6. The active session's `vision.md`, `domain.md`, and `tactical-ddd.md` (whichever exist per INDEX) for product and design context.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.

## Flow

```
LOAD CONTEXT → SELECT TASK → BRIEF → ENTER WORKTREE → IMPLEMENT → COMMIT → EXIT → MARK DONE
```

---

## Step 1: Load context

Execute the Memory Read Contract above. If `docs/tasks.md` is missing, tell the user to run `/capture` first. If Backlog is empty, suggest `/capture` or `/tactical-ddd`.

---

## Step 2: Select task

Display the Backlog tasks grouped by priority:

```
HIGH PRIORITY
  [1] Build [AggregateName] aggregate — implement the core aggregate with invariant enforcement
  [2] Implement [DomainService] domain service

MEDIUM PRIORITY
  [3] Add [AggregateName]Repository interface — define persistence contract

LOW PRIORITY
  [4] ...
```

Ask: *"Which task do you want to work on? Enter the number."*

Wait for the user's selection.

---

## Step 3: Brief

Show the full task details:

```
Task:       [Title]
Context:    [Why this matters]
Acceptance: [Definition of done]
Priority:   [High / Medium / Low]
Source:     [Where it came from]
```

Cross-reference the task against `decisions.md` and `glossary.md`. If the task name or acceptance contradicts an accepted term or a prior ADR, surface the conflict before starting and ask how to proceed.

Ask: *"Any additional context or constraints before I start? (Enter to proceed)"*

Incorporate any extra context into the implementation plan.

---

## Step 4: Mark in-progress

Move the task from **Backlog** to **In Progress** in `docs/tasks.md`:

```markdown
- [~] **[Title]** — [description]
  - **Context**: ...
  - **Acceptance**: ...
  - **Priority**: ...
  - **Source**: ...
  - **Started**: YYYY-MM-DD
```

Worker does not update INDEX — it is not creating or moving session artifacts. INDEX changes are reserved for skills that produce vision/research/domain/tactical artifacts.

Replace `memory/task/state.md` wholesale: `Phase: implementing — task: [Title], branch: task/[kebab]`. Update the `Next action` line to "review and merge `task/[kebab]` once verified."

---

## Step 5: Enter worktree

Use the `EnterWorktree` tool to create an isolated git worktree.

- Branch name: `task/[kebab-case-title]`
- The worktree isolates all changes — nothing touches the main branch until committed and reviewed

Tell the user: *"Working in isolated branch: task/[branch-name]"*

---

## Step 6: Implement

Work through the implementation in the worktree.

### Before writing code
1. Explore the existing codebase to understand conventions, folder structure, and patterns.
2. State your implementation plan in 3–5 bullet points and ask: *"Does this approach look right before I start writing?"*
3. Wait for confirmation.

### While writing code
- Follow the ubiquitous language from `domain.md` and `glossary.md` exactly — class, method, and variable names must match.
- Implement only what the task's Acceptance criteria require. No scope creep.
- Write tests alongside the implementation (unit tests at minimum for domain logic).
- If you hit a decision point where two reasonable approaches exist, surface it: *"I can do X or Y here — X is simpler but Y is more aligned with the domain model. Which do you prefer?"*

### Code quality rules
- No comments that explain *what* — only comments that explain *why* when the reason is non-obvious.
- No dead code, no TODO stubs, no half-finished methods.
- Match existing code style exactly.

---

## Step 7: Verify

Before committing, run whatever verification is available:

1. Type checker, if one exists.
2. Tests: `npm test`, `pytest`, `go test ./...`, etc.
3. UI changes: describe what to check visually — you cannot open a browser.

If verification fails: fix before committing. Do not commit broken code.

---

## Step 8: Commit

Commit with a message that follows the repository's existing style. If no style is established:

```
[task] [title in sentence case]

[One sentence on WHY this change was made — the business reason, not the technical description.]
```

Stage only the files changed for this task. Never use `git add -A` or `git add .` without first reviewing what would be staged.

---

## Step 9: Exit worktree

Use the `ExitWorktree` tool.

Tell the user:
- The branch name
- What was committed (file list)
- Next: *"Review the branch, merge when ready, or run `/worker` to pick the next task."*

---

## Step 10: Mark done (Memory Write Transaction)

Write order:

1. Move the task from **In Progress** to **Done** in `docs/tasks.md`:

   ```markdown
   - [x] **[Title]** — [description]
     - **Context**: ...
     - **Acceptance**: ...
     - **Priority**: ...
     - **Source**: ...
     - **Started**: YYYY-MM-DD
     - **Completed**: YYYY-MM-DD
     - **Branch**: task/[branch-name]
   ```
2. Verify `docs/tasks.md` parses (the moved item appears in Done, not duplicated in Backlog or In Progress).
3. INDEX is unchanged — this skill does not move session artifacts.
4. Replace `memory/task/state.md` wholesale: phase reverts to whatever phase the team is in (typically post-tactical-ddd if tasks remain, or "ready for next phase" if backlog is empty).
5. Run the Decision Gate. Most worker runs produce zero ADRs. If the implementation forced a *new* architectural commitment that was not already in `decisions.md` (e.g., choosing a database driver, selecting an algorithm with foreclosed alternatives), append it.
6. No glossary proposals from a worker run unless implementation surfaced a missing term — flag those for `/domain` or `/tactical-ddd` to formalise.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.

---

## Escalation — when to stop and ask

Stop and surface a question rather than guessing when:
- Acceptance criteria are ambiguous and the interpretation materially affects implementation
- An existing pattern conflicts with the domain model
- The task depends on another task that isn't done yet
- A test is failing and you've tried two fixes without success
- An accepted ADR or glossary term is about to be contradicted

Do not silently make consequential decisions. The co-drive model applies throughout.

---

## One worker, one task

Never attempt to work multiple tasks in parallel. If a task turns out to require splitting:
1. Implement the smallest coherent piece that satisfies a subset of the acceptance criteria.
2. Commit that.
3. Create a follow-up capture item for the remainder via `/capture quick`.
4. Mark the original task done with a note: *"Partial — follow-up captured."*
