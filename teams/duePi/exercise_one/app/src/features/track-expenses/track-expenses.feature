# Refined: Let the user record a single expense (amount, date, category
# from the seeded expense list) and see every recorded expense on the
# same page, newest-first. Expenses persist across reloads via
# localStorage under key duepi:expenses. This is the thinnest end-to-end
# path for "put money in, see money back out" and becomes the template
# that track-income will mirror.
#
# In scope:
#   - Entry form: amount (positive number, step 0.01), date (defaults to today), category
#   - Submit creates an Expense (id + createdAt generated) and appends to the list
#   - On-page list of all recorded expenses, sorted newest-first by date
#     (createdAt as deterministic tiebreaker for same-date entries)
#   - Persistence via versioned envelope under key "duepi:expenses"
#   - Wire component into App.tsx so it renders at app root
#
# Out of scope (later):
#   - Editing or deleting an expense        (edit-entry, delete-entry)
#   - Filtering by category or date range   (filter-by-category, filter-by-date-range)
#   - User-defined / custom categories      (seeded-categories)
#   - Monthly totals or summaries           (monthly-summary)
#   - Income entries                        (track-income)
#   - Export / import                       (export-data, import-data)
# Out of scope (never, for this app):
#   - Server persistence, multi-device sync, bank integrations
#
# Acceptance criteria are encoded one-to-one as the Scenarios below.

Feature: Track expenses
  As a duePi user
  I want to record expenses with amount, date, and category
  So that I can see where my money goes

  Scenario: Record one expense
    Given I am on the expenses page
    And no expenses have been recorded yet
    When I enter an expense of 42.50 on 2026-04-15 in category "food"
    And I save the entry
    Then the expense appears in the expense list

  Scenario: Record several expenses sorted newest-first by date
    Given I am on the expenses page
    When I record an expense of 12.00 on 2026-04-10 for "transport"
    And I record an expense of 850.00 on 2026-04-01 for "rents"
    And I record an expense of 42.50 on 2026-04-15 for "food"
    Then the expense list shows, top to bottom:
      | date       | amount | category  |
      | 2026-04-15 |  42.50 | food      |
      | 2026-04-10 |  12.00 | transport |
      | 2026-04-01 | 850.00 | rents     |

  Scenario: Persist across reload
    Given I have recorded an expense of 12.00 on 2026-04-10 for "transport"
    When I reload the page
    Then the expense is still listed

  Scenario: Reject a non-positive amount
    Given I am on the expenses page
    When I enter an expense of 0 on 2026-04-15 in category "food"
    And I save the entry
    Then I see an inline error that the amount must be greater than zero
    And no expense is added to the list

  Scenario: Category dropdown offers only seeded expense categories
    Given I am on the expenses page
    Then the category dropdown offers exactly: hobbies, food, rents, transport, insurance
    And "salary" is not offered

  Scenario: Empty state
    Given no expenses have been recorded yet
    When I visit the expenses page
    Then I see the message "No expenses yet — add one above."
