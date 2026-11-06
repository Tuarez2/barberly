---
name: arquitectura-api
description: "Estructura de un modulo de la API, errores, respuestas, librerias fijas y reloj. Usar al crear o modificar endpoints. No usar para permisos (multi-tenencia-seguridad) ni para crear citas (reservas-concurrencia)."
user-invocable: false
---

# Arquitectura de la API

## Modulos
`autenticacion`, `barberias`, `reservas`, `agenda`, `administracion`, `seguridad`, `asesor-estilo`, `pagos`, `estadisticas`.

## Estructura de un modulo (`apps/api/src/modulos/<modulo>/`)
- `rutas.ts` — `express.Router`, une ruta + middlewares + controlador. Sin logica.
- `controlador.ts` — lee `req`, llama al servicio, arma la respuesta. Sin Prisma ni reglas.
- `servicio.ts` — toda la logica de negocio y el acceso a Prisma.
- `esquemas.ts` — esquemas Zod (`.strict()`) de entrada y tipos derivados.
- `documentacion.ts` — declara las rutas del modulo para OpenAPI.
- `<modulo>.prueba.ts` — pruebas.

## Compartido (`apps/api/src/compartido/`)
- `errores.ts`: `class ErrorNegocio extends Error { constructor(public codigo: string, public http: number, mensaje: string, public detalles?: unknown) }`.
- `middleware/`: `autenticar`, `contextoBarberia`, `exigirRol(...roles)`, `validar(esquema)`, `manejarErrores`.
- `base-datos.ts`: instancia unica de `PrismaClient`.
- `reloj.ts`: exporta `ahora()`. Los servicios nunca usan `new Date()` ni `Date.now()` para reglas de negocio; las pruebas fijan la hora con el reloj.

## Librerias fijas
`helmet`, `cors` (origenes desde una variable de entorno), `express-rate-limit` (memoria; una instancia), `pino` para logs (con `redact` de `authorization`, `clave`, `token`, `tokenHash` e `imagen`) y `jsonwebtoken`. No usar otras sin preguntar.

## Reglas
- Lanza `new ErrorNegocio('HORARIO_OCUPADO', 409, 'El horario ya no esta disponible')`; solo `manejarErrores` lo convierte en respuesta. Codigos existentes en `docs/errores.md`.
- Respuesta ok: `res.status(200).json({ datos, meta? })`. Error: `{ error: { codigo, mensaje, detalles } }`. Creacion: 201.
- Error inesperado: 500 con `INTERNO` y mensaje generico; el detalle va al log sin datos sensibles.
- El error de `express.json()` (JSON mal formado) se convierte en 422 `DATOS_INVALIDOS` en `manejarErrores`.
- Rutas bajo `/api/v1`, minusculas con guiones. Nada de `any`; `strict` de TypeScript.
- La app solo habla con la API; solo la API toca MySQL, la IA y la pasarela.
- Proveedor de IA detras de la interfaz `ProveedorAsesorEstilo` (metodo `analizar`).
- Campos de las respuestas: ver `multi-tenencia-seguridad` (RNF-17).
- Dinero en JSON como string con 2 decimales (`"8.00"`); fechas ISO 8601 UTC.
- Paginacion: `pagina` y `limite` (por defecto 1 y 10, maximo 50), con `meta.total`.
- Dinero con `Prisma.Decimal`; fechas `Date` en UTC; Luxon solo para calcular horarios locales.

## Bruno y documentacion.ts
Fuente: DERCAS §8.8 y §10.7.
- Bruno: coleccion versionada con Git en `apps/api/bruno/<modulo>/`, con un `.bru` por endpoint y por error de negocio relevante.
- OpenAPI: se genera desde los esquemas Zod con `@asteasolutions/zod-to-openapi`.
- Cada modulo declara sus rutas en `documentacion.ts`; en desarrollo se sirve en `GET /api/v1/documentacion`.
- Nuevo endpoint: actualizar `documentacion.ts`, Bruno y el README. Si la especificacion debe cambiar, anotalo en Dudas.
