# F06 — Demo Data

- **Slug:** demo-data
- **Status:** shipped
- **Created:** 2026-04-23
- **Roadmap row:** [F06](../roadmap.md)
- **Source of truth (full pipeline outputs):** `exercise_one/.features/demo-data/` — intake, questions, journeys, plan, tasks. Do not duplicate that content here; treat the source folder as the canonical record.

## Summary

In-app feature: any logged-in user can populate their own account with ~500 realistic, currency-scaled transactions spread over the last 12 months, and one-click remove them again. Demo rows are tagged with a `source: "demo" | "user"` marker on the transaction schema so removal is precise and safe. A single toggling button in `/app` switches between "Create demo data" and "Remove demo data" based on whether the caller already has demo rows.

Generation algorithm guarantees the running balance stays non-negative at every chronological point — a hard product constraint.

## Key constraints

- ~500 transactions over the last 12 months, currency-scaled per user.
- Realistic-weighted distribution across categories; not uniform random.
- Append-only on create — never wipes user data.
- Idempotence via single toggling button: if demo data exists, the button removes; it never appends a second batch.
- Audit log gets one summary entry per action (`demo_data_created` / `demo_data_removed` with `{ count }`), not 500 per-row entries.

## Decisions

Cross-cutting (top-level ADRs that this feature also relies on):

- [0003 — Append-only audit log](../../decisions/0003-append-only-audit-log.md) — F06 added the `demo_data_created` / `demo_data_removed` discriminated-union variants with `{ count }`.
- [0005 — `withLock` concurrency](../../decisions/0005-withlock-concurrency-last-write-wins.md) — confirmed and reused.

Feature-internal (kept here, not promoted):

- See [decisions.md](decisions.md) for the seven feature-internal architectural decisions (source marker, generation algorithm, currency-scale table, button shape, server-action surface, audit-union extension, has-demo detection).

## Implementation snapshot

- Schema extension: `source: z.enum(["demo","user"]).default("user")` — Zod default backfills legacy rows transparently; no file migration.
- Generator: `src/lib/demoData/generator.ts` — interleaved running-balance-guard algorithm; deterministic under a seeded RNG (Mulberry32).
- Currency scaling: `src/lib/demoData/scales.ts` — per-currency × per-category `{min, max}` lookup, with a `DEFAULT` fallback. HUF/JPY/PLN/CZK bespoke; EUR/USD/GBP/CHF/CAD/AUD share EUR-like; NOK/SEK/DKK share Nordic.
- Server actions: `createDemoDataAction`, `removeDemoDataAction` in `src/actions/demoData.ts`. Reject on idempotence violation with `{ ok: false, error: "already_exists" }`.
- UI: `<DemoDataButton hasDemoData={boolean} />` rendered in `/app/page.tsx`; `hasDemoData` derived from already-loaded transactions (zero extra I/O), re-checked inside `withLock` server-side.
- Tests: 16 generator tests (incl. balance invariant across 5 seeds), 11 lib integration tests, 8 action tests. All groups complete; production build clean.

## Open items

None known. No smoke-test step was tracked for this feature (the equivalent step in F07 is still pending).
