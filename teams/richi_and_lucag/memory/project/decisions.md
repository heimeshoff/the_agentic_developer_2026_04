# Decisions

Append-only ADR-lite log. Entries land here only after passing the Decision Gate (see `CLAUDE.md`).

A decision belongs here only if it satisfies all of:

1. Irreversible or expensive to reverse.
2. Affects product behavior, domain language, architecture, data model, compliance, or workflow.
3. Has an explicit *why*.
4. Has at least one *rejected alternative*.

**Format** (the only allowed format in this file):

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

Entries are append-only. Never edit or delete a past ADR — supersede it with a new one referencing the prior ADR number.

---

## ADR-0001 — Adopt INDEX-driven memory architecture
Date: 2026-04-28
Status: Accepted
Scope: workflow
Decision: Memory is split into a stable workflow layer (`CLAUDE.md`), a slow-moving project layer (`memory/project/INDEX.md` + `decisions.md` + `glossary.md`), and a volatile task layer (`memory/task/state.md`); all skills resolve artifact paths through INDEX rather than `find`-ing on disk.
Why: The previous "latest-looking file wins" discovery let an archived earlier project framing (`exercise_one/conversation.md`) compete with the current `vision.md` for grounding, and skills had no shared protocol for recording decisions or proposing glossary terms.
Rejected alternative: Keep relying on per-skill globbing plus ad-hoc memory and add a single `memory.md` summary file. Rejected because globbing has no canonical-source semantics for active vs. superseded sessions, and a single summary file conflates volatile task state with durable architectural commitments.
Consequence: Every producing skill now runs the Memory Read Contract on entry and the Memory Write Transaction on save; INDEX is the only source of truth for active session and canonical artifact paths; recovery from drift is a single `/reindex` invocation; product identity is not embedded in skill descriptions.
Source artifact: `docs/memory-architecture-plan.md`
