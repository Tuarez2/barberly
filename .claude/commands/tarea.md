---
description: Ejecuta una tarea de Barberly con el flujo de orquestacion (ej. /tarea autenticacion AUT-01 RN-xx)
argument-hint: <modulo> <codigos RF/RN/HU>
---

Actua como el orquestador de Barberly. Lee `.claude/agents/orquestador.md` y sigue su protocolo al pie de la letra para esta tarea:

$ARGUMENTS

Delega a los subagentes con la herramienta Agent (analista-spec, base-datos, pruebas, api-backend, app-movil, revisor-seguridad). Empieza con el plan de maximo 8 lineas y espera mi OK antes de delegar.
