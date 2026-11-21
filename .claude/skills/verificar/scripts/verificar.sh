#!/usr/bin/env bash
# Uso: bash .claude/skills/verificar/scripts/verificar.sh
# Corre lint, typecheck y test. Imprime 3 lineas o menos; la salida completa va a /tmp.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../../../.."

registro="$(mktemp /tmp/barberly-api-verificar-XXXXXX.log)"
paso="$(mktemp /tmp/barberly-api-paso-XXXXXX.log)"
trap 'rm "$paso"' EXIT
fallo=0
primer_error=""
linea="api:"
separador=" "
conteo=""

for script in lint typecheck test; do
  if npm run "$script" >"$paso" 2>&1; then
    resultado="ok"
  else
    resultado="falla"
    fallo=1
    if [[ -z "$primer_error" ]]; then
      error="$(awk '!/^>/ && tolower($0) ~ /error|fail|✖/ { print; exit }' "$paso")"
      [[ -n "$error" ]] || error="$(tail -n 1 "$paso")"
      primer_error="$script: ${error:0:160}"
    fi
  fi
  {
    echo "===== $script: $resultado"
    cat "$paso"
  } >>"$registro"
  if [[ "$script" == "test" ]]; then
    conteo="$(grep -m1 -E '^[[:space:]]*Tests:?[[:space:]]' "$paso" | sed -E 's/^[[:space:]]+//' || true)"
  fi
  linea="$linea$separador$script $resultado"
  separador=" · "
done

[[ -n "$conteo" ]] && linea="$linea ($conteo)"
echo "$linea"
if [[ "$fallo" -ne 0 ]]; then
  echo "Primer error: $primer_error"
  echo "Salida completa: $registro"
  exit 1
fi
echo "Salida completa: $registro"
