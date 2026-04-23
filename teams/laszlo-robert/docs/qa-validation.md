# QA Validation Workflow

How we validate a feature against its acceptance criteria using a live browser via the **Chrome DevTools MCP**. Runs after "verification before completion" and before code review.

## When it runs

- After Claude has built or changed a UI feature and the dev server runs clean.
- Before the feature branch is reviewed/merged.
- Re-run after any fix made in response to failures.

## Prerequisite: Chrome DevTools MCP

Install once per machine (Google's official server):

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

This exposes tools like `navigate_page`, `click`, `fill`, `take_screenshot`, `list_console_messages`, `evaluate_script`, `list_network_requests`. If those tools are not visible in the session, stop and ask the user to install/enable the MCP — do not fake the validation.

## Inputs

1. **Acceptance criteria** — the bullet list from the plan's `Verification` section (e.g. `plan.md`), or an explicit list pasted by the human. Each bullet must be independently checkable in the UI.
2. **App URL** — usually `http://localhost:5173` (Vite default). Ensure `npm run dev` is running in `exercise_one/`.

If either is missing, ask for it. Do not invent acceptance criteria.

## Procedure

For each run:

1. **Reset state.** Open the app, clear localStorage via `evaluate_script` (`localStorage.clear()`), reload. Keeps runs deterministic.
2. **Build a checklist.** Turn each acceptance criterion into a discrete TodoWrite item (`TaskCreate`). One criterion = one todo.
3. **Drive the UI.** For each criterion, use the Chrome DevTools MCP to:
   - navigate / click / fill to perform the user flow,
   - `take_screenshot` at the key assertion point,
   - `evaluate_script` when a numeric/DOM assertion is clearer than eyeballing (e.g. "summary bar total equals 1234"),
   - `list_console_messages` at the end of the flow — any `error` level message fails the criterion unless explicitly expected.
4. **Record evidence.** Save screenshots under `exercise_one/qa/<yyyy-mm-dd>/<criterion-slug>.png`. Keep the folder gitignored unless the human asks to commit it.
5. **Mark each todo pass/fail** with a one-line note + screenshot path. Do not mark pass on "looks fine" — tie it to a specific observation.
6. **Persist-and-reload check.** For any criterion involving data entry, reload the page and re-assert the data is still there.

## Reporting

End of run, post a short report:

```
QA Validation — <feature> — <date>
✅ <criterion 1>   evidence: qa/.../add-income.png
✅ <criterion 2>   evidence: ...
❌ <criterion 3>   summary bar showed 0 after reload — console error: "...". screenshot: ...
```

If anything failed: stop, do not proceed to code review. Either fix and re-run the full validation, or hand back to the human with the failure report.

## Non-goals

- Not a replacement for unit tests on budget math, formatters, etc. — those stay under TDD.
- Not a performance/accessibility audit — only functional acceptance checks. Performance traces via `performance_start_trace` are available but opt-in per-feature.

## Red flags (stop and ask)

- "Acceptance criteria" are vague ("it should feel nice"). Push back, get checkable bullets.
- Chrome DevTools MCP tools missing from the session.
- Dev server not running or failing to start.
- Need to modify application code to make a criterion pass — that's a fix, not a QA task; hand back to implementation.
