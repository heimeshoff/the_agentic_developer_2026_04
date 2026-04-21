# Workshop Instructions

## Git Branching Strategy

- Each team **picks their own branch** and works on it for the duration of the workshop.
- Pick a branch name that identifies your team (e.g. `team-alpha`, `team-blue`, `team-<names>`).
- When merging back, **do not fast-forward**. Always merge with `--no-ff` so the branch history stays visible:

  ```bash
  git merge --no-ff <your-team-branch>
  ```

- This keeps each team's work distinct in the history and makes it easy to compare approaches afterward.

## Folder Layout

On your branch, work inside the `teams/` folder:

- Create a folder named after your team: `teams/<your-team-name>/`
- Inside it, create a subfolder per exercise: `teams/<your-team-name>/exercise_one/`, `teams/<your-team-name>/exercise_two/`, etc.
- All of your team's code for a given exercise lives in its exercise subfolder.

Example:

```
teams/
  team-alpha/
    exercise_one/
    exercise_two/
  team-blue/
    exercise_one/
```
