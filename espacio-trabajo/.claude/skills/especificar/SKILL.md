---
name: especificar
description: "Crea o actualiza la especificacion de un modulo solo con analista-spec (ej. /especificar reservas 3.3 8.5 10.2)"
argument-hint: "<modulo> <secciones DERCAS>"
disable-model-invocation: true
context: fork
agent: analista-spec
background: false
---

Crea o actualiza la especificación indicada por estos argumentos, en `api/docs/especificaciones/`:

$ARGUMENTS
