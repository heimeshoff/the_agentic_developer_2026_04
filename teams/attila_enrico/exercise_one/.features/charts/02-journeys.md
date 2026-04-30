# Charts — User Journeys

These journeys describe how the signed-in user interacts with the charts feature on the existing `/app` dashboard. Two charts ship in v1: a **monthly income vs expense bar chart** and a **spending-by-category pie/donut chart**. Both share a single time-range control (presets + custom date-range picker). Soft-deleted transactions are excluded; demo + user transactions are both included.

---

## Journey 1 — View monthly income vs expense (happy path)

**Actor:** Signed-in user with at least one income and one expense transaction in the last few months.

**Goal:** Get an at-a-glance comparison of how much money came in vs went out, month by month.

**Preconditions:**
- User is authenticated and on the `/app` dashboard.
- The user has at least two non-deleted transactions (demo or user), spanning at least two distinct calendar months.

**Steps:**
1. **User** lands on `/app`.
2. **System** renders the dashboard, which now includes a charts area alongside the existing transaction form and transactions list. The charts area shows the bar chart and the pie chart side by side (or stacked on narrow viewports), preceded by a single time-range control. The control defaults to the **"Last 3 months"** preset.
3. **System** populates the bar chart: one group of bars per month in the selected range, each group containing two bars — **income** (using the income accent colour) and **expense** (using the expense accent colour). The Y-axis is amounts formatted in the user's currency; the X-axis is month labels (e.g. "Feb 2026").
4. **User** hovers a bar.
5. **System** shows a tooltip with the month, the series name (Income or Expense), and the formatted total for that bar.
6. **User** clicks the **"This year"** preset.
7. **System** recomputes both charts in place against the new range. The bar chart now shows one bar group per month from January of the current year through the current month. A subtle loading indicator appears while data is recomputed; the previous chart fades out / new chart fades in so the user sees that something happened.
8. **User** reads the visible totals (e.g. notices that one month's expense bar is much taller than its income bar).

**Postconditions:**
- The user has a clear visual sense of monthly income vs expense for the selected range.
- The selected time range is reflected in the URL (so the view is shareable / refresh-stable) but no preference is persisted server-side.
- The transactions list below remains unchanged unless the user explicitly drills down.

---

## Journey 2 — Find biggest spending category and drill down (happy path)

**Actor:** Signed-in user who wants to know which category is eating their budget.

**Goal:** Identify the largest spending category in the current month and inspect the underlying transactions.

**Preconditions:**
- User is authenticated and on `/app`.
- The user has at least one expense transaction in the current month.

**Steps:**
1. **User** opens `/app` and selects the **"This month"** preset on the time-range control.
2. **System** updates the pie/donut chart to show one slice per spending category for the current month, sized by total expense amount, sorted largest-to-smallest. A legend lists each category with its name, formatted total, and percentage of the slice. The bar chart updates in lockstep to show the same range (a single month group).
3. **User** hovers the largest slice.
4. **System** highlights that slice (mild pop / contrast lift), highlights its legend row, and shows a tooltip with the category name, the formatted total, and the percentage of total spending.
5. **User** clicks the slice.
6. **System** treats this as a drill-down: it scrolls the user to the transactions list (already on the same page) and applies two filters to it — **category = the clicked category** and **date range = the chart's current range (this month)**. The active filters are shown as removable chips above the list (e.g. "Category: Groceries x", "Range: This month x"). The pie chart visually marks the clicked slice as the active filter (e.g. a thin ring / outline) so the user remembers the filter is on.
7. **User** scans the filtered list to see the individual transactions making up that slice.
8. **User** clears the category chip.
9. **System** removes the category filter from the list (date range filter remains until cleared) and removes the active-slice marker on the pie chart.

**Postconditions:**
- The user has identified the largest spending category and reviewed the transactions in it.
- Drill-down filters can be cleared independently and at any point without leaving the page.
- The chart selection state is purely UI — no data has been mutated.

---

## Journey 3 — Drill from a bar to a specific month's transactions

**Actor:** Signed-in user.

**Goal:** From the bar chart, jump straight to the transactions of an interesting month (e.g. an unusually high expense bar).

**Preconditions:**
- User is on `/app`.
- The bar chart shows at least two months of data.

**Steps:**
1. **User** notices on the bar chart that one month's expense bar stands out.
2. **User** clicks that bar (either the income or expense bar within the month group — both are clickable; clicking anywhere within the month group is also acceptable as a hit target).
3. **System** treats this as a drill-down: it scrolls to the transactions list and filters it to that single month (date range = first → last day of that month). A removable range chip appears above the list (e.g. "Range: March 2026 x"). The bar chart highlights the clicked month group as the active selection.
4. **User** reviews the month's transactions, optionally sorts them by amount.
5. **User** clears the range chip.
6. **System** removes the filter from the list and the active-month highlight from the bar chart. The chart's own time-range control is unaffected (it is independent of the list's drill-down filter).

**Postconditions:**
- The user has inspected a specific month's transactions reached via the chart.
- The list returns to its previous state once the drill-down filter is cleared.

---

## Journey 4 — Switch to a custom date range

**Actor:** Signed-in user who wants to look at an arbitrary window (e.g. "the trip I took in January–February").

**Goal:** View both charts for a custom start/end date that none of the presets covers.

**Preconditions:**
- User is on `/app`.
- The user has at least one transaction in the intended window.

**Steps:**
1. **User** opens the time-range control and chooses the **"Custom range"** option.
2. **System** reveals a date-range picker (start date + end date), pre-filled with the dates of whichever preset was active so the user has a sensible starting point. A confirm/apply button is shown; the charts do not change yet.
3. **User** picks a start date that is later than the current end date by mistake.
4. **System** prevents the apply button from being enabled and shows an inline message ("End date must be on or after the start date").
5. **User** corrects the end date so the range is valid.
6. **System** enables the apply button.
7. **User** clicks **Apply**.
8. **System** closes the picker, recomputes both charts for the chosen window, and updates the time-range control's label to display the chosen range (e.g. "12 Jan 2026 — 28 Feb 2026"). The bar chart's bucketing remains monthly; partial months at the edges of the range are still shown as full month groups, with bars representing only the in-range portion of that month.
9. **User** clicks the time-range control again and picks the **"All time"** preset.
10. **System** abandons the custom range, recomputes the charts over the user's full history, and updates the control's label to "All time".

**Postconditions:**
- Charts reflect the user's chosen window.
- The custom range is not persisted across sessions; reloading without the URL parameters returns to the default preset.

---

## Journey 5 — View charts when no transactions exist in the selected range (empty state)

**Actor:** Signed-in user whose selected time range happens to contain no transactions (e.g. a brand-new account, or a custom range covering a quiet month).

**Goal:** Understand that there is simply no data to show, without losing the layout context.

**Preconditions:**
- User is on `/app`.
- The user's transactions, after filtering by the selected range and excluding soft-deleted, return an empty set.

**Steps:**
1. **User** is on `/app`. The time-range control is on a preset that yields no transactions (e.g. a freshly registered user on "This month" before adding anything, or a custom range over an empty window).
2. **System** still renders both charts at full size with their axes/structure visible:
   - Bar chart: X-axis with month labels for the selected range, Y-axis with a default scale (e.g. 0 → a small placeholder maximum), no bars drawn.
   - Pie chart: an empty ring/circle outline at full size, no slices drawn, no legend rows.
3. **System** overlays each chart with a centered, low-emphasis **"No data"** message. The message is clearly an overlay (not a toast or modal) so the user understands the chart still belongs to the current range.
4. **System** keeps the time-range control fully interactive so the user can switch range without leaving the empty state.
5. **User** clicks the **"All time"** preset (or adds a transaction via the existing form on the same page).
6. **System** recomputes the charts; if data now exists, the "No data" overlays are removed and bars/slices appear. If still empty (genuinely no transactions on the account at all), the overlays remain.

**Postconditions:**
- The user understands that the absence of bars/slices is a data condition, not a broken chart.
- Layout does not jump when data appears or disappears, because the chart frames are always rendered at the same size.

---

## Journey 6 — Range change while a drill-down is active

**Actor:** Signed-in user who is mid-investigation.

**Goal:** Make sure the user is never confused when the chart range and the list's drill-down filter could disagree.

**Preconditions:**
- User has performed a drill-down (Journey 2 or 3) so the transactions list has an active filter chip from a chart click.

**Steps:**
1. **User** has the list filtered to "Category: Groceries" + "Range: This month" via a previous pie-slice click. The pie chart shows the clicked slice as the active selection.
2. **User** changes the chart time-range control to **"Last 3 months"**.
3. **System** recomputes both charts against the new range. Because the list's drill-down range was inherited from the chart at click-time, the system also updates the list's range chip to match the new range (Range: Last 3 months) and keeps the category chip ("Groceries") in place. If the previously-clicked category no longer appears in the new range's pie chart (zero spend in that category over 3 months — unlikely but possible), the active-slice marker is removed but the category filter on the list stays until the user clears it.
4. **User** can clear either chip independently to back out of the drill-down without changing the chart range.

**Postconditions:**
- The chart range and any chart-driven list filters stay consistent: changing the chart range cascades into the list's range filter, but category filters survive until the user clears them.
- The user is never left looking at a list filter that silently disagrees with the chart they are reading.
