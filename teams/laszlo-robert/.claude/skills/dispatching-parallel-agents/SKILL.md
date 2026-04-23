---
name: dispatching-parallel-agents
description: Split independent work across parallel subagents to save time. Use this skill when implementing multiple features, views, or files that don't depend on each other. Trigger when someone says "build these in parallel", "can we do these at the same time", or when the implementation plan has steps that are clearly independent — e.g. building IncomeView and SavingsView simultaneously. Do not use when tasks share state, write to the same files, or when one task's output is another's input.
---

# Dispatching Parallel Agents

The reason to use parallel agents: sequential work on genuinely independent tasks is a waste of wall-clock time. If IncomeView and SavingsView don't share any files and don't depend on each other's output, building them one-after-the-other doubles the time for no reason. Parallel agents do both at once.

The risk: parallel agents that aren't truly independent will clobber each other's work — writing to the same file, making conflicting assumptions about a shared type, or producing results that need reconciliation. The job of this skill is to make that call accurately.

---

## Step 1: Check for true independence

Before spawning anything, verify each task is independent on all three axes:

**Files**: Do the tasks write to any of the same files? If yes — shared types, shared utils, `App.tsx` — they're not independent. One must go first.

**Data**: Does task B need output that task A produces? If a view depends on a hook that hasn't been written yet, the view agent will block or guess wrong.

**Assumptions**: Will both agents need to make the same architectural decision independently? If so, they'll diverge. Pin the decision before spawning (write the shared type, write the shared hook) so agents receive it as input, not something they invent.

If any axis fails, either sequence the tasks or extract the shared part into a prerequisite step done before spawning.

---

## Step 2: Write self-contained agent briefs

Each agent runs cold — it has no memory of this conversation, no context about your stack, no idea what the other agents are doing. A brief that says "build the savings view" will produce something that doesn't fit.

A good brief includes:

- **What to build**: the specific files, the component name, the behaviour
- **Stack and conventions**: Vite + React + TypeScript + Tailwind + shadcn/ui; types from `src/types.ts`; data via `useFinanceData` hook
- **Where to find shared code**: exact paths to types, hooks, utilities it should import (not rewrite)
- **What not to touch**: files outside this task's scope
- **Output to produce**: what files to create or modify, what the result should do

**Example brief structure:**
```
Build the SavingsView for the budgeting app.

Stack: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
Types are in src/types.ts — use SavingsGoal as-is, do not redefine it.
Data hook is in src/hooks/useFinanceData.ts — use the savingsGoals array and addSavingsGoal / updateSavingsGoal helpers.
shadcn components are in src/components/ui/ — import from there.

Create:
- src/views/savings/SavingsView.tsx — list of goals with progress bars
- src/views/savings/SavingsGoalCard.tsx — individual goal card (name, target, current, progress bar, deadline)
- src/views/savings/SavingsGoalForm.tsx — form to add a new goal

Do not modify App.tsx, types.ts, or useFinanceData.ts.
```

---

## Step 3: Spawn in one turn

Dispatch all agents in a single message. Don't spawn the first one, wait, then spawn the second — that's sequential with extra steps. All go out at once, all run in parallel.

After spawning, while agents are running, do useful work: review the plan, draft the next set of tasks, or handle any prerequisite that needs to exist before integration.

---

## Step 4: Integrate the results

When agents complete, review each output before accepting it:

- Does it import from the correct paths?
- Did it introduce any types that duplicate what's already in `types.ts`?
- Does it follow the same conventions as existing code (naming, file structure)?

Reconcile any drift before moving on. Small inconsistencies caught here are much cheaper than hunting them down later.

If two agents produced conflicting assumptions, pick one, update the other to match, and note it for the team.

---

## Good candidates for parallelism in this codebase

| Parallel tasks | Why they're safe |
|---|---|
| IncomeView + SavingsView | Separate files, separate data domains, no shared components |
| InvestmentsView + BudgetView | Same — no overlap |
| Multiple utility functions in `utils.ts` | If each function is self-contained and tests are separate files |
| Vitest test suites for separate modules | Test files never conflict |

## Poor candidates (sequence these instead)

| Sequential tasks | Why |
|---|---|
| types.ts → any view | Views depend on the types being defined first |
| useFinanceData.ts → any view | Views import the hook — it must exist |
| App.tsx wiring → anything it imports | Can't wire what doesn't exist |
