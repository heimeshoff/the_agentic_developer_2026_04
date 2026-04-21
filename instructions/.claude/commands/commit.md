---
description: Create a git commit for the current staged/unstaged changes
---

Create a git commit following the repository's conventions.

Steps:

1. Run these in parallel:
   - `git status` (no `-uall` flag)
   - `git diff` (staged and unstaged)
   - `git log -n 5 --oneline` to match the repo's commit style

2. Analyze the changes and draft a concise (1–2 sentence) commit message focused on *why*, not *what*. Match the tone/format of recent commits.

3. Stage the relevant files explicitly by name — do **not** use `git add -A` or `git add .`. Skip anything that looks like a secret (`.env`, credentials, keys).

4. Create the commit using a HEREDOC so formatting is preserved:

   ```
   git commit -m "$(cat <<'EOF'
   <your message here>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```

5. Run `git status` after to confirm the commit landed.

Workshop-specific rules (from CLAUDE.md):
- Default branch assumption is a team branch, **not** `main`. If currently on `main` and the changes look like exercise work, stop and ask which team branch to use before committing.
- Never commit team code under `instructions/` — that directory is read-only reference material.

Do not push. Do not amend. If a pre-commit hook fails, fix the underlying issue and make a **new** commit.
