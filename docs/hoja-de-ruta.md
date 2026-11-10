# Hoja de ruta

Tareas y funcionalidades por fase, en orden (DERCAS §13.6). Una rama por tarea (se pide con `/tarea <ID>`) y un PR por funcionalidad (ver `docs/flujo-de-trabajo.md`).
Estado: `pendiente`, `en-curso` o `hecha`. El usuario lo cambia a `hecha` antes del commit final de la tarea.
La Fase 1 está detallada; las demás son provisionales y se afinan al empezar la fase, después de `/especificar` y `/decidir`.

## Fase 0. Preparación

Entrega: proyecto que compila y corre en el teléfono.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F0.A | `chore/fase-0-preparacion` | T0.1 | Monorepo en verde |
| F0.B | `docs/flujo-de-trabajo` | T0.2 | Forma de trabajar |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T0.1 | Monorepo, API, app y paquete compartido en verde | `preparacion.md` | `chore/fase-0-preparacion` | — | hecha |
| T0.2 | Flujo de trabajo, hoja de ruta, plantilla de PR y CI | — | `docs/flujo-de-trabajo` | T0.1 | hecha |

## Fase 1. Base y autenticación

Entrega: usuarios que entran según su rol. Especificación: `docs/especificaciones/autenticacion.md`.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F1.A | `docs/autenticacion-decisiones` | T1.1 | Dudas de autenticación resueltas |
| F1.B | `funcionalidad/base-datos` | T1.2, T1.3, T1.4 | Modelo, semillas y documentación de la API |
| F1.C | `funcionalidad/registro-sesion` | T1.5, T1.6, T1.7, T1.10, T1.11 | HU-AUT-01, HU-AUT-02 |
| F1.D | `funcionalidad/roles` | T1.8, T1.12 | Cada rol entra a su interfaz |
| F1.E | `feat/autenticacion-registrar-barberia` | T1.9 | HU-AUT-03 |
| F1.F | `funcionalidad/perfil` | T1.13, T1.14, T1.15 | Perfil, contraseña, recuperación y barbería activa |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T1.1 | Resolver las Dudas de autenticación y agregar la sección Pantallas a su especificación | AUT-01 a AUT-10 | `docs/autenticacion-decisiones` | T0.2 | hecha |
| T1.2 | Modelo de datos completo, índices y restricciones, con su migración | §9.2, §9.4, §9.5 | `feat/base-datos-modelo` | T1.1 | hecha |
| T1.3 | Semillas de desarrollo y fábricas de prueba | §7.1, skill `pruebas-api` | `feat/base-datos-semillas` | T1.2 | hecha |
| T1.4 | Documentación OpenAPI base en `GET /api/v1/documentacion` | §10.7 | `chore/api-documentacion` | T1.2 | hecha |
| T1.5 | API: registro de usuario | AUT-01, HU-AUT-01, SEG-06 | `feat/autenticacion-registro` | T1.3, T1.4 | pendiente |
| T1.6 | API: inicio de sesión con límite de intentos | AUT-02, HU-AUT-02, SEG-09 | `feat/autenticacion-iniciar-sesion` | T1.5 | pendiente |
| T1.7 | API: renovar y cerrar sesión | AUT-03, AUT-04, HU-AUT-02 | `feat/autenticacion-sesion` | T1.6 | pendiente |
| T1.8 | API: `GET /usuarios/yo` con membresías y `contextoBarberia` real | AUT-08, SEG-03, SEG-04 | `feat/autenticacion-membresias` | T1.7 | pendiente |
| T1.9 | API: registrar barbería y quedar como propietario | AUT-10, HU-AUT-03 | `feat/autenticacion-registrar-barberia` | T1.8 | pendiente |
| T1.10 | App: sesión (cliente HTTP con token, renovación automática, almacenamiento seguro, TanStack Query) | AUT-04, §11.4 | `feat/movil-sesion` | T1.7 | pendiente |
| T1.11 | App: pantallas Registro e Inicio de sesión con sus estados de error | HU-AUT-01, HU-AUT-02 | `feat/movil-registro-iniciar-sesion` | T1.10 | pendiente |
| T1.12 | App: entrada según el rol, rutas protegidas y cerrar sesión | AUT-03, AUT-08, HU-AUT-02 | `feat/movil-rol` | T1.8, T1.11 | pendiente |
| T1.13 | Perfil: ver y editar datos, cambiar contraseña (API y app) | AUT-05, AUT-06 | `feat/autenticacion-perfil` | T1.12 | pendiente |
| T1.14 | Elegir la barbería activa (API y app) | AUT-09 | `feat/autenticacion-barberia-activa` | T1.12 | pendiente |
| T1.15 | Recuperar la contraseña con código por correo e interfaz EnvioCorreo (API y app) | AUT-07, D-01 | `feat/autenticacion-recuperar-clave` | T1.7 | pendiente |

## Fase 2. Catálogo y administración

Entrega: barbería configurable y visible para clientes.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F2.A | `docs/administracion-busqueda` | T2.1 | Especificaciones |
| F2.B | `funcionalidad/configurar-barberia` | T2.2, T2.3, T2.4, T2.10 | HU-ADM-01, HU-ADM-02 |
| F2.C | `funcionalidad/personal` | T2.5, T2.6, T2.11 | HU-ADM-03 |
| F2.D | `funcionalidad/explorar` | T2.7, T2.8, T2.9, T2.12, T2.13 | HU-BUS-01 a HU-BUS-03 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T2.1 | Especificaciones de administración y búsqueda, y sus Dudas | §3.2, §3.5 | `docs/administracion-busqueda` | Fase 1 | pendiente |
| T2.2 | API: editar barbería y portada | ADM-01, skill `almacen-archivos` | `feat/administracion-barberia` | T2.1 | pendiente |
| T2.3 | API: servicios con etiquetas de estilo | ADM-02, ADM-14, RN-21, RN-22, HU-ADM-01 | `feat/administracion-servicios` | T2.2 | pendiente |
| T2.4 | API: horarios de atención | ADM-05, RN-24, HU-ADM-02 | `feat/administracion-horarios` | T2.2 | pendiente |
| T2.5 | API: invitar, aceptar y desactivar barberos | ADM-04, RN-25, HU-ADM-03, PO-10 | `feat/administracion-personal` | T2.2 | pendiente |
| T2.6 | API: servicios que ofrece cada barbero | ADM-03, RN-23 | `feat/administracion-servicios-barbero` | T2.3, T2.5 | pendiente |
| T2.7 | API: estado de publicación de la barbería | ADM-13, HU-AUT-03 | `feat/administracion-publicacion` | T2.4, T2.6 | pendiente |
| T2.8 | API: listado y búsqueda de barberías | BUS-01, BUS-02, HU-BUS-01, HU-BUS-03 | `feat/busqueda-listado` | T2.7 | pendiente |
| T2.9 | API: detalle de barbería, servicios, barberos y horario | BUS-05 a BUS-08, HU-BUS-02 | `feat/busqueda-detalle` | T2.8 | pendiente |
| T2.10 | App propietario: barbería, servicios y horarios | ADM-01, ADM-02, ADM-05, ADM-14 | `feat/movil-administracion` | T2.4 | pendiente |
| T2.11 | App propietario: personal e invitaciones | ADM-03, ADM-04 | `feat/movil-personal` | T2.6 | pendiente |
| T2.12 | App cliente: explorar y buscar | BUS-01, BUS-02 | `feat/movil-explorar` | T2.8 | pendiente |
| T2.13 | App cliente: detalle de barbería con Reservar | BUS-05 a BUS-08, BUS-10 | `feat/movil-detalle-barberia` | T2.9 | pendiente |

## Fase 3. Reservas

Entrega: flujo de reserva completo y seguro.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F3.A | `docs/reservas` | T3.1 | Especificación |
| F3.B | `funcionalidad/reservar` | T3.2, T3.3, T3.7, T3.8 | HU-RES-01, HU-RES-04 |
| F3.C | `funcionalidad/mis-citas` | T3.4, T3.5, T3.9 | HU-RES-02, HU-RES-03 |
| F3.D | `feat/reservas-foto-referencia` | T3.6 | RES-14 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T3.1 | Especificación de reservas y sus Dudas | §3.3, §4.1, §4.2, §8.5, §8.6 | `docs/reservas` | Fase 2 | pendiente |
| T3.2 | API: disponibilidad por días y por horas | RES-03, RES-04, RN-05 a RN-07, RN-10, RN-26 | `feat/reservas-disponibilidad` | T3.1 | pendiente |
| T3.3 | API: crear cita con transacción y bloqueo | RES-06, RN-01 a RN-12, HU-RES-01, HU-RES-04, PO-01 a PO-05 | `feat/reservas-crear` | T3.2 | pendiente |
| T3.4 | API: mis citas, historial y detalle | RES-07 a RES-09, SEG-05, HU-RES-03 | `feat/reservas-mis-citas` | T3.3 | pendiente |
| T3.5 | API: cancelar cita del cliente | RES-10, RN-13, RN-15, RN-17, HU-RES-02, PO-08 | `feat/reservas-cancelar` | T3.4 | pendiente |
| T3.6 | API y app: foto de referencia | RES-14, RN-31, SEG-13 | `feat/reservas-foto-referencia` | T3.3 | pendiente |
| T3.7 | App: reserva pasos 1 y 2 (servicio y barbero) | RES-01, RES-02 | `feat/movil-reserva-servicio-barbero` | T3.2 | pendiente |
| T3.8 | App: fecha y hora, resumen y éxito | RES-03 a RES-06 | `feat/movil-reserva-confirmar` | T3.3, T3.7 | pendiente |
| T3.9 | App: mis citas, detalle y cancelar | RES-07 a RES-10 | `feat/movil-mis-citas` | T3.5 | pendiente |

## Fase 4. Agenda del barbero y pagos

Entrega: barberos que operan su jornada y cobran desde la app.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F4.A | `docs/agenda-pagos` | T4.1 | Especificaciones |
| F4.B | `funcionalidad/agenda` | T4.2, T4.6 | HU-AGE-01 |
| F4.C | `funcionalidad/completar-cobrar` | T4.3, T4.5, T4.7 | HU-AGE-02, HU-PAG-01 |
| F4.D | `funcionalidad/bloqueos` | T4.4, T4.8 | HU-AGE-03 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T4.1 | Especificaciones de agenda y pagos, y sus Dudas | §3.4, §3.8, §4.3, §4.6 | `docs/agenda-pagos` | Fase 3 | pendiente |
| T4.2 | API: agenda diaria y semanal, y detalle de cita | AGE-01 a AGE-04, HU-AGE-01 | `feat/agenda-vistas` | T4.1 | pendiente |
| T4.3 | API: completar con pago, ausencia y cancelar con motivo | AGE-05, AGE-13, PAG-01, RN-14, RN-16, RN-18, RN-19, RN-32, RN-33, PO-09, PO-13 | `feat/agenda-estados-pago` | T4.2 | pendiente |
| T4.4 | API: bloqueos y días libres | AGE-08, AGE-09, RN-26, HU-AGE-03 | `feat/agenda-bloqueos` | T4.2 | pendiente |
| T4.5 | API: citas y pagos de la barbería con filtros | ADM-08, PAG-02 | `feat/administracion-citas-pagos` | T4.3 | pendiente |
| T4.6 | App barbero: agenda diaria y semanal | AGE-01 a AGE-03 | `feat/movil-agenda` | T4.2 | pendiente |
| T4.7 | App barbero: detalle de cita y completar con pago | AGE-04, AGE-05, AGE-13 | `feat/movil-agenda-cita` | T4.3, T4.6 | pendiente |
| T4.8 | App barbero: bloqueos y días libres | AGE-08, AGE-09 | `feat/movil-agenda-bloqueos` | T4.4, T4.6 | pendiente |

## Fase 5. Asesor de estilo con IA

Entrega: el diferencial funcionando de punta a punta. Antes: agente `asesor-ia` (`docs/instalar-agentes.md`).

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F5.A | `docs/asesor` | T5.1 | Especificación |
| F5.B | `feat/asesor-consentimiento` | T5.2 | RN-28 |
| F5.C | `funcionalidad/recomendar` | T5.3, T5.4, T5.5 | HU-IA-01, HU-IA-02, HU-IA-04 |
| F5.D | `feat/asesor-ficha-estilo` | T5.6 | HU-IA-03 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T5.1 | Especificación del asesor, proveedor de IA y sus Dudas | §3.7, §4.5, §8.7 | `docs/asesor` | Fase 4 | pendiente |
| T5.2 | Consentimiento (API y app) | IA-01, RN-28 | `feat/asesor-consentimiento` | T5.1 | pendiente |
| T5.3 | API: recomendación con la foto en memoria y límite diario | IA-03, IA-04, IA-07, RN-27, RN-29, RN-30, SEG-13, SEG-14, PO-11, PO-12, PO-14 | `feat/asesor-recomendar` | T5.2 | pendiente |
| T5.4 | App: captura, guía de encuadre y compresión | IA-02 | `feat/movil-asesor-captura` | T5.2 | pendiente |
| T5.5 | App: recomendaciones y reservar el corte | IA-04, IA-05, RES-13, HU-IA-02 | `feat/movil-asesor-recomendaciones` | T5.3, T5.4 | pendiente |
| T5.6 | Ficha de estilo para el barbero | AGE-12, IA-06, HU-IA-03 | `feat/asesor-ficha-estilo` | T5.3 | pendiente |

## Fase 6. Estadísticas

Entrega: propietario que ve el rendimiento de su barbería.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F6.A | `docs/estadisticas` | T6.1 | Especificación |
| F6.B | `funcionalidad/panel` | T6.2, T6.3, T6.4 | HU-ADM-04, HU-EST-01, HU-EST-02 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T6.1 | Especificación de estadísticas y sus Dudas | §3.9, §4.6 | `docs/estadisticas` | Fase 5 | pendiente |
| T6.2 | API: indicadores e ingresos | EST-01 a EST-03, RN-37, RN-38, HU-EST-01 | `feat/estadisticas-ingresos` | T6.1 | pendiente |
| T6.3 | API: ocupación, mapa de calor, servicios y asesor | EST-04 a EST-06, HU-EST-02 | `feat/estadisticas-demanda` | T6.2 | pendiente |
| T6.4 | App: panel del propietario | ADM-11, EST-01 a EST-06 | `feat/movil-estadisticas` | T6.3 | pendiente |

## Fase 7. Pulido y seguridad

Entrega: MVP estable. Se cierra con los 14 casos PO de DERCAS §12.2.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| F7.A | `feat/seguridad-auditoria` | T7.1 | SEG-10 |
| F7.B | `funcionalidad/pruebas-obligatorias` | T7.2, T7.3, T7.5 | 14 casos PO |
| F7.C | `fix/movil-textos-errores` | T7.4 | Errores y textos |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T7.1 | Auditoría de acciones críticas | SEG-10, §11.7 | `feat/seguridad-auditoria` | Fase 6 | pendiente |
| T7.2 | Repaso de aislamiento entre barberías, roles y concurrencia | PO-05 a PO-07, SEG-04, SEG-07 | `test/seguridad-aislamiento` | Fase 6 | pendiente |
| T7.3 | Repaso de privacidad de fotos | PO-14, RN-27, RN-31, SEG-13 | `test/seguridad-fotos` | Fase 6 | pendiente |
| T7.4 | Revisión de errores y textos de la app | SEG-08, §10.6 | `fix/movil-textos-errores` | Fase 6 | pendiente |
| T7.5 | Los 14 casos PO en verde y casos adicionales de §12.2 | §12.2, §12.5 | `test/casos-obligatorios` | T7.2, T7.3 | pendiente |

## Pendientes Debería y Podría

Se programan al cerrar la fase de su módulo, si hay tiempo: BUS-03, RES-12, RES-16, AGE-06, AGE-07, AGE-11, ADM-06, ADM-07, ADM-09, ADM-10, IA-08, IA-09, PAG-03, EST-07, EST-08.

## Fases 8 y 9, y Extendida

- Fase 8. Piloto con barberías reales (§12.4) y prueba cerrada de Google Play (12 testers, 14 días).
- Fase 9. Ficha de la tienda, política de privacidad y producción (§13.2).
- Extendida. Anticipo en línea en modo de prueba: ADM-15, RES-15, PAG-04 a PAG-07, SEG-16.
