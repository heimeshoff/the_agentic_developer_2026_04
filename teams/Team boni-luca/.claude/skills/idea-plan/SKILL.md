---
name: idea-plan
description: Stage 2 of the `/idea` pipeline — turn a clarified idea into a concrete implementation plan (files by hex layer, port signatures, tests, compatibility cost) and get the user's nod before any code is written. Use when the orchestrator invokes this, when the user says "plan this" / "draft a plan", or when a clarified idea is in `.claude/idea/current.md` with `Status: clarified`. Updates the state file and hands off to `idea-implement`.
---

# Idea — Stage 2: Plan

Produce a short, reviewable plan the user can steer **before** any code gets written. The plan is where ideas get course-corrected cheaply.

## Inputs

1. **State file** `.claude/idea/current.md`. Read the `Raw idea` and `Clarify` sections. If `Status` is not `clarified`, bail and tell the user we need to clarify first.
2. **Architectural guardrails** in `exercise_1/CLAUDE.md`.

## What to produce — 3 to 8 bullets in chat AND in the state file

Cover, at minimum:

- **Files by hex layer** — new/changed files grouped under `domain/`, `application/port/{in,out}/`, `adapter/in/web/`, `adapter/out/csv/`. Use exact paths where possible.
- **Port signatures** — if you're adding a port, sketch the Java interface only (method names + types). No method bodies.
- **Tests** — which domain behaviour, which CSV round-trip, which controller path. Name the test classes.
- **Compatibility cost** — anything that breaks existing tests or existing CSV files. If nothing, say so explicitly.

Skip bullets that genuinely don't apply (e.g. a pure web change won't need a port sketch). Call out the skip so the reader knows it was considered.

## The approval ask

End the plan with a single-line ask phrased so the **default is to proceed**:

> *"Hit enter (or say 'go') to start implementing, or tell me what to change."*

Treat any minimal affirmation as approval: empty input, `y`, `yes`, `yep`, `ok`, `go`, `ship it`, `👍`, `✅`. Only pause if the user raises a concern, asks for a change, or questions the plan. Don't ask "are you sure?".

For `trivial` dial: skip the ask. Announce what you're about to do in one sentence and set `Approved: yes` yourself. The plan is still worth writing down (even a one-liner) so resume-from-state keeps working.

## On exit

Update the state file:

- Append/replace the `Plan` section (include the full bullets, not a summary).
- Set `Approved:` to `yes`, `no`, or `pending`.
- If approved: set `Status: planned`, update `Updated:`.
- If the user pushed back: keep `Status: clarified`, record the objection in the `Plan` section, iterate.

Once `Status: planned`, hand off to `idea-implement` — don't wait for a second confirmation, the approval on the plan *is* the go.

## Don't

- Don't write implementation code. Interface sketches only.
- Don't enter formal plan mode (the Claude Code plan-mode tool) — keep it conversational in chat.
- Don't expand scope beyond what `Clarify` captured. If something new comes up, note it under "out of scope" in the plan and ask whether to re-clarify.
