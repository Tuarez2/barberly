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
- Los límites por IP usan la IP del cliente según PROXIES_CONFIABLES (D-15).
- Usuario con `activo` falso: CREDENCIALES_INVALIDAS al iniciar sesión y AUTENTICACION_REQUERIDA al renovar o al usar su token de acceso, sin revelar que la cuenta existe (D-05).
- Cambiar la contraseña (AUT-06) con la actual incorrecta: CREDENCIALES_INVALIDAS (401); la app no cierra la sesión por este código (D-05).

Validaciones de registro (§11.4):
| Campo | Regla |
| --- | --- |
| Nombre | Obligatorio, 2 a 80 caracteres, sin caracteres de control |
| Correo | Obligatorio, formato válido, único, guardado en minúsculas |
| Teléfono | Obligatorio, 7 a 15 dígitos, formato ecuatoriano aceptado (09XXXXXXXX o +5939XXXXXXXX), normalizado al guardar |
| Contraseña | Mínimo 8 caracteres, al menos una letra y un número, máximo 72 |

Cuerpos (D-14):
- Registro: `{ nombre, correo, telefono, clave, dispositivo? }`; un campo extra responde DATOS_INVALIDOS.
- Registro e inicio de sesión responden `{ datos: { usuario: { id, nombre, correo, telefono }, tokenAcceso, tokenRenovacion } }`.
- Teléfono: se quitan espacios, guiones, puntos y paréntesis; 09XXXXXXXX se guarda como +5939XXXXXXXX, y cualquier otro número de 7 a 15 dígitos (con + opcional) se guarda tal cual.
- Contraseña: los 72 caracteres tampoco pueden pasar de 72 bytes en UTF-8, el límite de bcrypt.
- El límite de registro cuenta todas las solicitudes de la IP, también las rechazadas.

Inicio de sesión (D-16):
- Cuerpo `{ correo, clave, dispositivo? }`; la clave solo se exige no vacía y de máximo 72 caracteres. Responde 200 con la forma del registro.
- Solo cuenta como fallo CREDENCIALES_INVALIDAS. Hay un contador por IP y otro por correo, con ventana de 15 minutos desde el primer fallo; al quinto fallo, todo intento responde DEMASIADAS_SOLICITUDES hasta que se cierra, aunque la clave sea correcta. Un inicio correcto no reinicia el contador.
- Si el correo no existe, la clave se compara igual contra un hash de relleno.

Renovar y cerrar sesión (D-17):
- Renovar: `{ tokenRenovacion }` responde 200 `{ datos: { tokenAcceso, tokenRenovacion } }`. Revoca la fila anterior solo si sigue vigente y crea otra con el mismo `dispositivo` y 30 días desde la renovación; de dos renovaciones simultáneas solo una gana.
- Cerrar sesión: con el token de acceso y `{ tokenRenovacion }`, revoca esa fila si es del usuario y responde 204; también 204, sin cambios, si ya estaba revocada, no existe o es de otro usuario.
- No hay detección de reutilización de un token revocado en el MVP.
- Cliente (T1.10 y el panel): una sola renovación a la vez; las solicitudes que reciben TOKEN_VENCIDO mientras tanto esperan esa renovación. Solo AUTENTICACION_REQUERIDA borra la sesión local; un error de red o un 500 no la borra.

Perfil y membresías (D-18):
- GET /usuarios/yo: `{ datos: { id, nombre, correo, telefono, consentimientoIaEn, membresias: [{ id, rol, barberoId, barberia: { id, nombre } }] } }`. Solo membresías ACTIVO de barberías activas, por nombre de barbería; `barberoId` es el PerfilBarbero o null.
- `contextoBarberia`: barbería del parámetro `:id`, con membresía ACTIVO en una barbería activa; si no, NO_ENCONTRADO 404 (también con un id que no es UUID).
- `autenticar`: un usuario inexistente o inactivo responde AUTENTICACION_REQUERIDA 401 aunque su token sea válido (D-05).

Registrar barbería, POST /barberias (AUT-10, D-13, D-07):
- Cuerpo `{ nombre, direccion, telefono, descripcion? }`; campo extra → DATOS_INVALIDOS. `nombre` 3 a 80; `direccion` 3 a 200; `telefono` con la validación y normalización de Usuario; `descripcion` hasta 500 (vacía se guarda null); ninguno con caracteres de control. Reglas y zona horaria quedan en sus valores por defecto; se editan con PATCH /barberias/:id (ADM).
- En una sola transacción crea Barberia (`activo` verdadero, `publicada` falso: D-07) y Membresia del usuario autenticado con rol PROPIETARIO y estado ACTIVO. Un usuario puede registrar varias barberías; sin límite ni unicidad de nombre.
- 201 `{ datos: { id, nombre, descripcion, direccion, telefono, publicada, activo, membresia: { id, rol, estado } } }`. La barbería no aparece en el listado público (GET /barberias) hasta cumplir D-07.
- Errores: DATOS_INVALIDOS, AUTENTICACION_REQUERIDA. El cliente vuelve a pedir GET /usuarios/yo para ver la membresía nueva.

Editar perfil, PATCH /usuarios/yo (AUT-05):
- Cuerpo `{ nombre?, telefono? }` con al menos uno; vacío o con un campo extra (también `correo`, que no cambia en el MVP) → DATOS_INVALIDOS. Mismas validaciones y normalización del registro. Responde 200 `{ datos: { id, nombre, correo, telefono } }`.

Cambiar contraseña, PATCH /usuarios/yo/clave (AUT-06, D-05):
- Cuerpo `{ claveActual, claveNueva }`; `claveActual` no vacía y de máximo 72; `claveNueva` con las reglas de Contraseña del registro. Responde 204.
- Actual incorrecta: CREDENCIALES_INVALIDAS 401 (la app no cierra la sesión). Al quinto fallo de un usuario en 15 minutos, DEMASIADAS_SOLICITUDES hasta cerrarse la ventana (mismo mecanismo en memoria y configuración de D-16, contador por usuarioId). No revoca las demás sesiones.

Recuperar contraseña (AUT-07, D-01):
- POST /autenticacion/recuperar-clave: cuerpo `{ correo }` (formato inválido → DATOS_INVALIDOS). Responde siempre 202 `{ datos: { mensaje } }` con el mismo texto exista o no el correo, esté activa o no la cuenta.
- Si el usuario existe y está activo: en una transacción marca como usados (`usadoEn`) los códigos vigentes y crea uno de 6 dígitos (generador criptográfico) con `codigoHash` (bcryptjs), `expiraEn` a 15 minutos e `intentos` 0; después lo envía con EnvioCorreo. Si no existe o está inactivo, no crea ni envía nada.
- Límite: 3 solicitudes por correo normalizado y 5 por IP (D-15) por hora, contando todas las solicitudes (existan o no); la siguiente responde DEMASIADAS_SOLICITUDES 429. Valores en la configuración Zod.
- POST /autenticacion/restablecer-clave: cuerpo `{ correo, codigo, claveNueva }`; `codigo` exactamente 6 dígitos; `claveNueva` con las reglas del registro; campo extra o formato inválido → DATOS_INVALIDOS (no gasta un intento). Responde 204. Errores: DATOS_INVALIDOS, CODIGO_INVALIDO, DEMASIADAS_SOLICITUDES.
- Límite propio: 10 solicitudes por IP por hora (IP según PROXIES_CONFIABLES, D-15), contando todas, también las rechazadas; la siguiente responde DEMASIADAS_SOLICITUDES 429. Valor en la configuración Zod.
- Se evalúa el último código del usuario sin `usadoEn`. CODIGO_INVALIDO 422, con el mismo mensaje, si el correo no existe o está inactivo, no hay código, venció, ya se usó, tiene 5 intentos o el código no coincide. Un código incorrecto suma un intento (atómico, solo si `intentos` < 5); el quinto fallo lo deja inutilizable. Con usuario inexistente se compara igual contra un hash de relleno.
- Con el código correcto, en una transacción: `usadoEn` ahora, nueva `claveHash` y revocación de todos los TokenRenovacion del usuario. No abre sesión: la app lleva a iniciar sesión.
- EnvioCorreo (interfaz propia): `enviarCodigoRecuperacion(correo, codigo)`. En desarrollo y pruebas la implementación solo registra en el log; no hay implementación real en E1.C.

Barbería activa (AUT-09): no hay endpoint nuevo ni estado en la API. GET /usuarios/yo ya entrega las membresías ACTIVO (D-18) y `contextoBarberia` verifica la barbería por el `:id` de cada ruta, por lo que la API no guarda "barbería activa". La app (solo cliente y barbero) y el panel eligen y recuerdan localmente la membresía activa (id de membresía, en expo-secure-store; en el panel, localStorage): con una sola se selecciona sola; con varias se ofrece Cambiar de barbería o rol; si la guardada ya no aparece tras volver a pedir /usuarios/yo, se usa la primera por nombre o el rol cliente. Las rutas con `:id` usan el `barberiaId` de la elegida.

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
| Perfil del propietario (panel web, D-10) | 19:1482 | /perfil |
| Editar perfil | 11:667 | (cliente)/perfil/editar |
| Cambiar contraseña | 11:693 | (cliente)/perfil/clave |
| Invitaciones | 22:1871 | (cliente)/perfil/invitaciones |
| Cambiar de barbería o rol | 22:1886 | (cliente)/perfil/cambiar-rol |
| Registrar barbería (panel web, D-13) | 22:1922 | /registrar-barberia |

Editar perfil, Cambiar contraseña, Invitaciones y Cambiar de barbería o rol se reutilizan en (barbero) (§10.5). El propietario entra por el panel web, que tiene su propio inicio de sesión, registro, elección de barbería y perfil (D-10, D-12, D-13; rutas en docs/pantallas.md); en la app ve un aviso para ir al panel. Recuperar la contraseña (D-01) no tiene diseño: ver Huecos en docs/pantallas.md.

## Criterios de aceptación
- HU-AUT-01: Dado un correo nuevo y datos válidos, cuando se registra, entonces la cuenta se crea, recibe los tokens y entra a la app.
- HU-AUT-01: Dado un correo ya registrado, cuando se registra, entonces ve un error claro y no se crea otra cuenta.
- HU-AUT-01: Dada una contraseña de menos de 8 caracteres, cuando se registra, entonces ve qué requisito falta.
- HU-AUT-02: Dadas credenciales correctas, cuando inicia sesión, entonces entra a la pantalla de su rol.
- HU-AUT-02: Dada una sesión vigente, cuando reabre la app, entonces sigue dentro.
- HU-AUT-02: Dado un token de renovación revocado, cuando se renueva la sesión, entonces se le pide iniciar sesión.
- HU-AUT-02: Dado un propietario, cuando inicia sesión en la app, entonces entra como cliente, o como barbero si tiene esa membresía, y ve el aviso para usar el panel web (D-10).
- HU-AUT-02: Dado un usuario sin membresía PROPIETARIO activa, cuando inicia sesión en el panel web, entonces ve Sin acceso y no llega a ninguna pantalla de administración (D-10).
- HU-AUT-03: Dado un usuario autenticado con nombre, dirección y teléfono, cuando registra la barbería, entonces queda como propietario.
- HU-AUT-03: Dada una barbería recién registrada, sin servicios, horarios ni barberos, cuando se consulta el listado público, entonces no aparece (D-07).
- HU-AUT-03: Dado un usuario autenticado y `{ nombre: "Corte Fino", direccion: "Av. Amazonas 123", telefono: "0991234567" }`, cuando hace POST /barberias, entonces 201 con `publicada` falso, telefono `+593991234567` y una Membresia PROPIETARIO ACTIVO; GET /usuarios/yo la incluye.
- HU-AUT-03: Dado `nombre` de 2 caracteres, `direccion` ausente o un campo extra, cuando hace POST /barberias, entonces DATOS_INVALIDOS y no se crea barbería ni membresía; sin token, AUTENTICACION_REQUERIDA.
- AUT-05: Dado `{ telefono: "099 123 4567" }`, cuando hace PATCH /usuarios/yo, entonces 200 con el teléfono normalizado y el nombre intacto; con `{ correo: "otro@x.com" }` o `{}`, DATOS_INVALIDOS.
- AUT-06: Dada la clave actual correcta y una nueva de 8 caracteres con letra y número, cuando cambia, entonces 204 y puede iniciar sesión con la nueva; con la actual incorrecta, CREDENCIALES_INVALIDAS y la clave no cambia; con la nueva de 7 caracteres, DATOS_INVALIDOS.
- AUT-06: Dados 5 fallos de la clave actual en 15 minutos, cuando intenta de nuevo (aunque sea correcta), entonces DEMASIADAS_SOLICITUDES.
- AUT-07: Dado un correo registrado o no, cuando pide recuperar-clave, entonces 202 con la misma respuesta; solo si existe se crea un código y se llama a EnvioCorreo; el 4.º pedido de la hora para el mismo correo recibe DEMASIADAS_SOLICITUDES.
- AUT-07: Dado un código nuevo, cuando se pide otro, entonces el primero responde CODIGO_INVALIDO.
- AUT-07: Dado un código vigente y correcto, cuando restablece con una clave válida, entonces 204, la clave nueva sirve para iniciar sesión, la vieja no y todos sus tokens de renovación quedan revocados; reusar el código responde CODIGO_INVALIDO.
- AUT-07: Dado un código vigente, cuando se envían 5 códigos erróneos, entonces cada uno responde CODIGO_INVALIDO y el correcto después también; un código de hace 16 minutos responde CODIGO_INVALIDO.
- AUT-07: Dadas 10 solicitudes a restablecer-clave desde una IP en una hora (válidas o no), cuando llega la 11.ª, entonces DEMASIADAS_SOLICITUDES 429.
- AUT-09: Dado un usuario con membresías ACTIVO en dos barberías, cuando consulta /usuarios/yo, entonces ve ambas por nombre y la app o el panel elige una; con una sola, se elige sola; ante una barbería ajena en la ruta, NO_ENCONTRADO.

## Pruebas
- Casos PO: §15.1 no asigna ninguno; se verifica con aceptación, RNF-04 y RNF-06.
- Por regla: sin RN; una prueba por cada validación de §11.4, incluidos sus límites.

## Fuera de alcance
- Invitar y gestionar personal (ADM-04), consentimiento del asesor (RN-28) y publicación de barberías (ADM-13). Regla de publicación, que aplica la Fase 2: barbería activa con al menos un servicio activo, un día con HorarioAtencion y un barbero ACTIVO que ofrezca un servicio activo; al registrarla nace sin publicar (D-07).

## Referencias
DERCAS §2.3, §2.5, §3.1, §5.2, §5.3 (CU-20), §6, §9.1, §9.2, §10.1, §10.2, §11.1, §11.4, §14.2, §15.1, Anexo B.

