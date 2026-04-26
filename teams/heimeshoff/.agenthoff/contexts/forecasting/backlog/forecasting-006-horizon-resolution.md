---
id: forecasting-006
title: Horizon resolution — selector value to projection bounds
status: backlog
type: feature
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: []
blocks: [forecasting-007]
tags: [domain-core, projection-input]
---

## Why

The Dashboard horizon selector offers three values: "Rolling 12 months",
"End of year", "Until zero". The projection engine needs concrete date
bounds to iterate over. Translating the selector value into bounds is its
own piece of domain logic with edge cases (year rollover for EOY, no-zero
case for "Until zero" when runway is positive forever within reason).

Isolating this from the projection engine itself keeps the engine simple
and makes the selector logic independently testable.

## What

A pure function (or domain service) that takes:

- The selected horizon value (rolling-12mo | EOY | until-zero)
- Today's date
- Optionally: a reference to the projection result (for until-zero
  resolution)

…and returns a projection window: `{from: today, to: <date or sentinel>}`.

Special cases:

- **Rolling 12 months** — `to = today + 12 months`.
- **End of year** — `to = December 31 of current calendar year`. If today
  is already very near or past that, behavior must be defined (next year?
  clamp to today + 1 day?).
- **Until zero** — `to` = the projected zero-money day for the chosen
  scenario. If the projection never reaches zero within a reasonable
  upper bound (e.g. 5 years), return a "beyond horizon" sentinel; the
  Dashboard renders this as "Beyond horizon" with the projected end
  balance instead of a date (per Prompt 1 in `forecasting-001`).
- The selector value persists across sessions (per Prompt 1).

## Acceptance criteria

- [ ] Pure resolution function `resolveHorizon(horizon, today, projection?)`
      returns `{from: Date, to: Date | 'beyond-horizon'}`. No I/O, no
      side effects.
- [ ] **Rolling 12 months:** `to = today + 365 days` (not "12 calendar
      months" — calendar months drift; 365 is unambiguous). Leap-year
      adds one day in February cycles, accepted.
- [ ] **End of year:** `to = Dec 31 of currentYear` while `today < Dec 31`
      of currentYear; on Dec 31 itself and Jan 1, `to` flips to `Dec 31 of
      currentYear+1`. Concretely: `to = today.month === 12 && today.day ===
      31 ? Dec 31(year+1) : Dec 31(year)`.
- [ ] **Until zero:** each zero-money-day card resolves its own horizon
      independently from its own scenario's projection (per Prompt 1's
      side-by-side equal-weight cards). The pessimistic card uses the
      pessimistic projection's zero-day; the optimistic card uses the
      optimistic's. If a projection's zero-day is past the upper search
      bound (5 years), `to = 'beyond-horizon'`.
- [ ] Upper search bound for "Until zero" is **5 years from today**, hard
      coded for v1. Not user-configurable. Documented in the ADR and in
      the function's doc comment so the constant has a name and a story.
- [ ] "Beyond horizon" sentinel renders in the Dashboard zero-day card as
      "Beyond horizon" + the projected end balance at year+5.
- [ ] Selector value persists across app restarts via SQLite (per
      `forecasting-011`) — single-row `user_preferences` table with
      `horizon TEXT NOT NULL DEFAULT 'rolling-12mo'`.
- [ ] Switching horizon does not require re-entering any other input;
      changing the selector fires `horizon.changed` which feeds the
      recompute scheduler from `forecasting-002`.
- [ ] Unit tests cover: rolling-12mo (incl. leap year), EOY mid-year, EOY
      on Dec 30 vs 31 vs Jan 1, until-zero with positive runway >5y
      (beyond-horizon), until-zero with runway 18 months, until-zero
      independently for pessimistic vs optimistic.

## Notes

### Resolved decisions

- **EOY edge:** flip to next Dec 31 only on Dec 31 itself, not before.
  Picks the simplest rule that's still useful (the user has Dec 31 itself
  to look at year-end before the horizon flips).
- **Until-zero scenario binding:** each card resolves its own. Cards are
  co-equal per Prompt 1; coupling them to a single "more conservative"
  projection would lose information.
- **Upper search bound:** 5 years. Hard coded. If a user's runway is
  >5 years they don't need a zero-day projection — they need a different
  tool. Not configurable in v1.
