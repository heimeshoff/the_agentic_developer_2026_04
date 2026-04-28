---
name: writing-plans
description: Write an implementation plan for multi-step work. Use this skill when the team is about to start a feature, a new exercise, or any work that spans more than a handful of files. Trigger when someone says "let's plan this", "write a plan for X", "what's our approach", or after a brainstorm has been agreed on. The plan is written first, reviewed by the team, and only then does implementation begin — Claude does not write code until the plan is approved.
---

# Writing Plans

The reason plans exist: multi-step work without a written plan drifts. Claude starts building, discovers an ambiguity, makes a guess, and by the time the team sees it the code is heading the wrong direction. A plan creates a shared checkpoint — both humans read it, push back if something's wrong, and only then does Claude execute. The cost is five minutes; the payoff is not having to throw away an afternoon's work.

## Before you write

If a brainstorm artifact exists for this feature (check `teams/laszlo-robert/docs/brainstorms/`), read it first. The intent, requirements, and rough design from the brainstorm are the inputs to the plan — don't re-derive them from scratch.

If there's no brainstorm, ask: "Has this been through a brainstorm yet? If not, consider running `skills:brainstorming` first — plans are much easier to write when intent and requirements are already locked."

Don't insist. If the team wants to go straight to a plan, write it.

---

## Plan structure

Model your plans on this shape — it's the format the team has naturally converged on:

```markdown
# Plan: <Feature or Exercise Name>

## Context
<Why this work exists and what it's scoped to. One short paragraph.>

---

## Approach
<Stack choices, architectural decisions, and the reasoning behind them. 
Be brief — name the choice and the reason, not a full justification.>

---

## Design
<The concrete decisions: which views/components, what the data model looks like, 
how things connect. Use tables and type sketches freely — they compress a lot of information.>

---

## Key files
<A table of file paths and their purpose. Include new files and significantly-modified 
existing ones. Omit files that are obviously implied (e.g. auto-generated ones).>

---

## Implementation order
<A numbered list. Each step should be independently verifiable — 
the team can pause after any step and see working software.>

---

## Verification
<A checklist of what "done" looks like. Each criterion should be 
checkable by a human in under 30 seconds. Include: it builds, 
it runs, the key behaviours work, edge cases are handled.>
```

---

## How much detail is right

The goal is to de-risk implementation, not to pre-implement it in prose.

- **Enough**: naming the types, listing the files, ordering the steps
- **Too much**: spelling out every function signature, writing pseudocode, describing things that follow obviously from the choices already made

If you find yourself writing more than ~3 sentences about a single implementation step, you're probably over-specifying. Trust that the humans reading the plan will fill in the obvious parts.

---

## Where to save the plan

- **Exercise-level work** (new exercise, major restructure): overwrite or update `teams/laszlo-robert/plan.md`
- **Feature-level work** (a new view, a significant new capability): create `teams/laszlo-robert/docs/plans/<kebab-case-feature>.md`

When in doubt, ask. A wrong location is easy to fix, but a plan nobody can find is useless.

---

## Getting approval

After writing the plan, say:

> "Here's the plan — take a read. Once you're both happy with it, say the word and I'll start implementing."

Then stop. Don't start writing code, don't start "while you review I'll just set up the files." Wait for explicit approval from the team.

If they push back on a section, update that section and re-confirm. Don't re-read the whole plan back to them — just show what changed.

Once both Laszlo and Robert say go, begin execution in the order listed under **Implementation order**. Check off steps as they complete.
