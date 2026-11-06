# AGENTS.md — Barberly

App móvil de citas para barberías con asesor de estilo por IA. Monorepo: `apps/movil` (Expo), `apps/api` (Express), `paquetes/compartido` (tipos y esquemas Zod), `docs/`, `pruebas/`.
Fuente de verdad funcional: `docs/DERCAS.md` (RF, RN, CU, HU, API, errores). Si este archivo y el DERCAS difieren, gana el DERCAS: avisa, no improvises.

## Stack

- App: React Native, Expo (Router), TypeScript estricto, TanStack Query, React Hook Form + Zod, Luxon, expo-secure-store.
- API: Node.js LTS, Express, TypeScript estricto, Zod, Prisma, MySQL 8, JWT, bcrypt/argon2.
- Calidad: Vitest/Jest + Supertest, ESLint, Prettier.
- Monolito modular, sin microservicios. No añadas dependencias sin justificarlo en el PR.

## Idioma de los nombres (obligatorio)

- **En español, sin tildes ni ñ:** modelos, tablas, campos, enums, rutas, campos JSON, códigos de error, módulos, carpetas, archivos propios, funciones, variables, tipos y pruebas.
- **En inglés solo lo que impone la tecnología:** palabras reservadas (TS, SQL, Prisma), librerías y sus APIs (`express.Router`, `prisma.$transaction`, `useQuery`), métodos y cabeceras HTTP, el campo `id`, términos técnicos (`token`, `hash`, `webhook`, `JWT`) y archivos estándar (`package.json`, `README.md`, `.env`, `schema.prisma`).
- Formato: modelos `PascalCase` (`Cita`, `PerfilBarbero`); campos y variables `camelCase` (`iniciaEn`, `barberiaId`); tablas `snake_case` plural con `@@map` (`citas`); enums y códigos de error `MAYUSCULAS` (`CONFIRMADA`, `HORARIO_OCUPADO`); rutas en minúsculas con guiones (`/api/v1/citas/:id/foto-referencia`); archivos en minúsculas con guiones.
- Claves foráneas terminan en `Id` (`clienteId`); fechas con hora terminan en `En` (`creadoEn`). Booleanos sin prefijo inglés (`activo`, `publicada`).
- No inventes nombres: usa los del DERCAS §9 (modelo), §10 (API) y Anexo B (errores).

## Flujo SDD

1. Leer `docs/especificaciones/<modulo>.md` y lo que referencia, no el DERCAS completo.
2. Si la tarea cambia el comportamiento, actualizar primero la especificación.
3. Presentar un plan de 5 a 8 líneas y esperar OK.
4. Trabajar en tareas pequeñas, una rama por tarea.
5. Escribir las pruebas desde los criterios de aceptación.
6. Correr `lint`, `typecheck` y `test`.
7. Citar códigos RN/AUT en los commits.

## Referencias

- Reglas de negocio: `docs/reglas.md`.
- Catálogo de errores: `docs/errores.md`.
- Especificaciones por módulo: `docs/especificaciones/`.
- `docs/DERCAS.md`: solo para consultar una sección puntual, nunca completo.

## Comandos (ajustar al crear los package.json)

- Instalar: `npm install` en cada app.
- API: `npm run dev` · `npm test` · `npm run lint` · `npm run typecheck`
- Prisma: `npx prisma migrate dev` (local) · `npx prisma migrate deploy` (producción) · `npm run seed`
- App: `npx expo start` (Expo Go, Android)
- Antes de dar una tarea por terminada: `lint` + `typecheck` + `test` sin errores.

## Arquitectura (API)

- Módulos en `apps/api/src/modulos/`: `autenticacion`, `barberias`, `reservas`, `agenda`, `administracion`, `seguridad`, `asesor-estilo`, `pagos`, `estadisticas`.
- Por módulo: `rutas.ts → controlador.ts → servicio.ts → datos (Prisma)`, más `esquemas.ts` (Zod) y `*.prueba.ts`. La lógica de negocio vive solo en `servicio.ts`.
- La app solo habla con la API. Solo la API toca MySQL, la IA y la pasarela.
- Proveedor de IA detrás de la interfaz `ProveedorAsesorEstilo` (método `analizar`); en pruebas usa el simulado.
- Respuesta ok: `{ datos, meta? }`. Error: `{ error: { codigo, mensaje, detalles } }`. Rutas bajo `/api/v1`.

## Convenciones

- IDs UUID. Dinero: `Decimal` según DERCAS §9.2 (`(8,2)` en `Servicio.precio` y `Cita.precioReserva`; `(10,2)` en `Barberia.montoAnticipo` y `Pago.monto`), nunca `float`. Fechas: UTC en BD, ISO 8601 en API, zona de la barbería (`America/Guayaquil`) solo al mostrar (Luxon).
- Borrado lógico (`activo` o `estado`) en entidades con historial. Nada de `console.log` con datos sensibles.
- Textos de la interfaz en español, centralizados.
- Un cambio = una tarea pequeña. No refactorices fuera del alcance pedido. Un PR por funcionalidad, con pruebas.
- Cita el código de la regla en commits y pruebas (ej. `RN-04`, `RES-06`).

## Reglas de negocio críticas (el backend las aplica siempre)

- **RN-04** Sin solapamiento de citas activas (`PENDIENTE`/`CONFIRMADA`) por barbero. Intervalo `[iniciaEn, terminaEn)`: terminar a las 10:00 y empezar a las 10:00 no se solapa.
- **RN-16** `COMPLETADA`, `CANCELADA` y `AUSENTE` son finales: `TRANSICION_INVALIDA`.
- **RN-13** El cliente cancela si `iniciaEn − ahora ≥ minutosMinCancelacion` (120); si no, `CANCELACION_TARDIA`. El personal cancela antes del inicio, con motivo (RN-14/17).
- **RN-27..31** Foto del rostro solo en memoria, jamás en disco ni logs. Consentimiento previo (`consentimientoIaEn`), 5 consultas/día, máximo 3 recomendaciones, solo servicios activos del catálogo. Foto de referencia: una por cita, se borra al llegar a estado final.
- **RN-32** Un solo `Pago` `FINAL`, solo en cita `COMPLETADA`; si el monto difiere del sugerido, exige `motivoAjuste`.
- **RN-34** Con anticipo nace `PENDIENTE`, ocupa el horario y vence en 15 min (`anticipoVenceEn`): sin pago aprobado se cancela sola y libera el horario.
- **RN-37/38** Ingresos = pagos registrados + anticipos conservados. Estadísticas solo de la barbería del propietario.
- **RN-21/25** Servicio o barbero con citas futuras: se desactiva o se reasigna, nunca se borra (`BARBERO_CON_CITAS`).
- Resto de reglas: ver docs/reglas.md.

## Concurrencia en reservas (no lo simplifiques)

1. Crear la cita dentro de `prisma.$transaction`.
2. `SELECT … FOR UPDATE` sobre la fila del barbero y luego la del cliente (siempre en ese orden).
3. Revalidar cruces con lecturas actuales dentro de la transacción y luego insertar.
4. Respaldo en BD: único `(perfilBarberoId, inicioActivo)` (columna generada solo para citas activas, migración SQL manual) y único `(clienteId, claveIdempotencia)`.
5. Orden de validación y códigos de error: DERCAS §8.5. Prueba obligatoria: 20 solicitudes simultáneas → 1 cita.

## Seguridad (no negociable)

- Toda consulta filtra por la barbería de la **membresía** del usuario autenticado. Nunca confíes en un `barberiaId` enviado por el cliente.
- Recurso de otra barbería o de otro usuario → **404** (`NO_ENCONTRADO`), no 403.
- Cadena por solicitud: límite → autenticación (401) → contexto de barbería → rol (403) → validación Zod (400/422) → propiedad (404) → negocio (409/422) → auditoría.
- Validar con Zod en la API siempre; rechazar campos no esperados. Solo Prisma (sin SQL concatenado).
- `claveHash` con bcrypt/argon2; tokens de renovación guardados como hash. JWT de acceso de 15 min. En la app, tokens solo en `expo-secure-store`.
- Secretos solo en variables de entorno; mantén `.env.example` sin valores reales. Nunca subas `.env`.
- La app nunca maneja datos de tarjeta. Webhooks: verificar firma e idempotencia por `referenciaPasarela`.
- Inicio de sesión fallido: mensaje genérico `CREDENCIALES_INVALIDAS`. Logs sin contraseñas, tokens ni fotos.
- Auditar en `RegistroAuditoria`: cita creada, cancelada o con cambio de estado; precios; personal; pagos; anticipos; consentimiento de IA.

## Pruebas

- Cada regla RN y cada endpoint con prueba. Cada endpoint se prueba también con un usuario de **otra barbería** (debe dar 404).
- Casos obligatorios: DERCAS §12.2 (PO-01 a PO-14).
- Usar la base de prueba y el proveedor de IA simulado. Sin llamadas reales a IA ni pasarela en las pruebas.

## Hecho significa

Cumple los criterios de su HU · pruebas pasan · `lint` y `typecheck` limpios · probado en Android (Expo Go) si toca la app · README/OpenAPI actualizados.

## No hacer

- No nombrar en inglés nada propio del proyecto.
- No saltarse la validación de reservas "porque la app ya valida".
- No guardar la foto del rostro, ni pasarla a logs, ni a otro servicio distinto del proveedor de IA.
- No exponer correos de otros usuarios ni datos entre barberías.
- No usar `float` para dinero ni fechas locales en BD.
- No hacer cobros reales: la pasarela solo en modo de prueba.
- No inventar endpoints, campos o códigos de error: si falta algo, consulta el DERCAS o pregunta.
