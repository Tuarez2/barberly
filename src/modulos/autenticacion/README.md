# Módulo autenticacion

Registro, sesiones, perfil e invitaciones. Especificación: `docs/especificaciones/autenticacion.md`.

## Endpoints

| Método | Ruta                           | Rol     | Éxito | Errores                                                                | Tarea |
| ------ | ------------------------------ | ------- | ----- | ---------------------------------------------------------------------- | ----- |
| POST   | /api/v1/autenticacion/registro | Pública | 201   | DATOS_INVALIDOS 422, CORREO_REGISTRADO 409, DEMASIADAS_SOLICITUDES 429 | T1.5  |

### POST /autenticacion/registro (AUT-01, HU-AUT-01)

Cuerpo (D-14), sin campos extra:

```json
{
  "nombre": "Ana Pérez",
  "correo": "ana@correo.ec",
  "telefono": "0991234567",
  "clave": "Barberly2026",
  "dispositivo": "Pixel 7"
}
```

Respuesta 201, la misma que tendrá iniciar sesión:

```json
{
  "datos": {
    "usuario": {
      "id": "…",
      "nombre": "Ana Pérez",
      "correo": "ana@correo.ec",
      "telefono": "+593991234567"
    },
    "tokenAcceso": "…",
    "tokenRenovacion": "…"
  }
}
```

- Validación en `esquemaRegistro` de `src/compartido/contrato.ts` (§11.4): la app y el panel usan la misma.
- El correo se guarda en minúsculas; el teléfono `09XXXXXXXX` se guarda como `+5939XXXXXXXX`.
- La contraseña se guarda con bcrypt de costo 12, fijo (SEG-06, §14.3).
- El token de acceso es un JWT HS256 de `TOKEN_ACCESO_MINUTOS` (15) con el id del usuario en `sub`.
- El token de renovación es opaco, de `TOKEN_RENOVACION_DIAS` (30); en `TokenRenovacion` solo queda su SHA-256. Cada registro abre una sesión con el `dispositivo` recibido (D-04).
- Límite: `REGISTRO_LIMITE_POR_HORA` (5) solicitudes por IP, también las rechazadas (D-03, D-14). Está en `src/compartido/limites.ts`, en memoria. La IP del cliente sale de `PROXIES_CONFIABLES` (D-15): en producción va en 1, o todos los clientes comparten la IP del proxy.
- Rol cliente por defecto: el usuario nace sin membresías.

## Pruebas

`autenticacion.prueba.ts`: criterios de HU-AUT-01, cada validación de §11.4 con sus límites, el registro simultáneo con el mismo correo, el límite por IP y la IP detrás de un proxy (D-15). Bruno: `bruno/autenticacion/`.
