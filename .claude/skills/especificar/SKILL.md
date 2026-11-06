---
name: especificar
description: "Crea o actualiza la especificacion de un modulo solo con analista-spec (ej. /especificar reservas 3.3 8.5 10.2)"
argument-hint: "<modulo> <secciones DERCAS>"
disable-model-invocation: true
context: fork
agent: analista-spec
background: false
---

Crea o actualiza la especificacion indicada por estos argumentos:

$ARGUMENTS

El primer argumento es el modulo; el resto, las secciones del DERCAS. Termina con tu informe y deja las Dudas al final.
