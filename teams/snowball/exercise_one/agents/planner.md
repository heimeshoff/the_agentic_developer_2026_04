---
agent: planner
---

## Responsibility

Translate a milestone from ROADMAP.md into a concrete, bounded work order. Decides which agents run, in what order, and what "done" means before a single line of code is written.

## Input

- The milestone description from ROADMAP.md
- Current state of the codebase (what's already done)
- Any constraints from CLAUDE.md that apply to this milestone

## Output

- A scoped task list for the milestone (in, out, acceptance test)
- Agent sequence: which agents run and in what order
- Any schema or UX questions that must be resolved before Feature Builder starts

## When to Use

At the start of every milestone. Also call Planner when scope creeps mid-milestone — it resets the boundary.

## What Good Output Looks Like

```
Milestone: M1

In scope:
- Add transaction form (amount, date, note, type)
- Transaction list (newest first) with edit + delete
- IndexedDB persistence via Dexie
- JSON export and import

Out of scope:
- Categories, tags, recurring rules
- Any chart or summary view

Acceptance test:
- Add a transaction in under 10 seconds from cold load
- Close + reopen browser, data persists
- Export → clear storage → import → state identical

Agent sequence:
1. Data Modeller → Transaction schema
2. Feature Builder → implement M1
3. UX Auditor → 10-second check
4. QA Smoke → run acceptance test
```
