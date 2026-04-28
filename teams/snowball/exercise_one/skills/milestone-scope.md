---
skill: milestone-scope
---

## Goal

Lock the boundary of a milestone before any work starts. Forces an explicit "in / out / done" decision so Feature Builder doesn't drift and Planner doesn't re-scope mid-flight.

## Why It Exists

Workshop time is short. The biggest time sink is building something that wasn't needed, or building the right thing but not knowing when to stop. This skill makes "done" concrete before the first line of code.

## Prompt Pattern

```
You are scoping milestone [NAME] for the Snowball finance app.

Context:
- ROADMAP description: [paste milestone block]
- Already built: [list features from previous milestones, or "nothing yet"]
- Hard constraints from CLAUDE.md: frontend-only, IndexedDB, no backend, EUR/German formatting, 10-second entry rule

Produce:
1. IN SCOPE — bullet list of concrete deliverables
2. OUT OF SCOPE — things the milestone description might imply but we are explicitly deferring
3. ACCEPTANCE TEST — one or two sentences that, if true, prove the milestone is done

Be ruthless about OUT OF SCOPE. If it isn't needed to pass the acceptance test, it doesn't belong in this milestone.
```
