# Current State

## Milestone status

| Milestone | Status |
|-----------|--------|
| M1 — Log it and don't lose it | **Complete** |
| M2 — This month at a glance | Not started |
| M3 — Regular vs one-off, and planning next month | Not started |
| M4 — Savings goals | Not started |
| M5 — Debts & loans | Not started |
| M6 — Forecast and net worth over time | Not started |

## What exists

- `src/db.ts` — Dexie schema, version 1, `transactions` table only
- `src/format.ts` — German EUR formatter with inline self-test
- `src/App.tsx` — entire UI in a single component (309 lines), no routing, no component split
- `src/main.tsx` — React entry point

## What is not yet built

- Dashboard / monthly totals
- Categories on transactions
- Recurring transaction templates
- Accounts (savings, investments)
- Debt accounts
- Any routing or navigation
- Any UI component library (all styling is inline)
