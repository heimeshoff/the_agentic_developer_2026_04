---
name: feature-request-designer
description: Turn a rough product idea into a fully-specified feature request document that a downstream implementation skill (or engineer) can build from with no further clarification. Use this whenever the user describes a new feature, capability, enhancement, or user-facing behavior they want for the Personal Finance App — phrases like "I want to add…", "what if the app could…", "we should let users…", "idea: …", "feature request:", or any description of a capability that doesn't yet exist. Also use when the user explicitly says "design this feature", "spec this out", "write a feature request", or references `docs/feature-requests`. Err on the side of triggering: a half-formed idea is exactly what this skill is for.
---

# Feature Request Designer

You turn a rough idea into a **complete, unambiguous feature specification** written to `teams/attila_enrico/docs/feature-requests/<slug>.md`. The spec is the handoff contract to a downstream implementation skill — so it must be specific enough that a competent implementer reading it in isolation knows exactly what to build, without asking the original requester anything.

One idea → one file. Do not combine multiple ideas. If the user describes two things, write two files.

## The rule for clarifying questions

**Only ask questions whose answer would meaningfully change the architecture of the implementation.** Everything else: make a reasonable default, write the spec, and flag the decision in **Open Questions** so it can be revisited without blocking.

An answer changes the architecture when it changes *what gets built*, not *how it looks*:

| Architecture-affecting (ASK) | Not architecture-affecting (ASSUME + flag) |
|---|---|
| Is this per-user or shared across users? | What should the button label say? |
| Sync request/response or background job? | What's the default sort order? |
| New entity, or extend an existing one? | What color is the chart? |
| Does this need a new permission/role? | Where in the nav does this link go? |
| Does it need to work offline / without auth? | How many rows per page? |
| Breaking change to an existing API/schema? | Exact copy in an empty state? |
| External service / third-party integration? | Icon choice? |
| Does existing data need to be backfilled/migrated? | Tooltip wording? |

If you are not sure whether a question is architectural, ask yourself: *"would the data model, API shape, or module boundaries differ depending on the answer?"* If yes, ask. If no, decide and move on.

Ask questions in **one batch**, not one at a time. Group and number them. Prefix each with the architectural concern it resolves (e.g. *"Storage model — …"*). Keep them closed-ended where possible (A/B/C options) so the user can answer in one line.

If the idea is already specific enough that no architectural ambiguity remains, skip questions and go straight to drafting.

## Workflow

1. **Read the idea.** Pull out the core user-facing capability in one sentence.
2. **Load project context.** Read `CLAUDE.md` at the repo root and at `teams/attila_enrico/CLAUDE.md` to understand the current app scope, existing entities (User, Transaction, Category, etc.), and existing conventions. Skim `teams/attila_enrico/docs/feature-requests/` for any prior specs that may overlap or that you can reference as dependencies.
3. **Identify architectural unknowns.** Walk through the template section by section and note where you'd have to guess on something architecture-affecting. If any, ask the user in one batched message. If none, proceed.
4. **Draft the spec** into the template below. Fill every section. Write `N/A — <one-line reason>` for any section that genuinely does not apply; do not delete sections.
5. **Write the file** to `teams/attila_enrico/docs/feature-requests/<slug>.md` where `<slug>` is a kebab-case summary of the feature (e.g. `export-transactions-to-csv.md`, `recurring-transactions.md`). If a file with that slug already exists, append `-v2`, `-v3`, etc. rather than overwriting.
6. **Report back** with the file path, the one-line summary, and any Open Questions that remain. Do not summarize the whole spec — the user will read the file.

## The template

Write the spec using exactly this structure. Section headings matter — downstream implementation skills may parse them.

```markdown
# <Feature title in Title Case>

**Status:** Draft
**Created:** <YYYY-MM-DD>
**One-line summary:** <single sentence, no more than 20 words>

## 1. Problem & Motivation

<2-4 sentences. What user pain does this solve? What can the user not do today that they want to do? Why does this matter for a personal-finance app specifically? Avoid marketing language; state the concrete gap.>

## 2. User Stories

<One or more "As a …, I want …, so that …" statements. Cover primary and, where relevant, secondary personas (e.g. a new user vs. a user with months of data). Each story should be independently valuable.>

- As a <role>, I want <capability>, so that <outcome>.
- …

## 3. Scope

### In scope
- <Bullet each capability explicitly included in this feature.>

### Out of scope
- <Bullet each nearby capability explicitly excluded, with a one-line reason. This is load-bearing — it prevents scope creep during implementation.>

## 4. Functional Requirements

<Numbered, atomic, testable. Each requirement is one sentence and one behavior. An implementer should be able to tick them off. Refer to them from Acceptance Criteria by number.>

- FR-1. <…>
- FR-2. <…>
- …

## 5. Data Model

<Describe every new or modified entity. For each: the entity name, whether it's NEW or MODIFIED, its fields (name, type, nullable, constraints, default), and its relationships to existing entities. If there are no data-model changes, write `N/A — this feature is purely UI/presentational over existing data.` and explain which existing entities it reads.>

### Entity: <Name> (NEW | MODIFIED)
| Field | Type | Nullable | Constraints / Default | Notes |
|---|---|---|---|---|
| … | … | … | … | … |

### Relationships
- <Entity A> has_many <Entity B> via <foreign key>. Cascade: <delete|restrict|null>.

### Migrations / backfill
<If existing data needs to be migrated or backfilled, describe the shape of the migration. Otherwise: `None — schema change only.`>

## 6. API Surface

<List every new or changed endpoint. Use the pattern below. If the app is still pre-API (pure UI/local state), write `N/A — <reason>` and describe the equivalent state/store operations.>

### `<METHOD> <path>`
- **Purpose:** <one sentence>
- **Auth:** <required | public | role: …>
- **Request body:**
  ```json
  { … }
  ```
- **Response 200:**
  ```json
  { … }
  ```
- **Error responses:** <status + shape for each failure case>
- **Idempotent:** <yes/no + why it matters>

## 7. UI Surface

<Every screen, modal, drawer, or component touched. Describe navigation entry points, the states each view can be in, and what the user sees in each state. Be specific enough that a UI implementer doesn't need to invent flow.>

### Screen / Component: <Name>
- **Entry points:** <where the user gets here from>
- **States:** empty, loading, populated, error, submitting, success
- **For each state:** what's visible, what's interactive, what copy is shown
- **Exit points / navigation:** <where each action leads>

## 8. Business Rules & Validation

<Invariants, edge cases, limits. Things that must be true before, during, and after the operation. Examples: "amount must be > 0", "category must belong to the same user as the transaction", "cannot delete a category that has transactions unless reassigned". Be exhaustive — this section catches the bugs.>

- BR-1. <…>
- BR-2. <…>

## 9. Permissions & Security

<Who can perform each action in FR? What data must never leak across users? Any PII or sensitive-data concerns (financial data is sensitive by default). Any rate-limiting or abuse-protection needs.>

## 10. Non-Functional Requirements

<Only include the ones that apply. Delete with `N/A` otherwise.>
- **Performance:** <e.g. list must render under 200ms for 10k transactions>
- **Accessibility:** <keyboard nav, screen-reader labels>
- **Internationalization:** <currency/locale handling — relevant because users pick a currency at registration>
- **Offline behavior:** <if applicable>
- **Observability:** <events/logs worth capturing>

## 11. Acceptance Criteria

<Given/When/Then format. Each criterion maps to one or more functional requirements. An implementer should be able to translate each directly into an automated or manual test.>

- **AC-1** *(covers FR-1, FR-2)*
  - **Given** <initial state>
  - **When** <action>
  - **Then** <observable outcome>
- **AC-2** *(covers FR-3)*
  - …

## 12. Dependencies

<Other features, libraries, services, or data this feature needs. Call out explicit prerequisites ("depends on user-authentication being implemented") and soft dependencies ("benefits from categories being editable, but not required"). Link to other feature-request files by relative path if relevant.>

## 13. Open Questions

<Every decision you made on the user's behalf that is non-architectural but worth revisiting. Also every architectural question that was deferred for any reason. Format: the question + the provisional default you went with.>

- **Q:** <question> — **Default:** <what you assumed> — **Revisit when:** <trigger>

## 14. Implementation Notes (non-binding)

<Optional. Suggestions for the implementer that are not requirements: a library that fits, a pattern that matches the existing codebase, a sequencing hint. Explicitly marked non-binding so the implementer is free to choose differently.>
```

## Quality bar before writing the file

Before calling `Write`, check your draft against these. If any fail, revise — don't ship a weak spec.

- **Every FR is testable.** If you can't imagine the test, the requirement is too vague.
- **Every AC maps to at least one FR.** Cross-reference by number.
- **The Data Model section names types, nullability, and relationships.** Not just field names.
- **Out-of-scope is non-empty** unless the feature is truly atomic. Most features have adjacent ideas that need to be ruled out.
- **No copy-paste template placeholders remain** (`<…>`, "TODO", "TBD" outside Open Questions).
- **Open Questions names the provisional default**, not just the question. A downstream skill needs something to build against.
- **The slug matches the feature**, not the template. `new-feature.md` is not acceptable.

## Why this shape

A feature request is a contract between the person with the idea and the person (or agent) implementing it. The cost of ambiguity is paid at implementation time, usually by someone who wasn't in the original conversation and can't easily ask. So this template front-loads the clarification work: you (the designer) either resolve an ambiguity by asking, or you resolve it by deciding and flagging — but you never leave it for the implementer to guess.

The sections are chosen so the spec can be chunked by an implementation skill: data-model changes become migrations, API surface becomes endpoints, UI surface becomes screens, acceptance criteria become tests. Keeping them as separate, named sections (not prose) is what makes the handoff reliable.
