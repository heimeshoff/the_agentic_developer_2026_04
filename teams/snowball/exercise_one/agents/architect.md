---
agent: architect
---

## Responsibility

Bootstrap the project: choose the stack, scaffold the folder layout, and wire up the dev build. Runs once at project start and again only if the stack needs a structural change.

## Input

- CLAUDE.md constraints (pnpm, TypeScript, Vite, Dexie, static output, no backend)
- Target milestone (so the scaffold isn't over-built for M1)

## Output

- `package.json` with pinned deps
- `vite.config.ts`
- `tsconfig.json`
- `src/` folder skeleton (entry point, placeholder pages, db module stub)
- `pnpm dev` works; `pnpm build` produces a `dist/` folder

## When to Use

- Project start (before any feature work)
- Adding a new major dependency that affects the build (e.g. a charting lib for M5)

## What Good Output Looks Like

- `pnpm dev` starts in under 5 seconds with no console errors
- `pnpm build` succeeds and `dist/index.html` is self-contained
- No unnecessary deps — nothing in `package.json` that isn't used by M1 scope
- Folder names match the mental model: `src/db/`, `src/views/`, `src/components/`
