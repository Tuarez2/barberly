#!/usr/bin/env bash
# Uso: bash .claude/skills/verificar/scripts/verificar.sh [api|movil|todos]
# Corre lint, typecheck y test por workspace. Imprime 5 lineas o menos; la salida completa va a /tmp.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../../../.."

objetivo="${1:-todos}"
case "$objetivo" in
  api | movil) espacios=("$objetivo") ;;
  todos) espacios=(api movil) ;;
  *)
    echo "Uso: verificar.sh [api|movil|todos]"
    exit 2
    ;;
esac

if [[ ! -f package.json ]]; then
  echo "Falta la Fase 0: ver docs/especificaciones/preparacion.md"
  exit 1
fi

registro="$(mktemp /tmp/barberly-verificar-XXXXXX.log)"
paso="$(mktemp /tmp/barberly-paso-XXXXXX.log)"
trap 'rm "$paso"' EXIT
fallo=0
primer_error=""

for espacio in "${espacios[@]}"; do
  linea="$espacio:"
  separador=" "
  conteo=""
  for script in lint typecheck test; do
    if npm run "$script" -w "apps/$espacio" --if-present >"$paso" 2>&1; then
      resultado="ok"
    else
      resultado="falla"
      fallo=1
      if [[ -z "$primer_error" ]]; then
        error="$(awk '!/^>/ && tolower($0) ~ /error|fail|✖/ { print; exit }' "$paso")"
        [[ -n "$error" ]] || error="$(tail -n 1 "$paso")"
        primer_error="$espacio $script: ${error:0:160}"
      fi
    fi
    {
      echo "===== $espacio $script: $resultado"
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
done

if [[ "$fallo" -ne 0 ]]; then
  echo "Primer error: $primer_error"
  echo "Salida completa: $registro"
  exit 1
fi
echo "Salida completa: $registro"
