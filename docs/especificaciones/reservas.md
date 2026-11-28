# Especificación: reservas

## Propósito
Calcular disponibilidad, crear citas sin doble reserva y que el cliente las consulte y cancele (rebanada T3.2 a T3.5).

## Funcionalidades
| Código | Qué debe hacer | Prioridad |
| --- | --- | --- |
| RES-01, RES-02 | Un servicio por cita; barbero específico o "Cualquiera disponible" | Debe |
| RES-03 | Días del calendario con horario libre (`disponibilidad/dias`) | Debe |
| RES-04 | Horarios libres de una fecha, barbero y servicio | Debe |
| RES-05 | Resumen previo: lo arma la app con datos ya consultados; sin endpoint propio | Debe |
| RES-06 | Crear la cita validando RN-01 a RN-12; CONFIRMADA (PENDIENTE con anticipo) | Debe |
| RES-07, RES-08 | Mis citas: futuras activas y historial filtrable por estado | Debe |
| RES-09 | Detalle de la cita con estado y motivo de cancelación | Debe |
| RES-10 | El cliente cancela dentro del plazo | Debe |
| RES-12 | Notas del cliente, máximo 200 caracteres | Debería |

## Reglas aplicables
RN-01 a RN-13, RN-15, RN-16, RN-17 (cliente), RN-26 (en disponibilidad y creación). Ver docs/reglas.md. Valores de `Barberia` (§9.2): `minutosMinAnticipacion` 30, `diasMaxAnticipacion` 30, `minutosMinCancelacion` 120, `maxCitasActivas` 3 (D-09).

## Modelo
Referencia: DERCAS §9.2 (Cita, Barberia, HorarioAtencion, Bloqueo). Todas las tablas incluyen `creadoEn` y `actualizadoEn`.
- Cita: id, barberiaId, clienteId, perfilBarberoId, servicioId, iniciaEn, terminaEn, precioReserva, duracionReserva, estado, notas, canceladaPorId, canceladaEn, motivoCancelacion, claveIdempotencia (única por cliente), anticipoVenceEn. Restricción `ex_citas_barbero_sin_cruce` (D-19).
- Estados (§4.8). Aquí: creación → CONFIRMADA (RN-12); creación → PENDIENTE con `anticipoVenceEn` = ahora + 15 min si `anticipoActivo` (la confirmación por pago es de la etapa 5); PENDIENTE o CONFIRMADA → CANCELADA por el cliente si `inicio − ahora ≥ minutosMinCancelacion` (RN-13, exacto en el límite). CANCELADA, COMPLETADA y AUSENTE son finales: TRANSICION_INVALIDA (RN-16).
- Disponibilidad: algoritmo de la skill `disponibilidad-horarios` (§8.6); `ahora` viene de `reloj.ahora()`; fechas locales según `Barberia.zonaHoraria`, respuesta en ISO 8601 UTC.

Contratos (prefijo /api/v1; usuario autenticado con cualquier rol: el cliente no necesita membresía, §2.3). Una barbería inexistente, inactiva o no publicada responde NO_ENCONTRADO para todos, también para sus miembros (la excepción de D-32 es solo para ver el detalle en busqueda). Un `servicioId` o `barberoId` inexistente o de otra barbería responde NO_ENCONTRADO, antes que SERVICIO_NO_OFRECIDO.
- GET /barberias/:id/disponibilidad `?servicioId&barberoId?&fecha=AAAA-MM-DD` → 200 `{ datos: { fecha, horarios: [{ iniciaEn }] } }` (D1), ascendentes en UTC, sin repetir con Cualquiera disponible y sin barbero asignado. Fecha pasada o fuera de `diasMaxAnticipacion`: lista vacía. Servicio o barbero de otra barbería o inexistente: NO_ENCONTRADO; barbero de la barbería que no ofrece el servicio: SERVICIO_NO_OFRECIDO; servicio o barbero inactivos: RECURSO_INACTIVO; parámetros mal formados: DATOS_INVALIDOS.
- GET /barberias/:id/disponibilidad/dias `?servicioId&barberoId?&desde&hasta` → 200 `{ datos: [{ fecha, disponible }] }`, un elemento por día del rango. Más de 31 días o `desde` > `hasta`: DATOS_INVALIDOS. Mismos errores que el anterior.
- POST /citas: cuerpo `{ barberiaId, servicioId, barberoId?, iniciaEn, notas?, claveIdempotencia (UUID) }`; campo extra → DATOS_INVALIDOS. `iniciaEn` ISO UTC en bloque de 15 minutos (D6). Sin `barberoId` = Cualquiera disponible (CU-07 A3). 201 `{ datos: <cita> }`; la cita trae el barbero asignado. Sigue el orden de §8.5 y la skill `reservas-concurrencia` (bloqueo FOR UPDATE, cancelar PENDIENTE vencidas, revalidar, insertar con `terminaEn`, `precioReserva`, `duracionReserva` copiados). Idempotencia (D2): primero se busca por (`clienteId`, `claveIdempotencia`); si existe, 200 con esa cita sin revalidar. Si el insert falla con P2002 del índice único de idempotencia, se relee la cita y se responde 200; esto es distinto de la violación de `ex_citas_barbero_sin_cruce`, que da HORARIO_OCUPADO.
- GET /citas/mias `?estado?&desde?&hasta?&pagina&limite`: `estado` admite varios separados por coma; `desde` y `hasta` filtran `iniciaEn` (ISO UTC); `limite` máximo 50 (mayor: DATOS_INVALIDOS). Solo citas del cliente. 200 `{ datos: [<cita resumida>], meta }`. Orden `iniciaEn` ascendente si todos los estados pedidos son PENDIENTE o CONFIRMADA; si no, descendente (D3). Próximas = `estado=PENDIENTE,CONFIRMADA&desde=<ahora>`; historial = `estado=COMPLETADA,CANCELADA,AUSENTE`.
- GET /citas/:id → 200 `{ datos: <cita> }`; cita de otro usuario o inexistente: NO_ENCONTRADO (sin revelar que existe). En esta rebanada solo el cliente dueño; B y P llegan en la etapa 4.
- PATCH /citas/:id/cancelar: cuerpo `{ motivo? }` (máximo 200, sin caracteres de control; vacío = null). Orden: propiedad (NO_ENCONTRADO), estado no final (TRANSICION_INVALIDA), plazo (CANCELACION_TARDIA con el teléfono de la barbería en `detalles`). Se cancela con una sola actualización condicionada (`id`, `clienteId` y estado PENDIENTE o CONFIRMADA); si no actualiza filas, se relee la cita para dar el error correcto (NO_ENCONTRADO o TRANSICION_INVALIDA). Un solo registro de auditoría y un solo aviso aunque haya solicitudes simultáneas. Guarda `canceladaPorId`, `canceladaEn`, `motivoCancelacion`; libera el horario al instante. 200 `{ datos: <cita> }`.
- `<cita>`: `{ id, estado, iniciaEn, terminaEn, duracionReserva, precioReserva, notas, anticipoVenceEn, barberia: { id, nombre, direccion, telefono }, servicio: { id, nombre }, barbero: { id, nombreVisible, urlFoto }, canceladaEn, motivoCancelacion, puedeCancelar }` (D4). La resumida omite `notas`, `direccion` y los datos de cancelación. Dinero como texto decimal.
- Auditar creación y cancelación (CU-07, RN-17). El orden de validación de §8.5 da el código ante varios fallos.

## API
| Método | Ruta | Rol | Éxito |
| --- | --- | --- | --- |
| GET | /barberias/:id/disponibilidad | Pub | 200 |
| GET | /barberias/:id/disponibilidad/dias | Pub | 200 |
| POST | /citas | Pub (cualquier usuario autenticado, D-31) | 201 |
| GET | /citas/mias | C | 200 |
| GET | /citas/:id | C (B, P: etapa 4) | 200 |
| PATCH | /citas/:id/cancelar | C (B, P: etapa 4) | 200 |

## Errores
DATOS_INVALIDOS, AUTENTICACION_REQUERIDA, NO_ENCONTRADO, RECURSO_INACTIVO, SERVICIO_NO_OFRECIDO, HORARIO_PASADO, ANTICIPACION_INSUFICIENTE, FECHA_DEMASIADO_LEJANA, FUERA_DE_HORARIO, BARBERO_NO_DISPONIBLE, HORARIO_OCUPADO, CRUCE_DEL_CLIENTE, LIMITE_DE_CITAS, CANCELACION_TARDIA, TRANSICION_INVALIDA. Ver docs/errores.md. Sin errores nuevos.

## Pantallas
Tomadas de docs/pantallas.md. Las variantes son estados de la misma ruta.

| Pantalla | Nodo de Figma | Ruta |
| --- | --- | --- |
| Reserva 1 Servicio | 9:56 | (cliente)/barberias/[id]/reserva/servicio |
| Reserva 2 Barbero | 9:108 | (cliente)/barberias/[id]/reserva/barbero |
| Reserva 3 Fecha y hora (horario ocupado 22:1589) | 9:160 | (cliente)/barberias/[id]/reserva/fecha-hora |
| Reserva 4 Resumen | 9:298 | (cliente)/barberias/[id]/reserva/resumen |
| Reserva exitosa | 9:351 | (cliente)/barberias/[id]/reserva/exito |
| Mis citas Próximas (vacío 22:1565) / Historial | 10:339 / 10:396 | (cliente)/citas |
| Detalle de cita (cancelar 11:440, fuera de plazo 11:485, cancelada 11:531) | 11:387 | (cliente)/citas/[id] |

## Criterios de aceptación
Cada criterio debe poder escribirse como una prueba, con valores concretos.
- PO-01 (HU-RES-01): Dado un servicio de 30 min y el barbero libre mañana 10:00 local, cuando POST /citas con ese `iniciaEn`, entonces 201 CONFIRMADA, `terminaEn` 10:30, `precioReserva` y `duracionReserva` copiados.
- PO-02, RN-11: Dada una cita 10:00–10:30 del barbero, cuando otro cliente reserva 10:15 (o 10:00), entonces HORARIO_OCUPADO 409 y queda una sola cita.
- PO-03, RN-04: Dada una cita que termina a las 10:00, cuando se reserva a las 10:00, entonces 201, y GET /disponibilidad ofrece las 10:00.
- PO-04: Dado el pasado, un inicio fuera del horario y un día con Bloqueo, cuando se reserva, entonces HORARIO_PASADO, FUERA_DE_HORARIO y BARBERO_NO_DISPONIBLE; con inicio en ahora + 29 min, ANTICIPACION_INSUFICIENTE; a ahora + 30 min, 201; a 31 días, FECHA_DEMASIADO_LEJANA.
- PO-05: Dadas 20 solicitudes simultáneas al mismo barbero y horario, cuando se procesan, entonces una devuelve 201, 19 HORARIO_OCUPADO y hay una sola cita.
- RES-06: Dado `claveIdempotencia` repetida por el mismo cliente, cuando reintenta, entonces recibe la misma cita y no se crea otra.
- RN-08, RN-09: Dado un cliente con una cita 10:00–10:30 en otra barbería, cuando reserva 10:15, entonces CRUCE_DEL_CLIENTE; con 3 citas futuras activas en la barbería, la cuarta es LIMITE_DE_CITAS; con `maxCitasActivas` 2, la tercera.
- CU-07 A3: Dados dos barberos libres y uno con más citas ese día, cuando reserva sin `barberoId`, entonces se asigna el de menos citas (empate: menor `id`) y la respuesta trae su `barbero`.
- SEG-02: Dado un `servicioId` o `barberoId` de otra barbería o inexistente, cuando GET /disponibilidad o POST /citas, entonces NO_ENCONTRADO 404 (no SERVICIO_NO_OFRECIDO); una barbería inactiva o no publicada también da NO_ENCONTRADO, incluso a sus miembros.
- RN-23, RN-26: Dado un barbero de la barbería sin ese servicio, entonces SERVICIO_NO_OFRECIDO; con un Bloqueo de toda la barbería, no hay horarios y `dias` marca `disponible` falso.
- RN-34: Dada una PENDIENTE con `anticipoVenceEn` pasado, cuando se consulta la disponibilidad o se reserva ese horario, entonces está libre y la PENDIENTE queda CANCELADA ("Anticipo vencido", canceladaPorId nulo).
- RES-07, RES-08: Dado un cliente con citas CONFIRMADA, CANCELADA y COMPLETADA, cuando pide `estado=PENDIENTE,CONFIRMADA`, entonces solo ve las activas por fecha ascendente; nunca citas ajenas.
- PO-08, RN-13: Dado `minutosMinCancelacion` 120, cuando cancela con inicio en 2 h exactas, entonces 200 CANCELADA con motivo, quién y cuándo, y el horario se puede reservar; con 119 min, CANCELACION_TARDIA y sigue CONFIRMADA.
- PO-09, RN-16: Dada una cita CANCELADA, cuando se cancela de nuevo, entonces TRANSICION_INVALIDA.
- PO-06: Dada la cita de otro cliente o de otra barbería, cuando GET o PATCH cancelar, entonces NO_ENCONTRADO; sin token, AUTENTICACION_REQUERIDA.
- RES-09: Dada una cita cancelada, cuando GET /citas/:id, entonces trae `motivoCancelacion` y `canceladaEn`.

## Pruebas
- Casos PO: PO-01 a PO-05, PO-06 (citas), PO-08, PO-09; más reintento con la misma clave, horario cancelado que se vuelve a tomar y PENDIENTE vencida (§12.2). RNF-01 en disponibilidad.
- Por regla: casos límite de la skill `disponibilidad-horarios`; una prueba por código del orden de §8.5; zona horaria (cita 20:00 locales cuenta en su fecha local).

## Fuera de alcance
- Acciones de barbero y propietario (cancelar con motivo, agenda, estado, reasignar, cita manual RES-16): etapa 4. Foto de referencia (RES-14), asesor (RES-13), reprogramar (RES-11) y cobro del anticipo (RES-15, etapa 5). Recordatorios (NOT).

## Dudas
Menores (Decidido, se anota en el PR):
- D1: forma de GET /disponibilidad (no definida en el DERCAS): la propuesta del contrato arriba.
- D2: respuesta ante una `claveIdempotencia` (UUID) repetida: 200 con la cita existente, aunque el cuerpo difiera; ver el contrato de POST /citas.
- D3: orden y filtros de Mis citas no definidos: lo propuesto arriba.
- D4: `puedeCancelar` (inicio − ahora ≥ minutosMinCancelacion y estado activo) y el teléfono de la barbería los necesitan las pantallas 11:485 y 11:440; no están en §10.
- D5: `diaSemana` 0 = domingo (Luxon `weekday` % 7); bloques de 15 min en horas de reloj (:00, :15, :30, :45); `diasMaxAnticipacion` por fecha local (hoy local + N días).
- D6: inicio fuera del bloque de 15 minutos: DATOS_INVALIDOS (ya en docs/reglas.md Dudas 1). BARBERO_NO_DISPONIBLE también cubre el cierre de toda la barbería.
- D7: reservar o consultar disponibilidad de una barbería inactiva o no publicada: NO_ENCONTRADO para todos, miembros incluidos (la excepción de D-32 es solo para ver el detalle). Con `anticipoActivo` verdadero la cita nace PENDIENTE; antes de la etapa 5 nadie puede activarlo.
Ninguna abierta. Decidido (para el PR):
- N1 (D-31): un barbero sin HorarioAtencion propio ese día no trabaja ese día (RN-05); no hereda el horario general.
- N2 (D-31): un barbero o propietario puede reservar como cliente en su misma barbería, sin restricción adicional.

## Referencias
DERCAS §3.3, §4.1, §4.2, §4.7, §4.8, §8.5, §8.6, §9.2, §10.1, §10.2, §12.2, CU-07, CU-09; decisiones D-09, D-19, D-31.
