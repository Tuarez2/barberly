# Módulo autenticacion

Registro, sesiones, perfil e invitaciones. Especificación: `docs/especificaciones/autenticacion.md`.

## Endpoints

| Método | Ruta                                    | Rol     | Éxito | Errores                                                                                                                     | Tarea |
| ------ | --------------------------------------- | ------- | ----- | --------------------------------------------------------------------------------------------------------------------------- | ----- |
| POST   | /api/v1/autenticacion/registro          | Pública | 201   | DATOS_INVALIDOS 422, CORREO_REGISTRADO 409, DEMASIADAS_SOLICITUDES 429                                                      | T1.5  |
| POST   | /api/v1/autenticacion/iniciar-sesion    | Pública | 200   | DATOS_INVALIDOS 422, CREDENCIALES_INVALIDAS 401, DEMASIADAS_SOLICITUDES 429                                                 | T1.6  |
| POST   | /api/v1/autenticacion/renovar           | Pública | 200   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401                                                                            | T1.7  |
| POST   | /api/v1/autenticacion/cerrar-sesion     | Pub     | 204   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401                                                         | T1.7  |
| GET    | /api/v1/usuarios/yo                     | Pub     | 200   | AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401                                                                              | T1.8  |
| PATCH  | /api/v1/usuarios/yo                     | Pub     | 200   | DATOS_INVALIDOS 422, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401                                                         | T1.13 |
| PATCH  | /api/v1/usuarios/yo/clave               | Pub     | 204   | DATOS_INVALIDOS 422, CREDENCIALES_INVALIDAS 401, AUTENTICACION_REQUERIDA 401, TOKEN_VENCIDO 401, DEMASIADAS_SOLICITUDES 429 | T1.13 |
| POST   | /api/v1/autenticacion/recuperar-clave   | Pública | 202   | DATOS_INVALIDOS 422, DEMASIADAS_SOLICITUDES 429                                                                             | T1.15 |
| POST   | /api/v1/autenticacion/restablecer-clave | Pública | 204   | DATOS_INVALIDOS 422, CODIGO_INVALIDO 422, DEMASIADAS_SOLICITUDES 429                                                        | T1.15 |

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

### GET /usuarios/yo (AUT-08, D-18)

Exige el token de acceso. Responde:

```json
{
  "datos": {
    "id": "…",
    "nombre": "Ana Pérez",
    "correo": "ana@correo.ec",
    "telefono": "+593991234567",
    "consentimientoIaEn": null,
    "membresias": [
      {
        "id": "…",
        "rol": "BARBERO",
        "barberoId": "…",
        "barberia": { "id": "…", "nombre": "Barberia Centro" }
      }
    ]
  }
}
```

- Solo membresías ACTIVO de barberías activas, ordenadas por el nombre de la barbería. Las INVITADO van por `/invitaciones/mias`; un cliente recibe la lista vacía.
- `barberoId` es el PerfilBarbero (§10.1), solo con rol BARBERO; si no, `null`. `consentimientoIaEn` es la fecha del consentimiento del asesor (RN-28) o `null`.
- La app elige la interfaz del rol con esta lista y el panel muestra Sin acceso si no hay ninguna PROPIETARIO (D-10).

### PATCH /usuarios/yo (AUT-05)

Exige el token de acceso. Cuerpo `{ "nombre"?, "telefono"? }` con al menos uno; responde 200 con `{ "datos": { "id", "nombre", "correo", "telefono" } }`, la misma forma que `usuario` en la sesión.

- Validación en `esquemaEdicionPerfil` de `src/compartido/contrato.ts`, con `esquemaNombre` y `esquemaTelefono` del registro: misma normalización (D-14).
- `{}`, sin cuerpo o con un campo extra responde DATOS_INVALIDOS y no aplica nada. El correo no cambia en el MVP: enviarlo es un campo extra.
- Solo edita al usuario del token.

### PATCH /usuarios/yo/clave (AUT-06, D-05)

Exige el token de acceso. Cuerpo `{ "claveActual": "…", "claveNueva": "…" }`; responde 204.

- `claveActual` solo se exige no vacía y de máximo 72 (como en iniciar sesión); `claveNueva`, con las reglas de Contraseña del registro (`esquemaCambioClave` del contrato). Un 422 no gasta intentos.
- Actual incorrecta: `CREDENCIALES_INVALIDAS` 401; la app no cierra la sesión. La nueva se guarda con bcrypt de costo 12 y no se revocan las demás sesiones.
- Límite (D-16): `limitarCambioClave` en `src/compartido/limites.ts`, en memoria y con la configuración del inicio de sesión. Un contador por usuario (no por token ni IP), donde solo cuentan los 401. Al llegar a `INICIO_INTENTOS_MAXIMOS` (5) fallos dentro de `INICIO_ESPERA_MINUTOS` (15) desde el primero, todo intento responde 429 hasta que se cierra la ventana, aunque la actual sea correcta. Un cambio correcto no reinicia el contador.

### POST /autenticacion/recuperar-clave (AUT-07, D-01)

Pública. Cuerpo `{ "correo": "ana@correo.ec" }`, sin campos extra. Responde siempre 202 `{ "datos": { "mensaje": "…" } }` con el mismo texto, exista o no el correo y esté activa o no la cuenta.

- Con una cuenta activa, en una transacción (con la fila del usuario bloqueada) marca como usados los códigos vigentes y crea uno de 6 dígitos (`randomInt`) con `codigoHash` en bcrypt de costo 12, `expiraEn` a 15 minutos e `intentos` 0. Después lo envía por `EnvioCorreo`, sin esperar la respuesta del proveedor.
- Si la cuenta no existe o está inactiva no crea ni envía nada, pero calcula igual el hash: ni la respuesta ni el tiempo la delatan.
- Límite por hora, contando todos los pedidos: `RECUPERACION_LIMITE_POR_IP` (5) antes de validar y `RECUPERACION_LIMITE_POR_CORREO` (3) con el correo normalizado. Están en `src/compartido/limites.ts`, en memoria.
- `EnvioCorreo` (`src/compartido/envio-correo.ts`): interfaz con `enviarCodigoRecuperacion(correo, codigo)`. La implementación por defecto solo escribe en el log, con el código fuera de producción y sin el código ni el correo en producción. Las pruebas la reemplazan con `fijarEnvioCorreo` y `restaurarEnvioCorreo`, como el reloj.

### POST /autenticacion/restablecer-clave (AUT-07, D-01)

Pública. Cuerpo `{ "correo": "…", "codigo": "123456", "claveNueva": "…" }`; `codigo` de exactamente 6 dígitos y `claveNueva` con las reglas del registro. Un 422 de validación no gasta intentos. Responde 204.

- Se evalúa el último código del usuario sin `usadoEn`. `CODIGO_INVALIDO` 422, siempre con el mismo mensaje, si el correo no existe, la cuenta está inactiva, no hay código, venció, ya se usó, tiene 5 intentos o no coincide. Sin cuenta o sin código se compara igual contra un hash de relleno.
- Un código erróneo suma un intento de forma atómica solo si `intentos` es menor que 5: nunca pasa de 5, tampoco con solicitudes simultáneas.
- Con el correcto, en una transacción: marca `usadoEn` solo si el código sigue disponible y vigente (de dos restablecimientos simultáneos solo uno da 204), guarda la nueva `claveHash` y revoca todos los TokenRenovacion del usuario. No abre sesión.
- Límite (D-15): `RESTABLECIMIENTO_LIMITE_POR_IP` (10) solicitudes por IP por hora, antes de validar y contando todas, también las rechazadas (DATOS_INVALIDOS o CODIGO_INVALIDO). La siguiente responde `DEMASIADAS_SOLICITUDES` 429 sin gastar el código ni sumar un intento. Está en `src/compartido/limites.ts`, en memoria.

## Middlewares compartidos (D-18)

- `autenticar`: además del JWT, consulta el usuario; si no existe o está inactivo responde `AUTENTICACION_REQUERIDA` 401 (D-05). Desactivar una cuenta corta el acceso de inmediato.
- `contextoBarberia`: toma la barbería del parámetro `:id` de la ruta y exige una membresía ACTIVO del usuario en una barbería activa. Cualquier otro caso (id que no es UUID, barbería inexistente o inactiva, otra barbería, INVITADO o INACTIVO) responde `NO_ENCONTRADO` 404. Llena `req.contextoBarberia` con `{ barberiaId, rol }` para `exigirRol`, con el id de la base aunque la URL lo traiga en mayúsculas. Solo sirve en rutas `/barberias/:id/...` (con `mergeParams` si el router se monta ahí) y sin otro `:id` hijo; un recurso con la barbería en su fila, como `PATCH /citas/:id`, necesita su propia verificación.
- Orden en una ruta interna: `autenticar` → `contextoBarberia` → `exigirRol` → `validar` → servicio.

## Pruebas

`autenticacion.prueba.ts`: criterios de HU-AUT-01 y HU-AUT-02 (lo que toca a la API), cada validación de §11.4 con sus límites, el registro simultáneo con el mismo correo, el límite por IP, la IP detrás de un proxy (D-15), el límite de inicios fallidos por cuenta, por IP y en el tiempo (D-16), la rotación, la carrera entre renovaciones y el cierre de sesión (D-17), y el perfil con sus membresías (D-18). `perfil.prueba.ts`: editar el perfil (AUT-05) y cambiar la contraseña con su límite por usuario (AUT-06, D-16). `recuperar-clave.prueba.ts`: recuperar y restablecer la contraseña, los límites por correo y por IP, los intentos y el uso único con solicitudes simultáneas (AUT-07, D-01). Los middlewares se prueban en `src/compartido/middleware/middleware.prueba.ts`, también con la otra barbería. Bruno: `bruno/autenticacion/` y `bruno/usuarios/`.
