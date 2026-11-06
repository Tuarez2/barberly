# Especificación: autenticacion

## Propósito
Registrar usuarios, gestionar sesiones, perfil e invitaciones, y permitir registrar una barbería.

## Funcionalidades
| Código | Qué debe hacer | Prioridad |
| --- | --- | --- |
| AUT-01 | Registrar usuario con nombre, correo, teléfono y contraseña; rol cliente por defecto; abrir su sesión | Debe |
| AUT-02 | Iniciar sesión con correo y contraseña; devolver token de acceso y de renovación | Debe |
| AUT-03 | Cerrar sesión invalidando el token de renovación del dispositivo y borrando la sesión local | Debe |
| AUT-04 | Renovar el token de acceso con el de renovación, sin pedir la contraseña | Debe |
| AUT-05 | Ver y editar nombre y teléfono; el correo no se cambia en el MVP | Debería |
| AUT-06 | Cambiar la contraseña exigiendo la actual | Debería |
| AUT-07 | Recuperar la contraseña con enlace o código temporal enviado por correo | Podría |
| AUT-08 | Consultar las membresías tras iniciar sesión y mostrar la interfaz del rol | Debe |
| AUT-09 | Elegir la barbería activa si el usuario pertenece a varias | Debería |
| AUT-10 | Registrar una barbería nueva y quedar como su propietario | Debe |

## Reglas aplicables
Ninguna RN: §15.1 traza este módulo a las validaciones de §11.4 (ver Modelo). Ver docs/reglas.md.

## Modelo
Referencia: DERCAS §9.2. Todas las tablas incluyen `creadoEn` y `actualizadoEn` (§9.1).
- Usuario: id, nombre, correo, telefono, claveHash (nunca se expone), activo, consentimientoIaEn.
- TokenRenovacion: id, usuarioId, tokenHash, expiraEn, revocadoEn, dispositivo.
- Membresia: usuarioId y barberiaId (par único), rol (PROPIETARIO, BARBERO), estado (INVITADO, ACTIVO, INACTIVO). El cliente no necesita membresía (§2.3). Al aceptar la invitación se crea PerfilBarbero (CU-20).

Sesiones (§11.4):
- El registro devuelve los mismos tokens que el inicio de sesión.
- Token de acceso: JWT de corta duración (propuesta: 15 minutos) con el identificador del usuario.
- Token de renovación: larga duración (propuesta: 7 a 30 días), guardado como hash y revocable por dispositivo.
- En el teléfono: expo-secure-store. Transporte: solo HTTPS fuera del entorno local de desarrollo.
- Inicio fallido: mensaje genérico; espera temporal tras 5 intentos desde la misma cuenta o IP.

Validaciones de registro (§11.4):
| Campo | Regla |
| --- | --- |
| Nombre | Obligatorio, 2 a 80 caracteres, sin caracteres de control |
| Correo | Obligatorio, formato válido, único, guardado en minúsculas |
| Teléfono | Obligatorio, 7 a 15 dígitos, formato ecuatoriano aceptado (09XXXXXXXX o +5939XXXXXXXX), normalizado al guardar |
| Contraseña | Mínimo 8 caracteres, al menos una letra y un número, máximo 72 |

## API
Prefijo /api/v1. Pública = sin sesión; Pub = cualquier usuario autenticado.
| Método | Ruta | Rol | Éxito |
| --- | --- | --- | --- |
| POST | /autenticacion/registro | Pública | 201 |
| POST | /autenticacion/iniciar-sesion | Pública | 200 |
| POST | /autenticacion/renovar | Pública | 200 |
| POST | /autenticacion/cerrar-sesion | Pub | 204 |
| GET | /usuarios/yo | Pub | 200 |
| PATCH | /usuarios/yo | Pub | 200 |
| PATCH | /usuarios/yo/clave | Pub | 204 |
| GET | /invitaciones/mias | Pub | 200 |
| PATCH | /invitaciones/:id | Pub | 200 |
| POST | /barberias (AUT-10; §10.2 Administración) | Pub | 201 |

## Errores
DATOS_INVALIDOS, AUTENTICACION_REQUERIDA, TOKEN_VENCIDO, CORREO_REGISTRADO, CREDENCIALES_INVALIDAS, DEMASIADAS_SOLICITUDES, NO_ENCONTRADO. Ver docs/errores.md.

## Criterios de aceptación
- HU-AUT-01: Dado un correo nuevo y datos válidos, cuando se registra, entonces la cuenta se crea, recibe los tokens y entra a la app.
- HU-AUT-01: Dado un correo ya registrado, cuando se registra, entonces ve un error claro y no se crea otra cuenta.
- HU-AUT-01: Dada una contraseña de menos de 8 caracteres, cuando se registra, entonces ve qué requisito falta.
- HU-AUT-02: Dadas credenciales correctas, cuando inicia sesión, entonces entra a la pantalla de su rol.
- HU-AUT-02: Dada una sesión vigente, cuando reabre la app, entonces sigue dentro.
- HU-AUT-02: Dado un token de renovación revocado, cuando se renueva la sesión, entonces se le pide iniciar sesión.
- HU-AUT-03: Dado un usuario autenticado con nombre, dirección y teléfono, cuando registra la barbería, entonces queda como propietario.
- HU-AUT-03: Dada una barbería sin servicios y horarios configurados, cuando se consulta el listado público, entonces no aparece.

## Pruebas
- Casos PO: §15.1 no asigna ninguno; se verifica con aceptación, RNF-04 y RNF-06.
- Por regla: sin RN; una prueba por cada validación de §11.4, incluidos sus límites.

## Fuera de alcance
- Invitar y gestionar personal (ADM-04), consentimiento del asesor (RN-28) y publicación de barberías (ADM-13).

## Referencias
DERCAS §2.3, §2.5, §3.1, §5.2, §5.3 (CU-20), §6, §9.1, §9.2, §10.1, §10.2, §11.1, §11.4, §14.2, §15.1, Anexo B.

## Dudas
1. AUT-07 no tiene ruta ni entidad para el código temporal; §14.2 (n.º 10) sigue abierta.
2. Token de renovación vencido o revocado: sin código definido; TOKEN_VENCIDO solo cubre el de acceso.
3. Sin valor fijo: duración del token de renovación (7 a 30 días), espera tras 5 intentos y límite de registro (SEG-09).
4. No se define cómo se identifica `dispositivo` al iniciar o cerrar sesión.
5. AUT-06 con contraseña actual incorrecta e inicio con `activo` falso: sin código definido.
6. Rechazar una invitación: no se define el estado final (§9.2 solo tiene INVITADO, ACTIVO, INACTIVO).
7. ADM-13 cita una "regla de publicación" sin definirla; HU-AUT-03 pide servicios y horarios, CU-07 añade un barbero.
