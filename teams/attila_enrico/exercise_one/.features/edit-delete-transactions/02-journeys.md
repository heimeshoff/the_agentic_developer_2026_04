# User Journeys — Edit and Delete Transactions

### Edit an existing transaction successfully
- **Actor:** Signed-in user viewing their own transactions list on `/app`.
- **Goal:** Correct one or more fields on a past transaction and persist the change.
- **Preconditions:**
  - The user is authenticated and a session is active.
  - At least one non-deleted transaction owned by the user is visible in the list.
  - The user has opened `/app` and can see inline edit/delete affordances on each row.
- **Steps:**
  1. The user clicks the edit affordance on a specific transaction row.
  2. The system opens an edit dialog pre-filled with the transaction's current title, amount, timestamp, kind (expense/income), and category. The kind toggle reflects the transaction's current kind. The category select shows only categories valid for that kind.
  3. The user changes one or more fields (e.g. edits the title and adjusts the amount) while leaving kind unchanged.
  4. The user clicks the save action.
  5. The system validates the input client-side and on the server; validation passes.
  6. The system persists the update, closes the dialog, and returns the user to the list.
  7. The list re-renders with the updated fields for that row. The row's position in the list reflects the (unchanged) timestamp-based ordering, and the balance figure at the top updates if the amount or kind changed.
  8. The system records the edit in the audit log as an `update` event.
- **Postconditions:**
  - The transaction's fields reflect the user's changes.
  - An audit entry exists capturing the before/after snapshot.
  - The balance on `/app` is consistent with the updated data.

### Delete a transaction successfully with the undo toast
- **Actor:** Signed-in user viewing their own transactions list on `/app`.
- **Goal:** Remove a transaction from the list without a blocking confirmation step.
- **Preconditions:**
  - The user is authenticated.
  - At least one non-deleted transaction owned by the user is visible.
- **Steps:**
  1. The user clicks the delete affordance on a transaction row.
  2. The system optimistically removes that row from the visible list and updates the balance accordingly.
  3. A toast appears near the edge of the viewport confirming the deletion and offering an "Undo" action. The toast is visible for roughly eight seconds.
  4. The user does not interact with the toast. The toast dismisses itself on timeout.
  5. The system finalises the soft delete; the transaction no longer appears in any list queries for this user.
  6. The system records the action in the audit log as a `delete` event.
- **Postconditions:**
  - The transaction is no longer visible in the list or balance totals.
  - The underlying row still exists but is marked as deleted (soft delete). It is excluded from all normal list and aggregate views.
  - An audit entry captures the delete.

### Undo a just-deleted transaction via the toast
- **Actor:** Signed-in user who has just clicked delete on a transaction row.
- **Goal:** Reverse an accidental deletion before the toast dismisses.
- **Preconditions:**
  - The delete toast is currently visible on screen.
  - The eight-second window has not yet elapsed.
- **Steps:**
  1. The user clicks the "Undo" action in the toast.
  2. The system restores the transaction by clearing its deleted marker.
  3. The row reappears in the list in its original timestamp-ordered position, and the balance re-adjusts to include it again.
  4. The toast dismisses.
  5. The system records the action in the audit log as a `restore` event.
- **Postconditions:**
  - The transaction is visible again in the list and included in the balance.
  - The audit log contains both the original `delete` entry and the subsequent `restore` entry.

### Change kind during edit forces category re-pick
- **Actor:** Signed-in user editing one of their own transactions.
- **Goal:** Flip a transaction from expense to income (or vice versa) and save with a valid category for the new kind.
- **Preconditions:**
  - The user has opened the edit dialog for a transaction.
  - The dialog is pre-filled with the transaction's current kind and category.
- **Steps:**
  1. The user toggles the kind control from the current value to the other value (e.g. expense to income).
  2. The system clears the category field. The category select now offers only the categories valid for the newly chosen kind. No category is pre-selected.
  3. The user attempts to save without picking a category.
  4. The system blocks the save and surfaces an inline error on the category field indicating that a category is required.
  5. The user selects a valid category for the new kind.
  6. The user clicks save again.
  7. The system validates, persists the update, closes the dialog, and refreshes the list and balance to reflect the kind and category change (and the balance flips sign for this row's contribution).
  8. The system records the edit in the audit log as an `update` event capturing the kind and category change.
- **Postconditions:**
  - The transaction's kind and category are both updated consistently.
  - No transaction can end up with a category that does not belong to its kind.

### Validation failure on edit keeps the dialog open
- **Actor:** Signed-in user editing their own transaction.
- **Goal:** Attempt to save an invalid change and recover without losing their in-progress edits.
- **Preconditions:**
  - The edit dialog is open and pre-filled.
- **Steps:**
  1. The user clears the amount field (or enters a non-positive value, or clears the title, or enters an unparseable date).
  2. The user clicks save.
  3. The system runs validation and finds one or more invalid fields.
  4. The dialog stays open. The system displays inline error messages next to each invalid field. The user's other in-progress edits remain visible and untouched.
  5. The transaction in the underlying list is unchanged; no audit entry is written.
  6. The user corrects the invalid field(s) and clicks save again.
  7. On the corrected submission, the system validates, persists, and closes the dialog as in the happy path.
- **Postconditions:**
  - The transaction is only updated if and when all fields pass validation.
  - The user never loses unsaved edits because of a validation failure.

### Attempting to edit or delete a transaction that isn't available
- **Actor:** Signed-in user whose list state is stale, or whose browser tab is out of sync with the server (e.g. a second tab already deleted the row, the row belongs to another user via a forged id, or the row never existed).
- **Goal:** The system handles the request safely without leaking information about the real cause.
- **Preconditions:**
  - The user attempts to edit or delete a transaction id that the server cannot find under their ownership in a non-deleted state.
- **Steps:**
  1. The user clicks the edit or delete affordance on a row that is no longer valid for them (for example, the row was soft-deleted in another tab moments earlier).
  2. The system attempts to load or mutate the transaction for the current user.
  3. The system cannot resolve a matching, non-deleted transaction owned by this user.
  4. The system returns a generic "not found" outcome. The same outcome is shown whether the id is unknown, belongs to a different user, or refers to an already-soft-deleted row.
  5. The UI surfaces a brief, non-technical message (e.g. "This transaction is no longer available") and closes the edit dialog if it was opened.
  6. The list view refreshes so it reflects the current server state.
  7. No audit entry is written, because no mutation occurred.
- **Postconditions:**
  - No data changes.
  - The user is nudged back to an accurate view of their current transactions.
  - The response does not disclose whether the id exists, who owns it, or whether it was previously deleted.
