# Memory Architecture Plan

_Date: 2026-04-28_
_Scope: `teams/richi_and_lucag/` only — self-contained, no parent-folder dependencies_

---

## Goal

Give Claude a small always-loaded layer plus three on-demand memory layers so the team's harness:

- Loads minimal context by default but can resolve the right artifacts deterministically.
- Lets Claude autonomously read all memory and autonomously record decisions, gated by a semantic check.
- Treats glossary as propose-only, never auto-overwriting existing definitions.
- Survives growing past one session folder without "latest-looking file wins" drift.

## Memory taxonomy

| Layer | Question it answers | Volatility | File(s) | Read | Write |
|---|---|---|---|---|---|
| **Workflow** | *How we work* | Stable | `CLAUDE.md` | Auto-loaded by harness | Manual edits only |
| **Project** | *Why & what this project does* | Slow | `memory/project/INDEX.md`, `decisions.md`, `glossary.md` | Skills resolve via INDEX; full read on demand | INDEX/state by skills (transactional); decisions append-only via Decision Gate; glossary propose-only |
| **Task** | *Where we are right now & what's next* | Fast | `memory/task/state.md` | Skills read on entry | Replaced wholesale on phase change |

Plus durable artifacts in `exercise_one/<date-slug>/` (unchanged) and a backlog at `docs/tasks.md` (initialized empty in this migration).

## Final folder layout

```
teams/richi_and_lucag/
  CLAUDE.md                          # workflow + curation rules + Decision Gate spec
  memory/
    project/
      INDEX.md                       # canonical pointers, session lifecycle, integrity block
      decisions.md                   # ADR-lite, append-only, gated
      glossary.md                    # accepted terms only — propose, don't auto-merge
    task/
      state.md                       # snapshot: active session, phase, next, drift warnings
  exercise_one/
    2026-04-23-consultant-cashflow/
      vision.md                      # existing
    conversation.md                  # existing — to be marked archived in INDEX
  docs/
    memory-architecture-plan.md      # this file
    tasks.md                         # initialized empty by this migration
  scripts/
    reindex_memory.sh                # deterministic recovery path
  .claude/
    settings.json                    # unchanged
    settings.local.json              # unchanged (gitignored, machine-local)
    skills/
      brainstorm/SKILL.md
      research/SKILL.md
      domain/SKILL.md
      tactical-ddd/SKILL.md
      capture/SKILL.md
      worker/SKILL.md
      business-research/SKILL.md
      reindex/SKILL.md               # NEW
```

Seven existing skills get refactored; one new skill (`reindex`) is added.

---

## Design rules

### Placement rules (where memory belongs)

- **`CLAUDE.md`** — durable team operating rules: phase gates, co-drive, artifact convention, code rules, Decision Gate spec, memory curation rules, placement table.
- **`memory/project/INDEX.md`** — canonical pointers + session lifecycle. No prose summaries longer than one line per artifact.
- **`memory/project/decisions.md`** — durable "why this, not that". Each entry foreclose an alternative.
- **`memory/project/glossary.md`** — accepted ubiquitous language only. No pending proposals — those live in skill output until a human accepts.
- **`memory/task/state.md`** — volatile current phase, active session, blockers, next action, drift warnings.

Worked examples (from codex review):

- "We always start with `/research`" → `CLAUDE.md` (durable workflow rule).
- "We are currently waiting for `/research` approval" → `state.md` (volatile phase).
- "We chose research-before-domain because domain modeling without facts caused churn" → `decisions.md` (foreclosed alternative).

### The Decision Gate

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

Only `append: yes` candidates are written. No vague global rule — the gate runs explicitly at each skill's end.

Anti-noise rule (also in `CLAUDE.md`):

> Do not log task status, wording edits, artifact file paths, phase transitions, or user preferences unless they foreclose a future alternative.

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

### Glossary protocol

- Skills (mainly `domain` and `tactical-ddd`) emit a `## Glossary Proposals` section in their final response or artifact.
- Each proposal: term, candidate definition, bounded context, rationale.
- A human accepts proposals; only on accept does Claude append to `glossary.md`.
- Existing entries are never silently overwritten. Updates are proposed the same way: "term X currently defined as Y; conversation suggests Z; update?".

### Memory Read Contract (pasted into every skill)

```markdown
## Memory Read Contract

Required reads on entry:
1. `memory/project/INDEX.md` — canonical pointers + session lifecycle.
2. `memory/task/state.md` — current phase, active session, blockers.
3. The specific canonical artifact path(s) this skill grounds in, resolved from INDEX.

Rules:
- Always resolve artifact paths through INDEX. Do not fuzzy-find via `find`.
- If INDEX is missing or points to a missing file, stop and tell the user to run `/reindex`. Do not silently fall back to globbing.
- The active session is whichever session has `status: active` in INDEX. Never use date-affinity heuristics.
```

### Memory Write Transaction (pasted into every producing skill)

```markdown
## Memory Write Transaction

Write order, no skipping:
1. Save the artifact (or backlog change) to its canonical path.
2. Verify the file exists and is non-empty.
3. Update `memory/project/INDEX.md` — bump canonical pointer if this is now canonical, and update session lifecycle if a status changed.
4. Replace `memory/task/state.md` wholesale with the new snapshot.
5. Run the Decision Gate. Append qualifying entries to `decisions.md`.
6. Output any glossary candidates as a `## Glossary Proposals` section in the final response. Do not edit `glossary.md`.

If any step after step 1 fails or is skipped, the final response must say:
> Memory drift possible. Run `/reindex` to reconcile.
```

### Session lifecycle (in INDEX)

Each session entry in `INDEX.md` carries a `status`:

- `active` — current focus. Exactly one allowed.
- `superseded` — superseded by a later session; pointer in INDEX shows which one.
- `archived` — preserved for history but not in scope.
- `abandoned` — explicitly dropped. Kept on disk for audit.

Canonical artifact pointers must include `source session` and `supersedes` (where applicable).

INDEX must contain a Memory Integrity block:

```markdown
## Memory Integrity
- Active session: [path or "none"]
- Canonical artifact set complete: yes/no
- Known drift: [list, or "none"]
- Last reindex: YYYY-MM-DD
```

---

## Implementation steps

Each step is a discrete, reviewable unit. I'll stop for your read after step 1 (CLAUDE.md) before continuing.

### Step 1 — Write `CLAUDE.md`

Single file, ~80 lines. Sections:

1. **Project pointer** — one sentence: "This team builds whatever vision is named in `memory/project/INDEX.md`. Do not assume a fixed product domain."
2. **Phase gates** — human approval required between brainstorm → research → domain → tactical-ddd → capture → worker.
3. **Co-drive rule** — Claude proposes, human confirms; never make consequential decisions silently.
4. **Artifact convention** — `exercise_one/YYYY-MM-DD-<scope-slug>/<phase>.md`.
5. **Code rules** — pulled from existing `worker` skill (no comments-of-what, no `git add -A`, no scope creep, surface decision points).
6. **Memory placement table** — the table from this plan, lifted in.
7. **Decision Gate spec** — full criteria + ADR-lite block format + anti-noise rule.
8. **Glossary protocol** — propose-only, human accepts, never silent overwrite.
9. **Memory pointers** — "On entry, read `memory/task/state.md`. Resolve artifact paths via `memory/project/INDEX.md`. Read `decisions.md` and `glossary.md` only when their content is relevant to the current task."

### Step 2 — Initialize memory files

- `memory/project/INDEX.md` populated from current state:
  - Active session: `exercise_one/2026-04-23-consultant-cashflow/` (vision-only).
  - Archived: `exercise_one/conversation.md` (old homeowner project context, marked archived with one-line reason).
  - Memory Integrity block: complete=no (only vision present), drift=none, last reindex=today.
- `memory/project/decisions.md` — empty scaffold with format spec at top (the ADR-lite block).
- `memory/project/glossary.md` — empty scaffold with format spec at top.
- `memory/task/state.md` — current snapshot: active session = consultant-cashflow, phase = post-vision, next = `/research` or `/domain` (user choice).
- `docs/tasks.md` — initialized empty with the existing template from `capture` skill.

### Step 3 — Reindex tooling

- `scripts/reindex_memory.sh` — deterministic shell script:
  - Walks `exercise_one/*/` for known artifact filenames.
  - Lists what's on disk vs. what `INDEX.md` claims.
  - Outputs a diff-style report; does not auto-edit `INDEX.md`.
  - Final response is a proposed updated `INDEX.md` content for human approval.
- `.claude/skills/reindex/SKILL.md` — invokes the script, presents the diff to the user, applies the new `INDEX.md` only on confirm. Resets `state.md`'s drift warning on success.

### Step 4 — Refactor existing skills

For each of the seven, three coordinated changes:

**A. Strip product-specific nouns from `description:` frontmatter.**

The current `description:` lines all hardcode "homeowner-fintech personal finance product" — that contradicts the only present vision (consultant cashflow). Replace with product-agnostic phrasing that loads product identity from INDEX/vision at runtime. Example:

Before:
```
description: Vision refinement skill for the homeowner-fintech personal finance product. ...
```

After:
```
description: Vision refinement skill for this team. Reads memory/project/INDEX.md to learn the active project; loads or creates vision.md. Use whenever the team is starting a new initiative or pressure-testing direction.
```

**B. Insert Memory Read Contract** (verbatim, near top of skill body).

**C. Insert Memory Write Transaction** (verbatim, in the saving section) and remove ad-hoc `find` discovery.

**Per-skill specifics on top of A/B/C:**

| Skill | Specific change |
|---|---|
| `brainstorm` | After saving `vision.md`, mark itself as the active session in INDEX if it's a new session. Decision candidates: usually scope decisions (out-of-scope items). |
| `research` | Drop same-date session-affinity rule; resolve session via INDEX active session. Emit Glossary Proposals if domain language emerged. |
| `domain` | Glossary Proposals section emitted in final response (terms also embedded in `domain.md` artifact under the same heading). Decision candidates: bounded context choices, ACL placements. |
| `tactical-ddd` | **Reverse write order**: save `tactical-ddd.md` first, *then* append tasks to `docs/tasks.md`. Decision candidates: aggregate boundaries, repository contracts. Glossary Proposals carry forward from domain layer. |
| `capture` | Reads vision/domain via INDEX (no globbing). If `docs/tasks.md` missing, initialize using its template (no longer punts). |
| `worker` | Reads `decisions.md` + `glossary.md` before implementation, in addition to artifacts. Does not update INDEX unless creating/moving project artifacts. |
| `business-research` | Same A/B/C; product-agnostic phrasing. |

### Step 5 — Cleanup

- `exercise_one/conversation.md` left on disk but marked `status: archived` in INDEX with a one-liner explaining it described an earlier abandoned project direction.
- `settings.local.json` allows `Bash(/usr/bin/find *)` — leave as-is (machine-local, gitignored). Do not rely on it; INDEX is the deterministic path.

### Step 6 — Smoke check

Mental dry-run against the consultant-cashflow folder:

1. New session starts. Claude reads `CLAUDE.md` (auto). Reads `state.md` per CLAUDE.md instruction. Sees active session = consultant-cashflow, phase = post-vision.
2. User invokes `/research`. Skill follows Memory Read Contract: reads INDEX, resolves vision path, reads vision.
3. Skill produces `research.md`. Memory Write Transaction: save → verify → bump INDEX (research pointer + integrity block) → replace state.md (phase = post-research) → Decision Gate → Glossary Proposals.
4. Claude says: "Saved research.md. 2 decision candidates flagged, 1 glossary proposal. Read [proposals]?"

If any step is muddled, fix before moving on.

---

## Risks and how each is mitigated

| Risk | Mitigation |
|---|---|
| Decision logging too noisy | Decision Gate's four-criteria check + anti-noise rule + per-skill explicit candidate list |
| Decision logging too sparse | Per-skill ending forces a `Decision candidates` enumeration; skips are visible |
| INDEX drift from skill failure mid-write | Memory Write Transaction's drift warning + `/reindex` recovery |
| Glossary auto-edited via domain artifact | Glossary Proposals as separate output section; `glossary.md` writes only on human accept |
| Product-identity confusion | Skill descriptions go product-agnostic; identity loaded from INDEX/vision at runtime |
| Multiple "active" sessions | INDEX schema enforces exactly one `active`; reindex flags violations |
| `conversation.md` rediscovered as authoritative | Marked `archived` in INDEX; no skill globbing means it's not picked up by accident |
| `docs/tasks.md` ambiguity (capture creates, tactical-ddd punts) | Migration step initializes it; both skills now assume it exists |

## Acceptance criteria for the migration

- [ ] `CLAUDE.md` exists and contains the nine sections listed in Step 1.
- [ ] `memory/project/INDEX.md` exists with active session, archived `conversation.md` entry, and integrity block.
- [ ] `memory/project/decisions.md` and `memory/project/glossary.md` exist with format specs at top.
- [ ] `memory/task/state.md` exists reflecting current phase = post-vision.
- [ ] `docs/tasks.md` exists with the standard backlog/in-progress/done structure.
- [ ] `scripts/reindex_memory.sh` runs against the current folder and outputs a clean (no-drift) report.
- [ ] All seven existing skills carry the Memory Read Contract and Memory Write Transaction sections verbatim.
- [ ] No skill description contains "homeowner-fintech" or any other product-specific noun.
- [ ] `tactical-ddd` saves its artifact before appending tasks (write-order fix verified by reading the skill).
- [ ] Mental dry-run of `/research` against the consultant-cashflow folder produces the expected sequence.

## Out of scope

- Changes to artifacts already on disk (vision.md is preserved as-is).
- New skills beyond `/reindex`.
- Anything outside `teams/richi_and_lucag/`.
- Activity logs, transcripts, JSONL — Claude session memory and harness logs cover this.
- Hooks of any kind — CLAUDE.md auto-load is sufficient.

---

## Order of work

1. Write `CLAUDE.md` → stop for human read.
2. Initialize `INDEX.md`, `state.md`, `decisions.md` scaffold, `glossary.md` scaffold, `docs/tasks.md`.
3. Build `scripts/reindex_memory.sh` and `/reindex` skill.
4. Refactor skills in this order (lowest blast radius first): `business-research` → `brainstorm` → `research` → `capture` → `domain` → `tactical-ddd` → `worker`.
5. Run smoke check; fix issues.
6. Mark this plan complete; create `decisions.md` ADR-0001 capturing the architecture choice itself.
