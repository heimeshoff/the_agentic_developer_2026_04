---
name: idea-clarify
description: Stage 1 of the `/idea` pipeline — restate an informal idea in concrete terms, locate it in the hexagon, fix what's out of scope, and surface at most two focused questions. Use when invoked by the `/idea` orchestrator, when the user says "clarify this idea", or when they drop a rough feature idea that needs shape before planning. Updates `.claude/idea/current.md` and hands off to `idea-plan`.
---

# Idea — Stage 1: Clarify

Turn an informal idea into a concrete, scoped description that the planning stage can consume without re-asking.

## Inputs

1. **State file** at `.claude/idea/current.md`. Read it. The `Raw idea` section should already contain the user's words — if it doesn't, copy them in now.
2. **Architectural context** in `exercise_1/CLAUDE.md` — hexagonal layout, CSV persistence, Spring Boot, JUnit 5 + AssertJ. Assume these.

## What to produce (under 60 seconds of thinking)

Write a `Clarify` section in the state file covering:

- **Restated idea** — one or two sentences in your own words. Prove you understood.
- **Input / output shape** — what the user does, what they see, what gets persisted.
- **Hexagon location** — new domain concept? new port (in/out)? new adapter? pure web change? name the directories.
- **Out of scope** — adjacent things you are deliberately *not* building in this pass.
- **Dial** — pick one and justify in half a sentence: `trivial`, `small-feature`, `refactor`, `full`, `spike`. Update the top-level `Dial:` field too.

## Questions — at most two

If anything is genuinely ambiguous (data shape, category semantics, currency rounding, recurrence, which aggregate owns it), ask **up to two** focused questions. Prefer `AskUserQuestion` with 2–4 concrete options over free-text — the user should be able to answer with a single tap.

If you need more than two questions, the idea isn't ready yet: note that in the state file, set `Status: raw`, and hand back to the user for a longer conversation.

Skip questions entirely for `trivial` or clear `small-feature` changes.

## On exit

Update the state file:

- Append the `Clarify` section.
- Set `Status: clarified` (or `raw` if you bailed on too-many-questions).
- Update `Updated:` to today's date.

Then tell the user one sentence: *"Clarified — hit enter (or say 'go') to draft the plan, or push back on anything above."* Treat empty / `y` / `yes` / `go` / `ok` / `👍` as approval to proceed to `idea-plan`. Do not auto-run the next stage — wait for the nudge, so the user can redirect cheaply.

## Don't

- Don't start writing code. This stage is shape-only.
- Don't produce a plan (file list, test list). That's stage 2's job.
- Don't invent requirements the user didn't ask for. When in doubt, mark as out-of-scope.
