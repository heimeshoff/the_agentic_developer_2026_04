---
name: CSV import
description: Import transactions from bank CSV exports — Runway's primary data path (vision key feature #2)
type: idea
---

# Idea: CSV import

**Captured:** 2026-04-23
**Source:** User input
**Status:** Raw
**Last Refined:** --

## Description

Import of CSV files.

## Initial Thoughts

- Already named in `vision.md` as **Key feature #2**: "CSV import. Primary data path. Drop in a bank export, transactions ingest, duplicates get caught. Targets German banks first (Sparkasse, DKB, N26) — exact format list TBD during research."
- Related research: [`wise-api-and-alternatives.md`](../research/wise-api-and-alternatives.md) landed on CSV export as one of the viable paths when a personal API isn't available — reinforces CSV as the right v1 primary input.
- Non-goal reminder from vision: no bank API / Open Banking integration in v1 — CSV only.
- Currently blocked behind Task 001 (visual prototype on mock data). This idea belongs in the *after-prototype-earns-it* queue.

## Open Questions

- Which exact bank CSV schemas to support first? (Sparkasse, DKB, N26 named in vision — confirm formats.)
- Duplicate detection strategy — hash on (date, amount, description)? Bank-provided transaction IDs where available?
- How is a new CSV format added — config file, auto-detect via column headers, or code change per bank?
- Where does the imported data live — SQLite or plain files? (Also an open question in vision.)
- What UI surface — drag-drop onto the dashboard, a dedicated import screen, or a CLI step?
- Does the categorizer (key feature #6) run inline during import, or as a separate pass?

## Refinement Log
