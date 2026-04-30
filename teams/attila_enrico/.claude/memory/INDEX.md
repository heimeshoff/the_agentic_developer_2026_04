# Project Memory Index

This index is auto-loaded into every Claude Code session via `@.claude/memory/INDEX.md` in `teams/attila_enrico/CLAUDE.md`. Follow the pointers below; do not put memory content directly in this file.

Conventions and how to update: [`README.md`](README.md).

## Decisions (ADRs)

- [0001 — Adopt project memory](decisions/0001-adopt-project-memory.md) — scaffold `.claude/memory/`, ADR + roadmap conventions, `@import` wiring · 2026-04-28 · Accepted
- [0002 — Soft delete via `deletedAt`](decisions/0002-soft-delete-via-deletedAt.md) — nullable timestamp on rows; list queries filter; enables undo + audit retrospection · 2026-04-23 · Accepted
- [0003 — Append-only audit log in `data/audit.json`](decisions/0003-append-only-audit-log.md) — separate store, discriminated-union schema, written from every mutation path · 2026-04-23 · Accepted
- [0004 — Generic `not_found` for ownership/missing rows](decisions/0004-generic-not-found-no-info-leak.md) — collapse "doesn't exist" and "not yours" into one response to prevent existence leaks · 2026-04-23 · Accepted
- [0005 — Last-write-wins via in-process `withLock`](decisions/0005-withlock-concurrency-last-write-wins.md) — single-process JSON store, no OCC, audit log preserves clobbered writes · 2026-04-23 · Accepted

## Features

- [Roadmap](features/roadmap.md) — every feature ever discussed, with status
- [F06 demo-data](features/demo-data/brief.md) — shipped 2026-04-23 · seed ~500 realistic transactions + one-click remove
- [F07 edit-delete-transactions](features/edit-delete-transactions/brief.md) — shipped 2026-04-23 (smoke-test pending) · inline edit/soft-delete with undo toast

## Knowledge

- _(none yet)_
