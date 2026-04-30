#!/usr/bin/env bash
set -euo pipefail
input=$(cat)
prompt=$(echo "$input" | grep -o '"prompt":"[^"]*"' | cut -d'"' -f4 | tr '[:upper:]' '[:lower:]')

emit() {
  local label="$1" file="$2"
  [[ -f "$file" ]] && printf '\n## %s\n\n%s\n' "$label" "$(cat "$file")"
}

case "$prompt" in
  *database*|*schema*|*migration*|*dexie*|*indexeddb*|*table*|*field*|*model*)
    emit "Data model" exercise_one/docs/DATA_MODEL.md ;;
esac
case "$prompt" in
  *milestone*|*progress*|*status*|*built*|*implemented*|*current*|*done*|*started*)
    emit "Current state" exercise_one/docs/CURRENT_STATE.md ;;
esac
case "$prompt" in
  *decision*|*why*|*library*|*choice*|*stack*|*architecture*|*scope*|*tradeoff*)
    emit "Decisions" exercise_one/docs/DECISIONS.md ;;
esac
exit 0
