# Módulo autenticacion

Registro, sesiones, perfil e invitaciones. Especificación: `docs/especificaciones/autenticacion.md`.

## Endpoints

| Método | Ruta                                 | Rol     | Éxito | Errores                                                                     | Tarea |
| ------ | ------------------------------------ | ------- | ----- | --------------------------------------------------------------------------- | ----- |
| POST   | /api/v1/autenticacion/registro       | Pública | 201   | DATOS_INVALIDOS 422, CORREO_REGISTRADO 409, DEMASIADAS_SOLICITUDES 429      | T1.5  |
| POST   | /api/v1/autenticacion/iniciar-sesion | Pública | 200   | DATOS_INVALIDOS 422, CREDENCIALES_INVALIDAS 401, DEMASIADAS_SOLICITUDES 429 | T1.6  |
| POST   | /api/v1/autenticacion/renovar        | Pública | 200   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401                            | T1.7  |
| POST   | /api/v1/autenticacion/cerrar-sesion  | Pub     | 204   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401         | T1.7  |

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

### POST /autenticacion/iniciar-sesion (AUT-02, HU-AUT-02)

Cuerpo (D-16), sin campos extra: `{ "correo": "ana@correo.ec", "clave": "Barberly2026", "dispositivo": "Pixel 7" }`. Responde 200 con la misma forma que el registro.

- La clave solo se exige no vacía y de máximo 72 caracteres: las reglas del registro no se aplican aquí.
- Correo inexistente, clave incorrecta o cuenta inactiva responden el mismo `CREDENCIALES_INVALIDAS` (§11.4, D-05). Si el correo no existe, la clave se compara contra un hash de relleno para que el tiempo no lo delate.
- Cada inicio abre su propia sesión en `TokenRenovacion` (D-04).
- Límite (SEG-09, D-03, D-16): un contador por IP y otro por correo normalizado, en `src/compartido/limites.ts`. Solo cuentan los 401. Al llegar a `INICIO_INTENTOS_MAXIMOS` (5) dentro de `INICIO_ESPERA_MINUTOS` (15) desde el primer fallo, todo intento responde 429 hasta que se cierra la ventana, aunque la clave sea correcta. Un inicio correcto no reinicia el contador.

### POST /autenticacion/renovar (AUT-04, HU-AUT-02)

Cuerpo (D-17): `{ "tokenRenovacion": "…" }`. Responde 200 con `{ "datos": { "tokenAcceso": "…", "tokenRenovacion": "…" } }`, sin el usuario.

- Rota la sesión en una transacción (D-03): revoca la fila enviada solo si sigue vigente y crea otra con el mismo `dispositivo` y `TOKEN_RENOVACION_DIAS` (30) desde la renovación.
- De dos renovaciones simultáneas con el mismo token solo una gana: la segunda espera el bloqueo de la fila y ya no la encuentra vigente.
- Vencido, revocado, inexistente o de un usuario inactivo: `AUTENTICACION_REQUERIDA` 401, sin distinguir (D-02, D-05). La app borra la sesión local y pide iniciar sesión; por eso debe hacer una sola renovación a la vez y no borrar la sesión ante un error de red o un 500 (ver la especificación).
- No hay detección de reutilización de un token revocado en el MVP (D-17).

### POST /autenticacion/cerrar-sesion (AUT-03)

Exige `Authorization: Bearer <token de acceso>` y el cuerpo `{ "tokenRenovacion": "…" }`. Responde 204.

- Revoca solo esa sesión y solo si es del usuario autenticado (D-04, D-17).
- Si ya estaba revocada, no existe o es de otro usuario, también responde 204 sin cambiar nada: repetir el cierre no falla y no revela de quién es un token.
- El token de acceso sigue valiendo hasta que vence (15 minutos); la app lo borra al cerrar sesión.

## Pruebas

`autenticacion.prueba.ts`: criterios de HU-AUT-01 y HU-AUT-02 (lo que toca a la API), cada validación de §11.4 con sus límites, el registro simultáneo con el mismo correo, el límite por IP, la IP detrás de un proxy (D-15), el límite de inicios fallidos por cuenta, por IP y en el tiempo (D-16), y la rotación, la carrera entre renovaciones y el cierre de sesión (D-17). Bruno: `bruno/autenticacion/`.
