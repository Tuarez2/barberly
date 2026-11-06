#!/usr/bin/env bash
# Uso: bash .claude/skills/especificar-sdd/scripts/seccion-dercas.sh <seccion>...
# Ejemplos: 8.5   3.3   "Anexo B"   CU-07
# Imprime desde el titulo de cada seccion hasta el siguiente titulo del mismo nivel o superior.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../../../.."
dercas="docs/DERCAS.md"

if [[ $# -eq 0 ]]; then
  echo "Uso: seccion-dercas.sh <seccion>... (ej. 8.5 3.3 \"Anexo B\")"
  exit 2
fi

imprimir_seccion() {
  awk -v buscada="$1" '
    function nivel_de(linea) { match(linea, /^#+/); return RLENGTH }
    function coincide(titulo,    t, b, siguiente, despues) {
      t = tolower(titulo); b = tolower(buscada)
      if (index(t, b) != 1) return 0
      siguiente = substr(t, length(b) + 1, 1)
      despues = substr(t, length(b) + 2, 1)
      if (siguiente == "" || siguiente == " ") return 1
      return siguiente == "." && despues !~ /[0-9]/
    }
    /^```/ { en_codigo = !en_codigo }
    !en_codigo && /^#+ / {
      titulo = $0; sub(/^#+ /, "", titulo)
      if (dentro && nivel_de($0) <= nivel) { exit }
      if (!dentro && coincide(titulo)) { dentro = 1; nivel = nivel_de($0) }
    }
    dentro { print }
    END { exit dentro ? 0 : 3 }
  ' "$dercas"
}

listar_parecidos() {
  local base="${1%.*}"
  local primera
  primera="$(printf '%s' "${base%% *}" | tr '[:upper:]' '[:lower:]')"
  local parecidos
  parecidos="$(awk -v p="$primera" '
    /^#+ / {
      t = $0; sub(/^#+ /, "", t); l = tolower(t)
      if (index(l, p) == 1 || (p !~ /^[0-9]/ && index(l, p) > 0)) print "  " t
    }
  ' "$dercas" | head -n 10)"
  if [[ -z "$parecidos" ]]; then
    parecidos="$(grep -E '^## ' "$dercas" | sed -E 's/^## /  /')"
  fi
  echo "No encontré la sección \"$1\". Títulos parecidos:"
  echo "$parecidos"
}

estado=0
for seccion in "$@"; do
  if ! imprimir_seccion "$seccion"; then
    listar_parecidos "$seccion"
    estado=1
  fi
done
exit "$estado"
