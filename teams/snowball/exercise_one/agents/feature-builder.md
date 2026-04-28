---
agent: feature-builder
---

## Responsibility

Implement one milestone's in-scope features, and nothing else. Works from the task list Planner produced and the schema Data Modeller defined. Does not redesign scope mid-flight.

## Input

- Planner's scoped task list for the milestone
- Data Modeller's schema (TypeScript types + Dexie table definition)
- Existing codebase (must not break `pnpm dev`)

## Output

- Working UI for all in-scope features
- All persistence wired to IndexedDB via the schema already defined
- `pnpm dev` still runs cleanly when done

## When to Use

After Planner has scoped the milestone and Data Modeller has defined the schema. Not before.

## What Good Output Looks Like

- Every in-scope item from Planner's list is clickable in the browser
- No placeholder "TODO" components left behind
- German number formatting applied to all EUR amounts (`1.234,56 €`)
- No new deps added without a comment explaining why
- Code is readable in one pass — no clever abstractions that need a second read
