---
name: worker
description: Task execution skill for the homeowner-fintech personal finance product. Invoke with /worker. Reads docs/tasks.md, lets the user select one task, then creates an isolated git worktree to implement it. One worker, one worktree, one task at a time. Marks tasks in-progress and done. Use whenever the team is ready to move a task from backlog to implementation.
---

# Worker

Picks one task from `docs/tasks.md` and implements it in an isolated git worktree.

## Flow

```
LOAD TASKS → SELECT TASK → BRIEF → ENTER WORKTREE → IMPLEMENT → COMMIT → EXIT → MARK DONE
```

---

## Step 1: Load tasks

Read `teams/richi_and_lucag/docs/tasks.md`.

- If the file does not exist: tell the user to run `/capture` first.
- If Backlog is empty: tell the user there are no tasks to work — suggest `/capture` or `/tactical-ddd`.

Also read any relevant context files that exist:
- `*/vision.md` — to understand the product goal
- `*/domain.md` — to understand the domain model
- `*/tactical-ddd.md` — to understand the intended design

---

## Step 2: Select task

Display the Backlog tasks grouped by priority:

```
HIGH PRIORITY
  [1] Build MortgageAccount aggregate — implement the core aggregate with invariant enforcement
  [2] Implement DetectRefinancingEligibility domain service

MEDIUM PRIORITY
  [3] Add MortgageRepository interface — define persistence contract
  ...

LOW PRIORITY
  [4] ...
```

Ask: *"Which task do you want to work on? Enter the number."*

Wait for the user's selection before proceeding.

---

## Step 3: Brief

Before entering the worktree, show the full task details:

```
Task:       [Title]
Context:    [Why this matters]
Acceptance: [Definition of done]
Priority:   [High / Medium / Low]
Source:     [Where it came from]
```

Ask: *"Any additional context or constraints before I start? (Enter to proceed)"*

Incorporate any extra context the user provides into the implementation plan.

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

---

## Step 5: Enter worktree

Use the `EnterWorktree` tool to create an isolated git worktree for this task.

- Branch name: `task/[kebab-case-title]` (e.g., `task/mortgage-account-aggregate`)
- The worktree isolates all changes — nothing touches the main branch until committed and reviewed

Tell the user: *"Working in isolated branch: task/[branch-name]"*

---

## Step 6: Implement

Work through the implementation in the worktree. Follow these principles:

### Before writing code
1. Explore the existing codebase to understand conventions, folder structure, and patterns.
2. State your implementation plan in 3–5 bullet points and ask: *"Does this approach look right before I start writing?"*
3. Wait for confirmation.

### While writing code
- Follow the ubiquitous language from `domain.md` exactly — class names, method names, variable names must match the domain model.
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

1. Check for type errors: run the project's type checker if one exists.
2. Run tests: `npm test`, `pytest`, `go test ./...`, or whatever fits the stack.
3. If the task touches a UI: describe what to check visually (you cannot open a browser, so instruct the user).

If verification fails: fix the issue before committing. Do not commit broken code.

---

## Step 8: Commit

Commit with a message that follows the repository's existing style. If no style is established, use:

```
[task] [title in sentence case]

[One sentence on WHY this change was made — the business reason, not the technical description.]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Stage only the files changed for this task. Never use `git add -A` or `git add .` without first reviewing what would be staged.

---

## Step 9: Exit worktree

Use the `ExitWorktree` tool to return to the main worktree.

Tell the user:
- The branch name: `task/[branch-name]`
- What was committed (file list)
- What to do next: *"Review the branch, merge when ready, or run `/worker` to pick the next task."*

---

## Step 10: Mark done

Move the task from **In Progress** to **Done** in `docs/tasks.md`:

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

---

## Escalation — when to stop and ask

Stop and surface a question to the user rather than guessing when:
- The acceptance criteria are ambiguous and the interpretation materially affects the implementation
- An existing pattern in the codebase conflicts with the domain model
- The task depends on another task that isn't done yet
- A test is failing and you've tried two fixes without success

Do not silently make consequential decisions. The co-drive model (Claude proposes, human confirms) applies throughout.

---

## One worker, one task

Never attempt to work multiple tasks in parallel. If a task turns out to require splitting:
1. Implement the smallest coherent piece that satisfies a subset of the acceptance criteria.
2. Commit that.
3. Create a follow-up capture item for the remainder via `/capture quick`.
4. Mark the original task done with a note: *"Partial — follow-up captured."*
