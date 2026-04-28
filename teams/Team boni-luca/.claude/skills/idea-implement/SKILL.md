---
name: idea-implement
description: Stage 3 of the `/idea` pipeline — write the code and tests for an already-approved plan, respecting the hexagonal layout, CSV persistence conventions, and JUnit 5 + AssertJ testing style from `exercise_1/CLAUDE.md`. Use when the orchestrator invokes this, when the user says "implement the plan" / "let's build it", or when `.claude/idea/current.md` has `Status: planned` and `Approved: yes`. Appends a file-log to the state and hands off to `idea-verify`.
---

# Idea — Stage 3: Implement

Turn the approved plan into working code + tests, without drifting from it.

## Inputs

1. **State file** `.claude/idea/current.md`. Read `Clarify` and `Plan`. If `Status` ≠ `planned` or `Approved` ≠ `yes`, stop and route back to the correct stage.
2. **Architectural conventions** in `exercise_1/CLAUDE.md`.

## Non-negotiable conventions

- `domain/` and `application/` stay free of Spring and I/O imports. If you're tempted to `@Autowired` something in a domain class, it belongs behind a port instead.
- Money is `BigDecimal`, never `double` / `float`.
- Dates are `LocalDate`, ISO-8601 (`yyyy-MM-dd`) on the wire.
- CSV adapter: UTF-8, header row, `yyyy-MM-dd` dates, dot decimal, no thousands separators, one CSV per aggregate.
- Inbound web: Spring MVC, thin controllers. Templates read from the domain; they don't compute domain logic.
- Tests use AssertJ (`assertThat(...)`) — never JUnit's `assertEquals`. Write the test *before or alongside* the production code, not after.

## Parallelism opportunity

If the plan hits independent hex layers (domain + out-adapter + in-adapter) AND the interfaces between them are pinned down in the plan, fan out with Agent subagents — one per layer. Each subagent gets:

- The relevant section of the plan.
- The port signatures they consume/produce.
- A clear "write the code and tests in this layer only, do not touch others" instruction.

Don't fan out when the plan is thin or the layers haven't been pinned — subagents that have to re-derive shape will disagree.

For small features or single-layer changes, just do it sequentially.

## Log as you go

Each time you finish a coherent chunk (e.g. a new aggregate, a repository adapter, a controller), append a one-line entry to the `Implementation` section of the state file:

```
- 2026-04-23 added Debt aggregate + DebtTest (domain/)
- 2026-04-23 wired CsvDebtRepository + round-trip test (adapter/out/csv/)
```

This is what makes resumption painless. If the session dies mid-stage, the next agent reads the log and knows what's already built.

## Self-check before exit

Before marking this stage done, quickly scan for:

- Dead `private` methods.
- Single-impl interfaces or ports without a second caller in sight — drop them.
- Spring imports that crept into `domain/`.
- `double`/`float` on money fields.
- `@Disabled` or TODO-ridden tests.

Fix anything found. Don't defer cleanup to stage 4.

## On exit

Update the state file:

- `Implementation` section: final file log + any notes worth preserving (non-obvious decisions, deferred follow-ups).
- `Status: implemented`.
- Update `Updated:`.

Tell the user one sentence: *"Implemented — running verify next."* Then hand off to `idea-verify`.

## Don't

- Don't add dependencies not already in the project without flagging first and getting agreement.
- Don't silently expand scope beyond the plan. If you hit something adjacent that needs fixing, note it in the `Implementation` section as a follow-up and ask whether to include it now.
- Don't commit here. Commits happen after verify.
