---
name: idea
description: Drive a feature idea from concept to a committed change on the team branch. Primary invocation is `/idea <the idea in plain words>`, but also use whenever the user starts a message with "idea:" or says "let's add…", "we should be able to…", "can we track…" for the personal finance app. Walks through clarify → plan → implement → verify → commit, honouring the hexagonal architecture, CSV persistence, Spring Boot, and JUnit 5 + AssertJ conventions in `exercise_1/CLAUDE.md`.
---

# Idea → Commit

Convert an informal idea into working, tested, committed code on the team branch. This is a thinking scaffold, not a rigid script — if a stage adds no value for a given change, say so explicitly and skip it.

## Why this skill exists

When someone says "idea: X", they're at the mouth of a funnel. Without a guide, the model tends to either jump straight into code and miss architectural constraints, or over-plan a twenty-line change. This skill forces a cheap clarify + align phase before code, then drives through to a committed change so ideas don't stall half-done.

The only hard rule: **don't start coding non-trivial work without a visible plan the user can steer**. Everything else is judgement.

## The five stages

### 1. Clarify (≤ 60 seconds of thinking)

Restate the idea in your own words, then surface:

- **Shape of input and output.** What does the user do, what do they see, what gets persisted?
- **Where it lives in the hexagon.** New domain concept? New port? New adapter? Pure web change?
- **What stays out of scope.** Adjacent things you will not build in this pass.

If anything is genuinely ambiguous — data shape, category semantics, currency rounding, recurrence — ask **at most 2 focused questions** before proceeding. More than 2 means the idea isn't ready for code yet; prefer `AskUserQuestion` with 2–4 options over free-text questions so the user can answer quickly.

Skip clarification entirely for trivial changes (typo fix, a rename, a string tweak).

### 2. Plan (short, in chat)

Write 3–8 bullets covering:

- New / changed files, grouped by hexagonal layer (`domain/`, `application/port/{in,out}/`, `adapter/in/web/`, `adapter/out/csv/`).
- Port signatures if you're adding one — the Java interface sketch only, not full bodies.
- Tests you'll add: which domain behaviour, which CSV round-trip, which controller path.
- Anything that breaks existing tests or existing CSV files (compatibility cost).

Don't enter formal plan mode for this — keep it conversational. Ask for a thumbs-up before writing code, **unless** the change is trivial (< ~20 lines of code, no new ports, no domain model changes). Trivial changes can skip straight to stage 3 with a one-line announcement.

### 3. Implement

Follow the conventions already locked in by `exercise_1/CLAUDE.md`:

- `domain/` and `application/` stay free of Spring and I/O imports. If you're tempted to `@Autowired` something in a domain class, it belongs behind a port instead.
- Money is `BigDecimal`, never `double`. Dates are `LocalDate`, ISO-8601 on the wire.
- CSV adapter: UTF-8, header row, `yyyy-MM-dd` dates, dot decimal, no thousands separators. One CSV per aggregate.
- Inbound web: Spring MVC, thin controllers. Templates (if any) read from the domain; they don't compute domain logic.

Write the test *before or alongside* the domain logic, not as an afterthought. Use AssertJ's fluent `assertThat(...)` — never JUnit's `assertEquals`.

### 4. Verify

Run the minimum needed to prove the change works:

- **Any logic change:** `./mvnw test`. Read the failures, not just the exit code.
- **UI change:** `./mvnw spring-boot:run`, open `http://localhost:8080`, exercise the new path by hand. If you can't actually drive a browser from this session (no display, headless), say so explicitly — don't claim "it works" based on compilation alone.
- **CSV change:** write a round-trip test (write → read → assert equal) in addition to whatever else you add.

Quick self-review before stage 5: any dead `private` methods? Any over-engineering (interfaces with one impl, ports without a second caller in sight)? Any Spring imports that crept into `domain/`? Fix first.

### 5. Commit

Invoke the team's `/commit` skill (or follow its rules directly if you're in a context where the skill tool isn't reachable):

- One commit per logical idea. If the diff grew beyond the idea, split — don't ship a grab-bag.
- Subject ≤ 60 chars, lowercase, imperative present tense, no trailing period.
- Never push. `/idea` ends at a local commit; the user decides when to push.

## Tiny changes — stage dial-down

Not every idea needs all five stages. Use judgement:

| Change shape                              | Stages to run                |
|-------------------------------------------|------------------------------|
| Typo, rename, string tweak                | 3 → 5                        |
| Pure refactor, no behaviour change        | 2 (brief) → 3 → 4 → 5        |
| Small feature, no new port                | 1 (brief) → 3 → 4 → 5        |
| New port / new domain concept             | all five                     |
| Spike / throwaway exploration             | announce "spiking" → 3 only, **skip commit**, no stage 5 |

Always announce which dial you chose in one sentence so the user can override.

## What NOT to do

- Don't start stage 3 on a non-trivial idea without the user's nod on the plan. The plan is where ideas get course-corrected cheaply.
- Don't add dependencies, frameworks, or libraries that aren't already in `exercise_1/CLAUDE.md` without flagging the choice first and getting agreement.
- Don't commit a failing test, a `@Disabled` test, or a "TODO: fix later" test. Either finish it or leave it unwritten.
- Don't push. Ever, unless the user explicitly asks. `/idea` is scoped to local work.
- Don't silently expand scope. If while implementing you notice something adjacent that wants fixing, call it out and ask — don't bundle it in.
