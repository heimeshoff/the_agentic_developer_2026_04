# Team: richi_and_lucag

This file is auto-loaded into every session. It defines how this team works, where memory lives, and what gets written when.

---

## Project pointer

This team builds whatever vision is named in `memory/project/INDEX.md`. Do not assume a fixed product domain. The active project's identity, scope, and language are derived from the active session's `vision.md` resolved through INDEX.

## Phase gates

Human approval is required between every phase. The phase order is:

```
brainstorm → research → domain → tactical-ddd → capture → worker
```

Never advance to the next phase without an explicit human "yes" on the current phase's artifact.

## Co-drive rule

Claude proposes, human confirms. Never make consequential decisions silently — surface trade-offs, name alternatives, and wait for the human to choose.

## Artifact convention

All phase artifacts live under:

```
exercise_one/YYYY-MM-DD-<scope-slug>/<phase>.md
```

Where `<phase>` is one of `vision`, `research`, `domain`, `tactical-ddd`. Session folders are append-only: do not rename or move them after creation.

## Code rules (apply during `/worker`)

- No comments that explain *what* — only comments that explain *why* when the reason is non-obvious.
- Never use `git add -A` or `git add .` without first reviewing what would be staged.
- No scope creep. Implement only what the task's Acceptance criteria require.
- Surface decision points: if two reasonable approaches exist, name them and ask.
- Match existing code style exactly. No dead code, no TODO stubs.

## Memory placement

| Layer | Question it answers | Volatility | File(s) | Read | Write |
|---|---|---|---|---|---|
| **Workflow** | *How we work* | Stable | `CLAUDE.md` | Auto-loaded by harness | Manual edits only |
| **Project** | *Why & what this project does* | Slow | `memory/project/INDEX.md`, `decisions.md`, `glossary.md` | Skills resolve via INDEX; full read on demand | INDEX/state by skills (transactional); decisions append-only via Decision Gate; glossary propose-only |
| **Task** | *Where we are right now & what's next* | Fast | `memory/task/state.md` | Skills read on entry | Replaced wholesale on phase change |

Worked examples:

- "We always start with `/research`" → `CLAUDE.md` (durable workflow rule).
- "We are currently waiting for `/research` approval" → `state.md` (volatile phase).
- "We chose research-before-domain because domain modeling without facts caused churn" → `decisions.md` (foreclosed alternative).

## Decision Gate

A decision worth appending to `decisions.md` must satisfy **all** of:

1. Irreversible or expensive to reverse.
2. Affects product behavior, domain language, architecture, data model, compliance, or workflow.
3. Has an explicit *why*.
4. Has at least one *rejected alternative*.

Every producing skill ends with a `Decision candidates` step:

```
Decision candidates from this session:
1. [candidate] — append: yes/no — reason
2. [candidate] — append: yes/no — reason
```

Only `append: yes` candidates are written.

**Anti-noise rule**: Do not log task status, wording edits, artifact file paths, phase transitions, or user preferences unless they foreclose a future alternative.

ADR-lite block (the *only* allowed format in `decisions.md`):

```markdown
## ADR-NNNN — [Decision title]
Date: YYYY-MM-DD
Status: Accepted
Scope: product | domain | architecture | workflow
Decision: [what was decided, one sentence]
Why: [why this, in one sentence]
Rejected alternative: [the one foreclosed alternative + why rejected]
Consequence: [what this commits us to or rules out]
Source artifact: [path to producing artifact, or "conversation"]
```

## Glossary protocol

- Skills (mainly `domain` and `tactical-ddd`) emit a `## Glossary Proposals` section in their final response or artifact.
- Each proposal: term, candidate definition, bounded context, rationale.
- A human accepts proposals; only on accept does Claude append to `glossary.md`.
- Existing entries are never silently overwritten. Updates are proposed the same way: "term X currently defined as Y; conversation suggests Z; update?".

## Memory pointers (on session entry)

1. Read `memory/task/state.md` — current phase, active session, blockers.
2. Resolve artifact paths via `memory/project/INDEX.md` — never `find` or glob.
3. Read `memory/project/decisions.md` and `memory/project/glossary.md` only when their content is relevant to the current task.
4. If INDEX is missing, malformed, or points to a missing file: stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
