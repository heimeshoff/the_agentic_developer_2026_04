#!/usr/bin/env bash
#
# reindex_memory.sh
#
# Deterministic reconciliation report between what is on disk under exercise_one/
# and what memory/project/INDEX.md claims. Read-only: never edits INDEX.md.
#
# Run from the team root: teams/richi_and_lucag/
#   bash scripts/reindex_memory.sh
#
# Output: a diff-style report on stdout. Exit code 0 on success regardless of
# drift — drift is reported, not failed.

set -euo pipefail

# Resolve team root from this script's location so it works from any cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$TEAM_ROOT"

INDEX_FILE="memory/project/INDEX.md"
EXERCISE_ROOT="exercise_one"

KNOWN_PHASES=(vision research domain tactical-ddd)

printf '== reindex_memory.sh ==\n'
printf 'Team root: %s\n' "$TEAM_ROOT"
printf 'Date:      %s\n' "$(date +%Y-%m-%d)"
printf '\n'

if [[ ! -f "$INDEX_FILE" ]]; then
    printf 'FATAL: %s does not exist. Bootstrap INDEX.md before reindexing.\n' "$INDEX_FILE"
    exit 1
fi

if [[ ! -d "$EXERCISE_ROOT" ]]; then
    printf 'FATAL: %s/ does not exist.\n' "$EXERCISE_ROOT"
    exit 1
fi

printf -- '-- Sessions on disk --\n'
disk_sessions=()
while IFS= read -r -d '' session; do
    rel="${session#./}"
    disk_sessions+=("$rel")
    printf '  %s/\n' "$rel"
done < <(find "$EXERCISE_ROOT" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)
if [[ ${#disk_sessions[@]} -eq 0 ]]; then
    printf '  (none)\n'
fi
printf '\n'

printf -- '-- Loose files on disk under %s/ --\n' "$EXERCISE_ROOT"
loose_files=()
while IFS= read -r -d '' f; do
    rel="${f#./}"
    loose_files+=("$rel")
    printf '  %s\n' "$rel"
done < <(find "$EXERCISE_ROOT" -mindepth 1 -maxdepth 1 -type f -print0 | sort -z)
if [[ ${#loose_files[@]} -eq 0 ]]; then
    printf '  (none)\n'
fi
printf '\n'

printf -- '-- Phase artifacts on disk --\n'
disk_artifacts=()
for session in "${disk_sessions[@]}"; do
    for phase in "${KNOWN_PHASES[@]}"; do
        path="$session/$phase.md"
        if [[ -f "$path" ]]; then
            disk_artifacts+=("$path")
            printf '  [%s] %s\n' "$phase" "$path"
        fi
    done
done
if [[ ${#disk_artifacts[@]} -eq 0 ]]; then
    printf '  (none)\n'
fi
printf '\n'

printf -- '-- Paths referenced by INDEX.md --\n'
indexed_paths=()
while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    indexed_paths+=("$path")
    if [[ -e "$path" ]]; then
        printf '  OK     %s\n' "$path"
    else
        printf '  MISSING %s\n' "$path"
    fi
done < <(grep -oE '`(exercise_one[^`]+)`' "$INDEX_FILE" | sed -E 's/^`//; s/`$//' | sort -u)
if [[ ${#indexed_paths[@]} -eq 0 ]]; then
    printf '  (none — INDEX has no exercise_one paths)\n'
fi
printf '\n'

printf -- '-- Drift report --\n'
drift=0

# Disk artifacts not mentioned in INDEX.
for art in "${disk_artifacts[@]}"; do
    if ! grep -qF "$art" "$INDEX_FILE"; then
        printf '  ON_DISK_NOT_INDEXED  %s\n' "$art"
        drift=$((drift + 1))
    fi
done

# Indexed paths missing from disk.
for p in "${indexed_paths[@]:-}"; do
    [[ -z "${p:-}" ]] && continue
    if [[ ! -e "$p" ]]; then
        printf '  INDEXED_NOT_ON_DISK  %s\n' "$p"
        drift=$((drift + 1))
    fi
done

# Active-session count must be exactly 1.
active_count=$(grep -cE '^\| `exercise_one/[^|]+` \| active \|' "$INDEX_FILE" || true)
if [[ "$active_count" -ne 1 ]]; then
    printf '  ACTIVE_SESSION_COUNT  expected 1, found %s\n' "$active_count"
    drift=$((drift + 1))
fi

if [[ "$drift" -eq 0 ]]; then
    printf '  (no drift detected)\n'
fi
printf '\n'

printf -- '-- Summary --\n'
printf '  sessions on disk:        %d\n' "${#disk_sessions[@]}"
printf '  phase artifacts on disk: %d\n' "${#disk_artifacts[@]}"
printf '  indexed paths:           %d\n' "${#indexed_paths[@]}"
printf '  drift items:             %d\n' "$drift"

if [[ "$drift" -gt 0 ]]; then
    printf '\nNext step: review the drift list above and update %s by hand,\n' "$INDEX_FILE"
    printf 'or invoke /reindex to generate a proposed updated INDEX for approval.\n'
fi
