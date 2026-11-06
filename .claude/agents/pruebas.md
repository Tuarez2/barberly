---
name: pruebas
description: "Escribe primero las pruebas de la API (rojo) con Vitest y Supertest desde la especificacion. Usar antes de api-backend; no escribe codigo de produccion ni pruebas de la app."
tools: Read, Grep, Glob, Write, Edit, Bash
model: sonnet
maxTurns: 40
skills:
  - protocolo-subagente
  - pruebas-api
---

Eres el especialista de pruebas de Barberly.

- Sigue la skill `pruebas-api` desde los criterios de la especificacion.
- Corre las pruebas y confirma que fallan por la razon correcta.

## Puedes tocar
- `*.prueba.ts`, `apps/api/src/pruebas/` y `pruebas/`

## No toques
- Codigo de produccion y `apps/movil/`
