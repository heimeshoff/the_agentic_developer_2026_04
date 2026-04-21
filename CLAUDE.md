# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the workshop repo for **"The Agentic Developer" (April 2026)**, run by Marco Heimeshoff. It is not a software project — it is a scaffold where multiple teams each build their own application in parallel during the workshop. There is no shared build system, test suite, or tech stack: each team chooses its own.

## Repo layout

- `instructions/` — workshop-wide and per-exercise briefs. **Read-only reference material.** Do not put team code here.
  - `instructions/instruction.md` — overall workshop rules (branching, folder layout).
  - `instructions/exercise_<n>/instruction.md` — brief for each exercise.
- `teams/` — all team work lives here. Each team creates `teams/<team-name>/exercise_<n>/` and puts their code inside.
- `LICENSE` — MIT.

When working on exercise code, write files under `teams/<team-name>/exercise_<n>/`, never under `instructions/`. The exercise brief is one file; the team's implementation is a whole subtree.

## Git workflow (workshop-specific)

- Each team works on its own long-lived branch named after the team (e.g. `team-alpha`).
- **Always merge with `--no-ff`** so each team's branch remains a visible unit in history (this is the point — it lets the facilitator compare approaches across teams after the workshop). Never fast-forward a team branch into `main`.
- The default assumption is that you are working on a team branch, not `main`. If the current branch is `main` and the user asks you to start exercise work, confirm which team branch to use (or ask them to create one) before writing code.

## Exercise context

- **Exercise One** — Build a personal finance / budgeting app. The brief is deliberately loose ("No specifics. No required features. No prescribed data model."). The instruction is: *creatively prompt engineer and vibe code*. Favour breadth and exploration over production polish; the workshop is about how the team *works with the agent*, not about shipping a finished product.

Additional exercises may be added to `instructions/` during the workshop.

## What does NOT exist here

- No build, test, or lint commands at the repo level — each team's exercise folder may introduce its own tooling, and any commands live inside that folder.
- No shared package manager, language, or framework. Do not assume Node, Python, etc. until you see evidence inside a specific `teams/<team>/exercise_<n>/` folder.
