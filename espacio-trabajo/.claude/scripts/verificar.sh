#!/usr/bin/env bash
# Uso: bash .claude/scripts/verificar.sh [api|movil|panel]...  (sin argumentos: los que existan)
# Corre el verificar.sh de cada repositorio y resume en pocas lineas (D-27).
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
repos=("$@")
[[ ${#repos[@]} -eq 0 ]] && repos=(api movil panel)
estado=0
for repo in "${repos[@]}"; do
  script="$repo/.claude/skills/verificar/scripts/verificar.sh"
  if [[ ! -f "$script" ]]; then
    [[ $# -gt 0 ]] && { echo "$repo: no existe $script"; estado=1; }
    continue
  fi
  bash "$script" || estado=1
done
exit "$estado"
