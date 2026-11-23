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

# Spec 043 (Q5) : `git grep` (toujours présent avec Git) remplace `rg`, dont l'absence faisait passer la garde.
command -v git >/dev/null 2>&1 || fail "git est requis pour rechercher les références legacy (git grep)"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "la garde doit s'exécuter dans un dépôt Git (git grep)"

# Code de sortie de git grep : 0 = trouvé, 1 = rien trouvé, autre = erreur (qui ne doit jamais valoir « rien trouvé »).
contains_fixed_string() {
  local needle="$1"
  shift
  local status=0
  git grep --untracked -q -F -e "$needle" -- "$@" || status=$?
  case "$status" in
    0) return 0 ;;
    1) return 1 ;;
    *) fail "git grep a échoué (code $status) en recherchant : $needle" ;;
  esac
}

source_pathspecs=("App.tsx")
for dir in views components src utils tests; do
  for ext in ts tsx js mjs cjs; do
    source_pathspecs+=("$dir/*.$ext")
  done
done

for pattern in "${forbidden_import_patterns[@]}"; do
  if contains_fixed_string "$pattern" "${source_pathspecs[@]}"; then
    fail "forbidden legacy reference found for pattern: $pattern"
  fi
done

if contains_fixed_string "export * from './scoringTerminal'" src/application/index.ts src/domain/index.ts src/infrastructure/index.ts; then
  fail "legacy scoringTerminal barrel export reintroduced"
fi

# Specs 063/065 : cliquet des classes de palette brutes (la référence ne peut que baisser).
node scripts/design-tokens/check.mjs || fail "raw palette classes above the recorded baseline (scripts/design-tokens/baseline.json)"

echo "guard:clean: OK"
