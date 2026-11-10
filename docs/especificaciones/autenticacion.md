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
| AUT-07 | Recuperar la contraseña con un código temporal de 6 dígitos enviado por correo (D-01) | Podría |
| AUT-08 | Consultar las membresías tras iniciar sesión y mostrar la interfaz del rol | Debe |
| AUT-09 | Elegir la barbería activa si el usuario pertenece a varias | Debería |
| AUT-10 | Registrar una barbería nueva y quedar como su propietario | Debe |

## Reglas aplicables
Ninguna RN: §15.1 traza este módulo a las validaciones de §11.4 (ver Modelo). Ver docs/reglas.md.

## Modelo
Referencia: DERCAS §9.2. Todas las tablas incluyen `creadoEn` y `actualizadoEn` (§9.1).
- Usuario: id, nombre, correo, telefono, claveHash (nunca se expone), activo, consentimientoIaEn.
- TokenRenovacion: id, usuarioId, tokenHash, expiraEn, revocadoEn, dispositivo. Cada fila es una sesión: cada inicio o registro crea una, y cerrar sesión recibe el token de renovación y revoca solo esa fila. `dispositivo` es texto opcional (máximo 100) que envía la app, solo informativo (D-04).
- CodigoRecuperacion (D-01): id, usuarioId, codigoHash, expiraEn (15 minutos), usadoEn, intentos. Pedir uno nuevo invalida el anterior; restablecer la clave revoca todos los TokenRenovacion del usuario. El correo sale por la interfaz EnvioCorreo; en desarrollo y pruebas solo se registra en el log.
- Membresia: usuarioId y barberiaId (par único), rol (PROPIETARIO, BARBERO), estado (INVITADO, ACTIVO, INACTIVO). El cliente no necesita membresía (§2.3). Al aceptar la invitación se crea PerfilBarbero (CU-20). Al rechazarla pasa a INACTIVO; solo se responde una membresía en INVITADO, y reinvitar devuelve esa misma fila a INVITADO (D-06).

Sesiones (§11.4):
- El registro devuelve los mismos tokens que el inicio de sesión.
- Token de acceso: JWT de 15 minutos con el identificador del usuario (D-03).
- Token de renovación: 30 días, guardado como hash y revocable por dispositivo; se rota en cada renovación y el anterior queda revocado (D-03).
- Renovar con un token vencido, revocado o inexistente responde AUTENTICACION_REQUERIDA (401) sin distinguir la causa; TOKEN_VENCIDO es solo para el token de acceso (D-02).
- En el teléfono: expo-secure-store. Transporte: solo HTTPS fuera del entorno local de desarrollo.
- Inicio fallido: mensaje genérico; tras 5 intentos fallidos desde la misma cuenta o IP, espera de 15 minutos con DEMASIADAS_SOLICITUDES (D-03).
- Registro: máximo 5 por IP por hora, con DEMASIADAS_SOLICITUDES (D-03).
- Las duraciones y límites van en la configuración validada con Zod (D-03).
- Usuario con `activo` falso: CREDENCIALES_INVALIDAS al iniciar sesión y AUTENTICACION_REQUERIDA al renovar o al usar su token de acceso, sin revelar que la cuenta existe (D-05).
- Cambiar la contraseña (AUT-06) con la actual incorrecta: CREDENCIALES_INVALIDAS (401); la app no cierra la sesión por este código (D-05).

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
| POST | /autenticacion/recuperar-clave (D-01; responde igual exista o no el correo) | Pública | 202 |
| POST | /autenticacion/restablecer-clave (D-01) | Pública | 204 |
| GET | /usuarios/yo | Pub | 200 |
| PATCH | /usuarios/yo | Pub | 200 |
| PATCH | /usuarios/yo/clave | Pub | 204 |
| GET | /invitaciones/mias | Pub | 200 |
| PATCH | /invitaciones/:id | Pub | 200 |
| POST | /barberias (AUT-10; §10.2 Administración) | Pub | 201 |

## Errores
DATOS_INVALIDOS, AUTENTICACION_REQUERIDA, TOKEN_VENCIDO, CORREO_REGISTRADO, CREDENCIALES_INVALIDAS, CODIGO_INVALIDO (D-01), DEMASIADAS_SOLICITUDES, NO_ENCONTRADO. Ver docs/errores.md.

## Pantallas
Tomadas de docs/pantallas.md. Las variantes son estados de la misma ruta.

| Pantalla | Nodo de Figma | Ruta |
| --- | --- | --- |
| Bienvenida | 14:626 | (autenticacion)/bienvenida |
| Inicio de sesión (credenciales inválidas 13:581, demasiados intentos 13:609) | 13:555 | (autenticacion)/iniciar-sesion |
| Registro (con errores 13:671) | 13:637 | (autenticacion)/registro |
| Perfil del cliente | 11:579 | (cliente)/perfil |
| Perfil del barbero | 16:1052 | (barbero)/perfil |
| Perfil del propietario | 19:1482 | (propietario)/perfil |
| Editar perfil | 11:667 | (cliente)/perfil/editar |
| Cambiar contraseña | 11:693 | (cliente)/perfil/clave |
| Invitaciones | 22:1871 | (cliente)/perfil/invitaciones |
| Cambiar de barbería o rol | 22:1886 | (cliente)/perfil/cambiar-rol |
| Registrar barbería | 22:1922 | (cliente)/registrar-barberia |

Editar perfil, Cambiar contraseña, Invitaciones y Cambiar de barbería o rol se reutilizan en (barbero) y (propietario) (§10.5). Recuperar la contraseña (D-01) no tiene diseño: ver Huecos en docs/pantallas.md.

## Criterios de aceptación
- HU-AUT-01: Dado un correo nuevo y datos válidos, cuando se registra, entonces la cuenta se crea, recibe los tokens y entra a la app.
- HU-AUT-01: Dado un correo ya registrado, cuando se registra, entonces ve un error claro y no se crea otra cuenta.
- HU-AUT-01: Dada una contraseña de menos de 8 caracteres, cuando se registra, entonces ve qué requisito falta.
- HU-AUT-02: Dadas credenciales correctas, cuando inicia sesión, entonces entra a la pantalla de su rol.
- HU-AUT-02: Dada una sesión vigente, cuando reabre la app, entonces sigue dentro.
- HU-AUT-02: Dado un token de renovación revocado, cuando se renueva la sesión, entonces se le pide iniciar sesión.
- HU-AUT-03: Dado un usuario autenticado con nombre, dirección y teléfono, cuando registra la barbería, entonces queda como propietario.
- HU-AUT-03: Dada una barbería recién registrada, sin servicios, horarios ni barberos, cuando se consulta el listado público, entonces no aparece (D-07).

## Pruebas
- Casos PO: §15.1 no asigna ninguno; se verifica con aceptación, RNF-04 y RNF-06.
- Por regla: sin RN; una prueba por cada validación de §11.4, incluidos sus límites.

## Fuera de alcance
- Invitar y gestionar personal (ADM-04), consentimiento del asesor (RN-28) y publicación de barberías (ADM-13). Regla de publicación, que aplica la Fase 2: barbería activa con al menos un servicio activo, un día con HorarioAtencion y un barbero ACTIVO que ofrezca un servicio activo; al registrarla nace sin publicar (D-07).

## Referencias
DERCAS §2.3, §2.5, §3.1, §5.2, §5.3 (CU-20), §6, §9.1, §9.2, §10.1, §10.2, §11.1, §11.4, §14.2, §15.1, Anexo B.

