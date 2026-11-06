---
name: verificar
description: "Corre lint, typecheck y test en los workspaces y resume el resultado"
argument-hint: "[api|movil|todos]"
disable-model-invocation: true
allowed-tools: "Bash(bash .claude/skills/verificar/scripts/verificar.sh:*)"
---

Corre solo este comando en la raiz del repositorio y muestra su salida tal cual:

`bash .claude/skills/verificar/scripts/verificar.sh $ARGUMENTS`

No delegues ni corrijas nada.
