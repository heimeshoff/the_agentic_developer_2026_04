---
name: test-driven-development
description: TDD workflow for logic-heavy code in the Laszlo & Robert budgeting app. Use this skill for budget calculations, categorisation rules, data transformations, and any function with non-trivial logic. Skip for pure UI components, layout changes, or wiring code. Trigger when someone says "let's TDD this", "write tests first", "add tests for X", or when implementing anything involving money math, percentage calculations, filtering, or aggregation.
---

# Test-Driven Development

The reason TDD exists here: budget math is the one place where being "mostly right" is actively harmful. Off-by-one errors in spend calculations, wrong frequency conversions, incorrect gain/loss formulas — these are silent bugs that erode trust in the app. Tests written before the code mean the logic is specified before it's implemented, and the spec can't accidentally drift to match the bug.

**When to use TDD**: budget math, categorisation rules, data aggregations, utility functions (`formatCurrency`, `sumBy`, frequency normalisation, etc.), any function that takes data in and returns data out.

**When to skip**: React components, layout, styling, wiring up event handlers, anything where "correctness" is visual.

---

## Setup (first time only)

If Vitest isn't installed in the exercise folder, add it before writing any tests:

```bash
cd teams/laszlo-robert/exercise_one
npm install -D vitest @vitest/ui
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

Add to `vite.config.ts`:
```ts
/// <reference types="vitest" />
// inside defineConfig:
test: {
  environment: 'node',
}
```

Test files live alongside the code they test: `src/lib/utils.test.ts`, `src/hooks/useFinanceData.test.ts`, etc.

---

## The cycle

Red → Green → Refactor. Don't skip steps, don't combine them.

### Red: write a failing test first

Before writing any implementation, write a test that describes the desired behaviour. Run it — it should fail (if it passes without implementation, the test is wrong).

```ts
// Example: budget spend calculation
import { describe, it, expect } from 'vitest'
import { calculateSpend } from './utils'

describe('calculateSpend', () => {
  it('sums transactions for a given category', () => {
    const transactions = [
      { categoryId: 'food', amount: 30 },
      { categoryId: 'food', amount: 20 },
      { categoryId: 'transport', amount: 15 },
    ]
    expect(calculateSpend('food', transactions)).toBe(50)
  })
})
```

Run: `npm test` → should fail with "calculateSpend is not a function" or similar.

### Green: write the minimum code to pass

Implement just enough to make the test pass. Resist the urge to generalise or handle cases the tests don't cover yet.

```ts
export function calculateSpend(categoryId: string, transactions: Transaction[]): number {
  return transactions
    .filter(t => t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0)
}
```

Run: `npm test` → should pass.

### Refactor: clean up without breaking

Now that the test is green, improve the code: rename for clarity, extract a helper, remove duplication. Run the tests after every change. If they go red, undo.

Then add the next test case — edge cases, boundary conditions, error inputs — and repeat.

---

## What to test in this codebase

High-value targets:

| Logic | What to test |
|---|---|
| Budget spend vs budgeted | Correct aggregation per category; categories with no transactions return 0 |
| Income frequency normalisation | Monthly/weekly/annual all convert to a common unit correctly |
| Investment gain/loss | `(currentPrice - purchasePrice) * shares`; negative gain works |
| Savings progress | Percentage capped at 100%; never goes below 0 |
| `formatCurrency` | Rounds correctly; handles 0; handles negative |
| `sumBy` | Empty array returns 0; handles floating point amounts |

---

## Running tests

```bash
npm test          # watch mode — re-runs on file save
npm run test:ui   # browser UI for exploring results
```

Keep tests running in watch mode while implementing. Green bar = safe to move forward.
