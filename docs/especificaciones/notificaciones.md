# Especificación: notificaciones

## Propósito
Registrar el token push del dispositivo y avisar por push al cliente y al barbero cuando una cita se crea o se cancela (D-21).

## Funcionalidades
| Código | Qué debe hacer | Prioridad |
| --- | --- | --- |
| NOT-02 | Avisar por push al cliente y al barbero cuando una cita se crea o se cancela (esta etapa; otros cambios de estado, después) | Debe |
| NOT-03 | Registrar y renovar el token de notificaciones del dispositivo al iniciar sesión, y borrarlo al cerrarla | Debe |

## Reglas aplicables
RN-NOT-A y RN-NOT-B (D-30). Ver docs/reglas.md.

## Modelo
Referencia: DERCAS §9.2 (no tiene esta entidad: se agrega por D-30). Todas las tablas incluyen `creadoEn` y `actualizadoEn` (§9.1).
- DispositivoPush (D-30): id, usuarioId, token (único, hasta 200), plataforma (ANDROID, IOS), activo, ultimoUsoEn. Un token pertenece a un solo usuario: si otro usuario lo registra en el mismo teléfono, la fila pasa a él.

Registro (NOT-03):
- PUT /usuarios/yo/token-push, cuerpo `{ token, plataforma }`; campo extra → DATOS_INVALIDOS. `token` con formato `ExponentPushToken[...]` o `ExpoPushToken[...]`, 1 a 200 caracteres; `plataforma` ANDROID o IOS. Responde 204. Es un upsert por `token`: lo crea o lo reasigna al usuario, con `activo` verdadero y `ultimoUsoEn` ahora. La app lo llama tras iniciar sesión o registrarse y en cada apertura con sesión vigente (el token puede cambiar).
- DELETE /usuarios/yo/token-push, cuerpo `{ token }`. Responde 204; también 204 sin cambios si no existe o es de otro usuario. La app lo llama antes de POST /autenticacion/cerrar-sesion; si falla por red, cierra la sesión igual.
- Máximo 10 dispositivos activos por usuario; al registrar el 11.º se desactiva el de `ultimoUsoEn` más antiguo (D-30) y se borran los inactivos del usuario que superen ese límite.
- Decidido (menor): el upsert reasigna el token a quien lo registra, porque el token de Expo solo vive en el dispositivo; riesgo aceptado.
- Sin permiso de notificaciones en el teléfono, la app no registra nada y sigue funcionando.

Interfaz EnvioNotificaciones (D-21), igual que EnvioCorreo (autenticación):
- Interfaz propia: `enviar(tokens, aviso)`, con `aviso` = `{ titulo, cuerpo, datos }`. Devuelve `{ tokensInvalidos }` (los que Expo responde `DeviceNotRegistered`); el servicio los marca `activo` falso.
- Implementaciones: Expo (Expo Push Service) y en memoria (guarda los avisos para las pruebas y registra en el log). En desarrollo y pruebas se usa la de memoria; sin credenciales de Expo, también.
- Lotes de hasta 100 mensajes por llamada a Expo.
- Los logs nunca incluyen el token; el envío sin esperar atrapa el rechazo de la promesa (`.catch`) y solo registra el error.

Avisos (NOT-02):
- Cita creada (POST /citas y POST /barberias/:id/citas, cualquier estado inicial): aviso al barbero de la cita y, si tiene `clienteId`, al cliente.
- Cita cancelada (PATCH /citas/:id/cancelar y cancelación del sistema por anticipo vencido, RN-34): aviso al cliente y al barbero, excepto a quien canceló (`canceladaPorId`); el sistema no excluye a nadie.
- Destinos: todos los DispositivoPush activos del usuario. El barbero se alcanza por PerfilBarbero → Membresia → Usuario.
- Se envía después de confirmar la transacción de la cita. Un fallo del envío se registra en el log y nunca revierte ni retrasa la respuesta (se llama sin esperar el resultado).
- `datos` = `{ tipo: "CITA_CREADA" | "CITA_CANCELADA", citaId }`; no lleva teléfono, correo ni notas. Texto en español, fecha y hora en la zona horaria de la barbería: "Nueva cita: Corte clásico, mar 3 dic, 10:00" y "Cita cancelada: Corte clásico, mar 3 dic, 10:00".
- Al tocar el aviso, el cliente abre el detalle de la cita con `citaId`; si ya no es accesible, NO_ENCONTRADO. El barbero abre su agenda: el detalle de cita del barbero llega en la etapa 4.

## API
Prefijo /api/v1. Pub = cualquier usuario autenticado.
| Método | Ruta | Rol | Éxito |
| --- | --- | --- | --- |
| PUT | /usuarios/yo/token-push (NOT-03, D-30) | Pub | 204 |
| DELETE | /usuarios/yo/token-push (NOT-03, D-30) | Pub | 204 |

## Errores
DATOS_INVALIDOS, AUTENTICACION_REQUERIDA. Sin errores nuevos: los avisos no devuelven error al cliente. Ver docs/errores.md.

## Pantallas
Tomadas de docs/pantallas.md. No hay pantalla nueva: el permiso y el registro ocurren al iniciar sesión, y el aviso abre una existente.

| Pantalla | Nodo de Figma | Ruta |
| --- | --- | --- |
| Detalle de cita (cliente) | 11:387 | (cliente)/citas/[id] |
| Detalle de cita iniciada o futura (barbero) | 15:903, 15:948 | (barbero)/citas/[id] |
| Perfil (cierra sesión y borra el token) | 11:579, 16:1052 | (cliente)/perfil, (barbero)/perfil |

El permiso de notificaciones no tiene diseño: se usa el diálogo del sistema (Huecos de docs/pantallas.md). El propietario recibe avisos solo si tiene un dispositivo en la app; el panel web no recibe push.

## Criterios de aceptación
- NOT-03: Dado un usuario autenticado, cuando hace PUT /usuarios/yo/token-push con `{ token: "ExponentPushToken[abc]", plataforma: "ANDROID" }`, entonces 204 y existe un DispositivoPush activo; repetirlo no crea otra fila.
- NOT-03: Dado el mismo token registrado por el usuario A, cuando el usuario B lo registra, entonces la fila pasa a B y A ya no recibe avisos en ese dispositivo.
- NOT-03: Dado `{ token: "abc", plataforma: "WEB" }` o un campo extra, cuando se registra, entonces DATOS_INVALIDOS; sin sesión, AUTENTICACION_REQUERIDA.
- NOT-03: Dado un usuario con 10 dispositivos activos, cuando registra un 11.º, entonces el de `ultimoUsoEn` más antiguo queda inactivo.
- NOT-03: Dado un token registrado, cuando hace DELETE con ese token, entonces 204 y no recibe más avisos; con un token ajeno o inexistente, 204 sin cambios.
- NOT-02: Dada una cita nueva de un cliente con cuenta, cuando se crea con POST /citas, entonces EnvioNotificaciones recibe un aviso `CITA_CREADA` para los dispositivos del barbero y otro para los del cliente, con `citaId`.
- NOT-02: Dada una cita manual de un cliente sin cuenta (RES-16), cuando se crea, entonces solo se avisa al barbero.
- NOT-02: Dada una cita cancelada por el cliente, cuando se cancela, entonces el aviso `CITA_CANCELADA` llega al barbero y no al cliente; si cancela el barbero o el propietario, llega al cliente y, si cancela el propietario, también al barbero asignado.
- NOT-02: Dada una cita PENDIENTE cuyo anticipo vence (RN-34), cuando el proceso la cancela, entonces se avisa al cliente y al barbero.
- NOT-02: Dado un usuario sin dispositivos o con EnvioNotificaciones lanzando un error, cuando se crea o cancela una cita, entonces la respuesta es la misma (201 o 200) y la cita queda guardada.
- NOT-02: Dado un token que Expo marca `DeviceNotRegistered`, cuando se envía un aviso, entonces ese DispositivoPush queda `activo` falso.
- NOT-02: Dado un aviso, cuando se inspecta su `datos`, entonces solo tiene `tipo` y `citaId`.

## Pruebas
- Casos PO: §15.1 no asigna ninguno; se verifica con los criterios de aceptación.
- Por regla: aislamiento (un usuario no borra ni lee tokens ajenos); avisos con la implementación en memoria; envío posterior al commit.

## Fuera de alcance
- Recordatorios 24 h y 1 h antes (NOT-01, D-22), lista de espera (NOT-04), "ya toca tu corte" (NOT-05), WhatsApp (NOT-06) y preferencias (NOT-07): etapa 4. Avisos de otros cambios de estado (confirmada, completada, ausente) y push al panel web.

## Dudas
Ninguna abierta. Decidido (D-30, para el PR):
1. Entidad DispositivoPush y endpoints PUT y DELETE /usuarios/yo/token-push: D-30.
2. RN-NOT-A y RN-NOT-B quedan en docs/reglas.md (D-30). Errores nuevos: ninguno.
3. Máximo 10 dispositivos por usuario (D-30); formato de fecha "mar 3 dic": decidido, lo más simple.
4. Cancelación por el propietario: se avisa al cliente y al barbero asignado (D-30).
5. Cita PENDIENTE por anticipo: avisa al crearse como las demás; se revisa en la etapa 5 (D-30).

## Referencias
DERCAS §3.10, §8.7, §9.2, §10.2, §14.4, D-21, D-22, D-29, D-30. Interfaz como EnvioCorreo en docs/especificaciones/autenticacion.md.
