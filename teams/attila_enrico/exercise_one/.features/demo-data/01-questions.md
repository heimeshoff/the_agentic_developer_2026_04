## Questions

### Scope & users

1. Who is this feature for?
   - A) Developer-only seeder (CLI script / env-gated route, not shown in UI)
   - B) End-user-facing button inside `/app` (any logged-in user can populate their own account)
   - C) Both — a script for dev setup and an in-app button for users/demos

2. If it is user-facing, should it be gated behind anything?
   - A) Available to every logged-in user, always
   - B) Only visible for accounts that have zero transactions (first-run onboarding)
   - C) Hidden behind a feature flag / env var (e.g. `NEXT_PUBLIC_ENABLE_DEMO_DATA`)
   - D) Only for a specific email allowlist (e.g. the workshop user)

3. Does "demo data" include demo **users** as well, or only transactions for the currently logged-in user? (The existing seeder, if any, would need to decide whether to touch `db.users` or only `db.transactions`.)

### Data & state

4. How many transactions should a single "create demo data" run produce, and over what date range?
   - A) Small (~20–30, last 1 month)
   - B) Medium (~100–150, last 3 months)
   - C) Large (~300–500, last 12 months, to make charts look rich)
   - D) Configurable via input on the UI / CLI flag

5. What distribution should the generated data follow?
   - A) Roughly realistic (monthly salary, weekly groceries, occasional rent, sporadic entertainment, etc. — weighted across the existing `EXPENSE_CATEGORIES` / `INCOME_CATEGORIES`)
   - B) Uniform random across categories and dates
   - C) Deterministic fixture (same output every run, good for screenshots/tests)

6. How should it interact with the user's existing transactions?
   - A) Append only — never touches existing rows
   - B) Wipe first — soft-delete or hard-delete all of this user's current transactions, then insert fresh demo data
   - C) Offer both (user picks "Add demo data" vs "Reset with demo data")

7. Should re-running the feature be idempotent?
   - A) Yes — detect existing demo rows (e.g. tagged with a marker field or specific `title` prefix) and skip
   - B) No — each run always appends a fresh batch (duplicates are fine)

8. The `Transaction` schema in `src/lib/db.ts` has no "source" / "isDemo" field. Do we:
   - A) Extend the schema with an optional `source: "demo" | "user"` marker (requires schema migration consideration)
   - B) Use a title convention (e.g. prefix `[demo] `) to identify them
   - C) Don't mark them at all — once created, they're indistinguishable from real data

### UI / UX

9. Where is the entry point?
   - A) A button on the empty state of `/app` (when `transactions.length === 0`)
   - B) A button always visible in the `/app` page header or sidebar
   - C) A dedicated `/app/settings` or `/app/demo` subpage
   - D) No UI — only a `pnpm seed` / `npm run seed` script

10. What should the user see during and after generation? A blocking spinner, a toast, a full-page state? And should the list/balance refresh automatically (via `revalidatePath('/app')`) or require a manual reload?

11. Should the action be undoable?
    - A) Yes — a single "Undo" toast (like the existing `UndoToast` for deletes) that removes the entire batch
    - B) No — the user can delete rows individually using the existing per-row delete
    - C) Yes, but via an explicit "Clear demo data" button rather than an immediate undo

### Edge cases & constraints

12. How does the generator pick amounts given the user's chosen `currency` (EUR / USD / HUF / etc. from `src/lib/currencies.ts`)?
    - A) Same numeric ranges regardless of currency (e.g. salary 2000–4000)
    - B) Currency-aware ranges (HUF salary in hundreds of thousands, EUR in thousands)
    - C) Fixed numbers, currency is purely cosmetic in the generated rows

13. What happens if the feature is invoked and partway through writing (say row 47 of 100) the process crashes or a write fails? Do we need the whole batch to be atomic (one single `writeDb` with all rows appended), or is best-effort append acceptable?

14. Should every demo transaction emit an audit entry via `appendAuditEntry` (like real creations do), or should demo generation bypass the audit log to avoid flooding it?

15. If called when not logged in, is the expectation the same as other `/app` actions — redirect to `/login` via `requireSession()` — or does the feature have a separate path (e.g. seed script that takes a `--userId`)?

### Non-goals

16. Please confirm the following are explicitly **out of scope** for this feature (answer yes/no to each):
    - A) Generating demo **users** (auth accounts with passwords)
    - B) Generating historical data that spans multiple years for long-term trend charts
    - C) Localising demo titles/descriptions per user locale
    - D) Allowing the user to customise volume, date range, or category weights via UI inputs
    - E) Providing a "Reset to clean slate" (delete-everything) action as part of this feature

## Answers

### Scope & users
- **1. Audience:** B — end-user-facing button inside `/app`.
- **2. Gating:** A — available to every logged-in user, always (not answered explicitly, inferred from "gui button"; confirm if different).
- **3. Demo users?** No — only transactions for the currently logged-in user.

### Data & state
- **4. Volume & range:** C — around 500 transactions, spread over the last 12 months.
- **5. Distribution:** A — realistic-weighted, spread across both time and category.
- **6. Interaction with existing data:** Append only; separate one-click "remove demo data" action handles cleanup.
- **7. Idempotent re-run:** No re-run. If demo data already exists for the current user, the "Create demo data" button either (a) is disabled / replaced by "Remove demo data", or (b) surfaces a toast "Demo data already exists — remove it first". Never append a second batch on top.
- **8. Mark demo rows:** A — add a marker on the transaction (e.g. `source: "demo" | "user"`) so the "remove" action only removes demo-generated rows. (Chosen to make the one-click removal safe.)

### UI / UX
- **9. Entry point:** GUI button inside `/app` (always visible; if no demo data exists it says "Create demo data", if demo data exists it switches to "Remove demo data").
- **10. Feedback:** Standard — server action + toast + `revalidatePath('/app')` so balance and list refresh automatically.
- **11. Undo / removal:** C — explicit "Remove demo data" button, one click, clears all rows tagged `source: "demo"` for the current user.

### Edge cases & constraints
- **12. Amounts vs currency:** B — currency-aware ranges. HUF uses hundreds-of-thousands scale for salary / tens-of-thousands for rent etc.; EUR/USD/GBP/CHF use thousands-scale salary, hundreds-scale expenses. Generator reads the user's `currency` and picks the scale from a per-currency table.
- **13. Atomic write:** Single `writeDb` call for the whole batch (matches existing pattern).
- **14. Audit log per row:** One summary audit entry per action — e.g. `demo_data_created` with `{ count: 500 }` on create, and `demo_data_removed` with `{ count: N }` on remove. Do not write 500 individual `created` entries.
- **15. Not-logged-in:** Standard — `requireSession()` redirect to `/login`.

### Extra constraint (user-added)
- **Running balance must stay non-negative at every point in time.** The generator orders/amounts transactions so that, chronologically, `sum(income) - sum(spending)` up to any timestamp is ≥ 0. This is a hard constraint on the generation algorithm.

### Non-goals
- **16A.** Demo users — **out of scope** (yes).
- **16B.** Multi-year history — **out of scope** (yes; 12 months only).
- **16C.** Localised titles — **out of scope** (yes; English titles fine).
- **16D.** UI-configurable volume/range/weights — **out of scope** (yes; fixed ~500/12mo).
- **16E.** Generic "reset to clean slate" — **out of scope** (yes; only demo-tagged rows are removed by this feature).
