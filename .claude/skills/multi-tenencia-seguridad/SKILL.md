---
name: multi-tenencia-seguridad
description: Reglas de aislamiento entre barberias, autenticacion, autorizacion, validacion, secretos y auditoria de Barberly. Usar al escribir o revisar cualquier endpoint o consulta.
---

# Multi-tenencia y seguridad

## Aislamiento
- Toda consulta filtra por la barberia de la **membresia** del usuario autenticado. Nunca uses un `barberiaId` que venga en el cuerpo, query o ruta como fuente de autoridad.
- Recurso de otra barberia u otro usuario → **404** `NO_ENCONTRADO` (no 403, para no revelar su existencia). Rol insuficiente dentro de la propia barberia → **403**.
- Busca por `id` y barberia a la vez: `findFirst({ where: { id, barberiaId } })`, nunca `findUnique({ where: { id } })` sin filtro de pertenencia.
- No expongas correos ni datos de otros usuarios.

## Cadena por solicitud
limite de tasa → autenticacion (401) → contexto de barberia → rol (403) → validacion Zod (400/422) → propiedad (404) → negocio (409/422) → auditoria.

## Autenticacion
- `claveHash` con bcrypt o argon2. Tokens de renovacion guardados como hash. JWT de acceso de 15 min.
- Inicio de sesion fallido: siempre `CREDENCIALES_INVALIDAS`, sin distinguir correo o clave.
- En la app, tokens solo en `expo-secure-store`.

## Validacion y datos
- Zod `.strict()` en toda entrada; rechaza campos extra. Solo Prisma; nada de SQL concatenado (en `$queryRaw` usa plantillas etiquetadas).
- Secretos solo en variables de entorno; `.env` fuera de git; `.env.example` sin valores.
- Logs sin contraseñas, tokens, fotos ni datos de tarjeta.
- Foto del rostro solo en memoria; nunca en disco ni en logs (RN-27).
- Webhooks de pago: verificar firma e idempotencia por `referenciaPasarela`. Pasarela solo en modo de prueba.

## Auditoria (`RegistroAuditoria`)
Registrar: cita creada, cancelada o con cambio de estado; cambios de precios; personal; pagos; anticipos; consentimiento de IA.
