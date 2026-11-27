#!/usr/bin/env bash
# Uso: bash .claude/scripts/seccion-dercas.sh <seccion>...  (ej. 8.5 3.10 "Anexo B")
# Lee secciones del DERCAS desde el espacio de trabajo usando el script de la API.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
exec bash api/.claude/skills/especificar-sdd/scripts/seccion-dercas.sh "$@"
