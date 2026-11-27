#!/usr/bin/env bash
# Instala el espacio de trabajo de agentes en la carpeta que contiene api/, frontend/ y web/ (D-27).
# Uso (desde api/): bash espacio-trabajo/instalar.sh
# Copia CLAUDE.md y .claude/ a la carpeta de arriba y enlaza las skills tecnicas de cada repositorio.
# Vuelve a correrlo cuando cambie algo en espacio-trabajo/.
set -euo pipefail
origen="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
raiz="$(cd "$origen/../.." && pwd)"

mkdir -p "$raiz/.claude"
cp "$origen/CLAUDE.md" "$raiz/CLAUDE.md"
for carpeta in agents hooks scripts skills; do
  mkdir -p "$raiz/.claude/$carpeta"
  cp -R "$origen/.claude/$carpeta/." "$raiz/.claude/$carpeta/"
done
cp "$origen/.claude/settings.json" "$raiz/.claude/settings.json"

enlazar() {
  local repo="$1" skill="$2"
  local destino="$raiz/.claude/skills/$skill"
  [[ -d "$raiz/$repo/.claude/skills/$skill" ]] || return 0
  [[ -L "$destino" || ! -e "$destino" ]] || { echo "Omito $skill: ya existe una carpeta propia"; return 0; }
  ln -sfn "../../$repo/.claude/skills/$skill" "$destino"
}
for s in almacen-archivos arquitectura-api disponibilidad-horarios especificar-sdd multi-tenencia-seguridad \
  prisma-postgresql pruebas-api reservas-concurrencia revision-codigo; do
  enlazar api "$s"
done
for s in diseno-movil expo-pantallas; do enlazar frontend "$s"; done

echo "Espacio de trabajo instalado en $raiz. Abre Claude Code ahí y usa /funcionalidad <ID>."
