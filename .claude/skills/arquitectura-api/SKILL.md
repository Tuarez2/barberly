---
name: arquitectura-api
description: Estructura de un modulo de la API de Barberly (rutas, controlador, servicio, esquemas Zod), manejo de errores con ErrorNegocio y formato de respuestas. Usar al crear o modificar endpoints.
---

# Arquitectura de la API

## Estructura de un modulo (`apps/api/src/modulos/<modulo>/`)
- `rutas.ts` — `express.Router`, une ruta + middlewares + controlador. Sin logica.
- `controlador.ts` — lee `req`, llama al servicio, arma la respuesta. Sin Prisma ni reglas.
- `servicio.ts` — toda la logica de negocio y el acceso a Prisma.
- `esquemas.ts` — esquemas Zod (`.strict()`) de entrada y tipos derivados.
- `<modulo>.prueba.ts` — pruebas.

## Compartido (`apps/api/src/compartido/`)
- `errores.ts`: `class ErrorNegocio extends Error { constructor(public codigo: string, public http: number, mensaje: string, public detalles?: unknown) }`.
- `middleware/`: `autenticar`, `contextoBarberia`, `exigirRol(...roles)`, `validar(esquema)`, `manejarErrores`.
- `base-datos.ts`: instancia unica de `PrismaClient`.

## Reglas
- Lanza `new ErrorNegocio('HORARIO_OCUPADO', 409, 'El horario ya no esta disponible')`; solo `manejarErrores` lo convierte en respuesta. Codigos existentes en `docs/errores.md`.
- Respuesta ok: `res.status(200).json({ datos, meta? })`. Error: `{ error: { codigo, mensaje, detalles } }`. Creacion: 201.
- Error inesperado: 500 con `INTERNO` y mensaje generico; el detalle va al log sin datos sensibles.
- Rutas bajo `/api/v1`, minusculas con guiones. Nada de `any`; `strict` de TypeScript.
- Cadena por solicitud: limite → autenticacion → contexto → rol → validacion → propiedad → negocio → auditoria.
- Dinero con `Prisma.Decimal`; fechas `Date` en UTC; Luxon solo para calcular horarios locales.
- Nuevo endpoint: actualizar la especificacion y el OpenAPI/README.
