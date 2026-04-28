---
name: idea
description: Orchestrate the idea → commit pipeline for the personal finance app. Primary invocation is `/idea <the idea in plain words>`, but also use whenever the user starts a message with "idea:", says "let's add…", "we should be able to…", "can we track…", or asks "where were we" / "resume the idea" / "what's the idea status". Routes to the stage skills (`idea-clarify`, `idea-plan`, `idea-implement`, `idea-verify`, `commit`) via a shared state file so work is resumable across sessions.
---

# Idea — orchestrator

You are the router for a five-stage pipeline that turns an informal idea into a committed change:

```
clarify → plan → implement → verify → commit
```

Each stage is its own skill. This skill decides **which stage to run next** based on a shared state file, so a long idea can be picked up mid-stream across sessions (or handed between parallel agents).

## The state file

Single source of truth: `.claude/idea/current.md` (relative to the team root — same parent as `.claude/skills/`).

Expected layout:

```markdown
# Idea — <slug>

- **Status:** raw | clarified | planned | implemented | verified | committed | abandoned
- **Dial:** full | small-feature | refactor | trivial | spike
- **Started:** YYYY-MM-DD
- **Updated:** YYYY-MM-DD

## Raw idea
<verbatim user input>

## Clarify
<filled by idea-clarify>

## Plan
<filled by idea-plan>
**Approved:** yes | no | pending

## Implementation
<filled by idea-implement — file log, notes>

## Verify
<filled by idea-verify — test output summary, UI notes, self-review>

## Commit
<filled after /commit — sha + subject>
```

If the directory doesn't exist, create it. Treat a missing file as "no idea in progress".

## Routing rules

Inspect the user's input and the state file, then pick one:

| Situation                                                            | Action                                                                                                  |
|----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| User gave a new idea text AND no state file exists                   | Create state file with `Status: raw`, fill `Raw idea`, invoke `idea-clarify`.                           |
| User gave a new idea text AND state file exists (status ≠ committed) | Show the old idea's status in one line. Ask: *"Archive the current idea and start fresh? Hit enter to archive + start, or say 'keep' to stay on it."* Default is archive. |
| User gave a new idea text AND state is `committed`                   | Archive (`mv current.md archive/<slug>-<date>.md`), then start fresh as above.                          |
| User said "status" / "where are we" / "resume"                       | Print the state summary (status, dial, last update, next step). Ask if they want to continue.           |
| State exists, status is `raw`                                        | Invoke `idea-clarify`.                                                                                  |
| State exists, status is `clarified`                                  | Invoke `idea-plan`.                                                                                     |
| State exists, status is `planned`                                    | Invoke `idea-implement`.                                                                                |
| State exists, status is `implemented`                                | Invoke `idea-verify`.                                                                                   |
| State exists, status is `verified`                                   | Invoke `commit`, then on success update state `Status: committed` and record the sha.                   |
| State exists, status is `committed`                                  | Say "idea is done — archive it or start a new one?" and wait.                                           |

Always announce the stage you're about to run in one sentence before invoking it.

## Parallelism

Two places it's worth fanning out:

- **Stage 3 (implement):** if the plan touches multiple hex layers (`domain/` + `adapter/out/csv/` + `adapter/in/web/`) with no tight coupling, consider spawning Agent subagents per layer. Only do this when the plan is explicit enough that the subagents don't need to re-derive shape.
- **Stage 4 (verify):** `./mvnw test` and a manual UI check can run in parallel — start tests in the background, drive the UI while they run.

Don't force parallelism when the change is small. One sequential pass beats premature fan-out.

## Trivial-change shortcut

If the user's idea is clearly trivial (typo, rename, string tweak — roughly < 20 lines, no new port, no domain change), skip the pipeline: announce "this is trivial, going direct", implement + commit, and don't create a state file. The pipeline is for ideas that benefit from clarify/plan/verify structure.

## Hard rules (apply across all stages)

- Never push. `/idea` ends at a local commit.
- Don't silently expand scope mid-stage. Call it out and ask.
- Don't add dependencies not already in `exercise_1/CLAUDE.md` without explicit agreement.
- Don't commit failing or `@Disabled` tests.
- Each sub-skill **must update the state file** (status + timestamp + its section) before returning, so resumption works.
