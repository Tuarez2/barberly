# Módulo autenticacion

Registro, sesiones, perfil e invitaciones. Especificación: `docs/especificaciones/autenticacion.md`.

## Endpoints

| Método | Ruta                                 | Rol     | Éxito | Errores                                                                     | Tarea |
| ------ | ------------------------------------ | ------- | ----- | --------------------------------------------------------------------------- | ----- |
| POST   | /api/v1/autenticacion/registro       | Pública | 201   | DATOS_INVALIDOS 422, CORREO_REGISTRADO 409, DEMASIADAS_SOLICITUDES 429      | T1.5  |
| POST   | /api/v1/autenticacion/iniciar-sesion | Pública | 200   | DATOS_INVALIDOS 422, CREDENCIALES_INVALIDAS 401, DEMASIADAS_SOLICITUDES 429 | T1.6  |

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

## Pruebas

`autenticacion.prueba.ts`: criterios de HU-AUT-01 y HU-AUT-02 (lo que toca a la API), cada validación de §11.4 con sus límites, el registro simultáneo con el mismo correo, el límite por IP, la IP detrás de un proxy (D-15) y el límite de inicios fallidos por cuenta, por IP y en el tiempo (D-16). Bruno: `bruno/autenticacion/`.
