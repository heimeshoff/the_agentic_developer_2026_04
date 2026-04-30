# 0001 — Adopt project memory under `.claude/memory/`

- **Status:** Accepted
- **Date:** 2026-04-28

## Context

The team is building the Personal Finance App through a multi-stage feature pipeline (clarification → user journeys → technical plan → parallel implementation). Decisions accumulate across stages — stack choices, architectural trade-offs, scope cuts, parked ideas — and there is no durable place to record them. Without one:

- Rationale evaporates between sessions, so the same trade-offs get re-litigated.
- "Features we dreamed of but didn't build" disappear, even though the idea graveyard is itself useful retrospective signal.
- Claude Code starts each session blind to prior decisions and has to re-derive context from code + chat scrollback.

The user-level auto-memory at `~/.claude/projects/.../memory/` exists but is keyed at the workshop-root level, not the `teams/attila_enrico/` subfolder, and is intentionally narrow (user/feedback/project/reference cards) rather than a structured decision log.

## Decision

Adopt a project-local memory folder at `teams/attila_enrico/.claude/memory/` with the layout:

```
README.md              # conventions
INDEX.md               # pointer index, auto-loaded each session
decisions/NNNN-*.md    # ADRs, append-only, numbered
features/roadmap.md    # every feature ever, with status
features/<slug>/       # per-feature dossier, only at status >= shaping
knowledge/             # cross-cutting domain notes
```

Wire it into the team's `CLAUDE.md` with `@.claude/memory/INDEX.md` so the index is in context every session and Claude follows pointers from there.

Sub-decisions:

1. **ADR scope = any project decision** (stack, architecture, conventions, process), not only feature-pipeline decisions. One log, not two.
2. **Roadmap granularity = single `roadmap.md` table for everything**; a feature only earns its own folder once it reaches `shaping`. Idea graveyard stays light.
3. **Append-only ADRs.** Wrong decisions get a new superseding ADR; old one's `Status` is updated to `Superseded by NNNN`. History is preserved.

## Consequences

**Positive**
- Every session starts with the index in context — no re-derivation.
- Decision rationale is durable and discoverable; supersession trail shows how thinking evolved.
- The retrospective roadmap captures parked/dropped ideas as deliberate signal, not lost noise.
- One canonical decision log avoids the "where do I write this down?" friction.

**Negative / costs**
- Small token overhead each session for `INDEX.md` (kept tight to mitigate).
- Discipline cost: someone has to actually write the ADRs and keep the roadmap current. Skipped writes degrade the system silently.
- Project-local memory is invisible to other workshop teams — duplication risk if patterns generalize. Acceptable for now; can lift to workshop-root later if needed.

**Neutral**
- This file (`0001`) is itself the first record produced by the convention — meta but useful as a worked example.
