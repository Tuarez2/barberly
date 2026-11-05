---
name: revision-codigo
description: Checklist de revision de cambios de Barberly (seguridad, reglas de negocio, concurrencia, nombres en español, pruebas) con niveles Bloqueante, Importante y Sugerencia. Usar al revisar un diff antes de cerrar una tarea.
---

# Revision de codigo

Revisa `git diff main...HEAD` (o `git diff` si no hay rama). Solo lo cambiado.

## Checklist
**Bloqueante**
- [ ] Consulta sin filtro de barberia/membresia, o confianza en un `barberiaId` del cliente.
- [ ] Recurso ajeno responde 403 en vez de 404.
- [ ] Endpoint sin autenticacion, rol o validacion Zod `.strict()`.
- [ ] Regla RN omitida o con otro codigo de error que el DERCAS.
- [ ] Creacion de citas sin transaccion + `FOR UPDATE`, o sin manejo de `P2002`.
- [ ] Secretos, `.env`, contraseñas, tokens o fotos en codigo, logs o git.
- [ ] SQL concatenado; `float` para dinero; fechas locales en BD.
- [ ] Foto del rostro escrita en disco o enviada a un servicio distinto del proveedor de IA.

**Importante**
- [ ] Logica de negocio fuera de `servicio.ts`.
- [ ] Nombres propios en ingles, o endpoints/campos/codigos no definidos en el DERCAS.
- [ ] Falta prueba de la regla o del caso "otra barberia → 404".
- [ ] Falta auditoria en `RegistroAuditoria` donde corresponde.
- [ ] Dependencia nueva sin justificar; cambios fuera del alcance de la tarea.
- [ ] Mensaje de error crudo mostrado al usuario en la app.

**Sugerencia**
- [ ] Duplicacion, nombres poco claros, funciones largas.

## Formato del informe (≤15 lineas)
```
Bloqueantes: <n> · Importantes: <n> · Sugerencias: <n>
[Bloqueante] archivo.ts:42 — <problema>. Corregir: <accion>.
```
Si no hay Bloqueantes, empieza diciendo "Sin bloqueantes".
