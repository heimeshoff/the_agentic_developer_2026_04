# Skill: Work

Pick up tasks from the todo queue and implement them one by one.

## Invocation

```
/work                   # Pick up the next task and implement it
/work [task-id]         # Implement a specific task
/work --all             # Keep picking up tasks until the todo queue is empty
```

## Instructions

You execute tasks created by `/capture` (and other planning skills). Work through them sequentially: one task at a time, always moving it through the `todo/` → `in-progress/` → `done/` lifecycle, logging to `.workflow/protocol.md`, and committing when the task is finished.

### Startup

1. Read `.workflow/vision.md` (if it exists) so you understand the overall product direction.
2. Check `.workflow/tasks/in-progress/`:
   - **If a file is there**, a previous session was interrupted. Resume that task instead of picking a new one. Tell the user what you're resuming.
   - **If multiple files are there**, ask the user which one to resume.
3. Otherwise, pick a task:
   - **If a `[task-id]` argument was given**, find that task in `.workflow/tasks/todo/` (match by ID prefix, e.g. `007` matches `007-add-login.md`).
   - **Otherwise**, scan `.workflow/tasks/todo/`, sort by filename (lowest NNN prefix first), and pick the first one.
4. If `todo/` is empty and nothing is in `in-progress/`, report that there's nothing to do and stop. Suggest `/capture` to add new tasks.

### Dependency Check

Before starting a task, read its **Dependencies** field (if present):

- If it lists other task IDs, check that each is present in `.workflow/tasks/done/`.
- If any dependency is not yet done, skip this task and try the next one in `todo/`.
- If every task in `todo/` is blocked, list the blockers and stop.

### Execute One Task

For the selected task:

1. **Move the file** from `.workflow/tasks/todo/` to `.workflow/tasks/in-progress/`.
2. **Log "Task Started"** by prepending to `.workflow/protocol.md`:

   ```markdown
   ## YYYY-MM-DD HH:MM -- Task Started: NNN - [Task Title]

   **Type:** Task Start
   **Task:** NNN - [Title]
   **Milestone:** [milestone reference if any]

   ---
   ```

3. **Read the task file carefully.** Read any research files it references from `.workflow/research/`. Understand the acceptance criteria before writing code.
4. **Implement the task.** Follow existing project conventions. Write code, create files, run tests where appropriate. Stay focused -- don't expand scope beyond what the task specifies.
5. **Append a Work Log entry** to the bottom of the task file:

   ```markdown
   ### YYYY-MM-DD HH:MM -- Work Completed

   **What was done:**
   - [Action 1]
   - [Action 2]

   **Acceptance criteria status:**
   - [x] Criterion 1 -- [how verified]
   - [x] Criterion 2 -- [how verified]

   **Files changed:**
   - [path] -- [what changed]
   ```

6. **Move the task file** from `in-progress/` to `.workflow/tasks/done/` once all acceptance criteria are met.
7. **Log "Task Completed"** by prepending to `.workflow/protocol.md`:

   ```markdown
   ## YYYY-MM-DD HH:MM -- Task Completed: NNN - [Task Title]

   **Type:** Task Completion
   **Task:** NNN - [Title]
   **Summary:** [1-2 sentence summary of what was built]
   **Files changed:** [count]

   ---
   ```

8. **Commit** the task's changes:

   ```
   git add -A && git commit -m "Task NNN: [task title]"
   ```

### If a Task Fails

If acceptance criteria can't be met (tests fail, approach doesn't work, external blocker):

1. Append a Work Log entry describing what was tried and why it failed.
2. Leave the task file in `in-progress/` (do not move it to `done/`).
3. Log the failure to `.workflow/protocol.md`:

   ```markdown
   ## YYYY-MM-DD HH:MM -- Task Blocked: NNN - [Task Title]

   **Type:** Task Blocked
   **Task:** NNN - [Title]
   **Reason:** [Short explanation]

   ---
   ```

4. Stop and ask the user how to proceed. Do not silently move on.

### Loop Behavior

- **Default (`/work` or `/work [task-id]`)**: execute exactly one task, then stop and report what was done.
- **`/work --all`**: after finishing a task, return to Startup and pick the next one. Keep going until `todo/` is empty, a task is blocked, or the user interrupts. Give a brief status update after each task so the user can follow along.

### Completion Summary

When you stop (todo empty, blocked, or single-task mode finished):

1. List what was completed this session (task IDs + titles).
2. Note any tasks still in `in-progress/` (blocked) or skipped due to dependencies.
3. Count remaining items in `todo/` and `backlog/`.
4. Suggest a next step (`/capture` for new ideas, `/work` to continue, etc.).

### Important

- **One task per commit.** Never batch multiple tasks into a single commit -- the protocol and git log should match.
- **Don't modify other task files.** Only the one you're working on.
- **Don't create new tasks while working.** If you spot missing work, note it in the Work Log and suggest `/capture` afterwards.
- **Respect scope.** The acceptance criteria define "done." Don't add features, refactor neighboring code, or polish beyond what's asked.
- **Read research before coding.** If the task references `.workflow/research/` files, read them first -- they exist because prior context matters.
