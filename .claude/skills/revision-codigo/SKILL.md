---
name: revision-codigo
description: "Checklist de revision con niveles Bloqueante, Importante y Sugerencia. Usar al revisar cambios antes de cerrar una tarea. No usar para escribir o corregir codigo."
user-invocable: false
---

# Revision de codigo

Revisa con `git status --porcelain` + `git diff HEAD` (cambios en archivos con seguimiento, preparados o no) y lee completos los archivos que aparezcan como `??`. Solo lo cambiado. Bash solo para `git status`, `git diff`, `git log` y `git ls-files`.

## Checklist
**Bloqueante**
- [ ] Personal: barberia sin verificar contra su membresia `ACTIVO`, o sin membresia no responde 404.
- [ ] Cliente: barberia sin verificar como publicada, servicio o barbero ajenos a ella sin 404, o citas y consultas sin filtro por `clienteId`/`usuarioId` del usuario autenticado.
- [ ] `barberiaId` recibido usado para leer o modificar datos internos sin verificar la membresia.
- [ ] Recurso ajeno responde 403 en vez de 404.
- [ ] Endpoint sin autenticacion, rol o validacion Zod `.strict()`.
- [ ] Regla RN omitida o con otro codigo de error que el DERCAS.
- [ ] Creacion de citas sin transaccion + `FOR UPDATE`, o sin manejo de `P2002`.
- [ ] Secretos, `.env`, contraseñas, tokens o fotos en codigo, logs o git.
- [ ] SQL concatenado; `float` para dinero; fechas locales en BD.
- [ ] Foto del rostro (RN-27) fuera de memoria: escrita en disco o logs, guardada en el dispositivo mas alla de la seleccion, o enviada a un servicio distinto del proveedor de IA.
- [ ] `new Date()` en reglas de negocio en vez de `reloj.ahora()`.
- [ ] Respuesta sin `select` que expone `claveHash`, `tokenHash` o correos.
- [ ] Foto de referencia sin `urlTemporal`, o foto del rostro en `AlmacenArchivos`.

**Importante**
- [ ] Logica de negocio fuera de `servicio.ts`.
- [ ] Nombres propios en ingles, o endpoints/campos/codigos no definidos en el DERCAS.
- [ ] Falta prueba de la regla o del caso "otra barberia → 404".
- [ ] Falta auditoria en `RegistroAuditoria` donde corresponde.
- [ ] Dependencia nueva sin justificar; cambios fuera del alcance de la tarea.
- [ ] Mensaje de error crudo mostrado al usuario en la app.
- [ ] Consultas N+1 en listados; paginacion sin maximo.
- [ ] Colores o tamaños escritos directamente en pantallas en vez del tema.

**Sugerencia**
- [ ] Duplicacion, nombres poco claros, funciones largas.

## Hallazgos
Formato: variante de `revisor-seguridad` en `protocolo-subagente`.
Bloqueante es seguridad, fuga entre barberias, regla RN rota o concurrencia.
