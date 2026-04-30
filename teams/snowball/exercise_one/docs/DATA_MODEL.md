# Data Model

## Current schema (Dexie version 1)

### `transactions`

| Field    | Type                    | Notes                            |
| -------- | ----------------------- | -------------------------------- |
| `id`     | `number` (auto)         | Primary key                      |
| `amount` | `number`                | Positive or negative; always EUR |
| `date`   | `string`                | ISO format: `"2026-04-23"`       |
| `note`   | `string`                | Free text                        |
| `type`   | `'income' \| 'expense'` |                                  |

Indexes: `date`, `type`

## Planned additions (not yet implemented)

These will require Dexie version bumps when added:

- **M3:** `category` field on transactions; `recurringTemplates` table (cadence, amount, note, type)
- **M4:** `accounts` table (name, balance, target, type: savings/investment); `balanceSnapshots` table
- **M5:** `debtAccounts` table (name, principal, balance, interestRate, scheduledPayment); snapshots reuse same pattern as M4
