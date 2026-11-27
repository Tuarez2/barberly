# Hoja de ruta

Seis etapas de dos semanas (D-20). Cada etapa es una rebanada vertical (API, app y panel) que termina con una demo en el teléfono. Una rama por tarea y un PR por funcionalidad (ver `docs/flujo-de-trabajo.md`); con el orquestador del espacio de trabajo se pide con `/funcionalidad <ID>` o `/tarea <ID>`.
Estado: `pendiente`, `en-curso` o `hecha`. El usuario lo cambia a `hecha` antes del commit final de la tarea.
Repositorio de cada tarea: API (`api/`), app (`movil/`) o panel (`panel/`) (D-11).

## Hecho antes del replanteamiento

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T0.1 | Monorepo, API, app y paquete compartido en verde | `preparacion.md` | `chore/fase-0-preparacion` | — | hecha |
| T0.2 | Flujo de trabajo, hoja de ruta, plantilla de PR y CI | — | `docs/flujo-de-trabajo` | T0.1 | hecha |
| T1.1 | Resolver las Dudas de autenticación y agregar la sección Pantallas a su especificación | AUT-01 a AUT-10 | `docs/autenticacion-decisiones` | T0.2 | hecha |
| T1.2 | Modelo de datos completo, índices y restricciones, con su migración | §9.2, §9.4, §9.5 | `feat/base-datos-modelo` | T1.1 | hecha |
| T1.3 | Semillas de desarrollo y fábricas de prueba | §7.1, skill `pruebas-api` | `feat/base-datos-semillas` | T1.2 | hecha |
| T1.4 | Documentación OpenAPI base en `GET /api/v1/documentacion` | §10.7 | `chore/api-documentacion` | T1.2 | hecha |
| T1.5 | API: registro de usuario | AUT-01, HU-AUT-01, SEG-06 | `feat/autenticacion-registro` | T1.3, T1.4 | hecha |
| T1.6 | API: inicio de sesión con límite de intentos | AUT-02, HU-AUT-02, SEG-09 | `feat/autenticacion-iniciar-sesion` | T1.5 | hecha |
| T1.7 | API: renovar y cerrar sesión | AUT-03, AUT-04, HU-AUT-02 | `feat/autenticacion-sesion` | T1.6 | hecha |
| T1.8 | API: `GET /usuarios/yo` con membresías y `contextoBarberia` real; `autenticar` rechaza usuarios inactivos | AUT-08, SEG-03, SEG-04, D-05 | `feat/autenticacion-membresias` | T1.7 | hecha |
| T1.16 | Decisiones del panel web y de los tres repositorios, y documentos afectados | D-10 a D-13 | `docs/panel-web` | T1.4 | hecha |
| T1.17 | Separar en tres repositorios (API, app y panel), cada uno con su CI y su copia del contrato | D-11, §8.9 | `chore/separar-repositorios` | T1.16 | hecha |

## Etapa 1 (semanas 1 y 2). Sesión completa en app y panel

Demo: cada rol entra a su interfaz desde el teléfono y el propietario al panel. Las tareas T1.21 a T1.23 y la app de T1.10 a T1.12 son el avance de la primera semana.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| E1.A | `chore/replanteamiento` | T1.21, T1.22, T1.23 | PostgreSQL, documentos y agentes del replanteamiento (D-19 a D-28) |
| E1.B | `funcionalidad/movil-sesion` | T1.24, T1.10, T1.11, T1.12 | HU-AUT-01, HU-AUT-02 en la app, con el sistema de movimiento |
| E1.C | `funcionalidad/barberia-y-perfil` | T1.9, T1.13, T1.14, T1.15 | HU-AUT-03, perfil y recuperación |
| E1.D | `funcionalidad/panel-acceso` | T1.18, T1.19, T1.20 | El propietario entra al panel (HU-AUT-02, HU-AUT-03) |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T1.21 | API: migrar a PostgreSQL con la restricción sin cruces | D-19, RN-04 | `feat/migrar-postgresql` | T1.8 | hecha |
| T1.22 | Documentos del replanteamiento: DERCAS 1.4, decisiones D-19 a D-28 y hoja de ruta por etapas | D-19 a D-28 | `docs/replanteamiento` | T1.21 | hecha |
| T1.23 | Agentes: espacio de trabajo raíz, orquestador multi-repositorio y especialistas nuevos | D-27 | `chore/agentes-espacio-raiz` | T1.22 | hecha |
| T1.24 | App: sistema de movimiento y componentes base animados | D-26 | `feat/movil-movimiento` | T1.22 | hecha |
| T1.10 | App: sesión (cliente HTTP con token, renovación automática, almacenamiento seguro, TanStack Query) | AUT-04, §11.4 | `feat/movil-sesion` | T1.7 | hecha |
| T1.11 | App: pantallas Registro e Inicio de sesión con sus estados de error | HU-AUT-01, HU-AUT-02 | `feat/movil-registro-iniciar-sesion` | T1.10, T1.24 | hecha |
| T1.12 | App: entrada según el rol (cliente o barbero), aviso del panel para el propietario, rutas protegidas y cerrar sesión | AUT-03, AUT-08, HU-AUT-02, D-10 | `feat/movil-rol` | T1.8, T1.11 | hecha |
| T1.9 | API: registrar barbería y quedar como propietario | AUT-10, HU-AUT-03 | `feat/autenticacion-registrar-barberia` | T1.8 | hecha |
| T1.13 | Perfil: ver y editar datos, cambiar contraseña (API y app) | AUT-05, AUT-06 | `feat/autenticacion-perfil` | T1.12 | hecha |
| T1.14 | Elegir la barbería activa (API y app) | AUT-09 | `feat/autenticacion-barberia-activa` | T1.12 | hecha |
| T1.15 | Recuperar la contraseña con código por correo e interfaz EnvioCorreo (API y app) | AUT-07, D-01 | `feat/autenticacion-recuperar-clave` | T1.7 | hecha |
| T1.18 | Panel: proyecto base con Vite, React Router, TanStack Query, Tailwind, shadcn/ui, tema, cliente HTTP y CI | D-10, D-11, D-26 | `chore/panel-base` | T1.17 | pendiente |
| T1.19 | Panel: sesión, registro, inicio de sesión, rutas solo para propietarios y cerrar sesión | AUT-01 a AUT-04, AUT-08, HU-AUT-02, D-12 | `feat/panel-sesion` | T1.8, T1.18 | pendiente |
| T1.20 | Panel: registrar barbería, elegir la barbería activa y perfil del propietario | AUT-05, AUT-06, AUT-09, AUT-10, HU-AUT-03, D-13 | `feat/panel-barberia` | T1.9, T1.13, T1.14, T1.19 | pendiente |

## Etapa 2 (semanas 3 y 4). Primera reserva real de punta a punta

Demo: un compañero reserva desde su teléfono en una barbería sembrada, sin cruces, y recibe la confirmación push. La configuración de la barbería sale de las semillas; su administración llega en la etapa 4.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| E2.A | `docs/catalogo-reservas` | T2.1 | Especificaciones de búsqueda, reservas y notificaciones |
| E2.B | `funcionalidad/explorar` | T2.8, T2.9, T2.12, T2.13 | HU-BUS-01 a HU-BUS-03 |
| E2.C | `funcionalidad/reservar` | T3.2, T3.3, T3.7, T3.8 | HU-RES-01, HU-RES-04 |
| E2.D | `funcionalidad/mis-citas-push` | T3.4, T3.5, T3.9, T2.14 | HU-RES-02, HU-RES-03, NOT-02, NOT-03 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T2.1 | Especificaciones de búsqueda, reservas y notificaciones, y sus Dudas | §3.2, §3.3, §3.10, §4.1, §4.2, §8.5, §8.6 | `docs/catalogo-reservas` | Etapa 1 | pendiente |
| T2.8 | API: listado y búsqueda de barberías | BUS-01, BUS-02, HU-BUS-01, HU-BUS-03 | `feat/busqueda-listado` | T2.1 | pendiente |
| T2.9 | API: detalle de barbería, servicios, barberos y horario | BUS-05 a BUS-08, HU-BUS-02 | `feat/busqueda-detalle` | T2.8 | pendiente |
| T2.12 | App cliente: explorar y buscar (pantalla estrella, D-26) | BUS-01, BUS-02 | `feat/movil-explorar` | T2.8 | pendiente |
| T2.13 | App cliente: detalle de barbería con Reservar | BUS-05 a BUS-08, BUS-10 | `feat/movil-detalle-barberia` | T2.9 | pendiente |
| T3.2 | API: disponibilidad por días y por horas | RES-03, RES-04, RN-05 a RN-07, RN-10, RN-26 | `feat/reservas-disponibilidad` | T2.1 | pendiente |
| T3.3 | API: crear cita con transacción, bloqueo y restricción sin cruces | RES-06, RN-01 a RN-12, HU-RES-01, HU-RES-04, PO-01 a PO-05, D-19 | `feat/reservas-crear` | T3.2 | pendiente |
| T3.7 | App: reserva pasos 1 y 2 (servicio y barbero) | RES-01, RES-02 | `feat/movil-reserva-servicio-barbero` | T3.2 | pendiente |
| T3.8 | App: fecha y hora, resumen y éxito (pantalla estrella, D-26) | RES-03 a RES-06 | `feat/movil-reserva-confirmar` | T3.3, T3.7 | pendiente |
| T3.4 | API: mis citas, historial y detalle | RES-07 a RES-09, SEG-05, HU-RES-03 | `feat/reservas-mis-citas` | T3.3 | pendiente |
| T3.5 | API: cancelar cita del cliente | RES-10, RN-13, RN-15, RN-17, HU-RES-02, PO-08 | `feat/reservas-cancelar` | T3.4 | pendiente |
| T3.9 | App: mis citas, detalle y cancelar | RES-07 a RES-10 | `feat/movil-mis-citas` | T3.5 | pendiente |
| T2.14 | API y app: token push, EnvioNotificaciones y avisos de cita creada o cancelada | NOT-02, NOT-03, D-21 | `feat/notificaciones-push` | T3.3 | pendiente |

## Etapa 3 (semanas 5 y 6). Asesor de estilo con IA

Demo: selfie, análisis, tres cortes del catálogo, "Pruébatelo" y reservar con un toque. Antes: agente `asesor-ia`.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| E3.A | `docs/asesor` | T5.1 | Especificación |
| E3.B | `funcionalidad/recomendar` | T5.2, T5.3, T5.4, T5.5 | HU-IA-01, HU-IA-02, HU-IA-04 |
| E3.C | `funcionalidad/pruebatelo` | T5.7, T5.6 | IA-10, HU-IA-03 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T5.1 | Especificación del asesor, proveedor de IA (D-23) y sus Dudas | §3.7, §4.5, §8.7 | `docs/asesor` | Etapa 2 | pendiente |
| T5.2 | Consentimiento (API y app) | IA-01, RN-28 | `feat/asesor-consentimiento` | T5.1 | pendiente |
| T5.3 | API: recomendación con la foto en memoria y límite diario | IA-03, IA-04, IA-07, RN-27, RN-29, RN-30, SEG-13, SEG-14, PO-11, PO-12, PO-14 | `feat/asesor-recomendar` | T5.2 | pendiente |
| T5.4 | App: cámara con guía de encuadre, animación de análisis y compresión (pantalla estrella, D-26) | IA-02 | `feat/movil-asesor-captura` | T5.2 | pendiente |
| T5.5 | App: recomendaciones y reservar el corte | IA-04, IA-05, RES-13, HU-IA-02 | `feat/movil-asesor-recomendaciones` | T5.3, T5.4 | pendiente |
| T5.7 | API y app: "Pruébatelo" con imagen generada en memoria y deslizador antes/después | IA-10, RN-27, D-23 | `feat/asesor-pruebatelo` | T5.3 | pendiente |
| T5.6 | Ficha de estilo y receta del corte para el barbero | AGE-12, IA-06, HU-IA-03 | `feat/asesor-ficha-estilo` | T5.3 | pendiente |

## Etapa 4 (semanas 7 y 8). Operación del barbero y del propietario

Demo: la agenda del barbero se actualiza sola al entrar una reserva; el propietario configura su barbería en el panel; llegan los recordatorios.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| E4.A | `docs/agenda-administracion` | T4.1 | Especificaciones |
| E4.B | `funcionalidad/agenda` | T4.2, T4.4, T4.6, T4.8 | HU-AGE-01, HU-AGE-03 |
| E4.C | `funcionalidad/completar-cobrar` | T4.3, T4.7 | HU-AGE-02, HU-PAG-01 |
| E4.D | `funcionalidad/configurar-barberia` | T2.2, T2.3, T2.4, T2.5, T2.6, T2.7, T2.10, T2.11 | HU-ADM-01 a HU-ADM-03 |
| E4.E | `funcionalidad/recordatorios` | T4.9, T4.10 | NOT-01, NOT-04, D-22 |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T4.1 | Especificaciones de agenda, administración y pagos, y sus Dudas | §3.4, §3.5, §3.8, §4.3, §4.6 | `docs/agenda-administracion` | Etapa 3 | pendiente |
| T4.2 | API: agenda diaria y semanal, y detalle de cita | AGE-01 a AGE-04, HU-AGE-01 | `feat/agenda-vistas` | T4.1 | pendiente |
| T4.3 | API: completar con pago, ausencia y cancelar con motivo | AGE-05, AGE-13, PAG-01, RN-14, RN-16, RN-18, RN-19, RN-32, RN-33, PO-09, PO-13 | `feat/agenda-estados-pago` | T4.2 | pendiente |
| T4.4 | API: bloqueos y días libres | AGE-08, AGE-09, RN-26, HU-AGE-03 | `feat/agenda-bloqueos` | T4.2 | pendiente |
| T4.6 | App barbero: agenda en línea de tiempo y en tiempo real (pantalla estrella, D-26) | AGE-01 a AGE-03 | `feat/movil-agenda` | T4.2 | pendiente |
| T4.7 | App barbero: detalle de cita y completar con pago | AGE-04, AGE-05, AGE-13 | `feat/movil-agenda-cita` | T4.3, T4.6 | pendiente |
| T4.8 | App barbero: bloqueos y días libres | AGE-08, AGE-09 | `feat/movil-agenda-bloqueos` | T4.4, T4.6 | pendiente |
| T2.2 | API: editar barbería y portada | ADM-01, skill `almacen-archivos` | `feat/administracion-barberia` | T4.1 | pendiente |
| T2.3 | API: servicios con etiquetas de estilo | ADM-02, ADM-14, RN-21, RN-22, HU-ADM-01 | `feat/administracion-servicios` | T2.2 | pendiente |
| T2.4 | API: horarios de atención | ADM-05, RN-24, HU-ADM-02 | `feat/administracion-horarios` | T2.2 | pendiente |
| T2.5 | API: invitar, aceptar y desactivar barberos | ADM-04, RN-25, HU-ADM-03, PO-10 | `feat/administracion-personal` | T2.2 | pendiente |
| T2.6 | API: servicios que ofrece cada barbero | ADM-03, RN-23 | `feat/administracion-servicios-barbero` | T2.3, T2.5 | pendiente |
| T2.7 | API: estado de publicación de la barbería | ADM-13, HU-AUT-03 | `feat/administracion-publicacion` | T2.4, T2.6 | pendiente |
| T2.10 | Panel: barbería, servicios y horarios | ADM-01, ADM-02, ADM-05, ADM-14, D-10 | `feat/panel-administracion` | T2.4 | pendiente |
| T2.11 | Panel: personal e invitaciones | ADM-03, ADM-04, D-10 | `feat/panel-personal` | T2.6 | pendiente |
| T4.9 | API: cola pg-boss, recordatorios 24 h y 1 h, y vencimiento de anticipos | NOT-01, RN-34, D-22 | `feat/tareas-cola` | T2.14 | pendiente |
| T4.10 | API y app: lista de espera inteligente | NOT-04, D-21 | `feat/lista-espera` | T4.9 | pendiente |

## Etapa 5 (semanas 9 y 10). Dinero e inteligencia del negocio

Demo: anticipo pagado con Payphone en modo de prueba, estadísticas y resumen semanal por IA en el panel. **En esta etapa arranca la prueba cerrada de Google Play (12 testers, 14 días).**

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| E5.A | `docs/pagos-estadisticas` | T6.1 | Especificaciones |
| E5.B | `funcionalidad/anticipo` | T4.5, T6.5 | PAG-02, PAG-04 a PAG-07, D-24 |
| E5.C | `funcionalidad/panel-estadisticas` | T6.2, T6.3, T6.4, T6.6, T6.7 | HU-ADM-04, HU-EST-01, HU-EST-02, IA-11, IA-12 |
| E5.D | `chore/prueba-cerrada` | T6.8 | Prueba cerrada de Google Play |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T6.1 | Especificaciones de pagos y estadísticas, y sus Dudas | §3.8, §3.9, §4.6 | `docs/pagos-estadisticas` | Etapa 4 | pendiente |
| T4.5 | API: citas y pagos de la barbería con filtros | ADM-08, PAG-02 | `feat/administracion-citas-pagos` | T6.1 | pendiente |
| T6.5 | API y app: anticipo con PasarelaPagos (Payphone en modo de prueba) y webhook | PAG-04 a PAG-07, RN-34, RN-35, SEG-16, D-24 | `feat/pagos-anticipo` | T4.9 | pendiente |
| T6.2 | API: indicadores e ingresos | EST-01 a EST-03, RN-37, RN-38, HU-EST-01 | `feat/estadisticas-ingresos` | T6.1 | pendiente |
| T6.3 | API: ocupación, mapa de calor, servicios y asesor | EST-04 a EST-06, HU-EST-02 | `feat/estadisticas-demanda` | T6.2 | pendiente |
| T6.4 | Panel: estadísticas del propietario | ADM-11, EST-01 a EST-06, D-10 | `feat/panel-estadisticas` | T6.3 | pendiente |
| T6.6 | API y panel: resumen semanal del negocio con IA | IA-12, D-23 | `feat/estadisticas-resumen-ia` | T6.3 | pendiente |
| T6.7 | API y app: riesgo de ausencia (reglas) y anticipo solo cuando hay riesgo | IA-11, D-23 | `feat/riesgo-ausencia` | T6.5 | pendiente |
| T6.8 | EAS Build de producción, ficha interna e inicio de la prueba cerrada | §13.2, D-25 | `chore/prueba-cerrada` | Etapa 4 | pendiente |

## Etapa 6 (semanas 11 y 12). Piloto y publicación

Entrega: MVP estable en Google Play. Se cierra con los 14 casos PO de DERCAS §12.2.

| Func. | Rama del PR | Tareas | Entrega |
| --- | --- | --- | --- |
| E6.A | `funcionalidad/operacion` | T7.6, T7.1 | D-25, SEG-10 |
| E6.B | `funcionalidad/pruebas-obligatorias` | T7.2, T7.3, T7.5, T7.7 | 14 casos PO y Maestro |
| E6.C | `fix/textos-errores` | T7.4 | Errores y textos |
| E6.D | `chore/publicacion` | T7.8 | Barberly en Google Play |

| ID | Tarea | Códigos | Rama | Depende | Estado |
| --- | --- | --- | --- | --- | --- |
| T7.6 | Entornos staging y producción, Sentry, PostHog, EAS Update y despliegue automático | D-25, §13.1 | `chore/operacion` | Etapa 5 | pendiente |
| T7.1 | Auditoría de acciones críticas | SEG-10, §11.7 | `feat/seguridad-auditoria` | Etapa 5 | pendiente |
| T7.2 | Repaso de aislamiento entre barberías, roles y concurrencia | PO-05 a PO-07, SEG-04, SEG-07 | `test/seguridad-aislamiento` | Etapa 5 | pendiente |
| T7.3 | Repaso de privacidad de fotos (también "Pruébatelo") | PO-14, RN-27, RN-31, SEG-13 | `test/seguridad-fotos` | Etapa 5 | pendiente |
| T7.4 | Revisión de errores y textos de la app y del panel | SEG-08, §10.6 | `fix/textos-errores` | Etapa 5 | pendiente |
| T7.5 | Los 14 casos PO en verde y casos adicionales de §12.2 | §12.2, §12.5 | `test/casos-obligatorios` | T7.2, T7.3 | pendiente |
| T7.7 | Flujos de Maestro (registro, reserva y cancelación) en CI | D-25 | `test/maestro` | T7.6 | pendiente |
| T7.8 | Piloto con barberías reales, ficha de la tienda, política de privacidad y producción | §12.4, §13.2 | `chore/publicacion` | T6.8 | pendiente |

## Pendientes Debería y Podría

Se programan al cerrar la etapa de su módulo, si hay tiempo: BUS-03, RES-12, RES-16, AGE-06, AGE-07, AGE-11, ADM-06, ADM-07, ADM-09, ADM-10, IA-08, IA-09, PAG-03, EST-07, EST-08, NOT-05, NOT-06, NOT-07.
