#!/usr/bin/env bash
# Corre un hook de esta carpeta con Node, aunque Claude Code se abra sin nvm en el PATH.
# Uso: bash .claude/hooks/node.sh <hook>.mjs [argumentos]
# Sin Node, el formateador sale con 0 en silencio y las guardias bloquean.

cargar_nvm() {
  local nvm="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  # nvm.sh no debe consumir el evento que llega por stdin.
  if [ -s "$nvm" ]; then . "$nvm" </dev/null >/dev/null 2>&1; fi
}

command -v node >/dev/null 2>&1 || cargar_nvm

if ! command -v node >/dev/null 2>&1; then
  if [ "$1" = "formatear.mjs" ]; then exit 0; fi
  echo "No encuentro Node: abre Claude Code con nvm cargado" >&2
  exit 2
fi

hook="$(dirname "${BASH_SOURCE[0]}")/$1"
shift
exec node "$hook" "$@"
