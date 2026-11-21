---
name: verificar
description: "Corre lint, typecheck y test de la API y resume el resultado"
disable-model-invocation: true
allowed-tools: "Bash(bash .claude/skills/verificar/scripts/verificar.sh:*)"
---

Corre solo este comando en la raiz del repositorio y muestra su salida tal cual:

`bash .claude/skills/verificar/scripts/verificar.sh`

No delegues ni corrijas nada.
