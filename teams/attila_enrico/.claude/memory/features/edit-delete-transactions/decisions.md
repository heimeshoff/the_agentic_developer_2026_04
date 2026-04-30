# F07 edit-delete-transactions — feature-internal decisions

These are architectural decisions specific to edit-delete-transactions. Cross-cutting decisions are promoted to top-level ADRs (see [`brief.md`](brief.md) → "Decisions"). Source detail: `exercise_one/.features/edit-delete-transactions/03-plan.md` § 2.

## D1 — Generalise the add form rather than duplicate it

**Decision:** Rename `AddTransactionForm` to `TransactionForm` with `{ mode: "add" | "edit", initial?: Transaction, onSuccess?: () => void }`. Pick the server action at render time based on `mode`. Keep the existing `Field` / `FormError` / `SubmitButton` primitives unchanged.

**Why this over alternatives:**
- Duplicating into `EditTransactionForm.tsx` was rejected as guaranteed-drift.
- A headless hook + two thin wrappers was rejected as overkill — the two call sites are nearly identical.
- The kind-flip category reset works the same in both modes; centralising it avoids divergence.
- Implementation note from tasks.md: chose **controlled** `<select>` (not `defaultValue`) for reliable kind-flip reset. The `Field` component itself stayed unchanged — prefill is handled inside `TransactionForm`.

## D2 — Three dedicated server actions, not one omnibus

**Decision:** `updateTransactionAction(_prev, formData)` (form action), `deleteTransactionAction(id)` and `restoreTransactionAction(id)` (plain-argument actions, invoked via `useTransition`).

**Why this over alternatives:**
- A single `mutateTransactionAction({ action, id, ...rest })` was rejected — weak typing, poor binding to individual UI affordances.
- Separate actions match the existing `addTransactionAction` style.
- `delete` and `restore` use plain-arg signatures because they're called from a client island, not a `<form>`. They must be invoked inside a transition to keep the UI responsive.

## D3 — Hybrid optimistic-delete UX (server fire-and-forget, undo restores)

**Decision:** Click trash → optimistically hide the row (client `Set<string>` of `hiddenIds`) → call `deleteTransactionAction(id)` immediately inside a transition → show "Transaction deleted · Undo" toast for ~8s. Click Undo → call `restoreTransactionAction(id)` → remove id from `hiddenIds` on success. No delayed hard-delete; soft-deleted rows persist indefinitely (a Trash view is out of scope).

**Why this over alternatives:**
- Pure server round-trip with blocking confirm was rejected by product.
- Client-side timer that defers the server delete until the window elapses was rejected — loses durability if the tab closes mid-window.
- Optimistic hide + immediate server delete + undo-as-restore was chosen for durability + simplicity. The audit log gets `delete` + (optionally) `restore` entries, both observable.
- If either server call fails, roll back the optimistic state and surface a non-blocking inline error.
- Toast is a minimal in-file component; no library dependency introduced.

## D4 — Defense-in-depth on the `kind` → category invariant

**Decision:** Enforce `isValidCategory(kind, category)` in **both** layers — Zod (`superRefine` shared between add and edit input schemas via the `TransactionFieldsObject` base) **and** the form (clearing `category` to `""` and requiring re-pick when `kind` flips).

**Why this over alternatives:**
- Form-only is trivially bypassed by a crafted request.
- Zod-only is authoritative but produces a server error after submit, breaking the "guided re-pick" UX.
- Both layers match the existing pattern on add and align with the resolved answer in `01-questions.md`.
- Implementation gotcha (from tasks.md): `Zod.superRefine()` returns `ZodEffects` which can't be `.extend()`ed. Worked around by sharing a private `TransactionFieldsObject` base and attaching the refinement to both add-path and update-path schemas.
