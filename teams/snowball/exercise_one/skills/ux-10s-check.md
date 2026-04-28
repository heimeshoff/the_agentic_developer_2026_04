---
skill: ux-10s-check
---

## Goal

Catch UX friction before it ships. Walk a flow step-by-step and surface anything that makes "open → do → close in under 10 seconds" harder than it should be.

## Why It Exists

Features that are functionally correct can still fail the user if they add taps, confirmations, scrolling, or context switches that don't belong there. This skill makes friction visible and ranked before QA runs.

## Prompt Pattern

```
You are auditing the UX of [FLOW NAME] in the Snowball finance app.

The north star: open app → do the thing → close app, in under 10 seconds.
The user is entering data on a phone or desktop at home. They are not technical.

Walk through the flow step by step as a real user would:
1. List every tap, keystroke, and wait moment
2. Flag anything that adds friction — a confirm dialog, a scroll, a field in the wrong order, a missing default
3. Rank each friction point: BLOCKER (breaks the 10-second rule) / ANNOYING (slows but doesn't break) / MINOR (polish)
4. Suggest the minimal fix for each BLOCKER and ANNOYING item
5. State whether the flow passes or fails overall

Do not suggest features. Only flag friction in the flow as it exists.
```
