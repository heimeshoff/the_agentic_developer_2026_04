---
name: feature-workflow
description: >
  DDD and TDD workflow for implementing features. Use this skill whenever the user asks to
  implement a feature, add functionality, build something new, or work on a user story. This
  includes requests like "add X", "implement Y", "build the Z feature", "I need a way to...",
  or any task that involves adding new behavior to the codebase. Use this even for small features
  — the workflow scales down gracefully. Do NOT use for pure refactoring, bug fixes, or config changes.
---

# Feature Implementation Workflow

This skill defines how to go from a feature request to working code. It follows a
Domain-Driven Design and Test-Driven Development approach. The philosophy: understand
the domain deeply before writing code, then build it test-first in small increments.

For technology-specific guidance (architecture patterns, test conventions, etc.), defer
to the relevant specialized skills — this skill is about the *process*, not the tech.

## Phase 1: Build Context

Before discussing anything with the user, do your homework. The goal is to come to the
conversation informed, so you can ask sharp questions instead of generic ones.

1. **Read the knowledge base** — check `.claude/knowledge/INDEX.md` for existing
   domain concepts and architectural decisions. Read the entries relevant to this
   feature. This is accumulated understanding from prior conversations — use it.
2. **Read project documentation** — CLAUDE.md files, READMEs, any docs that explain
   the domain or architecture.
3. **Explore the existing codebase** — look at the domain model, understand what
   entities/value objects/aggregates already exist. Look at how similar features were
   built. Understand the package structure and conventions.
4. **Check for related code** — search for classes, tests, and configuration that
   touch the area this feature will live in. Understand the boundaries.

The point is not to spend forever researching. It's to have enough context that you
don't propose something that contradicts what's already there, and that you can have
a meaningful conversation about the domain.

## Phase 2: Domain Conversation

Now talk with the user. This is a conversation, not a requirements doc. The goal is to
arrive at a shared understanding of the domain concepts involved.

**What to explore:**
- What is the core behavior being added? What problem does it solve for the user?
- What are the key domain concepts? Name them — and use the names the user uses (ubiquitous language).
- How do these concepts relate to what already exists in the codebase?
- What are the boundaries? What is explicitly *not* part of this feature?
- Are there edge cases or business rules that aren't obvious from the request?

**How to approach it:**
- Check the knowledge base before asking a question — the answer might already be there
  from a previous conversation. Reference what you already know: "From what I understand,
  a Budget resets monthly — does this feature interact with that cycle?"
- Reference what you found in Phase 1. "I see there's already a `Category` concept —
  does this new feature relate to that?"
- Propose domain concepts and let the user correct you. It's faster than asking them
  to define everything from scratch.
- Keep it conversational. Don't produce a formal domain model document unless the user
  asks for one.
- If the feature is small and straightforward, this phase can be brief. Don't force a
  deep philosophical discussion about a simple CRUD addition.

**When to move on:** When you and the user agree on what the key concepts are, what
they're called, and roughly what behavior needs to exist. You don't need every detail —
the TDD cycle will surface the rest.

## Phase 3: Plan the Slices

Break the feature into small, vertical slices — each one a meaningful piece of behavior
that can be implemented and tested independently.

- Start from the domain core and work outward. The first slice should be pure domain
  logic with no infrastructure concerns.
- Each slice should be small enough to implement in one TDD cycle (a handful of tests).
- Order slices so each one builds on the last — the user can see progress incrementally.
- Present the slices to the user. They might reorder, split, merge, or drop some. This
  is the plan checkpoint — get alignment before coding.

**Example for a "savings goals" feature:**
1. A savings goal has a name and target amount (domain model)
2. You can record a contribution toward a goal (domain behavior)
3. A goal knows its progress as a percentage (derived value)
4. Goals are persisted and can be listed (persistence + query)
5. Goals are accessible through the UI (adapter/view layer)

## Phase 4: TDD Cycle

For each slice, follow the red-green-refactor cycle strictly:

### Red — Write a Failing Test
- Write one test that describes the next small piece of behavior.
- The test should express *what* the behavior is in domain language, not *how* it's
  implemented.
- Run the test. Watch it fail. This confirms the test is actually testing something.

### Green — Make It Pass
- Write the simplest code that makes the test pass. Nothing more.
- Resist the urge to build ahead. If the test says a savings goal has a name, don't
  also add the target amount yet — that's the next test.

### Refactor — Clean Up While Green
- Now improve the code you just wrote. Remove duplication, improve names, extract
  concepts that became clear during implementation.
- Run the tests again. Still green? Good. Move to the next test.

### Repeat
- Write the next failing test for this slice. Keep going until the slice is complete.
- After completing a slice, run the full test suite to make sure nothing broke.

**Important:** Don't skip the failing test step. It's tempting to write the test and
the implementation together, but seeing the test fail first is what gives you confidence
that the test is meaningful.

## Phase 5: Integration and Verification

Once all slices are implemented:

1. **Run the full test suite** — everything should pass.
2. **Start the application** — verify it actually runs.
3. **Test the feature manually** — if there's a UI, use it. Walk through the happy path
   and the edge cases you discussed in Phase 2.
4. **Check for regressions** — did anything else break? A quick smoke test of related
   features.

If something is off, go back to Phase 4 — write a test that captures the problem,
then fix it.

## Knowledge Base

Throughout the workflow — especially during the domain conversation and implementation —
you will learn things about the domain, business rules, and architecture that are worth
preserving. Store these in `.claude/knowledge/` so future conversations can pick them up
without the user having to re-explain.

### Structure

The knowledge base has two subdirectories:

```
.claude/knowledge/
├── INDEX.md              — one-line pointers to each file (like a table of contents)
├── domain/               — domain concepts, business rules, ubiquitous language
│   ├── expense.md
│   ├── budget.md
│   └── ...
└── architecture/         — architectural decisions, patterns, conventions
    ├── persistence-strategy.md
    ├── api-conventions.md
    └── ...
```

Each knowledge file uses this format:

```markdown
---
name: {{concept name}}
description: {{one-line summary — used to decide relevance when loading}}
type: {{domain | architecture}}
---

{{content — what you learned, in clear prose. Include context on *why* things are
the way they are when you know it, not just *what* they are.}}
```

`INDEX.md` is a flat list of pointers, one per line:
```
- [Expense](domain/expense.md) — what an expense is, categories, validation rules
- [Persistence Strategy](architecture/persistence-strategy.md) — why JPA, repository conventions
```

### When to write

Save knowledge automatically whenever you learn something that a future conversation
would benefit from knowing. Don't ask — just write it. Typical triggers:

- The user explains a business rule ("expenses over $500 need approval")
- You discover a domain concept during conversation ("so a Budget resets monthly")
- An architectural decision is made ("we're using Spring Data JPA with a repository per aggregate")
- A naming convention emerges ("we prefix all DTOs with the aggregate name")

### When to read

Load knowledge at the start of **Phase 1** (Build Context). Read `INDEX.md` first,
then read the files relevant to the feature being built. You don't need to load
everything — just what's related. If you're building a feature about savings goals,
you probably need `budget.md` but not `api-conventions.md`.

Also check the knowledge base during **Phase 2** (Domain Conversation) — something
you're about to ask the user might already be answered there.

### Keeping it current

- Before writing a new file, check if one already exists for that concept — update it
  instead of creating a duplicate.
- If you learn something that contradicts an existing entry, update the entry and note
  what changed and why.
- Keep entries focused. One concept per file. If a file starts covering multiple
  things, split it.

## Guidelines

- **Ubiquitous language matters.** If the user calls it a "savings goal," the class is
  `SavingsGoal`, not `SavingTarget` or `GoalEntity`. Match their language everywhere —
  code, tests, variable names.
- **Small steps compound.** Each TDD cycle should feel almost trivially small. That's
  the point — small steps mean fewer bugs, easier debugging, and steady progress.
- **Domain first, infrastructure later.** Get the domain model and its behavior right
  in pure unit tests before worrying about persistence, HTTP endpoints, or UI.
- **Don't gold-plate.** Implement what was discussed in Phase 2, nothing more. If you
  see an opportunity for a nice-to-have, mention it to the user — don't just build it.
- **Keep the user in the loop.** After each slice, briefly mention what was done and
  what's next. They shouldn't have to ask "where are we?"
