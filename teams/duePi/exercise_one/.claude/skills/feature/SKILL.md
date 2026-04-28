---
name: feature
description: Refine and scaffold a feature slice (brainstorm → Gherkin spec → React + TypeScript + localStorage) for team duePi's personal finance & budgeting app from an entry in `teams/duePi/exercise_one/features.md`. Trigger whenever the user runs `/feature`, asks to "build the next feature", "implement track-expenses", "turn this markdown spec into code", "scaffold a feature", "refine a feature before building", or otherwise wants to move an item in `features.md` from pending to implemented. Also trigger when the user adds a new feature description in discussion and asks what's next to build. Use even when `/feature` is not typed verbatim, as long as the intent is to realise a `features.md` entry in the duePi app.
---

# /feature — build a duePi feature slice from features.md

Turn a pending entry in `teams/duePi/exercise_one/features.md` into a runnable vertical slice of the app: a Gherkin spec, TypeScript types, a `localStorage`-backed storage module, and React component(s). Keep `features.md` in sync as the single source of truth for what's planned, in-progress, and done.

Scope is **team duePi's personal finance app only**. Stack is **React + TypeScript + `localStorage`** (see `teams/duePi/exercise_one/CLAUDE.md` for the full stack rationale). Gherkin is **docs-only** — we write `.feature` files as specification and concrete examples, but don't wire a test runner yet.

## Inputs

- **`teams/duePi/exercise_one/features.md`** — the feature tracker. Read it on every invocation.
- **Optional argument** — a feature slug, e.g. `/feature track-expenses`. If present, build that one. If omitted, list pending features and ask which to build next.

If `features.md` doesn't exist, create it using the format below, seeded from the use cases in `teams/duePi/exercise_one/CLAUDE.md`. Confirm the seed list with the user before writing code.

## features.md format

Keep it flat and human-editable. One feature per bullet. Slug first (bold, kebab-case), then a one-line description.

```md
# duePi Features

Legend: `[ ]` pending · `[~]` in-progress · `[x]` done

- [ ] **track-income** — Record salary/income entries with amount, date, category.
- [ ] **track-expenses** — Record expense entries with amount, date, category.
```

Status transitions by swapping the checkbox: `[ ]` → `[~]` → `[x]`. Slugs are stable once work starts — they become folder names. Don't rename.

## Workflow

1. **Read `features.md`.** If missing, create it from `teams/duePi/exercise_one/CLAUDE.md`'s use-case section and ask the user to confirm the seeded list.
2. **Pick the target feature.**
   - Slug given → match case-insensitively. No match → list slugs, ask.
   - No slug given → list `[ ]` pending features, ask which to build.
3. **Sanity check the app scaffold.** If `teams/duePi/exercise_one/app/package.json` doesn't exist, stop: we can't scaffold into a missing React app. Offer to bootstrap it first with `npm create vite@latest app -- --template react-ts` inside `teams/duePi/exercise_one/`, then resume.
4. **Brainstorm & refine the feature with the user.** This is an interactive step — do **not** skip to code, even if the feature looks obvious. The one-line entry in `features.md` is almost never enough to build from. Produce:
   - **Refined description** — 2–4 sentences capturing the user value *and* the mechanics. Go beyond the one-liner.
   - **In scope** — 3–6 concrete bullets of what this slice will include. If a bullet feels fuzzy, sharpen it or drop it.
   - **Out of scope** — bullets of what this slice will explicitly NOT include, even if tempting. Tag each as either `(later)` — parked as a follow-up feature — or `(never)` — conscious product decision.
   - **Gherkin scenarios (draft)** — 3–6 full `Scenario:` blocks with concrete `Given/When/Then` steps, real numbers, and realistic categories. These *are* the acceptance criteria in executable-example form. Do not show bullet-point summaries as a substitute — the actual `Given/When/Then` is what pins down behaviour, and it's what the user needs to validate. Include at minimum: the golden path, a persistence scenario, the main edge case from `features.md`, and any constraint surfaced during refinement (validation rules, allowed values, empty state).
   - **Open questions** — anything ambiguous. Ask the user; do not guess on their behalf.

   Present **all of the above**, including the full Gherkin scenario drafts, back to the user in one compact message, and **pause for confirmation or edits** before moving on. The user must see and validate the concrete scenarios before any code is written — this is the single most important checkpoint in the workflow. Any `(later)` out-of-scope items must be appended to `features.md` as new `[ ]` entries in the same step, so nothing is lost. The confirmed scenarios are used verbatim in step 7.
5. **Flip status to in-progress** (`[ ]` → `[~]`) in `features.md`. Only after refinement *and* the Gherkin scenarios are confirmed — the checkbox flipping marks committed scope.
6. **Check the slice is still one slice.** If the refined scope reads like an epic (2+ screens, unrelated sub-flows), jump to the "When the feature is bigger than one slice" section below — don't force it.
7. **Write the Gherkin spec file** using the scenarios confirmed in step 4 **verbatim**, with the refinement captured as the comment header (see template below). Do not invent new scenarios here — if a gap becomes obvious while coding, loop back to the user rather than quietly adding scenarios they never saw.
8. **Write `types.ts` → `storage.ts` → `<Name>.tsx` → `index.ts`**, in that order. Dependencies flow downward.
9. **Wire the component into the app** so it's reachable (update `src/App.tsx` or the current router/entry point). A feature that isn't rendered isn't done.
10. **Flip status to done** (`[~]` → `[x]`).
11. **Report** what was created, where, and suggest the next pending feature — or ask for feedback to refine this one.

## Output layout

For a feature with kebab-case slug `<slug>` and PascalCase `<Name>`:

```
teams/duePi/exercise_one/app/src/features/<slug>/
├── <slug>.feature        Gherkin scenarios (docs + examples, no runner)
├── types.ts              Types for entities in this slice
├── storage.ts            localStorage read/write, versioned schema
├── <Name>.tsx            React component(s) for the UI
└── index.ts              Barrel export
```

If a feature has more than one screen, add more `.tsx` files in the same folder rather than nesting deeper. Keep related code co-located — don't scatter a feature across `components/`, `hooks/`, `utils/`.

## Template: `<slug>.feature`

Start with a comment header that captures the refinement from step 4 (description, in/out of scope, acceptance criteria). Then one `Feature:` block with a short narrative, and one `Scenario:` per acceptance criterion. Cover at minimum: the golden path, at least one persistence scenario (reload / reopen browser), and the main edge cases the user called out during refinement. Use realistic numbers and the seeded category list from `CLAUDE.md` (`hobbies`, `food`, `rents`, `transport`, `insurance`, `salary`).

```gherkin
# Refined: Let the user record individual expense entries (amount, date,
# category from the seeded list) and see them listed chronologically, so
# they can answer "where did my money go this month?".
#
# In scope:
#   - Record a single expense (amount, date, category)
#   - Show a chronological list of recorded expenses
#   - Persist expenses across reloads via localStorage
#
# Out of scope (later):
#   - Editing or deleting an expense
#   - Filtering / sorting the list
#   - Monthly totals view
# Out of scope (never, for this app):
#   - Bank integrations, multi-user sync
#
# Acceptance criteria are encoded one-to-one as the Scenarios below.

Feature: Track expenses
  As a duePi user
  I want to record expenses with amount, date, and category
  So that I can see where my money goes

  Scenario: Record a single expense
    Given I am on the expenses page
    When I enter an expense of 42.50 on 2026-04-15 in category "food"
    And I save the entry
    Then the expense appears in the expense list
    And the total spend for April 2026 increases by 42.50

  Scenario: Persist across reload
    Given I have recorded an expense of 12.00 for "transport"
    When I reload the page
    Then the expense is still listed
```

## Template: `types.ts`

Start with the smallest type that supports the scenarios. Add fields only when a scenario forces them.

```ts
export type Category =
  | 'hobbies' | 'food' | 'rents' | 'transport' | 'insurance' | 'salary';

export interface Expense {
  id: string;       // crypto.randomUUID()
  amount: number;   // major currency unit, positive
  date: string;     // ISO yyyy-mm-dd
  category: Category;
}
```

Before re-declaring a type, check sibling features — `Category`, `Money`, and similar shared primitives likely already exist. If a type is clearly shared, promote it to `teams/duePi/exercise_one/app/src/shared/types.ts` and import from there.

## Template: `storage.ts`

Every feature gets its own `localStorage` key (`duepi:<slug>`) wrapped in a **versioned envelope**, so future migrations are possible without a big-bang rewrite.

```ts
import type { Expense } from './types';

const KEY = 'duepi:expenses';
const VERSION = 1;

interface Envelope<T> {
  version: number;
  items: T[];
}

export function loadExpenses(): Expense[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Envelope<Expense>;
    if (parsed.version !== VERSION) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

export function saveExpenses(items: Expense[]): void {
  const envelope: Envelope<Expense> = { version: VERSION, items };
  localStorage.setItem(KEY, JSON.stringify(envelope));
}
```

Don't merge multiple features under one envelope — keeping them separate lets each feature's schema evolve independently.

## Template: `<Name>.tsx`

One component per slice, single file, until the component clearly wants splitting. Keep storage calls behind a thin effect so the UI stays declarative.

```tsx
import { useEffect, useState } from 'react';
import { loadExpenses, saveExpenses } from './storage';
import type { Expense } from './types';

export function TrackExpenses() {
  const [items, setItems] = useState<Expense[]>(() => loadExpenses());
  useEffect(() => { saveExpenses(items); }, [items]);
  // form state, handlers, rendering below
  return (/* form + list */);
}
```

## Template: `index.ts`

```ts
export { TrackExpenses } from './TrackExpenses';
```

## Keeping features.md in sync

The tracker only stays useful if it reflects reality.

- **New feature surfaces in discussion?** Append it as `[ ]` with a one-line description before diving into code. Don't leave it in chat history.
- **Built feature reveals sub-work?** Append the sub-items as separate `[ ]` entries, optionally noting the parent. Example: `[ ] **expense-filters** — Filter expense list by category and date range (split out of track-expenses).`
- **Feature abandoned?** Move it under a `## Abandoned` section with a one-line reason — never silently delete. Future teammates (and future-you) need the context.

## What NOT to do

- **Don't scaffold a test runner** (cucumber-js, playwright-bdd, vitest-cucumber). The team decided Gherkin is docs-only for now. Revisit only when the user explicitly asks.
- **Don't add routing libraries, state managers, UI kits, CSS frameworks, or new dependencies** unless the feature genuinely cannot work without them — and even then, flag it and ask first.
- **Don't touch other teams' folders.** This skill is scoped to `teams/duePi/exercise_one/` only.
- **Don't reinvent shared helpers** across feature folders. If two features clearly need the same thing (same shape, same logic), promote to `teams/duePi/exercise_one/app/src/shared/` once — not on the first duplicate, on the obvious second.
- **Don't write backend, auth, or bank-integration code.** `localStorage` only. One device, one user. (See `CLAUDE.md` → "Out of scope".)

## When the feature is bigger than one slice

If a `features.md` entry reads more like an epic than a slice (e.g. "budgeting with groups and alerts and rollover"), don't try to build it all at once. Propose a split into 2–4 concrete sub-features, append them to `features.md` as new `[ ]` entries, mark the original as abandoned-in-favor-of-split, and ask which sub-feature to build first. The whole point of the tracker is to make this visible.

## Iteration mindset

This skill was drafted from discussion, not from evals. When the user pushes back on something a scaffolded feature produced, prefer **updating the templates in this SKILL.md** over hand-patching the one feature — the next `/feature` invocation should benefit from the same lesson.
