# Demo Data — User Journeys

This document describes the behavioural user journeys for the "Demo Data" feature of the Personal Finance App. It covers the happy path (populating an empty dashboard) plus the most important alternative and edge flows. Journeys are behavioural only — no implementation, API shapes, or data models.

Conventions used below:
- "the dashboard" refers to the `/app` page (balance, transactions list, any charts/graphs).
- "the demo control" refers to the single button in the `/app` header that toggles between two labels: **"Create demo data"** (when no demo rows exist for the current user) and **"Remove demo data"** (when at least one demo-tagged row exists for the current user).
- "the user's own data" means any transactions the user created manually (not tagged as demo).

---

## Journey 1 — First-time user populates an empty dashboard

**Actor:** A logged-in user who has never added a transaction.
**Goal:** See what the app looks like with realistic data without manually entering 500 rows.

**Preconditions:**
- User is logged in and viewing `/app`.
- User has zero transactions of any kind (no real, no demo).
- User has already picked a currency during registration.
- The dashboard shows an empty state: balance `0`, empty transactions list, empty/placeholder charts.

**Steps:**
1. **User:** Lands on `/app`. Sees the empty-state dashboard and the demo control in the header labelled **"Create demo data"**.
2. **System:** Renders the empty state. The demo control is enabled. No "Remove demo data" button is visible.
3. **User:** Clicks **"Create demo data"**.
4. **System:** Disables the button immediately and shows an inline busy indicator on it (spinner + label like "Creating…"). The rest of the page remains interactive but the transaction list visibly shows a loading state (or remains empty until the refresh completes).
5. **System:** After generation completes, shows a success toast: *"Demo data created — 500 transactions added over the last 12 months."*
6. **System:** Refreshes the dashboard automatically. Balance updates to a positive (non-zero, non-negative) amount in the user's currency. The transactions list now shows demo transactions sorted by date (most recent first), each visually tagged as "demo" (e.g. a subtle badge or muted colour). Charts/graphs populate with 12 months of spread data.
7. **System:** Swaps the demo control label from **"Create demo data"** to **"Remove demo data"** (same button, now in a "destructive / secondary" visual style).

**Postconditions:**
- The user's dashboard shows ~500 demo transactions spread across the last 12 months and across both income and expense categories.
- Running balance is non-negative at every point of the timeline.
- All amounts are in the user's currency and use a realistic scale for that currency.
- The demo control now reads **"Remove demo data"**.
- Exactly one audit entry exists for this action: `demo_data_created`.

---

## Journey 2 — User with existing real transactions adds demo data on top

**Actor:** A logged-in user who has been using the app and has entered some of their own transactions.
**Goal:** Enrich their dashboard with demo data (e.g. to show the app to someone else, or to see richer charts) without losing their own records.

**Preconditions:**
- User is logged in and viewing `/app`.
- User has one or more of their own transactions. Zero demo-tagged transactions.
- Dashboard already shows the user's own data (their balance, their list, their charts).

**Steps:**
1. **User:** Views their dashboard. Sees their own transactions in the list and their own balance. The demo control is labelled **"Create demo data"** and is enabled.
2. **User:** Clicks **"Create demo data"**.
3. **System:** Disables the button, shows the busy indicator on it, shows a loading affordance on the list.
4. **System:** On success, shows the toast *"Demo data created — 500 transactions added over the last 12 months."* and refreshes the dashboard.
5. **System:** The transactions list now contains both the user's own transactions and the demo transactions, interleaved chronologically. Demo rows are visually distinguishable (badge / muted style). The user's own rows are unchanged and carry no badge.
6. **System:** Balance reflects the sum of both sets. Charts reflect both sets combined.
7. **System:** The demo control flips to **"Remove demo data"**.

**Postconditions:**
- The user's own transactions are fully intact (same count, same amounts, same timestamps, same categories as before).
- ~500 demo transactions exist alongside them, visually tagged.
- Running balance (real + demo combined) is non-negative at every point.
- One audit entry: `demo_data_created`.

---

## Journey 3 — User clicks "Create demo data" when demo data already exists (guard path)

**Actor:** A logged-in user whose account already has demo data (either from a previous click, or loaded on a different device/session).
**Goal:** Avoid stacking a second batch of 500 demo rows.

**Preconditions:**
- User is logged in and viewing `/app`.
- User already has at least one demo-tagged transaction.
- The demo control is currently showing **"Remove demo data"**.

**Steps (the normal case — button is already in "Remove" state):**
1. **User:** Views the dashboard. The demo control reads **"Remove demo data"**. There is no visible "Create demo data" button.
2. **User:** Has no affordance to accidentally re-create. To get a fresh batch, they must first remove (see Journey 4) and then click Create again.

**Steps (the race-condition / stale-state case):**
1. **User:** Opens `/app` in a second browser tab *before* demo data existed. That stale tab still shows the control as **"Create demo data"**.
2. **User:** In the meantime, demo data was created in another tab/session. The stale tab is now out of sync.
3. **User:** Clicks **"Create demo data"** in the stale tab.
4. **System:** Does not create a second batch. Shows an informational toast: *"Demo data already exists. Remove it first before creating a new batch."*
5. **System:** Refreshes the dashboard so the stale tab re-syncs: the list now shows the existing demo rows, and the demo control flips to **"Remove demo data"**.

**Postconditions:**
- Exactly one batch of demo data exists (no duplicates, no ~1000-row states).
- The user understands from the toast what they need to do next.
- No new audit entry is written for the blocked click.

---

## Journey 4 — User clicks "Remove demo data" to clear only demo-tagged rows

**Actor:** A logged-in user who previously created demo data and now wants their dashboard back to reflecting only their own data (or back to an empty state).
**Goal:** Remove all demo transactions in one click, without touching any of their own transactions.

**Preconditions:**
- User is logged in and viewing `/app`.
- User has at least one demo-tagged transaction.
- User may or may not also have their own transactions.
- The demo control is labelled **"Remove demo data"**.

**Steps:**
1. **User:** Views the dashboard. Sees demo transactions (badged) possibly interleaved with their own. The demo control reads **"Remove demo data"** and is styled as a destructive/secondary action.
2. **User:** Clicks **"Remove demo data"**.
3. **System:** Disables the button and shows a busy indicator on it ("Removing…"). The list shows a loading state.
4. **System:** On success, shows a toast: *"Demo data removed — N transactions deleted."* (N is the number that was removed.)
5. **System:** Refreshes the dashboard. All demo-tagged rows are gone from the list. The user's own transactions remain exactly as they were (same rows, same order, same amounts). Balance recomputes based only on the user's own data. Charts shrink back to reflect only the user's own data (or become empty if the user had no own data — see Journey 1 empty state).
6. **System:** The demo control flips back to **"Create demo data"**.

**Postconditions:**
- Zero demo-tagged transactions remain for this user.
- The user's own transactions are unchanged in count, content, and order.
- Exactly one audit entry: `demo_data_removed`.
- The demo control is back to its "Create" state and is enabled.

---

## Journey 5 — Generation fails server-side

**Actor:** A logged-in user who clicks "Create demo data" at a moment when the server fails to complete the write (e.g. storage error, transient I/O failure).
**Goal:** Understand that nothing changed and that it is safe to try again.

**Preconditions:**
- User is logged in and viewing `/app`.
- Demo control is labelled **"Create demo data"** and enabled.
- The backend will fail during this action (the batch write cannot be committed).

**Steps:**
1. **User:** Clicks **"Create demo data"**.
2. **System:** Disables the button and shows the busy indicator ("Creating…").
3. **System:** The write fails. Because the whole batch is written atomically, **no demo rows are persisted**.
4. **System:** Shows an error toast: *"Couldn't create demo data. Please try again. If the problem persists, contact support."* The toast is styled as an error (red / destructive).
5. **System:** Re-enables the demo control and restores its label to **"Create demo data"** (unchanged from before the click).
6. **System:** Refreshes the dashboard. It shows exactly the same state as before the click — same balance, same list, same charts. No demo rows have appeared. No "Remove demo data" affordance has appeared.
7. **User:** May retry by clicking **"Create demo data"** again. A successful retry then follows Journey 1 or Journey 2.

**Postconditions:**
- No demo transactions were persisted for this user.
- The user's own transactions (if any) are untouched.
- The demo control is back in its pre-click state ("Create demo data", enabled).
- No `demo_data_created` audit entry is written (the action did not succeed). An internal error log is recorded on the server for diagnostics, but this is not shown to the user beyond the toast.

---

## Journey 6 — Not-logged-in user tries to access the demo control

**Actor:** A visitor who is not logged in and attempts to reach `/app`.
**Goal:** (Implicitly) would like to use the app, but must authenticate first.

**Preconditions:**
- No active session.
- Visitor types `/app` in the address bar, or follows a link that points to `/app`.

**Steps:**
1. **User:** Navigates to `/app`.
2. **System:** Detects no session and redirects to `/login`.
3. **User:** Never sees the demo control at all — the dashboard is not rendered for unauthenticated visitors.
4. **User:** Logs in. After login, lands on `/app` and now sees the dashboard with the demo control in whichever state matches their account (Create or Remove). From here, they continue with Journey 1, 2, or 4 as appropriate.

**Postconditions:**
- No demo data was created or removed for any account.
- No audit entries were written.
- The feature is never exposed to unauthenticated traffic.
