---
name: brainstorm
description: Vision refinement skill for the homeowner-fintech personal finance product. Invoke with /brainstorm. Leads a structured interview to co-create or update vision.md — covering problem framing, target users, value proposition, key capabilities, and success signals. Use this skill at the start of any new initiative or when the team needs to pressure-test and sharpen their direction before research or planning.
---

# Brainstorm

Produces a `vision.md` artifact through a structured interview grounded in the homeowner personal finance domain.

## Flow

```
LOCATE EXISTING VISION → INTERVIEW → SYNTHESIZE → SAVE ARTIFACT
```

---

## Step 1: Locate existing vision

Check for any `vision.md` files under `teams/richi_and_lucag/exercise_one/`.

- If one exists: read it, summarise what's there in 2–3 sentences, then ask: *"Do you want to refine the existing vision or start fresh?"*
- If none exists: proceed directly to the interview.

---

## Step 2: Interview

The goal is to surface the sharpest possible answer to: **What does this product do, for whom, and why does it matter?**

Work through these question clusters **one at a time**. Wait for the user's answer before moving to the next. Do not batch multiple clusters in one turn.

### Cluster A — The Problem
1. *"What is the core problem a homeowner faces that this product solves? Describe it in plain language, as if talking to that homeowner."*
2. *"When does this problem hurt most — what's the specific moment or trigger that makes the homeowner feel it?"*

### Cluster B — The User
3. *"Who is the primary user? (e.g., first-time buyer stretched on mortgage, long-term owner with rising maintenance costs, homeowner eyeing a refinance)"*
4. *"What does this user currently do — spreadsheet, YNAB, nothing, Monarch? What's broken about that?"*

### Cluster C — The Value
5. *"Finish this sentence: 'This app is the only one that _______.'"*
6. *"What's the single most important thing a user should be able to do on day one?"*

### Cluster D — Success
7. *"How will you know in 6 months that this product is working? What does a successful user look like?"*

### Cluster E — Scope guard
8. *"What is explicitly out of scope — things you'll never build, even if users ask?"*

After all clusters, do a brief synthesis pass: *"Here's what I heard — [3-bullet summary]. Does this feel right, or is anything off?"* Adjust until the user confirms.

---

## Step 3: Synthesize

Draft `vision.md` from the confirmed interview. Rules:
- **No fluff.** Every sentence must be load-bearing.
- **User's language.** Use their words, not product-marketing words.
- **Concrete over abstract.** "Detects when a homeowner is overpaying on insurance by 15%+" beats "helps homeowners save money."
- **Decisions are decisions.** Out-of-scope items belong in the Out of Scope section, not footnotes.

---

## Step 4: Save artifact

Save to:

```
exercise_one/YYYY-MM-DD-<scope-slug>/vision.md
```

- `YYYY-MM-DD` = today's date
- `<scope-slug>` = 2–4 word kebab-case label (e.g., `homeowner-vision`, `refinancing-focus`, `savings-signals`)

Path is relative to `teams/richi_and_lucag/`.

Tell the user the full path once saved.

---

## vision.md template

```markdown
# Vision: [Short product name or initiative title]

_Date: YYYY-MM-DD_

---

## Problem

[The specific problem this product solves, in the homeowner's language. The trigger moment. Why now.]

## User

[Who they are. What they currently use and why it fails them.]

## Value Proposition

[The one thing this product does that nothing else does. One paragraph max.]

## Day-One Capability

[The single most important thing a user can do on first use.]

## Success Signal

[What a successful user looks like in 6 months. Concrete, observable.]

## Out of Scope

[Explicit list of things this product will never do, even if users ask.]

## Open Questions

[Unresolved questions to carry into /research or /domain.]
```
