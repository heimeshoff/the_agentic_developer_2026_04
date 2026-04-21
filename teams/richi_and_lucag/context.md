# Project Context — richi_and_lucag

_Captured: 2026-04-21_

---

## Business Domain

**Product**: Personal finance / budgeting app for homeowners.

**Target user**: Homeowner trying to manage simple finances and discover hidden savings opportunities.

**Core gap vs existing tools** (YNAB, Monarch, Copilot, spreadsheets): No tool focuses specifically on homeowner financial needs. This app adds an opinionated layer with homeowner-specific insights, complementary to spreadsheets but with a better UI.

**Value proposition**: Surface savings opportunities the user can redirect toward investments.

**In-scope financial categories**:
- Mortgage (principal, interest, escrow)
- Property taxes / insurance
- HOA fees
- Home maintenance & repairs (unpredictable)
- Utilities
- Home improvement / renovation budget

**Out of scope**: Equity tracking.

**Savings opportunities focus**: Refinancing signals, subscription creep, energy bills, insurance comparison, overpaying on maintenance — any of the above.

---

## Workflow Decisions

| Decision | Choice |
|---|---|
| Phase gates | Human approval required between every phase |
| Tech stack | TBD — out of scope for now |
| Implementation style | Co-drive: Claude proposes, human and Claude iterate |
| Custom commands | Build from scratch — do not reuse `startup:*` skills |

---

## Phase Structure

```
/research  →  review research.md  →  human approves
    ↓
/domain    →  review domain.md    →  human approves
    ↓
/plan      →  review plan.md      →  human approves
    ↓
build (co-drive, iterative)
```

### Commands

| Command | Mechanism | Artifact |
|---|---|---|
| `/research` | Interview user + WebSearch (both) | `research.md` — unopinionated facts only |
| `/domain` | Conversation grounded in research artifact | `domain.md` — homeowner financial domain model |
| `/plan` | Structured Q&A + EnterPlanMode | `plan.md` — features + definition of done per feature |

### Artifact rules
- **Research artifacts**: unopinionated statement of facts — no recommendations, no opinions.
- **Planning artifacts**: templated document with explicit definition of done per deliverable.
- **Format**: text-only for now (no diagrams).

---

## Proposed File Structure

```
teams/richi_and_lucag/
  CLAUDE.md                        # team context + phase rules
  context.md                       # this file
  .claude/commands/
    research.md                    # /research command
    domain.md                      # /domain command
    plan.md                        # /plan command
  exercise_1/docs/
    research.md                    # research phase artifact
    domain.md                      # domain phase artifact
    plan.md                        # planning phase artifact
```

> **Open question**: Is `exercise_1/docs/` the right home for artifacts, or do you prefer flat in `exercise_1/` or a top-level `docs/` at team level?

---

## Open Items

- [ ] Confirm artifact location (`exercise_1/docs/` vs alternative)
- [ ] Write `CLAUDE.md`, command files, and artifact templates
- [ ] Run `/research` as first phase
