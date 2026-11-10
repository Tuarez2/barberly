# Reglas de negocio

Fuente: DERCAS §4. El backend las aplica siempre. "propuesta" = valor configurable. Error "—" = el DERCAS no asocia un código.

## Reserva (§4.1)

| Código | Regla | Error |
| --- | --- | --- |
| RN-01 | Una cita tiene exactamente un cliente, una barbería, un barbero, un servicio, una fecha y una hora de inicio. | — |
| RN-02 | La hora de fin es inicio + duración del servicio al reservar, y se guarda en la cita. | — |
| RN-03 | El precio del servicio se copia a la cita al reservar (precio congelado). | — |
| RN-04 | Barbero sin citas activas solapadas: hay solape si inicio_A < fin_B e inicio_B < fin_A; terminar y empezar a las 10:00 no solapa. | HORARIO_OCUPADO |
| RN-05 | La cita cae completamente dentro del horario de atención de la barbería y del horario laboral del barbero ese día. | FUERA_DE_HORARIO |
| RN-06 | No se reserva en el pasado; se exige anticipación mínima (propuesta: 30 minutos), configurable por barbería. | HORARIO_PASADO, ANTICIPACION_INSUFICIENTE |
| RN-07 | La anticipación máxima de reserva está limitada (propuesta: 30 días). | FECHA_DEMASIADO_LEJANA |
| RN-08 | Un cliente no tiene dos citas activas solapadas, aunque sean en barberías distintas. | CRUCE_DEL_CLIENTE |
| RN-09 | Un cliente tiene como máximo `Barberia.maxCitasActivas` citas futuras activas por barbería (1 a 10, por defecto 3) (D-09). | LIMITE_DE_CITAS |
| RN-10 | Los horarios se ofrecen en bloques de 15 minutos y la duración de un servicio es múltiplo de 15. | — |
| RN-11 | Si dos clientes reservan el mismo horario a la vez, solo uno tiene éxito; el otro recibe error. | HORARIO_OCUPADO |

## Confirmación y cancelación (§4.2)

| Código | Regla | Error |
| --- | --- | --- |
| RN-12 | Reserva válida se confirma automáticamente; si la barbería exige anticipo, nace pendiente y se confirma al aprobarse el pago (RN-34). | — |
| RN-13 | El cliente cancela hasta un límite antes del inicio (propuesta: 2 horas, `minutosMinCancelacion` = 120), configurable; pasado el límite debe contactar a la barbería. | CANCELACION_TARDIA |
| RN-14 | El barbero y el propietario cancelan en cualquier momento antes del inicio, indicando un motivo. | — |
| RN-15 | Una cita cancelada libera el horario de inmediato. | — |
| RN-16 | Una cita cancelada, completada o ausente no cambia más de estado. | TRANSICION_INVALIDA |
| RN-17 | Toda cancelación guarda quién, cuándo y el motivo (opcional para el cliente, obligatorio para el personal). | DATOS_INVALIDOS |

## Estados operativos (§4.3)

| Código | Regla | Error |
| --- | --- | --- |
| RN-18 | Solo el barbero asignado o el propietario marcan una cita como completada o ausencia. | ACCESO_DENEGADO |
| RN-19 | Completada o ausencia solo desde la hora de inicio en adelante. | — |
| RN-20 | Cita confirmada sin marcar 24 horas después de su fin se muestra al barbero como pendiente de cierre; no cambia sola de estado. | — |

## Servicios, horarios y personal (§4.4)

| Código | Regla | Error |
| --- | --- | --- |
| RN-21 | Un servicio con citas futuras no se elimina: se desactiva; las citas conservan precio y duración. | — |
| RN-22 | El precio es positivo con dos decimales; la duración es múltiplo de 15 entre 15 y 240 minutos. | DATOS_INVALIDOS |
| RN-23 | Un barbero solo ofrece los servicios que el propietario le asignó. | SERVICIO_NO_OFRECIDO |
| RN-24 | Cambiar el horario de atención no cancela citas; si una queda fuera, el sistema avisa al propietario con la lista. | — |
| RN-25 | No se quita a un barbero con citas futuras sin reasignarlas o cancelarlas antes. | BARBERO_CON_CITAS |
| RN-26 | Un día libre o bloqueo impide nuevas reservas pero no elimina las existentes. | BARBERO_NO_DISPONIBLE |

## Asesor de estilo (§4.5)

| Código | Regla | Error |
| --- | --- | --- |
| RN-27 | La foto del rostro se procesa en memoria y se descarta; solo se guarda la recomendación. | — |
| RN-28 | Antes de la primera consulta hay consentimiento explícito; se guarda su fecha (`consentimientoIaEn`) y puede retirarse. | CONSENTIMIENTO_IA_REQUERIDO |
| RN-29 | Cada cliente tiene un límite de consultas diarias (propuesta: 5), configurable en el servidor. | LIMITE_IA_ALCANZADO |
| RN-30 | Solo recomienda servicios activos de la barbería elegida (máximo 3); si ninguno encaja, lo indica y sugiere consultar al barbero. | — |
| RN-31 | Una cita admite como máximo una foto de referencia; una segunda reemplaza a la anterior, que se elimina, y la foto se elimina al llegar a un estado final. | — |

## Pagos y estadísticas (§4.6)

| Código | Regla | Error |
| --- | --- | --- |
| RN-32 | Solo una cita completada tiene pago registrado, a lo sumo uno (`FINAL`); monto sugerido = precio congelado − anticipo; si se cambia, exige motivo (`motivoAjuste`). | TRANSICION_INVALIDA, PAGO_YA_REGISTRADO, DATOS_INVALIDOS |
| RN-33 | Métodos registrables: efectivo, transferencia y DeUna; el anticipo en línea se cobra con tarjeta en la pasarela. | DATOS_INVALIDOS |
| RN-34 | Con anticipo nace pendiente y ocupa el horario; solo el pago aprobado confirma; sin pago en 15 minutos (`anticipoVenceEn`) se cancela sola y libera el horario. | ANTICIPO_VENCIDO |
| RN-35 | Anticipo: se devuelve si el cliente cancela en plazo (RN-13) o cancela la barbería; si cancela tarde o no llega, lo conserva la barbería. | — |
| RN-36 | El anticipo pagado se descuenta del pago final. | — |
| RN-37 | Los ingresos de las estadísticas se calculan con pagos registrados y anticipos conservados, no con el precio de las citas. | — |
| RN-38 | Las estadísticas solo incluyen datos de la barbería del propietario y se calculan en su zona horaria. | NO_ENCONTRADO |

## Precisiones (§4.7)

| Código | Regla | Error |
| --- | --- | --- |
| RN-13 | Exactamente en el límite se permite: inicio − ahora ≥ tiempo mínimo de cancelación; con menos tiempo, error. | CANCELACION_TARDIA |
| RN-04 | Cita que termina justo cuando empieza otra no se solapa: intervalo semiabierto [inicio, fin). | — |
| RN-34 | La pendiente vencida la libera un proceso programado; disponibilidad también ignora pendientes con anticipoVenceEn vencido, sin esperarlo. | — |

## Transiciones de estado (§4.8)

Estados: PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA, AUSENTE. Los tres últimos son finales (RN-16).

| Desde | Hacia | Quién | Condición | Regla |
| --- | --- | --- | --- | --- |
| (creación) | CONFIRMADA | Sistema | Reserva válida sin anticipo | RN-12 |
| (creación) | PENDIENTE | Sistema | Reserva válida con anticipo activo | RN-12, RN-34 |
| PENDIENTE | CONFIRMADA | Sistema | Webhook con pago aprobado | RN-34 |
| PENDIENTE | CANCELADA | Sistema | Pasan 15 minutos sin pago | RN-34 |
| PENDIENTE o CONFIRMADA | CANCELADA | Cliente | Dentro del plazo de cancelación | RN-13 |
| PENDIENTE o CONFIRMADA | CANCELADA | Barbero o propietario | Antes del inicio, con motivo | RN-14, RN-17 |
| CONFIRMADA | COMPLETADA | Barbero asignado o propietario | Desde la hora de inicio | RN-18, RN-19 |
| CONFIRMADA | AUSENTE | Barbero asignado o propietario | Desde la hora de inicio | RN-18, RN-19 |
| COMPLETADA, CANCELADA o AUSENTE | cualquiera | Nadie | Estado final: TRANSICION_INVALIDA | RN-16 |

## Dudas

1. RN-10: §8.5 no valida un inicio fuera del bloque de 15 minutos; no hay código definido.
2. RN-14: sin código para el personal que cancela desde la hora de inicio.
3. RN-18: barbero no asignado de la misma barbería: no se define si es 403 o 404.
4. RN-19: sin código para marcar antes de la hora de inicio.
