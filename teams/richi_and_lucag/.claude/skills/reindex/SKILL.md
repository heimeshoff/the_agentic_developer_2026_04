---
name: reindex
description: Reconcile memory/project/INDEX.md with what is actually on disk under exercise_one/. Invoke with /reindex. Runs the deterministic scripts/reindex_memory.sh report, presents drift to the user, proposes an updated INDEX.md, and applies it only on confirm. Use whenever a skill warns about possible memory drift, after manual edits to session folders, or as a periodic sanity check.
---

# Reindex

Reconciles `memory/project/INDEX.md` with disk state. Read-only by default. Edits INDEX only on explicit human confirmation.

## Flow

```
RUN SCRIPT → PARSE DRIFT → PROPOSE UPDATED INDEX → CONFIRM → APPLY → RESET DRIFT
```

---

## Step 1: Run the reconciliation script

Execute:

```
bash teams/richi_and_lucag/scripts/reindex_memory.sh
```

Capture stdout. The script never edits INDEX — it only reports.

---

## Step 2: Parse drift

Read the script's drift report. Categorise each finding:

- `ON_DISK_NOT_INDEXED` — a phase artifact exists on disk but INDEX does not point to it. Propose adding it to the canonical artifacts table.
- `INDEXED_NOT_ON_DISK` — INDEX points to a path that no longer exists. Propose removing or marking the pointer; ask the user before deleting historical entries.
- `ACTIVE_SESSION_COUNT` — INDEX lists zero or multiple `active` sessions. Ask which one is current; mark the others `superseded` or `archived`.

Also re-read `memory/project/INDEX.md` to check the Memory Integrity block matches reality (last reindex date, completeness flag).

---

## Step 3: Propose updated INDEX

Draft the full updated `INDEX.md` content as a single fenced block in your response. Do not write to the file yet. Show only the diff vs. the current file if the changes are small; show the whole file if more than three sections changed.

Ask: *"Apply this updated INDEX.md? (yes/no — or tell me what to change)"*

Wait for the user.

---

## Step 4: Apply on confirm

On `yes`:

1. Overwrite `memory/project/INDEX.md` with the proposed content.
2. Update the Memory Integrity block: bump `Last reindex` to today, recalculate `Canonical artifact set complete`, clear `Known drift` if everything is reconciled.
3. Update `memory/task/state.md` — clear any `Drift warnings`.
4. Re-run `scripts/reindex_memory.sh` and confirm the drift report is now empty. If it still reports drift, tell the user and stop.

On `no` or partial corrections: incorporate feedback, re-show the proposal, repeat Step 3.

---

## Step 5: Decision Gate

A `/reindex` run almost never produces a Decision Gate entry. Reconciliation is bookkeeping, not a foreclosed alternative. Skip the gate unless the user explicitly invoked `/reindex` to record a project-level decision (e.g., abandoning a session — which should be logged as an ADR with `Status: Accepted` and the rejected alternative being "keep pursuing this direction").

---

## Facilitation principles

- **Never silently rewrite history.** If a session is being marked `abandoned`, ask why and capture it before changing INDEX.
- **Never invent paths.** Only propose pointers to files that actually exist on disk per the script output.
- **Drift is information, not failure.** A drift report is the script doing its job; calmly walk the user through it.
