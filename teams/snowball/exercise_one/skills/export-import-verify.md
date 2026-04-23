---
skill: export-import-verify
---

## Goal

Verify that JSON export and import round-trip without data loss after any schema or feature change. Export/import is the only backup and device-transfer mechanism — it must always work.

## Why It Exists

CLAUDE.md requires JSON export/import from day one. Any schema migration or new field is a potential silent breakage: the export might omit a field, or the import might silently drop records. This skill makes that check explicit after every milestone.

## Prompt Pattern

```
You are verifying the export/import round-trip for [MILESTONE NAME] of the Snowball finance app.

Current schema: [paste TypeScript interfaces]
Export format (describe or paste sample JSON): [paste or describe]

Walk through each step and flag any discrepancy:

1. SEED — what data should be in the DB before export? (cover edge cases: zero transactions, max realistic count, special characters in notes, amounts with cents)
2. EXPORT — does the exported JSON include every field in the schema? Any field missing?
3. CLEAR — after clearing IndexedDB, is the app in a clean state?
4. IMPORT — does importing the exported file restore every record exactly? Check: count, amounts, dates, types, notes
5. EDGE CASES — what happens with: empty file, malformed JSON, a JSON file from a previous schema version?

Output: pass / fail per step. For each failure: what was lost or corrupted and why.
```
