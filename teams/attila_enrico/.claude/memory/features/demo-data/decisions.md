# F06 demo-data — feature-internal decisions

These are architectural decisions specific to demo-data. Cross-cutting decisions live as top-level ADRs (see [`brief.md`](brief.md) → "Decisions"). Source detail: `exercise_one/.features/demo-data/03-plan.md` § 2.

## D1 — Schema marker for demo rows

**Decision:** Extend `TransactionSchema` with `source: z.enum(["demo","user"]).default("user")`.

**Why this over alternatives:**
- A separate `demoTransactionIds: string[]` index on `DB` was rejected — duplicates state, drift risk on every write site.
- A title prefix convention (`[demo] …`) was rejected — fragile against title edits, ugly in UI.
- Zod's `.default("user")` backfills existing on-disk rows during `parse`, avoiding a file migration. New code sets `source: "user"` explicitly on object literals; the Zod default is a safety net, not a licence to omit.

## D2 — Balance-positive generation algorithm

**Decision:** Interleaved timeline with a running-balance guard.

**Why this over alternatives:**
- Front-loading all income then spending against running balance produces unrealistic clustering at month boundaries.
- Fixed monthly templates with jitter look mechanical and don't survive currency-scale changes well.
- The chosen algorithm: walk 12 months; seed 1–2 starter incomes on day 0; per-month add 1 salary + 0–2 ancillary incomes; pre-compute candidate expenses with category-specific cadences (groceries weekly, rent monthly, etc.); sort by timestamp; walk accumulating `runningBalance`; **skip** any expense that would drive balance below zero (don't shrink — shrinking distorts the distribution); stop at target count.

## D3 — Currency-aware amount scaling

**Decision:** Per-currency × per-category `{min, max}` lookup table in `src/lib/demoData/scales.ts` with a `DEFAULT` fallback.

**Why this over alternatives:**
- Computing from ISO-4217 exponent + a base EUR table fails: HUF salary isn't a clean exponent multiple of EUR salary, and rent and groceries scale differently per currency.
- Hardcoding one table and ignoring currency was rejected outright by the product constraint.
- Explicit table is testable (one test iterates `SUPPORTED_CURRENCIES` asserting an entry exists) and reads naturally to a future maintainer.

## D4 — Single toggling button vs separate buttons

**Decision:** One client component `<DemoDataButton hasDemoData={boolean} />` that renders one of two forms.

**Why this over alternatives:**
- Two always-visible buttons (one disabled) clutters the layout and gives a worse signal of state.
- A kebab/dropdown is overkill for two mutually exclusive actions.
- The `hasDemoData` flag is computed server-side from the already-loaded transactions list (no extra DB hit), passed in as a prop. The remove path uses a lightweight confirm UX because it's destructive.

## D5 — Two server actions vs one with mode param

**Decision:** Two separate server actions: `createDemoDataAction`, `removeDemoDataAction`.

**Why this over alternatives:**
- A single `mutateDemoDataAction({ mode })` would be a router with no behaviour of its own — different success payloads, different audit entries, different UI affordances.
- Matches the existing `add` / `update` / `delete` / `restore` action pattern; consistency wins.

## D6 — Audit log: discriminated-union extension

**Decision:** Extend `AuditEntrySchema` to a discriminated union on `action`. Existing four variants (`create` / `update` / `delete` / `restore`) keep their `{ before, after, transactionId }` shape; two new variants (`demo_data_created` / `demo_data_removed`) carry `{ count: number }` and omit before/after/transactionId.

**Why this over alternatives:**
- Reusing existing `AuditEntry` with a sentinel `transactionId` was rejected — semantically wrong (it's not a single-row event).
- A separate audit file for demo events fragments observability for no benefit.
- Per-row entries (one per generated transaction) would flood the log with 500 near-identical rows on a single user action. Summary entries are more useful and cheaper.

## D7 — Detecting "demo data exists" cheaply

**Decision:** In-memory scan of the already-loaded transactions list: `hasDemoData = transactions.some(t => t.source === "demo")`. Re-checked inside `withLock` on the server.

**Why this over alternatives:**
- A separate `demoBatches` index on `DB` adds state to maintain.
- Querying the audit log mixes load-bearing logic with an observational store (violates [0003](../../decisions/0003-append-only-audit-log.md)).
- The `/app` page already loads `listTransactionsByUser` for the balance and list; deriving `hasDemoData` from it is zero additional I/O. The server-side re-check inside `withLock` defends against client tampering — same pattern as `findOwnedTransaction`.
