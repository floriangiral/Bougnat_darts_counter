#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "guard:clean: $1" >&2
  exit 1
}

must_not_exist=(
  "components/ui/AppPageBackground.tsx"
  "index.css"
  "src/index.ts"
  "src/application/scoringTerminal/index.ts"
  "src/domain/scoringTerminal/index.ts"
  "src/features/x01/voice/VoiceScoreProposal.tsx"
  "src/infrastructure/scoringTerminal/index.ts"
  "src/ui/index.ts"
  "src/ui/components/index.ts"
  "src/ui/views/index.ts"
)

for path in "${must_not_exist[@]}"; do
  if [[ -e "$path" ]]; then
    fail "legacy file must stay deleted: $path"
  fi
done

must_not_have_files=(
  "src/features/setup"
  "src/features/x01/match"
  "src/features/scoring-terminal"
  "src/ui/components"
  "src/ui/views"
  "tests/unit/scoringTerminal"
)

for dir in "${must_not_have_files[@]}"; do
  if [[ -d "$dir" ]]; then
    file_count="$(find "$dir" -type f | wc -l | tr -d ' ')"
    if [[ "$file_count" != "0" ]]; then
      fail "legacy directory must remain empty: $dir ($file_count files)"
    fi
  fi
done

forbidden_import_patterns=(
  "src/features/setup/"
  "src/features/x01/match/"
  "src/features/scoring-terminal/"
  "src/ui/"
  "AppPageBackground"
  "/VoiceScoreProposal"
  "scoringTerminal/"
)

for pattern in "${forbidden_import_patterns[@]}"; do
  if rg -n --glob '*.{ts,tsx,js,mjs,cjs}' "$pattern" App.tsx views components src utils tests >/dev/null 2>&1; then
    fail "forbidden legacy reference found for pattern: $pattern"
  fi
done

if rg -n "export \* from './scoringTerminal'" src/application/index.ts src/domain/index.ts src/infrastructure/index.ts >/dev/null 2>&1; then
  fail "legacy scoringTerminal barrel export reintroduced"
fi

echo "guard:clean: OK"
