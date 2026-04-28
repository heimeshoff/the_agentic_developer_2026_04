---
name: git-commit
description: Analyze the current git diff and create a well-crafted commit that matches the repository's existing style. Use this skill whenever the user wants to commit changes, save their work, wrap up a change, or mentions committing in any form — including casual phrasings like "commit this", "ship it", "let's commit", "save this", "make a commit", or "wrap this up". Stages files intelligently (skipping secrets, build artifacts, and editor/OS cruft), reads recent commit messages to match the repo's existing style and conventions, writes a message focused on why the change was made rather than what mechanically changed, and commits without pushing.
---

# Git commit

Analyze what changed, write a commit message that matches the repo's style, and commit. Don't push.

## Step 1 — gather context (in parallel)

Run these three in parallel. You need all three before you can write a good message:

- `git status` — to see tracked/untracked/modified files. **Do not** use `-uall`; it can be slow on large repos.
- `git diff HEAD` — both staged and unstaged changes in one pass, so you actually understand what changed.
- `git log -n 10 --pretty=format:"%h %s%n%b%n---"` — to read the repo's recent commit history and match its style.

The reason to read the log carefully: every repo has its own dialect. Before writing anything, figure out:

- **Subject format.** Conventional Commits (`feat(scope): ...`)? Plain imperative (`Add X`)? Tag prefixes (`[api] ...`)? Something else?
- **Capitalization and punctuation.** Does the subject start with a capital? End with a period?
- **Tense/mood.** Imperative ("add logging") vs past ("added logging") vs gerund ("adding logging")?
- **Body usage.** Do commits usually have bodies, or just subjects? How detailed?
- **Trailers.** `Signed-off-by`, `Co-Authored-By`, issue references like `Fixes #123`?

If the history is inconsistent, pick the most common recent pattern. Don't invent a new style.

## Step 2 — stage deliberately

Stage files by explicit path. **Never** use `git add -A`, `git add .`, or `git add -u` — these are the classic ways to accidentally commit a secret.

Skip anything that looks like it shouldn't be in the repo:

- **Secrets.** `.env`, `.env.*` (unless it's clearly `.env.example` or similar), `*.pem`, `*.key`, `id_rsa*`, `credentials.json`, `*.p12`, anything with `secret`, `token`, or `password` in the filename.
- **Build artifacts.** `node_modules/`, `dist/`, `build/`, `.next/`, `.nuxt/`, `target/`, `out/`, `__pycache__/`, `.venv/`, `venv/`, compiled binaries, `*.pyc`, `*.class`.
- **OS and editor cruft.** `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/` — unless a quick check of the log shows the repo actually tracks them.
- **Accidental blobs.** Anything over ~1 MB that doesn't look like a deliberately-tracked asset.

If you're uncertain about a file, name it to the user and ask. And if you're skipping files, **say so** — silently dropping changes is worse than asking.

If the diff mixes clearly unrelated concerns (e.g. a bug fix plus an unrelated refactor plus a dependency bump), flag it and ask whether the user wants one commit or several. Atomic commits make history useful; lumping unrelated changes together erodes that.

## Step 3 — write the message

Focus on **why**, not what. The diff already shows what changed mechanically; the message earns its keep by explaining the reason, the effect, or the constraint that motivated the change.

For most commits, a well-chosen subject line is enough. Add a body only when the change genuinely needs explanation that won't fit — non-obvious tradeoffs, issue references, caveats for future readers, migration notes.

Match the repo style you identified in step 1: prefix, capitalization, punctuation, tense, trailer conventions. If the repo uses a `Co-Authored-By:` or `Signed-off-by:` trailer consistently, include one matching the pattern — otherwise don't add trailers the repo doesn't already use.

Avoid padding the message with things the diff already shows ("changed 3 files, added function foo"). That's noise.

## Step 4 — commit

Use a HEREDOC so multi-line messages and any special characters in the body render correctly:

```bash
git commit -m "$(cat <<'EOF'
<subject line>

<optional body>
EOF
)"
```

After the commit, run `git status` to confirm it landed, then tell the user the short SHA and subject so they can see what you did.

## What not to do

- **Don't push.** Committing and pushing are separate decisions — the user will push when they're ready.
- **Don't amend.** If a pre-commit hook rejects the commit, the commit did not happen, so `--amend` would modify the *previous* commit and can silently destroy work. Fix the underlying issue and make a **new** commit.
- **Don't skip hooks** (`--no-verify`, `--no-gpg-sign`). Hooks exist for reasons — if one fails, investigate and fix the cause.
- **Don't `git add -A` / `git add .` / `git add -u`.** Stage by explicit path, every time.
- **Don't invent a commit style the repo doesn't use.** If the log is all `fix: ...` / `feat: ...`, don't suddenly write `[FIX] ...`.
