#!/usr/bin/env bash
# Selective memory loader. Runs from two events:
#   - UserPromptSubmit       → keyword-match the user prompt
#   - PostToolUse(Read)      → keyword-match the just-read file path
# Each memory/bc-*.md file is injected at most once per session_id (cache in /tmp).
#
# Observability:
#   - systemMessage     → shown in the UI
#   - load-memory.log   → one line per fired hook, alongside this script
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEM_DIR="$SCRIPT_DIR/../../memory"
LOG_FILE="$SCRIPT_DIR/load-memory.log"

input=$(cat)

session_id=$(printf '%s' "$input" | jq -r '.session_id // "default"' 2>/dev/null) || session_id="default"
prompt=$(printf '%s' "$input" | jq -r '.prompt // empty' 2>/dev/null)
tool_name=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Decide event + source text
if [ -n "$prompt" ]; then
  event="UserPromptSubmit"
  src="prompt"
  text="$prompt"
elif [ "$tool_name" = "Read" ] && [ -n "$file_path" ]; then
  event="PostToolUse"
  src="path:$file_path"
  text="$file_path"
else
  exit 0
fi

# Skip self-reads of memory/* — they'd cause spammy duplicate injection
case "$file_path" in
  *"/memory/"*|*"/.claude/hooks/"*) exit 0 ;;
esac

lc=$(printf '%s' "$text" | tr '[:upper:]' '[:lower:]')

# Patterns include hyphenated forms so file paths like source/recovery-plan/... match.
declare -A BC_PATTERNS=(
  ["participant-portal"]='participant-portal|participant|income|drain|obligation|available|portal|salary|subscription|recurring expense|monthly equivalent'
  ["recovery-plan"]='recovery-plan|recovery plan|payoff|debt-free|debt free|savings opportunity|projection|avalanche|snowball|eliminate debt|debt elimination|debt-free date'
  ["counselor-dashboard"]='counselor-dashboard|counselor|caseload|snapshot|progress signal|intervention|stalled|at-risk|at risk|triage|oversight|dashboard'
  ["conversations"]='conversation|message|messaging|inbox|unread|reply|notification|chat|read state|read receipt'
)

# Per-session dedup so the same memory file isn't injected twice in one session
safe_sid=$(printf '%s' "$session_id" | tr -c 'a-zA-Z0-9._-' '_')
CACHE_FILE="/tmp/claude-memory-cache-${safe_sid}"
touch "$CACHE_FILE" 2>/dev/null || CACHE_FILE=""

ctx=""
report_entries=()
for bc in participant-portal recovery-plan counselor-dashboard conversations; do
  file="$MEM_DIR/bc-$bc.md"
  [ -f "$file" ] || continue

  if [ -n "$CACHE_FILE" ] && grep -qxF "bc-$bc" "$CACHE_FILE" 2>/dev/null; then
    continue
  fi

  matches=$(printf '%s' "$lc" | grep -oE "${BC_PATTERNS[$bc]}" | sort -u | paste -sd, -)
  if [ -n "$matches" ]; then
    ctx="${ctx}$(printf '\n\n=== memory/bc-%s.md ===\n' "$bc")$(cat "$file")"
    report_entries+=("bc-$bc.md <- $matches")
    [ -n "$CACHE_FILE" ] && echo "bc-$bc" >> "$CACHE_FILE"
  fi
done

# On PostToolUse with no matches, stay silent — Read fires constantly,
# we don't want a status line on every read.
if [ ${#report_entries[@]} -eq 0 ]; then
  if [ "$event" = "UserPromptSubmit" ]; then
    status="[memory] no BC matched — nothing injected"
  else
    exit 0
  fi
else
  printf -v joined '%s; ' "${report_entries[@]}"
  joined="${joined%; }"
  status="[memory] injected ${#report_entries[@]} file(s) ($event): $joined"
fi

{
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  snip=$(printf '%s' "$text" | head -c 80 | tr '\n' ' ')
  printf '%s | %s | %s=%s | %s\n' "$ts" "$status" "$event" "$src" "$snip" >> "$LOG_FILE"
} 2>/dev/null || true

if [ -n "$ctx" ]; then
  jq -n --arg c "$ctx" --arg m "$status" --arg ev "$event" '{
    systemMessage: $m,
    hookSpecificOutput: {
      hookEventName: $ev,
      additionalContext: $c
    }
  }'
else
  jq -n --arg m "$status" '{ systemMessage: $m }'
fi
