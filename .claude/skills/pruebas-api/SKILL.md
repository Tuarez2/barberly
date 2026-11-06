---
name: pruebas-api
description: "Pruebas de la API con Vitest y Supertest: base de prueba, rojo-verde, fabricas, aislamiento y concurrencia. Usar al crear o ampliar pruebas de apps/api. No usar para pruebas de la app (expo-pantallas)."
user-invocable: false
---

# Pruebas de la API

## Configuracion
- Vitest + Supertest; base `barberly_prueba` (`DATABASE_URL` de prueba en `.env.prueba`).
- Antes de las pruebas, aplicar las migraciones a `barberly_prueba` con `prisma migrate deploy` usando el `DATABASE_URL` de `.env.prueba`.
- `vitest.config.ts`: `test.include: ['src/**/*.prueba.ts', '../../pruebas/**/*.prueba.ts']` y `fileParallelism: false` (las pruebas comparten la base). Si `npm run test -w apps/api` reporta 0 pruebas, es un error de configuracion, no un exito.
- Antes de cada archivo: limpiar tablas en orden de dependencias y sembrar lo minimo; deja dos barberias con sus propietarios para el caso de aislamiento.
- Proveedor de IA: usar el simulado de `ProveedorAsesorEstilo`. Pasarela: simulada. Nunca llamadas reales.

## Utilidades (`apps/api/src/pruebas/`)
- `fabricas.ts`: `crearBarberiaDePrueba`, `crearClienteDePrueba`, etc., con UUID fijos para que los fallos se puedan reproducir.
- `sesiones.ts`: obtener tokens por rol.
- La hora se fija con el reloj (`compartido/reloj.ts`).

## Estructura
- Archivo `<modulo>.prueba.ts` junto al modulo.
- `describe('HU-RES-01', ...)` con el codigo de la historia; `it('RN-04: rechaza horario solapado', ...)` con el codigo de la regla.
- Una prueba por criterio de la HU y por regla RN de la especificacion; casos PO-01 a PO-14 de DERCAS §12.2 cuando correspondan.

## Obligatorias por endpoint
1. Camino feliz con su codigo HTTP y forma `{ datos }`.
2. Sin token → 401. Rol incorrecto → 403.
3. Entrada invalida o campo extra → 422 con `{ error: { codigo, mensaje, detalles } }`.
4. **Usuario de otra barberia → 404.**
5. Cada codigo de error de la especificacion.

## Casos de limite obligatorios
- Exactamente en el limite: RN-13 a 120 min se permite.
- 1 minuto antes del limite: RN-13 a 119 min responde `CANCELACION_TARDIA`.
- RN-04: una cita que termina a las 10:00 y otra que empieza a las 10:00 no se solapan.
- Fechas en zona `America/Guayaquil`.

## Concurrencia (reservas)
```ts
const respuestas = await Promise.all(
  Array.from({ length: 20 }, () => peticion.post('/api/v1/citas').set(...).send(datos)),
);
expect(respuestas.filter(r => r.status === 201)).toHaveLength(1);
expect(respuestas.filter(r => r.body.error?.codigo === 'HORARIO_OCUPADO')).toHaveLength(19);
```
Usa clientes distintos para evitar la idempotencia; verifica en la base que existe una sola cita.

Prueba obligatoria (RN-34): con una `PENDIENTE` vencida en las 10:00, una nueva reserva a las 10:00 tiene exito.

## Flujo rojo-verde
Escribe las pruebas, corre `npm run test -w apps/api` y confirma que fallan por falta de implementacion (no por error de sintaxis ni de entorno). No modifiques pruebas para que pasen; si una es incorrecta, reportalo.

Las pruebas de API importan solo `app` desde `src/app.ts` y las utilidades de prueba; nunca archivos internos del modulo. Una ruta que todavia no existe responde 404: ese es el rojo correcto.
