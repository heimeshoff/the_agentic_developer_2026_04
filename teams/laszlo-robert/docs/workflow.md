# Team Workflow — Laszlo & Robert

How we (Laszlo, Robert, and Claude) collaborate on workshop exercises. Load this file when planning, starting a feature, reviewing, or merging.

## Branching

- `laszlo-robert` is the long-lived team branch. Never commit directly to `main`.
- For non-trivial work, cut a short-lived feature branch off `laszlo-robert` (e.g. `laszlo-robert/budget-view`) and merge back with `--no-ff`.
- Never fast-forward a team branch into `main`.
- Claude may use git worktrees (`superpowers:using-git-worktrees`) for isolated work.

## Before writing code

- **Brainstorm first** (`superpowers:brainstorming`) for any new feature. Lock intent → requirements → rough design before touching files.
- **Write a plan** (`superpowers:writing-plans`) for multi-step work. Human reviews the plan, Claude executes it.

## While writing code

- **TDD** (`superpowers:test-driven-development`) for logic-heavy code (budget math, categorisation rules). Skip for pure UI polish.
- **Parallel subagents** (`superpowers:dispatching-parallel-agents`) when tasks are genuinely independent.
- Short progress updates from Claude. Redirect early if off-course.

## Before claiming done

- **Verification before completion** (`superpowers:verification-before-completion`). Run typecheck, build, and the app itself. Show evidence, don't assert.
- For UI: open it in the browser and exercise the golden path + obvious edge cases before reporting back.

## Review & merge

- **Code review** (`superpowers:requesting-code-review` / `receiving-code-review`) before merging feature branches back to `laszlo-robert`.
- `--no-ff` merge. Commit messages explain the *why*, not the *what*.

## Pairing shape

- Whoever is typing drives the conversation.
- If one of us takes a specific role for a session (product owner, reviewer, etc.), say so explicitly and Claude will honour it.
