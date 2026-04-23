# Task Board

_Last updated: 2026-04-23_

---

## M1 — Log it and don't lose it

> Acceptance: Add a transaction in <10 s; data survives a browser reload; export → clear → import restores identical state; runs as a static build.

### Step 1 — Scaffold (must finish before anything else)
- [x] Init pnpm + Vite + TypeScript project; install Dexie; verify `pnpm dev` serves a blank page

### Step 2 — Can run in parallel

**Track A — Data layer**
- [x] Define Dexie DB schema v1 with all M1 fields: `id`, `amount`, `date`, `note`, `type` (income/expense)
- [x] Wire "Add Transaction" form → Dexie `add()` → transaction appears in a raw list below

**Track B — Formatting utility**
- [x] Implement German number formatter (`1.234,56 €`) and cover it with a few inline assertions

### Step 3 — Requires Step 2 complete

**Track A — List features**
- [x] Replace raw list with formatted list view: newest-first, German amounts, delete button per row
- [x] Add inline edit for each transaction row

**Track B — Backup**
- [x] JSON export: button downloads all Dexie rows as a `.json` file (strip internal Dexie fields)
- [x] JSON import: file-upload input parses the JSON, shows a confirmation dialog, replaces DB contents

### Step 4 — Sign-off (requires Step 3 complete)
- [x] Static build check: `pnpm build` produces a `dist/` folder that opens correctly when served by any static file server

---

## M2 — This month at a glance

> Acceptance: Current-month net visible on load with zero interaction; switch months in one click; no horizontal scroll on phone-width viewport.

### Step 1 — Must do first
- [ ] Add a Dashboard route as the app's landing page (replace or wrap the current transaction list)

### Step 2 — Can run in parallel

**Track A — Monthly aggregates**
- [ ] Compute current-month income, expenses, and net from Dexie data and display as summary cards
- [ ] Add a month navigator (← / →) that recomputes totals for the selected month

**Track B — Mini feed**
- [ ] Show the latest 5–10 transactions on the dashboard with a "See all" link to the full list

### Step 3 — Polish & responsive
- [ ] Verify layout on a 375 px viewport; fix any horizontal overflow

---

## M3 — Regular vs one-off, and planning next month

> Acceptance: Adding a recurring item and confirming it next month costs no more keystrokes than a fresh one-off; dashboard shows regular-vs-one-off split; deleting a one-off doesn't touch its template.

### Step 1 — Must do first
- [ ] Add `category` field to Dexie schema (v2 migration); seed a default category list; wire category picker to the Add Transaction form

### Step 2 — Can run in parallel

**Track A — Recurring templates**
- [ ] Add `recurring` flag and `cadence` (monthly/quarterly/yearly) to transactions; store as a template row, not as pre-materialised future rows
- [ ] "Next month" view: list upcoming recurring templates; one-click "confirm" creates an actual transaction

**Track B — Dashboard breakdown**
- [ ] Add regular-vs-one-off split to the monthly dashboard (two sub-totals under expenses)
- [ ] Add category breakdown chart/list to the monthly dashboard

### Step 3 — Sign-off
- [ ] Verify: deleting a confirmed transaction leaves its source template intact; deleting the template leaves confirmed transactions intact

---

## M4 — Savings goals

> Acceptance: Update a balance in two fields; goal progress visible from dashboard without opening accounts view; historical snapshots are stored.

### Step 1 — Must do first
- [ ] Add `accounts` Dexie table: `id`, `name`, `type` (savings/investment), `target?`; add `balance_snapshots` table: `accountId`, `balance`, `date`

### Step 2 — Can run in parallel

**Track A — Account management**
- [ ] Accounts list view: create, rename, delete accounts
- [ ] "Update balance" form (two fields: account + new balance) → writes a snapshot row

**Track B — Dashboard card**
- [ ] Dashboard summary card: total savings + nearest goal progress bar

### Step 3 — Sign-off
- [ ] Verify: opening accounts view shows a chronological balance history per account (needed by M6)

---

## M5 — Debts & loans

> Acceptance: Log a repayment in <10 s; dashboard shows single "total owed" figure; debt with scheduled payment surfaces in the M3 next-month plan.

### Step 1 — Must do first
- [ ] Add `debt_accounts` Dexie table: `id`, `name`, `principal`, `currentBalance`, `interestRate`, `scheduledPayment?`; reuse `balance_snapshots` with a `kind` discriminator

### Step 2 — Can run in parallel

**Track A — Debt management**
- [ ] Debt accounts list: create, edit, delete
- [ ] "Log repayment" form → updates current balance + writes a snapshot

**Track B — Dashboard & planning**
- [ ] Dashboard summary card: total owed + next scheduled payment
- [ ] Surface debts with a scheduled payment on the M3 "next month" plan view

### Step 3 — Progress indicator
- [ ] Per-debt progress bar: % paid off and remaining balance

---

## M6 — Forecast and net worth over time

> Acceptance: Forecast updates immediately on recurring-item change; net-worth chart has monthly granularity with no gaps over a full year; all four framing questions answered from the landing page without menu-diving.

### Step 1 — Must do first
- [ ] Decide and wire a charting library (e.g. Chart.js or Recharts); render a static placeholder chart to validate the dependency

### Step 2 — Can run in parallel

**Track A — 12-month forecast**
- [ ] Forecast engine: derive month-by-month projected net from recurring income, recurring expenses, and scheduled debt payments
- [ ] Forecast view: month-by-month table/chart of projected net and cumulative cash; updates live when recurring items change

**Track B — Net worth chart**
- [ ] Net worth computation: `sum(savings snapshots) − sum(debt snapshots)` grouped by month
- [ ] Net worth chart: plot over all available months; no gaps allowed

### Step 3 — Export completeness
- [ ] Extend JSON export/import to include accounts, debt accounts, balance snapshots, and recurring templates — verify full round-trip

### Step 4 — Landing-page sign-off
- [ ] Audit landing page: all four questions (*this month / next month / savings goals / 12-month forecast*) answerable without menu-diving; fix any that require navigation
