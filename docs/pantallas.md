# Pantallas de Barberly

Mapa entre el prototipo de Figma, las rutas de Expo Router y la API. Archivo: https://www.figma.com/design/r8GKmXYO7AVhJBvdBqq992 (fileKey `r8GKmXYO7AVhJBvdBqq992`).
Para ver una pantalla: herramienta de Figma `get_design_context` o `get_screenshot` con el nodo indicado.
Las variantes ("con errores", "vacío", "(hoja)"...) son estados de la misma ruta, no rutas nuevas.
Las rutas son relativas a la carpeta de Expo Router y los endpoints van bajo `/api/v1` (DERCAS §10.2). Una ruta repetida entre grupos (`citas/[id]`, `perfil`) se enlaza siempre con su grupo en el `href`.
Las pantallas comunes de §10.5 (Editar perfil, Cambiar contraseña, Invitaciones, Cambiar de barbería o rol) figuran en `(cliente)` y se reutilizan en `(barbero)` y `(propietario)`.

## Acceso

| Pantalla | Nodo | Ruta Expo Router | Endpoints |
| --- | --- | --- | --- |
| Inicio de sesión | 13:555 | `(autenticacion)/iniciar-sesion` | `POST /autenticacion/iniciar-sesion` |
| Inicio de sesión credenciales inválidas | 13:581 | `(autenticacion)/iniciar-sesion` | `POST /autenticacion/iniciar-sesion` |
| Inicio de sesión demasiados intentos | 13:609 | `(autenticacion)/iniciar-sesion` | `POST /autenticacion/iniciar-sesion` |
| Registro | 13:637 | `(autenticacion)/registro` | `POST /autenticacion/registro` |
| Registro con errores | 13:671 | `(autenticacion)/registro` | `POST /autenticacion/registro` |
| Bienvenida | 14:626 | `(autenticacion)/bienvenida` | — |

## Cliente

| Pantalla | Nodo | Ruta Expo Router | Endpoints |
| --- | --- | --- | --- |
| Explorar | 4:8 | `(cliente)/explorar` | `GET /barberias` |
| Reserva 1 Servicio | 9:56 | `(cliente)/barberias/[id]/reserva/servicio` | `GET /barberias/:id/servicios` |
| Reserva 2 Barbero | 9:108 | `(cliente)/barberias/[id]/reserva/barbero` | `GET /barberias/:id/barberos` |
| Reserva 3 Fecha y hora | 9:160 | `(cliente)/barberias/[id]/reserva/fecha-hora` | `GET /barberias/:id/disponibilidad/dias`, `GET /barberias/:id/disponibilidad` |
| Reserva 4 Resumen | 9:298 | `(cliente)/barberias/[id]/reserva/resumen` | `POST /citas`, `PUT /citas/:id/foto-referencia` |
| Reserva exitosa | 9:351 | `(cliente)/barberias/[id]/reserva/exito` | `PUT /citas/:id/foto-referencia` (Reintentar) |
| Detalle de barbería | 10:240 | `(cliente)/barberias/[id]` | `GET /barberias/:id`, `GET /barberias/:id/servicios`, `GET /barberias/:id/barberos` |
| Mis citas Próximas | 10:339 | `(cliente)/citas` | `GET /citas/mias` |
| Mis citas Historial | 10:396 | `(cliente)/citas` | `GET /citas/mias` |
| Descubre tu estilo | 10:472 | `(cliente)/barberias/[id]/asesor` | `PUT /usuarios/yo/consentimiento-ia`, `POST /barberias/:id/asesor-estilo` |
| Recomendaciones | 10:503 | `(cliente)/barberias/[id]/asesor/recomendaciones` | Resultado de `POST /barberias/:id/asesor-estilo` |
| Detalle de cita | 11:387 | `(cliente)/citas/[id]` | `GET /citas/:id`, `PUT` y `DELETE /citas/:id/foto-referencia` |
| Cancelar cita (hoja) | 11:440 | `(cliente)/citas/[id]` | `PATCH /citas/:id/cancelar` |
| Detalle de cita fuera de plazo | 11:485 | `(cliente)/citas/[id]` | `GET /citas/:id` |
| Detalle de cita cancelada | 11:531 | `(cliente)/citas/[id]` | `GET /citas/:id` |
| Perfil | 11:579 | `(cliente)/perfil` | `GET /usuarios/yo`, `POST /autenticacion/cerrar-sesion` |
| Editar perfil | 11:667 | `(cliente)/perfil/editar` | `PATCH /usuarios/yo` |
| Cambiar contraseña | 11:693 | `(cliente)/perfil/clave` | `PATCH /usuarios/yo/clave` |
| Pago del anticipo | 11:714 | `(cliente)/citas/[id]/anticipo` | `POST /citas/:id/anticipo` |
| Anticipo vencido | 11:754 | `(cliente)/citas/[id]/anticipo` | `GET /citas/:id` |
| Explorar sin resultados | 22:1517 | `(cliente)/explorar` | `GET /barberias` |
| Mis citas vacío | 22:1565 | `(cliente)/citas` | `GET /citas/mias` |
| Reserva 3 horario ocupado | 22:1589 | `(cliente)/barberias/[id]/reserva/fecha-hora` | `GET /barberias/:id/disponibilidad/dias`, `GET /barberias/:id/disponibilidad` |
| Asesor analizando | 22:1728 | `(cliente)/barberias/[id]/asesor` | `POST /barberias/:id/asesor-estilo` |
| Asesor foto no válida | 22:1735 | `(cliente)/barberias/[id]/asesor` | `POST /barberias/:id/asesor-estilo` |
| Asesor límite alcanzado | 22:1764 | `(cliente)/barberias/[id]/asesor` | `POST /barberias/:id/asesor-estilo` |
| Asesor sin coincidencias | 22:1778 | `(cliente)/barberias/[id]/asesor` | `POST /barberias/:id/asesor-estilo` |
| Asesor no disponible | 22:1792 | `(cliente)/barberias/[id]/asesor` | `POST /barberias/:id/asesor-estilo` |
| Historial de recomendaciones | 22:1806 | `(cliente)/perfil/recomendaciones` | `GET /consultas-estilo/mias` |
| Retirar consentimiento (hoja) | 22:1829 | `(cliente)/perfil` | `PUT /usuarios/yo/consentimiento-ia` |
| Invitaciones | 22:1871 | `(cliente)/perfil/invitaciones` | `GET /invitaciones/mias`, `PATCH /invitaciones/:id` |
| Cambiar de barbería o rol | 22:1886 | `(cliente)/perfil/cambiar-rol` | `GET /usuarios/yo` |
| Registrar barbería | 22:1922 | `(cliente)/registrar-barberia` | `POST /barberias` |

## Barbero

| Pantalla | Nodo | Ruta Expo Router | Endpoints |
| --- | --- | --- | --- |
| Hoy | 15:665 | `(barbero)/hoy` | `GET /barberias/:id/agenda` |
| Hoy sin citas | 15:764 | `(barbero)/hoy` | `GET /barberias/:id/agenda` |
| Semana | 15:807 | `(barbero)/semana` | `GET /barberias/:id/agenda` |
| Detalle de cita iniciada | 15:903 | `(barbero)/citas/[id]` | `GET /citas/:id`, `GET /citas/:id/ficha-estilo`, `PATCH /citas/:id/estado` |
| Detalle de cita futura | 15:948 | `(barbero)/citas/[id]` | `GET /citas/:id`, `GET /citas/:id/ficha-estilo` |
| Registrar pago | 16:812 | `(barbero)/citas/[id]/pago` | `PATCH /citas/:id/estado` |
| Registrar pago con ajuste | 16:849 | `(barbero)/citas/[id]/pago` | `PATCH /citas/:id/estado` |
| Cancelar cita (hoja) | 16:891 | `(barbero)/citas/[id]` | `PATCH /citas/:id/cancelar` |
| Bloquear horario | 16:932 | `(barbero)/bloquear` | `POST /barberias/:id/bloqueos` |
| Bloquear horario con conflicto | 16:969 | `(barbero)/bloquear` | `POST /barberias/:id/bloqueos` |
| Mi disponibilidad | 16:1004 | `(barbero)/disponibilidad` | `GET /barberias/:id/bloqueos`, `DELETE /barberias/:id/bloqueos/:bloqueoId`; horario base: ver Huecos |
| Perfil | 16:1052 | `(barbero)/perfil` | `GET /usuarios/yo`, `POST /autenticacion/cerrar-sesion`, `PUT` y `DELETE /barberias/:id/barberos/:barberoId/foto` |
| Citas sin cerrar | 23:1756 | `(barbero)/citas-sin-cerrar` | `GET /barberias/:id/agenda`, `PATCH /citas/:id/estado` |
| Cancelar citas en conflicto (hoja) | 23:1773 | `(barbero)/bloquear` | `PATCH /citas/:id/cancelar` |
| Bloquear día completo | 23:1805 | `(barbero)/bloquear` | `POST /barberias/:id/bloqueos` |
| Mi disponibilidad con permiso | 23:1831 | `(barbero)/disponibilidad` | `GET /barberias/:id/bloqueos`, `DELETE /barberias/:id/bloqueos/:bloqueoId`; horario base: ver Huecos |
| Editar mi día | 23:1912 | `(barbero)/disponibilidad/[dia]` | Ver Huecos |

## Propietario

| Pantalla | Nodo | Ruta Expo Router | Endpoints |
| --- | --- | --- | --- |
| Resumen | 17:990 | `(propietario)/resumen` | `GET /barberias/:id/estadisticas`, `GET /barberias/:id/agenda` |
| Agenda | 17:1068 | `(propietario)/agenda` | `GET /barberias/:id/agenda` |
| Detalle de cita | 17:1190 | `(propietario)/citas/[id]` | `GET /citas/:id`, `GET /citas/:id/ficha-estilo`, `PATCH /citas/:id/estado` |
| Gestión | 17:1233 | `(propietario)/gestion` | `GET /barberias/:id` |
| Datos de la barbería | 17:1333 | `(propietario)/gestion/datos` | `PATCH /barberias/:id`, `PUT` y `DELETE /barberias/:id/portada` |
| Servicios | 17:1367 | `(propietario)/gestion/servicios` | `GET /barberias/:id/servicios`; inactivos: ver Huecos |
| Editar servicio | 18:1233 | `(propietario)/gestion/servicios/[servicioId]` | `PATCH /barberias/:id/servicios/:servicioId` |
| Personal | 18:1273 | `(propietario)/gestion/personal` | `GET /barberias/:id/personal` |
| Detalle de barbero con citas | 18:1315 | `(propietario)/gestion/personal/[membresiaId]` | `PATCH /barberias/:id/personal/:membresiaId`, `PUT` y `DELETE /barberias/:id/barberos/:barberoId/foto` |
| Invitar barbero | 18:1347 | `(propietario)/gestion/personal/invitar` | `POST /barberias/:id/personal/invitaciones` |
| Horarios | 18:1365 | `(propietario)/gestion/horarios` | `PUT /barberias/:id/horarios`; lectura: ver Huecos |
| Horario con citas afectadas | 18:1424 | `(propietario)/gestion/horarios` | `PUT /barberias/:id/horarios` |
| Reglas de reserva | 18:1450 | `(propietario)/gestion/reglas` | `PATCH /barberias/:id` |
| Pagos | 19:1366 | `(propietario)/gestion/pagos` | `GET /barberias/:id/pagos` |
| Corregir pago | 19:1426 | `(propietario)/gestion/pagos/[id]` | `PATCH /pagos/:id` |
| Anticipo | 19:1459 | `(propietario)/gestion/anticipo` | `PATCH /barberias/:id` |
| Perfil | 19:1482 | `(propietario)/perfil` | `GET /usuarios/yo`, `POST /autenticacion/cerrar-sesion` |
| Estadísticas | 19:1581 | `(propietario)/estadisticas` | `GET /barberias/:id/estadisticas`, `GET /barberias/:id/estadisticas/exportar` |
| Reasignar cita | 23:1951 | `(propietario)/citas/[id]/reasignar` | `GET /barberias/:id/barberos`, `PATCH /citas/:id/reasignar` |
| Registrar cita | 23:1981 | `(propietario)/citas/nueva` | `POST /barberias/:id/citas`, `GET /barberias/:id/disponibilidad` |
| Editar día | 23:2025 | `(propietario)/gestion/horarios/[dia]` | `PUT /barberias/:id/horarios`; lectura: ver Huecos |
| Feriados y cierres | 23:2063 | `(propietario)/gestion/horarios/cierres` | `GET /barberias/:id/bloqueos`, `DELETE /barberias/:id/bloqueos/:bloqueoId` |
| Agregar cierre | 23:2085 | `(propietario)/gestion/horarios/cierres/nuevo` | `POST /barberias/:id/bloqueos` |
| Agregar servicio | 23:2107 | `(propietario)/gestion/servicios/nuevo` | `POST /barberias/:id/servicios` |
| Gestión no publicada | 23:2147 | `(propietario)/gestion` | `GET /barberias/:id` |
| Citas futuras de barbero | 23:2168 | `(propietario)/gestion/personal/[membresiaId]/citas` | `GET /barberias/:id/citas`, `PATCH /citas/:id/reasignar` |
| Cancelar cita (hoja) | 25:2060 | `(propietario)/citas/[id]` | `PATCH /citas/:id/cancelar` |

## Estados

| Pantalla | Nodo | Ruta Expo Router | Endpoints |
| --- | --- | --- | --- |
| Carga | 22:1949 | Sin ruta: estado de cualquier pantalla | — |
| Error de red | 22:1954 | Sin ruta: estado de cualquier pantalla | — |
| Sin conexión | 22:1961 | Sin ruta: estado de cualquier pantalla | — |

## Huecos

Pantallas con diseño que §10.2 todavía no cubre. No se inventan rutas: se deciden antes de construirlas.

1. Horario base del barbero: `HorarioAtencion` admite `perfilBarberoId`, pero `PUT /barberias/:id/horarios` es solo del propietario. Falta cómo lee y edita el suyo un barbero con `puedeEditarHorario` (Mi disponibilidad, Editar mi día).
2. Leer horarios: no hay `GET` de horarios (Horarios, Editar día, Mi disponibilidad).
3. Servicios inactivos: `GET /barberias/:id/servicios` solo devuelve activos, y el propietario necesita verlos para reactivarlos (Servicios).
4. Registrar cita del barbero: §10.5 la incluye, pero Figma solo tiene el nodo de Propietario (23:1981). Se reutiliza ese diseño en `(barbero)/citas/nueva` con `POST /barberias/:id/citas`.

## Componentes (marco "Componentes", nodo 3:2)

| Componente | Nodo |
| --- | --- |
| Iconos | 3:3 |
| Chip | 3:29 |
| FilaBarberia | 3:30 |
| PestanaInferior | 3:50 |
| Boton | 8:77 |
| OpcionLista | 8:95 |
| EtiquetaEstado | 8:106 |
| DiaCalendario | 8:113 |
| EncabezadoReserva | 8:166 |
| FilaDato | 9:53 |
| FilaServicio | 10:221 |
| FilaBarbero | 10:228 |
| FilaCita | 10:234 |
| FilaMenu | 11:370 |
| CampoTexto | 11:385 |
| LogoBarberly | 13:549 |
| FilaAgenda | 15:658 |
| FilaDia | 15:659 |
| FilaBloqueo | 16:807 |
| TarjetaDato | 17:986 |
| Interruptor | 18:1232 |
| FilaBarra | 19:1361 |

Índice navegable del prototipo: nodo 26:2078.
