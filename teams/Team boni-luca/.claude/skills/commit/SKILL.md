---
name: commit
description: Create a git commit with a short, present-tense summary of the staged and unstaged changes. Use whenever the user wants to commit, save, ship, or wrap up work — including casual phrasings like "commit this", "commit it", "save this". Never pushes.
---

# Commit

Stage relevant changes and create a single commit with a short, present-tense message that summarises what changed.

## Style rules (non-negotiable)

- **Present tense, imperative mood.** "add debt calculator", not "added" / "adds" / "adding".
- **Short.** Subject line ≤ 60 characters. No scope prefix (`feat:`, `fix:`) unless the recent `git log` already uses that style.
- **Lowercase start**, no trailing period. One blank line + body only when the change truly needs explanation; otherwise subject only.
- **Focus on *why* the change was made, not a mechanical diff.** The diff already shows *what* changed.
- **One logical change per commit.** If the diff mixes unrelated things, flag it and ask how to split.

## Workflow

1. **Read the state** — run these in parallel:
   - `git status` (no `-uall`)
   - `git diff` and `git diff --staged`
   - `git log -n 5 --oneline` to match the repo's existing style
2. **Decide what to stage.** Stage by explicit paths — never `git add -A` or `git add .`. Skip: `.env`, credentials, build artifacts (`target/`, `node_modules/`, `dist/`), editor/OS cruft (`.DS_Store`, `.idea/`, `.vscode/`), anything that looks like a secret. If a secret-looking file is explicitly requested, warn first.
3. **Draft the message.** Reread the diff. Summarise the *intent* in one present-tense sentence. If the diff covers 3+ unrelated changes, pause and ask the user whether to split.
4. **Commit** with a HEREDOC so formatting is preserved:

   ```bash
   git commit -m "$(cat <<'EOF'
   <subject line>

   <optional body — only if needed>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```

5. **Verify** with `git status` and `git log -n 1` afterwards.
6. **Never push.** Do not run `git push` unless the user explicitly asks.

## Hard rules

- Never `--amend` (create a new commit instead — amending destroys previous work if a pre-commit hook already ran).
- Never `--no-verify` / `--no-gpg-sign` unless the user explicitly requests it.
- Never update `git config`.
- Never force-push.
- If a pre-commit hook fails, investigate and fix the root cause — do not bypass. Then re-stage and create a NEW commit.

## Good vs bad subject lines

| Good                                  | Bad                                             |
|---------------------------------------|-------------------------------------------------|
| `add debt payoff projection`          | `Added debt payoff projection.`                 |
| `seed default expense categories`     | `update stuff`                                  |
| `wire csv repository through port`    | `feat(persistence): implemented CSV repository` |
| `fix off-by-one in monthly rollup`    | `bug fix`                                       |
