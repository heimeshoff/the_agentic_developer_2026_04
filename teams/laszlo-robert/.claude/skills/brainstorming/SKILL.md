---
name: brainstorming
description: Structured feature brainstorming for team Laszlo & Robert. Use this skill whenever someone proposes a new feature, asks "what should we build next", wants to think through an idea before coding, or says things like "I want to add X", "let's brainstorm Y", "what do you think about building Z". The goal is to lock intent → requirements → rough design before any code is written. Trigger even when the idea sounds simple — simple ideas benefit from 5 minutes of structure too.
---

# Brainstorming

The reason this skill exists: the most expensive mistake in a workshop sprint is building the right-looking thing for the wrong reason. Five minutes of structured thinking before touching files saves hours of rework. This skill drives that conversation and produces a written artifact both team members have agreed on.

## How to run a brainstorm

Drive the conversation with questions, one at a time. Don't dump a form on the user — ask, listen, branch. The three phases below give you the shape, but let the answers steer you. If an answer makes a later question irrelevant, skip it.

When you have enough in each phase to write it up confidently, move on. Don't over-interview.

---

## Phase 1 — Intent

Goal: understand *why* this feature matters, not just what it is.

Start here:
> "What problem does this solve for the user — or for you as developers?"

Branch on the answer:
- If it's **user-facing** (something the end user sees/does): dig into the user's current pain. "What are they doing today without this?"
- If it's **developer-facing** (tooling, DX, internal): dig into the cost of not having it. "What keeps going wrong or taking too long?"
- If the answer is vague ("it would be nice to have"): ask "if we shipped this sprint without it, what breaks or hurts?"

You're done with Phase 1 when you can write one sentence: *"We're building X so that Y."*

---

## Phase 2 — Requirements

Goal: a short, concrete list of what done looks like. Not a spec — just enough to scope the work.

Ask:
> "What's the minimum this needs to do for it to be worth shipping?"

Then probe for edges:
- "What should it explicitly *not* do?" (scope fence)
- "Any data or state it needs to read or write that we don't already have?"
- "Does it need to work offline / with bad data / for a first-time user?"

Stop when you have 3–6 acceptance criteria that a reasonable person could check.

---

## Phase 3 — Rough Design

Goal: just enough architecture to unblock implementation. Not a system design doc.

Cover these three things — briefly:

**Component sketch**: Which UI surfaces are involved? New screen, panel, or wired into an existing one? A sentence is enough.

**Data model shape**: What new fields, entities, or relationships does this introduce? Name the types, not the schema.

**API / interaction surface**: How does data flow? User action → what happens → what updates? If there's a backend call or a calculation, name it. One short paragraph.

Avoid going deeper than this. The goal is to de-risk the implementation, not design it in advance.

---

## Closing the brainstorm

Before writing the artifact, read back your understanding of all three phases in plain language and ask:

> "Does this match what you both had in mind? Anything missing or wrong?"

Wait for explicit agreement from both Laszlo and Robert. If either pushes back, address it and re-confirm. Don't proceed to the artifact until you have a clear "yes, let's go."

---

## Writing the artifact

Save to `docs/brainstorms/<kebab-case-feature-name>.md` in the team folder (`teams/laszlo-robert/`).

Use this structure:

```markdown
# Brainstorm: <Feature Name>

**Date**: <today>
**Participants**: Laszlo, Robert, Claude

## Intent
<One sentence: "We're building X so that Y.">

## Requirements
- <acceptance criterion 1>
- <acceptance criterion 2>
- ...

## Rough Design

**Components**: <which UI surfaces, one sentence>

**Data model**: <new entities/fields and their types>

**API / interactions**: <data flow, one short paragraph>

## Open questions
<Anything that came up but wasn't resolved — parking lot for planning phase>
```

After saving, tell the team where the file is and suggest the next step: "Ready to write a plan? Use `skills:writing-plans` and point it at this brainstorm."
