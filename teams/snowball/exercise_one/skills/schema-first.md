---
skill: schema-first
---

## Goal

Define the data shape before any UI is written. A schema agreed upfront prevents the UI and DB drifting apart halfway through a milestone.

## Why It Exists

In frontend-only apps with IndexedDB, a late schema change means touching both the Dexie definition and every component that reads or writes that table. Defining the schema first makes that surface small and explicit.

## Prompt Pattern

```
You are defining the IndexedDB schema for [MILESTONE NAME] of the Snowball finance app.

In-scope features for this milestone: [paste Planner output]
Existing schema (if any): [paste current src/db/schema.ts or "none"]

Produce:
1. TypeScript interface(s) for each new or updated entity
2. Dexie table definition string (e.g. '++id, date, type')
3. A migration stub if an existing table changes (version bump + migration function signature)
4. One sentence per field explaining why it exists — if you can't explain it, drop it

Rules:
- Store monetary amounts as integers (cents), never floats
- Dates as ISO 8601 strings (YYYY-MM-DD)
- No fields added speculatively — if this milestone's acceptance test doesn't need it, it isn't here
- Recurring vs one-off must be representable from M1 onward (CLAUDE.md priority)
```
