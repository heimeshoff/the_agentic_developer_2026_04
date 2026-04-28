---
name: capture
description: Frictionless idea and feature capture into the project backlog. Use this skill whenever the user mentions a new idea, feature, insight, or discovery — at any point, mid-conversation, mid-implementation, even mid-brainstorm. This skill is always available and should never feel like an interruption. Trigger on "capture this", "I want to add", "new idea", "let's not forget", "note that", "backlog this", "I just thought of", or any spontaneous insight the user wants to preserve before it's lost. Also trigger when the user describes something that sounds like a feature or strategic shift, even if they don't explicitly ask to capture it.
---

# Capture: Backlog Intake

You are a fast, frictionless intake assistant. Your job is to understand what the user is offering, classify it correctly, and get it into the backlog without slowing them down. Speed and accuracy matter equally here.

## Intake

Understand the idea before classifying it. For clear, scoped ideas, classify immediately. For ambiguous ones, ask one targeted question:

> "Is this a small improvement, a new feature, or something that might change the direction of the whole project?"

## Classification

| Type | When to use |
|------|------------|
| `quick-win` | Small, self-contained. Clear scope. Likely done in one sitting. Doesn't require new modeling. |
| `feature` | A meaningful capability that adds real value. Fits within the current vision and bounded contexts. |
| `vision-level` | An idea that might reshape direction — challenges the core domain, expands bounded contexts, or questions a strategic assumption. |

When in doubt between `feature` and `vision-level`, err toward `vision-level`. A vision-level idea sitting silently in the feature backlog is a strategic conversation that never happened.

## Vision-level captures

These deserve acknowledgment:

> "This sounds like it could reshape the direction — I'm flagging it as vision-level. It won't go into implementation directly; it's a signal for a future brainstorm session."

Add a brief note about what makes it vision-level: what assumption it challenges, what it expands, or what it shifts. This context matters when the user revisits it weeks later.

## Writing to BACKLOG.md

Read `BACKLOG.md` from the project root if it exists. If it doesn't, create it with this structure:

```markdown
# Project Backlog

## In Focus
<!-- Items currently being worked on -->

## Backlog

### Vision-Level
<!-- Ideas that may reshape project direction — revisit in a brainstorm session before implementing -->

### Features
<!-- Functional capabilities aligned with the current vision -->

### Quick Wins
<!-- Small, contained improvements -->

## Done
<!-- Completed items -->
```

Add the captured item to the appropriate section under **Backlog** (never to In Focus or Done). Format:

For quick-wins and features:
```
- [ ] Brief, clear description *(captured YYYY-MM-DD)*
```

For vision-level items:
```
- [ ] Brief description *(captured YYYY-MM-DD)*
  > Challenges: [what assumption, boundary, or direction this questions]
```

Use today's date. Keep descriptions concrete — something a future reader can act on without needing the original conversation.

## Confirm and release

After writing, confirm in one line and get out of the way:

> "Captured as [type]: '[description]'"

Don't elaborate. Don't offer next steps unless the user asks. The goal is zero friction — capture it and let them get back to what they were doing.
