---
name: idea-verify
description: Stage 4 of the `/idea` pipeline — prove an implemented change works by running the relevant tests, exercising the UI where applicable, and doing a fast self-review. Use when the orchestrator invokes this, when the user says "verify it" / "does it work?" / "run the tests", or when `.claude/idea/current.md` has `Status: implemented`. Records results in the state file and hands off to `/commit`.
---

# Idea — Stage 4: Verify

Prove the change works end-to-end before committing. This stage is where "looks right" becomes "actually works".

## Inputs

1. **State file** `.claude/idea/current.md`. Read `Plan` and `Implementation`. If `Status` ≠ `implemented`, route back.
2. **What the change touches** — drives which checks to run.

## The minimum set

Pick the checks that match the change. Run more than one in parallel where it makes sense.

| Change shape                   | Run                                                                                           |
|--------------------------------|-----------------------------------------------------------------------------------------------|
| Any logic / domain change      | `./mvnw test`. Read failures, not just the exit code.                                         |
| CSV adapter change             | A round-trip test (write → read → assert equal) must exist. If it doesn't, go back to stage 3.|
| UI / web change                | `./mvnw spring-boot:run` (background), open `http://localhost:8080`, exercise the new path.   |
| Port / interface change        | All callers compile AND their tests pass.                                                     |
| Pure refactor                  | Full `./mvnw test`. No behaviour should change.                                               |

**Parallelism:** start `./mvnw test` in the background and do the UI walkthrough / self-review while it runs. On Opus, that's a real wall-clock win.

## If you can't drive a browser

Be honest: if this session has no display and no way to hit `http://localhost:8080` (headless sandbox, no browser tool), **say so explicitly**. Do not claim "it works" based on compilation alone — ship a verdict like *"tests pass; UI not exercised (no browser available) — please hand-test the `/debts` page before committing"* and set `Status: verified` with a caveat noted.

## Self-review

Before marking verified, quickly scan:

- Any dead `private` methods introduced this pass?
- Any single-impl interfaces / over-engineered abstractions?
- Any Spring or I/O imports in `domain/`?
- Any `@Disabled` / TODO-fix-later tests?
- Any `double` / `float` on money fields that slipped through?

Fix first, then re-run relevant tests. Don't push cleanup into the commit.

## On exit

Update the state file's `Verify` section with:

- Test command + short outcome (`./mvnw test → 42 passed, 0 failed`).
- UI check notes (what you exercised, or why you couldn't).
- Self-review findings + what you fixed.

Set `Status: verified`. Update `Updated:`.

Tell the user one sentence: *"Verified — running /commit next unless you want to inspect first. Hit enter to proceed."* Treat the usual affirmations as go. On approval, invoke the `/commit` skill; the orchestrator picks up the sha afterwards.

## Don't

- Don't mark verified if a test is red. Either fix it or step back to stage 3.
- Don't commit here — that's `/commit`'s job.
- Don't skip tests because "the change is small". Small changes are where regressions hide.
