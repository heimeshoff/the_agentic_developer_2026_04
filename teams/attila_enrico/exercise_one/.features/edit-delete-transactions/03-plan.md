# Technical Implementation Plan — Edit and Delete Transactions

## 1. Summary

Extend the existing single-user JSON-file-backed finance app so users can edit and delete their own transactions directly from the `/app` list. Reuses the existing architecture (`withLock`-serialised `readDb`/`writeDb`, server actions in `src/actions/`, pure domain logic in `src/lib/`, Zod validation with a `FormState` envelope). Adds a soft-delete flag (`deletedAt`) to the transaction schema, generalises `AddTransactionForm` into a single add-or-edit form opened in a modal, introduces a thin client island for inline row actions with optimistic delete + ~8s undo toast, and introduces a separate append-only `data/audit.json` store written by every create/update/delete/restore mutation. Authorisation continues to piggy-back on `requireSession()`; "not yours" and "doesn't exist" collapse into a single generic not-found result to avoid existence leakage.

## 2. Architectural decisions

- **Decision:** What is the shape and write-path integration of the audit log store?
  - **Options considered:**
    - Embed revision history on each transaction — keeps row-centric locality, but bloats the transactions store and complicates list queries.
    - Separate append-only `data/audit.json` alongside `db.json`, shared `withLock` — cleanly observational, easy to grow, zero list-query impact.
    - External event sink (e.g. log file/stream) — over-engineered for a JSON-backed workshop app.
  - **Recommendation:** Separate `data/audit.json` as already resolved in `01-questions.md`. Entry schema: `{ id: nanoid, transactionId, userId, action: "create" | "update" | "delete" | "restore", at: ISO timestamp, before: Transaction | null, after: Transaction | null }` validated by a new `AuditEntrySchema`. A new `src/lib/audit.ts` exposes `appendAuditEntry(entry)` (uses the same `withLock` to serialise writes). Called from: `addTransactionForUser` (after successful insert — backfills `create`), new `updateTransactionForUser` (`update`), new `softDeleteTransactionForUser` (`delete`), and new `restoreTransactionForUser` (`restore`). Reads of audit entries are out of scope for this feature.

- **Decision:** How to generalise the add form without duplicating it?
  - **Options considered:**
    - Duplicate into `EditTransactionForm.tsx` — fastest to implement, guaranteed drift.
    - Rename `AddTransactionForm` to `TransactionForm` with a `mode: "add" | "edit"` plus optional `initial: Transaction` prop, wire both server actions through a discriminator — single source of truth, small conditional branches.
    - Extract a headless hook (`useTransactionForm`) and two thin wrappers — cleaner separation, but overkill for two very similar call sites.
  - **Recommendation:** Option 2. Rename to `TransactionForm`, accept `{ mode, initial?, onSuccess? }`. Pick the server action at render time (`mode === "add" ? addTransactionAction : updateTransactionAction`). Keep the existing `Field`/`FormError`/`SubmitButton` primitives unchanged. The dashboard's sidebar continues to render `<TransactionForm mode="add" />`; the edit modal renders `<TransactionForm mode="edit" initial={tx} onSuccess={closeModal} />`.

- **Decision:** Server action surface for edit/delete/restore.
  - **Options considered:**
    - One omnibus `mutateTransactionAction` with an action discriminator — fewer exports, weaker typing.
    - Three dedicated actions (`updateTransactionAction`, `deleteTransactionAction`, `restoreTransactionAction`) mirroring the existing `addTransactionAction` style — consistent, easy to bind to individual forms/buttons.
  - **Recommendation:** Option 2. Surface in `src/actions/transactions.ts`:
    - `updateTransactionAction(_prev, formData)` — reads `id` from hidden field plus the same fields as add. Returns `FormState` (reusable with `useActionState`). Delegates to new `updateTransactionForUser(userId, id, raw)` in `src/lib/transactions.ts`. Zod input schema = existing add input schema extended with `id: z.string().min(1)`.
    - `deleteTransactionAction(id: string): Promise<{ ok: true } | { ok: false; error: "not_found" }>` — plain-argument action (called from a client component via `transition`), not a form action. Delegates to `softDeleteTransactionForUser`.
    - `restoreTransactionAction(id: string): Promise<{ ok: true } | { ok: false; error: "not_found" }>` — symmetric to delete, delegates to `restoreTransactionForUser`.
    - All three call `revalidatePath("/app")` on success.

- **Decision:** Where does optimistic state live, and how does undo reach the server in time?
  - **Options considered:**
    - Pure server round-trip with blocking confirm — safe but UX-heavy; product rejected this.
    - Optimistic hide on client with `useOptimistic`, server call fires immediately, undo fires `restoreTransactionAction` — works, but the user sees the row vanish while the delete is still in-flight; undo races with delete.
    - Optimistic hide on client, server delete call deferred until the undo window elapses (client-side ~8s timer), undo just cancels the timer — no server round-trip on undo, but loses durability if the tab closes mid-window.
    - Hybrid: fire server `deleteTransactionAction` immediately (soft delete is cheap and durable), optimistically hide the row, show an "Undo" toast for 8s that calls `restoreTransactionAction` — durable, simple, and matches the resolved answers.
  - **Recommendation:** Option 4 (hybrid). A new client island `TransactionsList.tsx` wraps the `<ul>` and owns a `Set<string>` of `hiddenIds` (the optimistic layer). Clicking trash: add id to `hiddenIds`, call `deleteTransactionAction(id)` inside a transition, show toast "Transaction deleted · Undo" for 8000ms. Clicking Undo within the window: call `restoreTransactionAction(id)`, remove id from `hiddenIds` on success. If the toast elapses without undo, nothing more happens — the row is already soft-deleted server-side and stays that way. **No delayed hard-delete**: soft-deleted rows remain in `db.json` indefinitely (acceptable because the audit log and out-of-scope Trash view are the only consumers). If either server call fails, roll back the optimistic state and surface a non-blocking inline error. Toast is a minimal in-file component (no new library dependency).

- **Decision:** Authorisation pattern per mutation.
  - **Options considered:**
    - Return distinct `"not_found"` vs `"forbidden"` errors — leaks existence of others' rows.
    - Collapse both cases into a generic `"not_found"` response — matches resolved answer, no info leak.
    - Row-level middleware — overkill for four server actions.
  - **Recommendation:** Option 2. Add a private helper `findOwnedTransaction(db, userId, id): Transaction | null` in `src/lib/db.ts` that returns `null` whenever the row is missing OR `userId` mismatches OR `deletedAt` is set (for update/delete; for restore only the mismatch/missing checks apply). Every mutation path that takes an `id` goes through this helper and maps `null` to a single `{ ok: false, error: "not_found" }` result at the server-action boundary. Client-side, a generic inline "That transaction is no longer available." message is shown.

- **Decision:** Where is the `kind`→category invariant enforced for the edit flow?
  - **Options considered:**
    - Form-only — UX-correct but trivially bypassed.
    - Zod-only — authoritative but late; user sees server error instead of guided re-pick.
    - Both layers — defense in depth, aligned with the existing `superRefine` check on add.
  - **Recommendation:** Option 3. The existing `InputSchema.superRefine` already validates `isValidCategory(kind, category)` — reuse it for the edit input schema (extract the common base as `TransactionFieldsSchema`). On the client, when the user flips `kind` in the `TransactionForm`, reset `category` to `""` and require the user to pick again before submit (HTML `required` on the select plus removing any pre-selected option). This guarantees the invariant even if someone crafts a request directly.

## 3. Affected files / modules

- `src/lib/db.ts` — `modify` — add `deletedAt: z.string().nullable().optional()` to `TransactionSchema`; update `listTransactionsByUser` to filter out rows where `deletedAt != null`; add `findOwnedTransaction`, `updateTransaction(tx)`, `softDeleteTransaction(id, at)`, `restoreTransaction(id)` repository-style helpers that share `withLock` and rewrite the db atomically.
- `src/lib/audit.ts` — `new` — `AuditEntrySchema`, `AuditEntry` type, `getAuditPath()`, `readAuditLog()`, `appendAuditEntry(entry)` (uses the same in-process lock pattern as `db.ts`).
- `src/lib/transactions.ts` — `modify` — extract `TransactionFieldsSchema` base; keep `addTransactionForUser` (plus audit `create` write); add `updateTransactionForUser(userId, id, raw)` and `softDeleteTransactionForUser(userId, id)` and `restoreTransactionForUser(userId, id)`; all return a discriminated `{ ok, ... }` result.
- `src/actions/transactions.ts` — `modify` — keep `addTransactionAction` (wire audit via lib); add `updateTransactionAction`, `deleteTransactionAction(id)`, `restoreTransactionAction(id)`; all call `revalidatePath("/app")` on success; all go through `requireSession()`.
- `src/app/app/TransactionForm.tsx` — `new` (effectively `AddTransactionForm` renamed and generalised) — `{ mode, initial?, onSuccess? }`; picks the right server action; resets category on kind flip.
- `src/app/app/AddTransactionForm.tsx` — `delete` — replaced by `TransactionForm` (sidebar call site swaps to `<TransactionForm mode="add" />`).
- `src/app/app/TransactionsList.tsx` — `new` — client component; owns optimistic `hiddenIds`, renders row actions (pencil/trash) and the undo toast; opens the edit modal.
- `src/app/app/EditTransactionModal.tsx` — `new` — client modal wrapper around `TransactionForm` (dialog element or focus-trapped div, Escape to close, click-outside to close).
- `src/app/app/UndoToast.tsx` — `new` — tiny controlled toast with "Undo" button and ~8s auto-dismiss timer.
- `src/app/app/page.tsx` — `modify` — pass transactions (already filtered by the updated lib) into `<TransactionsList>` instead of inlining the `<ul>`; keep balance computation (still correct — soft-deleted rows excluded upstream).
- `src/components/Field.tsx` — `modify` (small) — accept a `value`/controlled variant OR allow `defaultValue` on the `select` child path so edit can prefill (currently the `select` branch has no prefill hook). Alternative: handle prefill inside `TransactionForm` without changing `Field`. Prefer the latter to keep `Field` unchanged.
- `data/audit.json` — `new` (created lazily at first write) — append-only log file, gitignored alongside `db.json`.
- `src/lib/__tests__/transactions.test.ts` (or `src/lib/transactions.test.ts` per existing convention) — `new` — unit tests for update, soft-delete, restore, ownership collapsing to `not_found`, kind→category invariant, audit entry emission.
- `src/lib/__tests__/audit.test.ts` — `new` — unit tests for append-only semantics and schema validation.
- `.gitignore` — `modify` — ensure `data/audit.json` is ignored (verify `data/` pattern already covers it; if only `data/db.json` is listed, broaden).

## 4. Risks & unknowns

- **List-query audit:** `listTransactionsByUser` is the only current call site, but the balance reducer in `page.tsx` re-iterates the same list. Must confirm no other place reads `db.transactions` directly; if any do, they also need the `deletedAt` filter. Grep for `db.transactions` and `readDb` before shipping.
- **Schema backward compatibility:** Existing `data/db.json` rows won't have `deletedAt`. Making the field `.optional().nullable()` keeps `DBSchema.parse` green, but verify by round-tripping an existing db file through `readDb` in a test.
- **Modal + optimistic list interaction:** Edit modal success should both close the modal and refresh the list. `revalidatePath("/app")` on the server action re-renders the server component tree; ensure the client island's local optimistic state (hiddenIds) isn't stomped or left stale. A key-by-id render plus clearing only ids that successfully round-tripped should handle it.
- **Undo window vs. server revalidation race:** After optimistic hide + server delete, `revalidatePath` will refresh the list without the row. On Undo, after `restoreTransactionAction` succeeds we need the row to reappear — another `revalidatePath` handles it, but there's a visible flicker window. Acceptable for a workshop app; note it.
- **Server action `id`-only signatures:** Non-form server actions (`deleteTransactionAction(id)`, `restoreTransactionAction(id)`) are fine in Next.js 15 but must be invoked inside a `startTransition` / `useTransition` on the client to keep the UI responsive. Don't call them from a form.
- **Concurrency via `withLock`:** Last-write-wins is explicit; two tabs editing the same row will silently clobber each other. Called out as accepted, but the audit log should capture both writes so nothing is lost observationally.
- **Toast in a server component tree:** The dashboard is a server component; the toast must live inside the new `TransactionsList` client island (or be portaled from it). No global toast provider exists yet — don't introduce one just for this.
- **`Field` component prefill path for the category `<select>`:** The current `Field` passes `defaultValue` only to the built-in `<input>`; the `select` branch relies on its own children. The edit form must control the `<select>` default selection itself (render the current category as the initial `value`/`defaultValue` on the `<select>`). Confirm before implementation that this works without forcing `Field` to change.
- **Accessibility of inline icon buttons and modal:** Icons need `aria-label`s; modal needs focus trap, role=dialog, labelled by heading, Escape to close. Under-specified in the intake — call out as intentionally lightweight for workshop scope but not skipped.
- **Audit log size:** `data/audit.json` is rewritten whole on each append (same pattern as `db.json`). Fine at workshop scale, would need streaming append at real scale — document, do not fix.

## 5. Task list

1. Add `deletedAt` to `TransactionSchema`, update `listTransactionsByUser` to filter soft-deleted, add `findOwnedTransaction`/`updateTransaction`/`softDeleteTransaction`/`restoreTransaction` helpers — files: `src/lib/db.ts` — `[group-1]`
2. Create `AuditEntrySchema`, `appendAuditEntry`, `readAuditLog`, and `getAuditPath` — files: `src/lib/audit.ts` — `[group-1]`
3. Ensure `data/audit.json` is gitignored (verify or broaden pattern) — files: `.gitignore` — `[group-1]`
4. Extract `TransactionFieldsSchema` base from existing `InputSchema`; add `updateTransactionForUser`, `softDeleteTransactionForUser`, `restoreTransactionForUser`; wire `appendAuditEntry` into all four mutation paths including existing `addTransactionForUser` — files: `src/lib/transactions.ts` — `[group-2]`
5. Unit tests for lib transactions (update/soft-delete/restore/ownership collapsing/kind→category invariant) — files: `src/lib/transactions.test.ts` — `[group-3]`
6. Unit tests for audit log (append-only, schema validation, file creation) — files: `src/lib/audit.test.ts` — `[group-3]`
7. Add `updateTransactionAction`, `deleteTransactionAction(id)`, `restoreTransactionAction(id)` server actions; keep `addTransactionAction`; all call `requireSession()` and `revalidatePath("/app")` — files: `src/actions/transactions.ts` — `[group-3]`
8. Rename `AddTransactionForm` to `TransactionForm`, generalise with `{ mode, initial?, onSuccess? }`, handle kind-flip category reset and category `<select>` prefill on edit — files: `src/app/app/TransactionForm.tsx`, `src/app/app/AddTransactionForm.tsx` (delete) — `[group-4]`
9. Build `UndoToast` (controlled, auto-dismiss ~8s, "Undo" button) — files: `src/app/app/UndoToast.tsx` — `[group-4]`
10. Build `EditTransactionModal` wrapping `TransactionForm` in a dialog with focus trap and Escape/click-outside close — files: `src/app/app/EditTransactionModal.tsx` — `[group-5]`
11. Build `TransactionsList` client island: renders rows with pencil/trash buttons, owns optimistic `hiddenIds`, opens the edit modal, calls `deleteTransactionAction`/`restoreTransactionAction` via `useTransition`, renders `UndoToast` — files: `src/app/app/TransactionsList.tsx` — `[group-5]`
12. Swap `/app/page.tsx` to render `<TransactionsList transactions={...} currency={...} />` (keep balance calc unchanged) and update sidebar to `<TransactionForm mode="add" />` — files: `src/app/app/page.tsx` — `[group-6]`
13. Grep and audit every `db.transactions` / `readDb` call site to confirm soft-deleted rows are excluded everywhere they should be — files: (audit only; fix if found) — `[group-6]`
14. Smoke-test E2E happy paths manually: add, edit (including kind change), delete + undo within window, delete + let window elapse, attempt edit/delete for foreign id (expect generic not-found) — files: (no code; verification) — `[group-7]`
