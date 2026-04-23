---
agent: qa-smoke
---

## Responsibility

Run the milestone's acceptance tests manually against the live app. Produces a pass/fail checklist. If anything fails, files a specific bug report for Feature Builder to fix.

## Input

- Planner's acceptance test list for the milestone
- The runnable app with UX Auditor blockers already resolved

## Output

- Checked acceptance test list (pass / fail per item)
- For each failure: exact steps to reproduce, what was expected, what happened
- Explicit milestone sign-off or list of blockers before sign-off

## When to Use

After UX Auditor has cleared all blockers. This is the final gate before moving to the next milestone.

## What Good Output Looks Like

```
M1 Acceptance Test Results

[x] Transaction added in under 10 seconds from cold load (7 seconds)
[x] Close + reopen browser → data persists
[x] Export → clear storage → import → state identical
[ ] FAIL: Import of a 0-transaction file shows no confirmation dialog

Milestone M1: NOT signed off. 1 blocker.
Bug: import with empty array silently completes with no feedback to user.
Repro: export empty DB → import the file → no toast, no message.
Expected: "0 transactions imported" confirmation.
```
