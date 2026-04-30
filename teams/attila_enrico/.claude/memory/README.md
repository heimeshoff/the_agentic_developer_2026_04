# Project Memory

Knowledgebase + decision log for the Personal Finance App built under `teams/attila_enrico/`.

This folder is the durable memory for the project. The session-scoped index ([`INDEX.md`](INDEX.md)) is imported into every Claude Code session via `@.claude/memory/INDEX.md` in the team's `CLAUDE.md`, so Claude always knows where to look.

## Layout

```
.claude/memory/
├── README.md              # this file — conventions only, not auto-loaded
├── INDEX.md               # pointer index, auto-loaded into every session
├── decisions/             # ADRs (Architectural Decision Records), numbered + dated
│   └── NNNN-<slug>.md
├── features/
│   ├── roadmap.md         # every feature ever dreamed of, with status
│   └── <feature-slug>/    # per-feature dossier, only once status reaches "shaping"
└── knowledge/             # cross-cutting domain notes (glossary, invariants, patterns)
```

## Conventions

### Decisions (ADRs)
- One file per decision. Filename: `NNNN-<kebab-slug>.md` where `NNNN` is a zero-padded sequence (`0001`, `0002`, ...).
- Append-only: never renumber; never edit a decided ADR's body except to update its **Status** (e.g., from `Accepted` → `Superseded by 0017`).
- Required sections: `Context`, `Decision`, `Consequences`, `Status`, `Date`.
- ADR scope is **any project decision** — stack, architecture, conventions, process — not just feature-pipeline decisions.
- Add a one-line entry to [`INDEX.md`](INDEX.md) under "Decisions" when creating a new ADR.

### Features
- Every feature idea — even ones we'll never build — gets a row in [`features/roadmap.md`](features/roadmap.md). The graveyard is part of the value: it's the "retrospective roadmap of all features we dreamed of."
- Statuses: `idea` → `shaping` → `building` → `shipped`, plus `parked` (deliberately deferred) and `dropped` (decided against).
- A feature only earns its own folder (`features/<slug>/`) once it reaches `shaping`. Below that, the roadmap row is enough — keeps the idea log light.
- Per-feature folders typically contain: `brief.md`, `journeys.md`, `plan.md`, `decisions.md` (local decisions specific to the feature).

### Knowledge
- Long-lived domain notes that don't fit a single decision or feature: glossary, currency rules, category taxonomy, recurring patterns, lessons learned.
- One concept per file. Keep each under ~200 lines; split if it grows.

## How to update

When adding an ADR or feature:
1. Write the file in the right subfolder.
2. Add a one-line pointer to [`INDEX.md`](INDEX.md).
3. If a roadmap status changes, edit the row in `features/roadmap.md` (and update the linked ADR if a status change was a decision).

When a decision turns out to be wrong: don't delete it — write a new ADR that supersedes the old one, then update the old one's `Status` to `Superseded by NNNN`. The history is the point.
