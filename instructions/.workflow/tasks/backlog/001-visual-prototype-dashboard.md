# Task 001: Visual prototype — zero-day dashboard + category levers

**Created:** 2026-04-23
**Size:** Medium
**Milestone:** v0 — prototype
**Dependencies:** none

## Goal

Build a foundation-style visual prototype of Runway's two differentiating features — the zero-day dashboard and category lever mode — against hardcoded mock data. This is the first real answer to "does this concept sing?" Everything else (CSV import, manual entry, persistence, agentic categorizer) is deliberately out of scope until this prototype earns the right to continue.

This task also settles the vision's open "tech stack" question by committing to the cheapest-to-reverse option: React + TypeScript + Vite + Tailwind running as a localhost web app. If it feels wrong, we tear it down and try native. If it feels right, we later wrap it in Tauri to satisfy the local-only non-goal.

## Scope

**In scope (build this):**

1. A single-page dashboard that shows:
   - Today's date.
   - Projected **zero-day** as a date + countdown in days, prominent.
   - A time-series chart with two lines from today forward:
     - *Conservative* — cash currently in the account, drawn down by projected spend.
     - *Expected* — cash + sent invoices (weighted by confidence) + subscription baseline.
2. A **category panel** listing spending categories from the mock data, each showing:
   - Current projected monthly spend.
   - A slider (or number input) to adjust that projection.
3. **Live recompute:** dragging a category's slider updates the zero-day date, the countdown, and the chart within 200ms, with no page reload.
4. Hardcoded mock data in a single TypeScript file:
   - ~2 months of fake transactions across 5–8 categories.
   - One invoice in each of the three income states: *Received*, *Invoiced* (with expected pay date + confidence), *Recurring* (subscription baseline as a monthly figure).
   - A starting cash balance.

**Out of scope (don't build this):**

- CSV import (key feature #2 — later task).
- Manual transaction entry UI (key feature #3 — later task).
- Agentic categorizer (key feature #6 — later task).
- Invoice editing — invoices are read-only display from the mock file.
- Persistence of any kind. Refreshing the page resets to the hardcoded defaults.
- Tauri wrapping, packaging, or installer. Runs in the browser via `npm run dev`.
- Real styling polish beyond "legible and not ugly." Tailwind defaults are fine.

## Acceptance criteria

- [ ] `npm install && npm run dev` inside the project folder opens a dashboard in the browser with no errors.
- [ ] The dashboard shows today's date, the projected zero-day as both a date and a day countdown, and the conservative + expected chart lines.
- [ ] The category panel lists all categories from the mock data with their current projected monthly spend and a working slider per category.
- [ ] Adjusting any slider updates the zero-day date, the countdown, and both chart lines within 200ms without a page reload.
- [ ] At least one invoice in each of the three states (Received, Invoiced, Recurring) is represented in the expected-line calculation, and the distinction is visible either in the UI or via a brief inline legend/tooltip.
- [ ] No network calls, no persistence, no build errors, no console errors on first load.

## Tech choices (locked for this task)

- **Framework:** React 18 + TypeScript.
- **Build:** Vite.
- **Styling:** Tailwind CSS.
- **Chart:** Recharts (smallest-friction line chart that plays well with React). Swap allowed if Recharts fights back.
- **Project folder:** `runway/` at the exercise root (same level as `.workflow/`).
- **Package manager:** npm.

## Notes for implementation

- The zero-day calculation is the heart of the prototype. Keep it as one pure function: `computeZeroDay({ cash, invoices, subscriptionBaseline, projectedSpendByCategory }) → { date, dailyBalances[] }`. Everything else — the chart, the countdown, the reactivity — is presentation on top of that function.
- The conservative line ignores invoices and subscriptions. The expected line includes them, applying invoice confidence as a multiplier and assuming the stated expected pay date.
- Mock data should make the two lines visibly diverge, so the point of the "two shapes" income model is obvious at a glance.
- No routing, no state management library. `useState` in the root component is enough at this scale.
