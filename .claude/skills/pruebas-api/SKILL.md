---
name: pruebas-api
description: Como escribir pruebas de la API de Barberly con Vitest y Supertest (base barberly_prueba, orden rojo-verde, aislamiento entre barberias, concurrencia, IA simulada). Usar al crear o ampliar pruebas.
---

# Pruebas de la API

## Configuracion
- Vitest + Supertest; base `barberly_prueba` (`DATABASE_URL` de prueba en `.env.prueba`).
- `vitest.config.ts`: `fileParallelism: false` (las pruebas comparten la base).
- Antes de cada archivo: limpiar tablas en orden de dependencias y sembrar lo minimo; deja dos barberias con sus propietarios para el caso de aislamiento.
- Proveedor de IA: usar el simulado de `ProveedorAsesorEstilo`. Pasarela: simulada. Nunca llamadas reales.

## Estructura
- Archivo `<modulo>.prueba.ts` junto al modulo.
- `describe('HU-RES-01', ...)` con el codigo de la historia; `it('RN-04: rechaza horario solapado', ...)` con el codigo de la regla.
- Una prueba por criterio de la HU y por regla RN de la especificacion; casos PO-01 a PO-14 de DERCAS §12.2 cuando correspondan.

## Obligatorias por endpoint
1. Camino feliz con su codigo HTTP y forma `{ datos }`.
2. Sin token → 401. Rol incorrecto → 403.
3. Entrada invalida o campo extra → 400/422 con `{ error: { codigo, mensaje, detalles } }`.
4. **Usuario de otra barberia → 404.**
5. Cada codigo de error de la especificacion.

## Concurrencia (reservas)
```ts
const respuestas = await Promise.all(
  Array.from({ length: 20 }, () => peticion.post('/api/v1/citas').set(...).send(datos)),
);
expect(respuestas.filter(r => r.status === 201)).toHaveLength(1);
expect(respuestas.filter(r => r.body.error?.codigo === 'HORARIO_OCUPADO')).toHaveLength(19);
```
Usa clientes distintos para evitar la idempotencia; verifica en la base que existe una sola cita.

## Flujo rojo-verde
Escribe las pruebas, corre `npm test` y confirma que fallan por falta de implementacion (no por error de sintaxis ni de entorno). No modifiques pruebas para que pasen; si una es incorrecta, reportalo.
