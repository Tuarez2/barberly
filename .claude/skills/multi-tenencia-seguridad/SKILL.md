---
name: multi-tenencia-seguridad
description: "Aislamiento entre barberias, autenticacion, autorizacion, validacion, secretos y auditoria. Usar al escribir o revisar cualquier endpoint o consulta. No usar para la estructura del modulo (arquitectura-api)."
---

# Multi-tenencia y seguridad

## Aislamiento
- Personal (barbero o propietario): la barberia se toma de la ruta (o del recurso o cuerpo si la ruta no la trae) y se verifica contra su **membresia** `ACTIVO`; sin membresia en esa barberia → 404.
- Cliente: el `barberiaId` (ruta o cuerpo) solo identifica la barberia publica que consulta; debe estar publicada y el servicio y el barbero pertenecer a ella (si no, 404). Sus citas y consultas se filtran por `clienteId`/`usuarioId` = usuario autenticado.
- Nunca se usa un `barberiaId` recibido para leer o modificar datos internos de esa barberia sin verificar la membresia.
- Recurso de otra barberia u otro usuario → **404** `NO_ENCONTRADO` (no 403, para no revelar su existencia). Rol insuficiente dentro de la propia barberia → **403**.
- Busca por `id` y barberia a la vez: `findFirst({ where: { id, barberiaId } })`, nunca `findUnique({ where: { id } })` sin filtro de pertenencia.
- No expongas correos ni datos de otros usuarios: respuestas con `select` explicito de Prisma, nunca `claveHash` ni `tokenHash` (RNF-17).

## Cadena por solicitud
limite de tasa → `autenticar` (401) → `contextoBarberia` → `exigirRol` (403) → `validar` (Zod, 422) → propiedad (404) → negocio (409/422) → auditoria.

## Autenticacion
- `claveHash` con bcrypt (`bcryptjs`, costo 12). Tokens de renovacion guardados como hash. JWT de acceso de 15 min.
- Inicio de sesion fallido: siempre `CREDENCIALES_INVALIDAS`, sin distinguir correo o clave.
- En la app, tokens solo en `expo-secure-store`.

## Validacion y datos
- Zod `.strict()` en toda entrada; rechaza campos extra. Solo Prisma; nada de SQL concatenado (en `$queryRaw` usa plantillas etiquetadas).
- Secretos solo en variables de entorno; `.env` fuera de git; `.env.example` sin valores.
- Logs sin contraseñas, tokens, fotos ni datos de tarjeta; nada de `console.log` con datos sensibles.
- Foto del rostro solo en memoria; nunca en disco ni en logs (RN-27).
- Webhooks de pago: verificar firma e idempotencia por `referenciaPasarela`. Pasarela solo en modo de prueba.

## Auditoria (`RegistroAuditoria`)
Registrar: cita creada, cancelada o con cambio de estado; cambios de precios; personal; pagos; anticipos; consentimiento de IA.
