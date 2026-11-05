# Catálogo de errores

Fuente: DERCAS Anexo B. Formato de respuesta: §10.1.

| Código | HTTP | Cuándo |
| --- | --- | --- |
| DATOS_INVALIDOS | 422 | Algún campo no cumple su validación |
| AUTENTICACION_REQUERIDA | 401 | Falta el token o es inválido |
| TOKEN_VENCIDO | 401 | El token de acceso venció |
| ACCESO_DENEGADO | 403 | El rol no permite la acción |
| NO_ENCONTRADO | 404 | Recurso inexistente o de otra barbería |
| CORREO_REGISTRADO | 409 | Ya existe una cuenta con ese correo |
| CREDENCIALES_INVALIDAS | 401 | Correo o contraseña incorrectos |
| HORARIO_OCUPADO | 409 | El horario ya fue reservado |
| HORARIO_PASADO | 422 | El horario ya pasó |
| ANTICIPACION_INSUFICIENTE | 422 | No cumple la anticipación mínima |
| FECHA_DEMASIADO_LEJANA | 422 | Supera la anticipación máxima |
| FUERA_DE_HORARIO | 422 | Fuera del horario de atención |
| BARBERO_NO_DISPONIBLE | 409 | El barbero tiene un bloqueo o día libre |
| SERVICIO_NO_OFRECIDO | 422 | El barbero no ofrece ese servicio |
| RECURSO_INACTIVO | 409 | Servicio, barbero o barbería desactivados |
| CRUCE_DEL_CLIENTE | 409 | El cliente ya tiene una cita que se solapa |
| LIMITE_DE_CITAS | 409 | El cliente superó el máximo de citas activas |
| CANCELACION_TARDIA | 409 | Pasó el tiempo límite para cancelar |
| TRANSICION_INVALIDA | 409 | La cita no puede cambiar a ese estado |
| BARBERO_CON_CITAS | 409 | El barbero tiene citas futuras sin resolver |
| DEMASIADAS_SOLICITUDES | 429 | Demasiados intentos |
| CONSENTIMIENTO_IA_REQUERIDO | 403 | Falta el consentimiento para usar el asesor |
| LIMITE_IA_ALCANZADO | 429 | Se alcanzó el límite diario de consultas al asesor |
| IA_NO_DISPONIBLE | 503 | El servicio de IA falló o no respondió a tiempo |
| IMAGEN_NO_VALIDA | 422 | La foto no muestra un solo rostro reconocible |
| CITA_NO_COMPLETADA | 409 | Solo se registra el pago de citas completadas |
| PAGO_YA_REGISTRADO | 409 | La cita ya tiene un pago registrado |
| ANTICIPO_VENCIDO | 409 | Venció el plazo para pagar el anticipo |
| FIRMA_INVALIDA | 401 | La notificación de la pasarela no tiene una firma válida |
| INTERNO | 500 | Error interno (mensaje genérico; el detalle solo en logs) |

## Dudas

1. §10.4 define HTTP 400, pero el Anexo B no tiene código para él.
2. §10.4 usa 503 también para la pasarela; el Anexo B solo tiene IA_NO_DISPONIBLE.
3. Sin código en el Anexo B: último propietario activo (CU-20 A3) e invitar un correo no registrado (CU-20 A1).
