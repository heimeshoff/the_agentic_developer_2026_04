# Roadmap

Six milestones. Each one leaves the app more useful than the last — you could stop after any of them and still have something worth opening every week. Ordering follows the priorities in `CLAUDE.md`: income and expenses first, then savings, then debt, then forward-looking views.

The north star for every milestone: *open app, do the thing, close app, under 10 seconds*. If a milestone breaks that, it isn't done.

---

## M1 — Log it and don't lose it

**Goal:** Replace the paper spreadsheet's core function. You can record an income or expense transaction, see the list of what you've recorded, and back it up.

**Scope:**
- Single "add transaction" form: amount (EUR), date (defaults to today), note, type (income / expense).
- List view of all transactions, newest first, with delete + edit.
- Persistence in IndexedDB.
- JSON export (download) and import (upload, replaces current DB after confirmation).
- German number formatting (`1.234,56 €`).

**Success criteria:**
- A transaction can be added in under 10 seconds from a cold app load.
- Closing and reopening the browser preserves all data.
- Export → clear storage → import restores an identical state.
- Runs as a static build deployed from `dist/`.

---

## M2 — This month at a glance

**Goal:** Answer *"where do we stand this month?"* without scrolling or filtering.

**Scope:**
- Dashboard view as the app's landing page.
- Current-month totals: income, expenses, net.
- Quick toggle to previous months.
- Mini list of the latest 5–10 transactions with a link into the full list.

**Success criteria:**
- On opening the app, the current-month net is visible without any interaction.
- Switching between months takes one click.
- Works on a phone-width viewport without horizontal scroll.

---

## M3 — Regular vs one-off, and planning next month

**Goal:** Separate the predictable (salary, rent, subscriptions) from the noise (a one-off refund, a gift), and let you roll recurring items forward into a plan for next month.

**Scope:**
- Categories on transactions (seed list, user-editable).
- Mark a transaction as **recurring** with a cadence (monthly / quarterly / yearly) — stored as a template, not as pre-materialised future rows.
- "Next month" view: shows upcoming recurring items; one click to confirm each as an actual transaction when it happens.
- Breakdown-by-category on the monthly dashboard.

**Success criteria:**
- Adding a recurring transaction and then confirming it next month takes no more keystrokes than adding a fresh one-off would.
- Current month's dashboard shows a regular-vs-one-off split.
- Deleting a one-off does not touch the recurring template, and vice versa.

---

## M4 — Savings goals

**Goal:** Track savings and investment balances, and show progress toward named goals (*emergency fund, holiday, new car*).

**Scope:**
- "Accounts" concept for savings/investments: name, current balance, optional target.
- Manual balance updates (enter the new balance, app records a snapshot with the date).
- Goal progress bar per account with a target.
- Summary card on the dashboard: total savings + nearest goal progress.

**Success criteria:**
- Updating a savings balance takes no more than two fields (account, new balance).
- Goal progress is visible from the dashboard without opening the accounts view.
- Historical balance snapshots are kept (needed for M6).

---

## M5 — Debts & loans

**Goal:** Mirror the savings view for the other side of the ledger: what's owed, to whom, at what rate, and how repayment is going.

**Scope:**
- Debt accounts: name, original principal, current balance, interest rate, optional scheduled monthly payment.
- Log a repayment — updates the balance and records a snapshot.
- Progress indicator (% paid off, remaining balance).
- Dashboard summary card: total debt, next scheduled payment.

**Success criteria:**
- Logging a repayment takes under 10 seconds.
- Dashboard shows a single "total owed" figure alongside the savings figure.
- A debt with a scheduled payment surfaces on the "next month" plan from M3.

---

## M6 — Forecast and net worth over time

**Goal:** Answer the two forward- and backward-looking questions: *what will next year look like if nothing changes?* and *are we better off than a year ago?*

**Scope:**
- 12-month forecast derived from recurring income, recurring expenses, and scheduled debt payments. Month-by-month projected net and cumulative cash.
- Net worth chart: `sum(savings/investment balances) − sum(debt balances)` plotted over time, using the snapshots from M4/M5 and monthly nets from M1–M3.
- Export includes everything (transactions, accounts, snapshots, templates) so the charts survive a restore.

**Success criteria:**
- Forecast updates immediately when a recurring item is added, edited, or removed.
- Net-worth chart shows at least monthly granularity and has no gaps across a full year of use.
- The ROADMAP's original framing questions are all answered without menu-diving from the landing page: *this month*, *next month*, *savings goals*, *12-month forecast*.

---

## Explicitly not on the roadmap

Per `CLAUDE.md`: no multi-user, no logins, no bank APIs or CSV imports, no multi-currency, no mobile packaging, no cloud sync. If any of these start feeling necessary, that's a signal to pause and talk before building, not to quietly add them.
