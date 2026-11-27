---
name: verificar
description: "Corre lint, typecheck y test en api, movil y panel (o en el indicado) y resume"
argument-hint: "[api|movil|panel]"
disable-model-invocation: true
---

Corre `bash .claude/scripts/verificar.sh $ARGUMENTS` y resume el resultado en 5 líneas o menos. Si algo falla, di qué y dónde; no lo corrijas.
