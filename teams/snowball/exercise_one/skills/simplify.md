---
skill: simplify
---

## Goal

After a milestone ships, sweep the code for unnecessary complexity before moving on. Catches premature abstractions, dead code, and over-engineering while the context is still fresh.

## Why It Exists

Workshop velocity pushes toward "working fast." This skill enforces the counter-pressure: don't carry dead weight into the next milestone, where it becomes harder to remove.

## Prompt Pattern

```
Review the code written for [MILESTONE NAME] in the Snowball finance app.

Apply these rules strictly:
1. Three similar lines of code is better than a new abstraction — remove any helper that is called fewer than three times
2. Delete any comment that describes WHAT the code does (the code already says that) — keep only WHY comments for non-obvious constraints
3. Flag any prop, parameter, or interface field that is defined but never read
4. Flag any component or function that exists "in case we need it later"
5. Flag anything imported but unused

For each issue found: file path, line range, what to remove or inline, one-sentence reason.
Do not suggest new features or refactors beyond removing what's already there.
```
