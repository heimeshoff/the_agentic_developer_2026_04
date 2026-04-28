---
name: feature-pipeline
description: Multi-stage feature development pipeline for the Personal Finance App. Takes a rough feature idea through four stages — clarification (subagent questions), user journeys (subagent), technical plan with architectural decisions (subagent, in parallel with journeys), and parallel implementation by worker subagents. Pauses between stages so you can review before moving on. Use this skill whenever the user describes a feature to build or add and asks to "take it through the pipeline", "build it end-to-end", "do the whole thing", "plan and implement", or explicitly references `.features/`. Also use when the user says "continue the feature pipeline", "resume the feature …", or otherwise points at an in-flight feature folder. Prefer this skill over `feature-request-designer` when the user wants to go past the spec all the way to implementation; prefer `feature-request-designer` when they only want the spec.
---

# Feature Pipeline

A four-stage feature-development workflow for the Personal Finance App. Each stage dispatches one or more subagents, writes a markdown artifact to `.features/<slug>/`, and (except Stage 1) pauses for your review before the next stage starts.

## The four stages

1. **Intake** — capture the idea, derive a slug, create the feature folder.
2. **Clarify** — a subagent produces clarifying questions; you answer before continuing.
3. **Journeys + Plan (parallel)** — two subagents run at the same time:
   - a product subagent describes the user journeys,
   - an architect subagent produces the technical plan, architecture decisions, and task list.

   When both return, you review and approve.
4. **Implement** — worker subagents pick up tasks from the task list and run in parallel within each parallel group.

Each stage ends with a hard pause: do not proceed to the next stage without explicit user confirmation, except Stage 1 → Stage 2 which flows automatically.

## Why this shape

- Subagents keep the main context clean — each one returns a document, not a transcript — and they arrive cold, so they ask about things the in-thread agent would gloss over.
- Gates sit where mistakes are expensive: missing requirements (after clarify) and architectural direction (after plan). Between those, work flows.
- Stage 3 parallelises because journey (behaviour) and plan (structure) are orthogonal views of the same clarified spec — neither needs the other as input. You catch inconsistencies by reading both.
- Stage 4 parallelises because independent implementation tasks scale nearly linearly with worker count. The plan subagent tags which tasks are safe to run concurrently.
- Every artifact is a markdown file under `.features/<slug>/` so it's diffable, reviewable, and commits alongside the code on the team branch.

## Where files go

`.features/<slug>/` lives at the **current working directory** when the pipeline starts — for exercise work that means `teams/attila_enrico/exercise_<n>/.features/<slug>/`. Do not create `.features/` at the repo root or in the team folder; keep features next to the app they belong to.

```
.features/<slug>/
├── 00-intake.md      # Original idea, slug, timestamp, status
├── 01-questions.md   # Clarifying questions + your answers
├── 02-journeys.md    # User journeys (happy path + edge flows)
├── 03-plan.md        # Tech plan, architecture decisions, task list
└── tasks.md          # Live checklist updated during Stage 4
```

Use the `NN-` numeric prefix as written — it makes the folder self-navigating and makes stage detection (for resumes) trivial.

## Stage 1 — Intake

When the user describes a feature idea:

1. Derive a kebab-case `<slug>` of at most four words (e.g. `export-csv`, `recurring-transactions`, `spending-by-month-chart`). Keep it short — you'll type it often.
2. If `.features/<slug>/` already exists, this is a resume — jump to **Resuming** at the bottom. Otherwise create the folder.
3. Write `.features/<slug>/00-intake.md`:

   ```markdown
   # <Feature title in Title Case>

   - **Slug:** <slug>
   - **Created:** <YYYY-MM-DD>
   - **Status:** clarifying

   ## Idea
   <the user's raw description — preserve their wording; light cleanup only>

   ## Source
   <conversation | docs/feature-requests/<slug>.md | …>
   ```

4. **Optional bridge.** If a matching feature-request spec already exists at `teams/attila_enrico/docs/feature-requests/<slug>.md` (or a clearly-related one), note it in the `Source` field and ask the user whether to use that spec as the clarified input and skip Stage 2. If they say yes, copy the spec to `01-questions.md` under a `## Clarified spec (imported)` heading and jump to Stage 3.

Then proceed straight to Stage 2 (no pause).

## Stage 2 — Clarify

Dispatch **one** subagent of type `general-purpose` with a prompt shaped like this:

> You are a product/engineering analyst with no prior context on this conversation. A user has described a feature idea for the Personal Finance App — a personal finance web app where users track incomes and spendings, categorised, with charts. The app is built in Next.js + React + TypeScript.
>
> Read:
> - `.features/<slug>/00-intake.md` — the raw idea
> - `CLAUDE.md` at the repo root and at `teams/attila_enrico/CLAUDE.md` — project context
> - `teams/attila_enrico/exercise_<n>/` — existing code, to ground your questions in what's actually there
>
> Produce **6–12 clarifying questions** that an engineer would need answered before designing and building this feature. Organise them under these section headings, in this order:
>
> - **Scope & users** (who does this for; what's in and out)
> - **Data & state** (new/modified entities, existing-data impact)
> - **UI / UX** (screens, entry points, visible states)
> - **Edge cases & constraints** (limits, failures, empty states)
> - **Non-goals** (what this feature explicitly will not do)
>
> Skip questions that are already obviously answered by the idea or the existing code. Prefer closed-ended questions (A/B/C) where the options are clear. Do not propose solutions or designs — you are collecting requirements, not making decisions.
>
> Return **only** the question list as markdown. Do not preamble, do not summarise, do not save any files.

When it returns:

1. Write the returned markdown to `.features/<slug>/01-questions.md` under a `## Questions` heading, preserving the subagent's numbering.
2. Present the questions to the user in chat, grouped by section. Keep your framing light — let the subagent's questions speak.
3. **Pause.** Wait for the user's answers. Do not proceed to Stage 3 until they've answered or explicitly said "skip".
4. When they answer, append an `## Answers` section to `01-questions.md` with answers keyed to the question numbers. If any answer is ambiguous or introduces a new architecture-affecting choice, ask a short follow-up before continuing — do not silently fill in defaults for architectural questions.
5. Update `00-intake.md`'s **Status** to `journeys-and-plan`.

## Stage 3 — Journeys + Plan (parallel)

Once the questions are answered, dispatch **two subagents in the same tool-call message** so they run in parallel.

### Subagent A — user journeys

- **Type:** `general-purpose` (it needs Write to save its own output)
- **Prompt:**

> You are a product designer writing user-journey specs for the Personal Finance App (Next.js + React + TypeScript web app for tracking incomes and spendings).
>
> Read `.features/<slug>/00-intake.md` and `.features/<slug>/01-questions.md` (both the Questions and the Answers sections). Also read `teams/attila_enrico/CLAUDE.md` for project context.
>
> Write the user journeys for this feature as markdown. For each journey:
> - **Name** (short, specific — e.g. "Add a recurring transaction from the transactions list")
> - **Actor** and **Goal**
> - **Preconditions** (what must be true for this journey to start)
> - **Steps**, numbered, alternating user action and system response
> - **Postconditions** (what's true after the journey completes)
>
> Cover at minimum the **happy path** plus **2–3 important alternative or edge flows** — choose the ones that actually matter for this feature (errors, empty states, permission denials, cancellations, validation failures, etc.). Name edge flows clearly (e.g. "Amount is invalid", "Network fails mid-save").
>
> Be concrete enough that a frontend engineer could lay out the screens from your description alone. Do not propose implementation, API shapes, or data models — journeys are behavioural.
>
> Save the result to `.features/<slug>/02-journeys.md`. Return only a one-line confirmation of the save path; no preamble or summary.

### Subagent B — technical plan

- **Type:** `architect` (read-only by design — it will return the plan content; the main agent writes the file)
- **Prompt:**

> You are a software architect producing an implementation plan for a feature in the Personal Finance App (Next.js + React + TypeScript).
>
> Read `.features/<slug>/00-intake.md` and `.features/<slug>/01-questions.md`. Read `CLAUDE.md` at the repo root and `teams/attila_enrico/CLAUDE.md`. Explore `teams/attila_enrico/exercise_<n>/` to understand the actual code — route structure, component layout, state/data layer, styling conventions.
>
> Produce the plan as a single markdown document with these sections, in this order:
>
> 1. **Summary** — one paragraph: what's being built and the shape of the approach.
> 2. **Architectural decisions** — each decision formatted as:
>    - **Decision:** <the question the architect must answer>
>    - **Options considered:** bulleted, 2–4 options with one-line tradeoffs each
>    - **Recommendation:** which option and why, in one or two sentences
>
>    Cover at least: data model / storage, server-vs-client boundaries, state management, any third-party library choice, and any breaking-change risk to existing code. Skip sections that genuinely don't apply.
> 3. **Affected files / modules** — one line per file or folder, stating the change (new | modify | delete).
> 4. **Risks & unknowns** — things that could go wrong, or that need investigation before implementation starts.
> 5. **Task list** — a numbered checklist of implementation tasks. Group tasks that can safely run concurrently by tagging them `[group-N]`. A task can share a group with another only if **all three** of these hold:
>    - (a) it does not depend on the other task's output,
>    - (b) it does not edit any file the other task also edits,
>    - (c) it does not `import` / reference a symbol from a file the other task is newly creating or renaming.
>
>    Clause (c) is the one that's easiest to get wrong. Worked example: if task X creates `EditTransactionModal.tsx` and task Y creates `TransactionsList.tsx` which imports `EditTransactionModal`, those two CANNOT share a group — task Y's typecheck fails until task X's file is on disk. Put the importer in the next group. Err on the side of sequencing when in doubt; a tight group is better than a broken parallel run.
>
>    Each task should be small enough for one focused subagent to complete (roughly 15–60 minutes of work). For each task, write:
>    - one-line description,
>    - files it will touch,
>    - the group tag.
>
> Do **not** write code. Do **not** save files — return the full markdown as your final message.

When both subagents return:

1. Subagent A will have saved `02-journeys.md` itself. Verify it exists; if not, write it from the returned content (occasionally a worker flakes).
2. Take Subagent B's returned markdown and write it to `.features/<slug>/03-plan.md`.
3. Extract the task list from `03-plan.md` and copy it into `.features/<slug>/tasks.md` as a live checklist:

   ```markdown
   # <slug> — task list
   _Source: `03-plan.md` section 5. Tick items as they complete._

   - [ ] 1. <description> — files: `<…>` — `[group-1]`
   - [ ] 2. <description> — files: `<…>` — `[group-1]`
   - [ ] 3. <description> — files: `<…>` — `[group-2]`
   …
   ```

4. Tell the user both docs are ready. Give a **2–3 bullet** summary of the key architectural decisions (pulling from 03-plan.md section 2) and a one-line summary of the journey count. Ask them to read `02-journeys.md` and `03-plan.md` and approve (or ask for changes).
5. **Pause.** Do not proceed to Stage 4 until the user explicitly approves the plan.
6. If the user requests changes, edit the relevant file yourself (small changes) or re-dispatch the relevant subagent (larger changes), then re-ask for approval. Update `tasks.md` if the task list changes.
7. Once approved, update `00-intake.md`'s **Status** to `implementing`.

## Stage 4 — Implement

1. Read `.features/<slug>/tasks.md` and group tasks by their `[group-N]` tag in numeric order.
2. For each group (starting with `group-1`), dispatch **one `general-purpose` subagent per task in that group, all in the same tool-call message**, so the group runs in parallel. Each worker prompt should look like:

   > You are implementing one task from a larger feature. Do **only** this task — do not touch files or concerns outside its scope.
   >
   > **Task:** <full task description from tasks.md>
   > **Files to edit:** <file list from tasks.md>
   >
   > Background context to read first:
   > - `.features/<slug>/00-intake.md`
   > - `.features/<slug>/02-journeys.md` (for UX/behaviour context)
   > - `.features/<slug>/03-plan.md` (for architectural context; follow the decisions already made — do not revisit them)
   > - `CLAUDE.md` at the repo root and `teams/attila_enrico/CLAUDE.md`
   > - Any existing source files you're about to modify
   >
   > Implementation rules:
   > - Match the project's existing patterns (routing, component shape, styling, state).
   > - Do not invent new architectural decisions — the plan already decided. If you hit an ambiguity the plan didn't cover, stop and report it as a blocker instead of guessing.
   > - Keep your changes minimal to the task. No drive-by refactors, no unrelated formatting changes.
   > - If this task creates or modifies a **test file**, first read the project's test-runner config (`vitest.config.*`, `jest.config.*`, `playwright.config.*`, or the `"test"` script in `package.json`) to confirm which paths the runner discovers. Do not assume `*.test.ts` next to source code works — many projects only match `tests/**` or `__tests__/**`. If the path the plan specified isn't covered by the runner, relocate the test to a path that is (and note it in your report).
   > - If a task in your parallel group is editing files you also need, stop and report the conflict — do not race.
   >
   > When done, report back in this shape:
   > - **Files changed:** bullet list
   > - **Decisions made:** anything you chose beyond what the plan specified (should be very short if anything)
   > - **Blockers / follow-ups:** anything left undone or anything the next task needs to know

3. When the group finishes, update `tasks.md`: tick off completed items and append a one-line note per task if worth capturing (e.g. renamed file, extracted helper). If any worker reported a blocker, **stop the pipeline**, surface the blocker to the user, and wait for direction before continuing.
4. **Verify before moving on.** After every parallel group, run the project's typecheck (e.g. `npx tsc --noEmit`) and its test command (`npm test` or equivalent — look at `package.json`). If either fails, do not move to the next group — fix the breakage first, either inline for small issues (narrowing, missing imports, test-runner path corrections) or by re-dispatching a worker for the task that introduced it. Parallel workers each run their own checks against an incomplete snapshot of the tree, so a whole-group check catches cross-task races their individual checks can't. Skip this step only if the project has no typecheck/test commands configured — and note that in your run summary.
5. Move to the next group. Repeat until all groups are done.
6. After the final group, read the diff (`git status`, `git diff`) and report to the user:
   - What was built, grouped by user journey (not by task) — so the user sees the feature, not the plumbing.
   - Anything that deviated from the plan, with the reason.
   - Any follow-ups workers flagged.
7. Update `00-intake.md`'s **Status** to `implemented`.

Do **not** create a commit, open a PR, or push — leave git actions to the user unless they explicitly ask.

### When to break the parallel rule

Go sequential within a group (or split a group) if:

- A task in the group edits files another task in the group also edits. Race condition; last writer wins and you silently lose changes.
- A task's output is genuinely an input to another task in the same group (the plan got the grouping wrong — note it and fix `03-plan.md` and `tasks.md` before proceeding).
- The group has only one task. Nothing to parallelise.

If you notice the plan's grouping is wrong, fix it in `03-plan.md` and `tasks.md` and tell the user what you changed and why — don't silently rework the plan.

## Resuming

If `.features/<slug>/` already exists when the user asks to work on a feature (either because they said "continue" or just named an in-flight slug):

1. Read every file in the folder.
2. Detect the stage from files present and `00-intake.md` Status:
   - only `00-intake.md` → resume Stage 2
   - `01-questions.md` without `## Answers` → resume Stage 2 waiting for answers
   - `01-questions.md` with answers, no `02-journeys.md`/`03-plan.md` → resume Stage 3
   - `02-journeys.md` and `03-plan.md` exist, `tasks.md` has unchecked items → resume Stage 4 at the first unchecked group
   - all tasks checked → done; ask the user what they want to do next (review, extend, etc.)
3. Confirm with the user before resuming — sometimes they want to redo an earlier stage with new information. Don't assume.

## Conventions

- **Don't rename the slug mid-flight.** File references break.
- **Don't let subagents in Stages 2 and 3 write production code.** If a journeys or plan subagent starts editing `src/` files, that's a prompt-leak — rerun with tighter framing.
- **Keep `.features/` in git.** It's the planning artifact for the team branch and is genuinely useful workshop output even if the feature itself gets abandoned.
- **If a feature-request spec already exists** at `teams/attila_enrico/docs/feature-requests/<slug>.md`, offer to use it as the clarified input (see Stage 1). Don't re-litigate the same questions.
