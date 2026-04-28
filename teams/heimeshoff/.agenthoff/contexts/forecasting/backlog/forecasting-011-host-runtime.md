---
id: forecasting-011
title: Host runtime — desktop framework, language, persistence
status: backlog
type: decision
context: forecasting
created: 2026-04-26
completed:
commit:
depends_on: []
blocks: [forecasting-002, forecasting-005, forecasting-007, forecasting-008, forecasting-009]
tags: [architecture, platform, cross-cutting, foundational]
---

## Why

Several committed decisions implicitly assume a runtime that has not been
named:

- `forecasting-002` commits to "worker thread" off-main-thread compute
  (which means Web Worker, Node Worker thread, or OS thread — depending).
- `forecasting-005` commits to "persisted locally; survives app restart"
  (which means SQLite, JSON file, IndexedDB, or other — depending).
- `forecasting-001` Prompt 0 commits to "Web stack (React + Tailwind)" and
  "local-only desktop budgeting app for a single user on Windows 11"
  (which together imply Electron or Tauri or a localhost-served web app —
  no commitment yet).

Without naming the host, every BC's implementation is parameterized by
choices that haven't been made. This is the cheapest moment to settle it.

This is filed in Forecasting because Forecasting is where the constraint
bites hardest (worker threads, snapshot keying, projection cache), but the
decision is project-wide and shapes every BC.

## What

Pick:

1. **Desktop framework** — what wraps the React app into a Windows-native
   experience.
2. **Language** — for both UI and projection engine.
3. **Persistence** — durable local storage for transactions, contracts,
   tax events, starting balance, and cached projections.
4. **Build / packaging** — dev experience and the `.exe` story.
5. **Worker mechanism** — the concrete implementation of "off main thread"
   from `forecasting-002`.

### Recommendation (committed at refinement, formal ADR when worked)

| Slot | Choice | Reasoning compressed |
|---|---|---|
| Framework | **Electron** | Native Windows packaging, mature, no Rust friction. Tauri's smaller binary doesn't matter for single-user local. |
| Language | **TypeScript** end to end | One language across UI + engine + persistence layer. Engine purity (`forecasting-007`) enforced by plain functions, not classes. |
| Persistence | **SQLite via `better-sqlite3`** | Synchronous, embedded, ACID, zero-config. Single-user local has no concurrency to worry about. JSON files lose ACID; IndexedDB is browser-y and clunky for joins. |
| Build | **Vite** for dev, **electron-builder** for packaging | Standard combo. Hot reload across renderer, fast cold starts. |
| Worker | **Node Worker thread** in the main process for projection compute | Renderer Web Workers are an option but the engine reads SQLite, which is easier from Node. Engine input snapshot is serialized via `postMessage`; output (zero-day, runway, Sankey nodes/edges) returned the same way. |

### Considered and rejected

- **Tauri** — leaner binary, but adds Rust to a JS project. The projection
  engine's snapshot-pure shape is small enough that Rust's perf win
  doesn't pay back the language-stack tax.
- **Pure web app served from localhost** — no native packaging, awkward
  launch UX, no desktop integration (system tray, file associations).
  Vision says "local-only desktop"; web-only fights that.
- **Postgres / MySQL** — daemon overhead is wasted for single-user; ops
  burden of installing a DB server is hostile.
- **JSON file persistence** — simple but loses ACID. CSV import touches
  thousands of rows; partial-write recovery is real.
- **Renderer Web Worker for engine** — viable, but pulling SQLite into the
  renderer means either IPC every read or shipping `better-sqlite3` to
  the renderer. Worker-in-main-process is simpler.

## Acceptance criteria

- [ ] ADR in `.agenthoff/knowledge/decisions/` records each of the five
      slots (Framework / Language / Persistence / Build / Worker) with
      one paragraph of rationale per choice.
- [ ] ADR records the considered-and-rejected alternatives and the
      one-line reason each was passed over.
- [ ] ADR specifies the **persistence migration approach**: schema
      versioning via a `schema_migrations` table; migrations are
      forward-only TypeScript files in `db/migrations/`; migration runs
      on app startup before any read.
- [ ] ADR specifies the **dev-loop**: Vite dev server for renderer, Electron
      restart on main-process changes, hot module reload for renderer,
      `npm run dev` as the single entry point.
- [ ] ADR specifies the **worker-thread serialization contract**:
      structured-clone-compatible plain objects only — no classes, no
      Dates (use ISO-8601 strings or epoch ms), no bigints (use strings
      for amounts >2^53; integer cents stays in safe range).
- [ ] ADR confirms **cross-BC compatibility**: all four BCs share TS +
      Electron + SQLite; no BC-specific divergence.

## Notes

### Resolved decisions

- All five slots resolved by the recommendation above. The ADR's job
  when worked is to write it down with the rationale; no further
  decisions are open.

### Cross-BC implications

This decision is foundational for every BC. Once the ADR lands, all of
Cash Inflow, Cash Outflow, Tax Obligations, and Forecasting share:

- TypeScript + React + Tailwind front
- Electron host
- SQLite (via `better-sqlite3`) for persistence
- Same packaging story (`electron-builder`, single `.exe` installer)
- Same monetary representation (integer minor units, per `forecasting-005`)
- Same date representation across the worker boundary (ISO-8601 strings)

Any BC needing a different choice is a smell — surface it as a deviation
task, don't silently diverge.
