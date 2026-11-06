# DERCAS — Barberly: aplicación móvil para la gestión de citas en barberías

Nov 2, 2026 · @Cristhian Tuarez

## 1. Introducción

Este documento fija los requisitos, el comportamiento esperado, la arquitectura y el plan de verificación de Barberly, una aplicación móvil que elimina los cruces de horario en la agenda de barberías pequeñas y recomienda cortes con IA a partir de una foto.

### 1.1 Propósito

El DERCAS es la referencia única contra la que se diseña, se implementa y se prueba el sistema. Está dirigido al equipo de desarrollo, al docente que evalúa el proyecto, a los propietarios de las barberías piloto y a los agentes de IA que apoyarán la programación (a través del archivo AGENTS.md, que se deriva de las secciones 4 y 11).

### 1.2 Alcance del producto

Barberly permite a tres tipos de usuarios operar sobre una misma plataforma:

- **Cliente:** consulta barberías, ve solo horarios realmente libres, reserva y cancela citas, y usa el asesor de estilo con IA.
- **Barbero:** gestiona su agenda diaria y semanal, cambia el estado de las citas, bloquea horarios y registra el pago de cada cita.
- **Propietario:** configura servicios, precios, horarios y personal, y consulta un panel de estadísticas de su barbería.

**Dentro del alcance:** app móvil multiplataforma (React Native con Expo) probada en Android y publicada en Google Play; API REST con HTTPS; base de datos MySQL; tres roles; reservas con validación estricta; asesor de estilo con IA; registro de pagos; panel de estadísticas; anticipo en línea en modo de prueba (funcionalidad extendida).

**Fuera del alcance:** publicación en App Store, cobros con dinero real, suscripciones de las barberías, panel web, integración con WhatsApp, facturación electrónica, notificaciones push y prueba virtual del corte sobre la foto.

### 1.3 Objetivos medibles

| Objetivo                   | Indicador                                          | Meta del MVP                                                  |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| Eliminar cruces de horario | Citas superpuestas de un mismo barbero             | 0, garantizado por la regla de negocio y por la base de datos |
| Reserva rápida             | Pasos desde elegir barbería hasta confirmar        | 5 o menos                                                     |
| Respuesta ágil             | Tiempo de la API en consultas de disponibilidad    | Menos de 1 segundo                                            |
| Utilidad real              | Barberías que prueban la app                       | 1 o 2                                                         |
| Cobertura de funciones     | Funciones "Debe" implementadas                     | 100 %                                                         |
| Recomendación útil         | Recomendaciones del asesor que terminan en reserva | Al menos 20 % durante el piloto (propuesta)                   |
| Respuesta del asesor       | Tiempo desde enviar la foto hasta ver resultados   | Menos de 10 segundos                                          |
| Publicación                | Estado en Google Play                              | Publicada en producción al cierre del proyecto                |

### 1.4 Definiciones, acrónimos y abreviaturas

| Término        | Significado                                                             |
| -------------- | ----------------------------------------------------------------------- |
| MVP            | Producto mínimo viable: primera versión con las funciones esenciales    |
| MoSCoW         | Priorización en Debe, Debería, Podría y No en esta versión              |
| Bloque horario | Bloque de 15 minutos en que se ofrece la disponibilidad                 |
| Membresía      | Vínculo entre un usuario, una barbería y un rol (barbero o propietario) |
| Multi-tenencia | Varias barberías comparten el sistema sin ver los datos de las demás    |
| Cita activa    | Cita en estado pendiente o confirmada                                   |
| Estado final   | Completada, cancelada o ausencia del cliente: la cita ya no cambia      |
| Anticipo       | Pago parcial en línea al reservar, solo en modo de prueba               |
| Webhook        | Notificación que la pasarela de pagos envía a la API                    |
| JWT            | Token firmado de corta duración para autenticar solicitudes             |
| Idempotencia   | Propiedad por la que repetir una solicitud no crea duplicados           |
| ORM            | Capa que traduce objetos del código a tablas (Prisma)                   |
| LOPDP          | Ley Orgánica de Protección de Datos Personales del Ecuador              |
| EAS            | Expo Application Services: compilación y envío de la app a las tiendas  |

### 1.5 Convenciones de identificación

Cada elemento tiene un código estable para citarlo en pruebas, historias de usuario y en el AGENTS.md.

| Prefijo                                    | Elemento                 | Ejemplo   |
| ------------------------------------------ | ------------------------ | --------- |
| AUT, BUS, RES, AGE, ADM, SEG, IA, PAG, EST | Funcionalidad por módulo | RES-06    |
| RN                                         | Regla de negocio         | RN-04     |
| RNF                                        | Requisito no funcional   | RNF-07    |
| CU                                         | Caso de uso              | CU-05     |
| HU                                         | Historia de usuario      | HU-RES-01 |

Prioridad de cada funcionalidad: **Debe** (MVP), **Debería** (MVP si hay tiempo), **Podría** (extendido). Los casos de prueba obligatorios llevan el prefijo PO (PO-01 a PO-14).

**Idioma de los nombres.** Todo nombre propio del proyecto va en español, sin tildes ni ñ, para que el código se lea igual que este documento. Solo queda en inglés lo que impone la tecnología.

| Va en español                                                                                                                                                                                     | Se queda en inglés                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modelos y tablas (Cita, citas), campos (iniciaEn), estados (CONFIRMADA), rutas (/api/v1/citas), campos JSON, códigos de error (HORARIO_OCUPADO), módulos, carpetas, funciones y variables propias | Palabras reservadas de TypeScript, SQL y Prisma; nombres de librerías y sus funciones (Express, Prisma, Expo); métodos y cabeceras HTTP; el campo id; términos técnicos sin traducción usual (token, hash, webhook, JWT); archivos estándar (package.json, README.md, AGENTS.md, .env) |

### 1.6 Referencias

- Informe base: _Barberly: aplicación móvil para la gestión de citas en barberías_ (20 de octubre de 2026).
- _Barberly — Especificación detallada del proyecto_ (28 de octubre de 2026).
- ISO/IEC/IEEE 29148:2018, ingeniería de requisitos, como guía de estructura y calidad de los requisitos.
- Ley Orgánica de Protección de Datos Personales del Ecuador.
- Políticas para desarrolladores de Google Play, incluida la prueba cerrada para cuentas personales.

### 1.7 Control del documento

| Campo                   | Valor                                           |
| ----------------------- | ----------------------------------------------- |
| Proyecto                | Barberly                                        |
| Autor                   | Cristhian Tuarez                                |
| Versión                 | 1.1 (borrador para revisión del docente)        |
| Fecha                   | 5 de noviembre de 2026                          |
| Documentos que alimenta | AGENTS.md, plan de pruebas, prototipos en Figma |

## 2. Descripción general

Barberly es un sistema cliente-servidor nuevo e independiente: una app móvil consume una API REST que es la única con acceso a la base de datos y a los servicios externos de IA y pagos.

### 2.1 Problema y propuesta de valor

Muchas barberías pequeñas agendan por WhatsApp, llamadas o libreta de papel, lo que produce tres fallas concretas: citas que se cruzan, clientes que no llegan sin avisar y tiempo del barbero gastado en coordinar. El cliente, además, no sabe qué horarios están libres sin escribir y esperar respuesta.

| Usuario     | Valor que recibe                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Cliente     | Reserva en menos de un minuto viendo solo horarios libres; recibe recomendaciones de corte con IA                     |
| Barbero     | Ve su día y su semana en una sola pantalla, actualiza cada cita con un toque y conoce el estilo que quiere el cliente |
| Propietario | Controla servicios, precios, horarios y personal sin depender de un tercero; ve ingresos y rendimiento en un panel    |

### 2.2 Perspectiva del producto

El sistema se compone de cuatro elementos, descritos en la sección 8:

1. **App móvil** (React Native, Expo, TypeScript): presenta pantallas distintas según el rol activo.
2. **API REST** (Node.js, Express, TypeScript): aplica las reglas de negocio, valida y autoriza.
3. **Base de datos** MySQL 8 accedida solo mediante Prisma.
4. **Servicios externos:** un modelo de IA con visión (Gemini, Claude u OpenAI, por definir) y una pasarela de pagos ecuatoriana (Kushki o Payphone) en modo de prueba.

### 2.3 Actores y roles

Un mismo usuario puede tener roles distintos en barberías distintas, por eso el rol vive en la **membresía** y no en el usuario. El cliente es el rol por defecto y no necesita membresía.

| Rol               | Quién es                                             | Puede                                                                                                                                | No puede                                                                |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Cliente           | Cualquier usuario registrado                         | Ver barberías, reservar, cancelar sus citas, ver su historial, usar el asesor, pagar el anticipo                                     | Ver citas de otros clientes; editar servicios u horarios                |
| Barbero           | Usuario vinculado a una barbería como barbero        | Ver su agenda, cambiar el estado de sus citas, ver la ficha de estilo, registrar pagos, gestionar su disponibilidad si se le permite | Ver agendas ajenas (salvo permiso), cambiar precios, gestionar personal |
| Propietario       | Quien creó la barbería o fue designado administrador | Todo lo de su barbería: perfil, servicios, precios, horarios, personal, citas, pagos, anticipo y estadísticas                        | Acceder a datos de otras barberías                                      |
| Pasarela de pagos | Sistema externo                                      | Notificar por webhook el resultado de un cobro                                                                                       | Cualquier otra operación                                                |
| Proveedor de IA   | Sistema externo                                      | Devolver el análisis de una foto en JSON                                                                                             | Almacenar o recibir datos distintos de la foto y el catálogo            |

### 2.4 Matriz de permisos

**Propio** = solo sobre sus propios recursos. **Su barbería** = solo dentro de la barbería a la que pertenece.

| Acción                                     | Cliente | Barbero                   | Propietario                                    |
| ------------------------------------------ | ------- | ------------------------- | ---------------------------------------------- |
| Registrarse e iniciar sesión               | Sí      | Sí                        | Sí                                             |
| Ver listado, servicios, precios y barberos | Sí      | Sí                        | Sí                                             |
| Consultar disponibilidad                   | Sí      | Sí                        | Sí                                             |
| Crear una cita                             | Propio  | No                        | Su barbería (también para clientes sin cuenta) |
| Cancelar una cita                          | Propio  | Su agenda                 | Su barbería                                    |
| Ver historial de citas                     | Propio  | Su agenda                 | Su barbería                                    |
| Cambiar estado de una cita                 | No      | Su agenda                 | Su barbería                                    |
| Ver agenda diaria y semanal                | No      | Propio                    | Su barbería                                    |
| Bloquear rangos puntuales de horario       | No      | Propio                    | Su barbería                                    |
| Gestionar disponibilidad y días libres     | No      | Propio, si está permitido | Su barbería                                    |
| Crear, editar y desactivar servicios       | No      | No                        | Su barbería                                    |
| Configurar horarios de atención            | No      | No                        | Su barbería                                    |
| Agregar y quitar personal                  | No      | No                        | Su barbería                                    |
| Ver el panel de estadísticas               | No      | No                        | Su barbería                                    |
| Editar datos de la barbería                | No      | No                        | Su barbería                                    |
| Usar el asesor de estilo                   | Sí      | Sí                        | Sí                                             |
| Adjuntar foto de referencia a una cita     | Propio  | No                        | No                                             |
| Ver la ficha de estilo de una cita         | Propio  | Su agenda                 | Su barbería                                    |
| Registrar el pago de una cita              | No      | Su agenda                 | Su barbería                                    |
| Pagar un anticipo                          | Propio  | No                        | No                                             |
| Configurar el anticipo                     | No      | No                        | Su barbería                                    |

### 2.5 Reglas de pertenencia (membresía)

- Una membresía une un usuario con una barbería y un rol (barbero o propietario).
- Una barbería debe tener siempre al menos un propietario activo; el último no puede desactivarse ni quitarse a sí mismo.
- El propietario invita barberos por correo; la invitación queda pendiente hasta que el usuario la acepte.
- Quitar a un barbero con citas futuras exige reasignarlas o cancelarlas antes (RN-25).
- Toda consulta del backend filtra por la barbería de la membresía del usuario autenticado, nunca por un identificador enviado solo por el cliente.

### 2.6 Entorno operativo

| Componente              | Entorno                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Dispositivo del usuario | Teléfono Android de 5 a 7 pulgadas, orientación vertical; iOS queda preparado pero no se publica |
| Desarrollo              | Linux Mint Cinnamon, Node.js LTS, Git, Visual Studio Code, Expo Go                               |
| Servidor                | Node.js en Railway, Render o un VPS, con HTTPS                                                   |
| Base de datos           | MySQL 8 gestionado o instalado en el VPS                                                         |
| Distribución            | EAS Build y prueba cerrada de Google Play; luego producción                                      |

### 2.7 Restricciones

- Equipo reducido: se adopta un monolito modular, sin microservicios.
- Una barbería tiene un solo local y una sola zona horaria (America/Guayaquil, UTC-05:00, sin horario de verano); cambiarla no se permite en el MVP.
- Un barbero atiende un cliente a la vez.
- Los cobros con dinero real están excluidos; el anticipo solo funciona en modo de prueba.
- Los únicos datos personales almacenados son nombre, correo y teléfono; la foto del rostro no se guarda.
- MySQL no tiene restricción nativa de exclusión de rangos, por lo que los cruces se evitan con transacciones y bloqueos (sección 8.5).
- Expo Go limita los módulos nativos; se evitan en el MVP.
- Google Play exige una prueba cerrada de al menos 12 testers durante 14 días continuos antes de pedir acceso a producción.
- La interfaz está solo en español.

### 2.8 Supuestos y dependencias

| Tipo        | Descripción                                                     | Si falla                                                               |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Supuesto    | Al menos una barbería real acepta participar en el piloto       | Se simula con datos de prueba y compañeros como testers                |
| Supuesto    | Los usuarios tienen un teléfono Android con conexión a internet | Sin conexión: solo lectura de datos guardados                          |
| Dependencia | Proveedor de IA disponible y con costo por uso controlado       | La API responde IA_NO_DISPONIBLE; el resto de la app sigue funcionando |
| Dependencia | Pasarela de pagos con entorno de pruebas (Kushki o Payphone)    | El anticipo es extendido y puede omitirse sin afectar el MVP           |
| Dependencia | Plataforma de alojamiento con HTTPS                             | Cambio de proveedor; la API es portable con variables de entorno       |
| Dependencia | Aprobación de la revisión de Google Play                        | Se acepta la prueba cerrada aprobada como cierre del MVP               |

## 3. Requisitos funcionales

El sistema ofrece 104 funcionalidades repartidas en nueve módulos, de las cuales 66 son prioridad Debe y definen el MVP. Cada requisito se redacta como "El sistema debe…" y se traza a las reglas de negocio (sección 4) y a las historias de usuario (sección 6).

| Módulo                           | Prefijo | Funcionalidades | Debe | Debería | Podría |
| -------------------------------- | ------- | --------------- | ---- | ------- | ------ |
| Autenticación y usuarios         | AUT     | 10              | 6    | 3       | 1      |
| Búsqueda y consulta de barberías | BUS     | 10              | 7    | 1       | 2      |
| Reservas y citas                 | RES     | 16              | 12   | 2       | 2      |
| Agenda del barbero               | AGE     | 13              | 7    | 5       | 1      |
| Administración de barberías      | ADM     | 15              | 8    | 5       | 2      |
| Validación y seguridad           | SEG     | 16              | 11   | 4       | 1      |
| Asesor de estilo con IA          | IA      | 9               | 7    | 2       | 0      |
| Pagos                            | PAG     | 7               | 2    | 1       | 4      |
| Estadísticas                     | EST     | 8               | 6    | 2       | 0      |

### 3.1 Autenticación y usuarios (AUT)

| Código | El sistema debe…                                                                                                 | Prioridad | Trazas    |
| ------ | ---------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| AUT-01 | Registrar a un usuario con nombre, correo, teléfono y contraseña, con rol cliente por defecto, y abrir su sesión | Debe      | HU-AUT-01 |
| AUT-02 | Iniciar sesión con correo y contraseña y devolver token de acceso y token de renovación                          | Debe      | HU-AUT-02 |
| AUT-03 | Cerrar sesión invalidando el token de renovación del dispositivo y borrando la sesión local                      | Debe      | HU-AUT-02 |
| AUT-04 | Renovar el token de acceso con el token de renovación sin pedir la contraseña                                    | Debe      | HU-AUT-02 |
| AUT-05 | Permitir ver y editar nombre y teléfono; el correo no se cambia en el MVP                                        | Debería   |           |
| AUT-06 | Cambiar la contraseña exigiendo la contraseña actual                                                             | Debería   |           |
| AUT-07 | Recuperar la contraseña con un enlace o código temporal enviado por correo                                       | Podría    |           |
| AUT-08 | Consultar las membresías tras iniciar sesión y mostrar la interfaz del rol correspondiente                       | Debe      | SEG-03    |
| AUT-09 | Permitir elegir la barbería activa cuando el usuario pertenece a varias                                          | Debería   |           |
| AUT-10 | Permitir a un usuario registrar una barbería nueva y quedar como su propietario                                  | Debe      | HU-AUT-03 |

### 3.2 Búsqueda y consulta de barberías (BUS)

| Código | El sistema debe…                                                                                         | Prioridad | Trazas    |
| ------ | -------------------------------------------------------------------------------------------------------- | --------- | --------- |
| BUS-01 | Listar de forma paginada las barberías activas con nombre, dirección, portada y estado abierta o cerrada | Debe      | HU-BUS-01 |
| BUS-02 | Buscar por nombre mientras el usuario escribe, sin distinguir tildes ni mayúsculas                       | Debe      | HU-BUS-03 |
| BUS-03 | Filtrar por servicio ofrecido y por abierto ahora                                                        | Debería   |           |
| BUS-04 | Ordenar por nombre (predeterminado) o, en el futuro, por cercanía                                        | Podría    |           |
| BUS-05 | Mostrar el detalle: descripción, dirección, teléfono, horario por día, servicios y barberos              | Debe      | HU-BUS-02 |
| BUS-06 | Mostrar el catálogo de servicios activos con descripción corta, precio y duración                        | Debe      | RN-21     |
| BUS-07 | Mostrar los barberos con foto opcional y los servicios que ofrecen                                       | Debe      |           |
| BUS-08 | Mostrar el horario semanal y las excepciones visibles                                                    | Debe      |           |
| BUS-09 | Permitir marcar barberías favoritas                                                                      | Podría    |           |
| BUS-10 | Mostrar el botón Reservar en el detalle y en cada servicio                                               | Debe      | RES-01    |

### 3.3 Reservas y citas (RES)

| Código | El sistema debe…                                                                                                           | Prioridad | Trazas                   |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------ |
| RES-01 | Permitir elegir un servicio (uno solo por cita en el MVP)                                                                  | Debe      | RN-01                    |
| RES-02 | Permitir elegir un barbero específico o "Cualquiera disponible"                                                            | Debe      | RN-23                    |
| RES-03 | Mostrar un calendario que bloquee días pasados, días libres y fechas fuera de la anticipación máxima                       | Debe      | RN-06, RN-07, RN-26      |
| RES-04 | Calcular y mostrar los horarios libres para una fecha, barbero y servicio                                                  | Debe      | RN-10, RNF-01            |
| RES-05 | Mostrar un resumen con barbería, servicio, barbero, fecha, hora, duración y precio antes de confirmar                      | Debe      |                          |
| RES-06 | Crear la cita validando todas las reglas de reserva y guardarla como confirmada, o pendiente si hay anticipo               | Debe      | RN-01 a RN-12, HU-RES-01 |
| RES-07 | Listar las citas futuras activas del cliente ordenadas por fecha                                                           | Debe      | HU-RES-03                |
| RES-08 | Mostrar el historial con citas pasadas, completadas, canceladas y ausencias, filtrable por estado                          | Debe      | HU-RES-03                |
| RES-09 | Mostrar el detalle de una cita con su estado y, si aplica, el motivo de cancelación                                        | Debe      | RN-17                    |
| RES-10 | Permitir al cliente cancelar su cita dentro del plazo mínimo configurado                                                   | Debe      | RN-13, HU-RES-02         |
| RES-11 | Reprogramar una cita como cancelar y crear en una sola operación                                                           | Podría    |                          |
| RES-12 | Admitir notas del cliente de hasta 200 caracteres                                                                          | Debería   |                          |
| RES-13 | Abrir el flujo de reserva con barbería y servicio ya elegidos desde una recomendación del asesor                           | Debe      | IA-05                    |
| RES-14 | Permitir adjuntar una foto de referencia opcional, una por cita                                                            | Debe      | RN-31                    |
| RES-15 | Exigir el pago del anticipo antes de confirmar la cita cuando la barbería lo active                                        | Podría    | RN-34                    |
| RES-16 | Permitir al propietario o barbero registrar una cita a nombre de un cliente sin cuenta, identificado por nombre y teléfono | Debería   | Decisión abierta 12      |

### 3.4 Agenda del barbero (AGE)

| Código | El sistema debe…                                                                                | Prioridad | Trazas                         |
| ------ | ----------------------------------------------------------------------------------------------- | --------- | ------------------------------ |
| AGE-01 | Mostrar la vista diaria como línea de tiempo con citas, huecos libres y bloqueos                | Debe      | HU-AGE-01                      |
| AGE-02 | Mostrar la vista semanal con la cantidad de citas por día y acceso al detalle                   | Debe      |                                |
| AGE-03 | Permitir navegar entre días y semanas y volver a Hoy con un toque                               | Debe      |                                |
| AGE-04 | Mostrar el detalle de la cita: cliente, teléfono, servicio, duración, precio, notas y estado    | Debe      |                                |
| AGE-05 | Permitir marcar una cita como completada, como ausencia o cancelarla con motivo                 | Debe      | RN-14, RN-18, RN-19, HU-AGE-02 |
| AGE-06 | Destacar la próxima cita del día                                                                | Debería   |                                |
| AGE-07 | Abrir el marcador telefónico con el número del cliente                                          | Debería   |                                |
| AGE-08 | Permitir bloquear un rango horario sin traslaparse con citas activas                            | Debería   | HU-AGE-03                      |
| AGE-09 | Permitir marcar uno o varios días completos como no laborables, si el barbero tiene permiso     | Debería   | RN-26                          |
| AGE-10 | Permitir al barbero ajustar su horario laboral si el propietario lo permite                     | Podría    |                                |
| AGE-11 | Avisar de las citas pasadas que siguen confirmadas sin marcar                                   | Debería   | RN-20                          |
| AGE-12 | Mostrar la ficha de estilo: foto de referencia, notas y resumen del último servicio del cliente | Debe      | HU-IA-03                       |
| AGE-13 | Registrar el pago al completar la cita con método y monto sugerido                              | Debe      | RN-32, PAG-01                  |

### 3.5 Administración de barberías (ADM)

| Código | El sistema debe…                                                                            | Prioridad | Trazas                   |
| ------ | ------------------------------------------------------------------------------------------- | --------- | ------------------------ |
| ADM-01 | Permitir editar nombre, descripción, dirección, teléfono e imagen de portada                | Debe      |                          |
| ADM-02 | Permitir crear, editar, desactivar y reactivar servicios                                    | Debe      | RN-21, RN-22, HU-ADM-01  |
| ADM-03 | Permitir definir qué barberos ofrecen cada servicio                                         | Debe      | RN-23                    |
| ADM-04 | Permitir invitar barberos por correo, ver su estado y desactivarlos                         | Debe      | RN-25, HU-ADM-03         |
| ADM-05 | Permitir definir apertura, cierre, pausa y días cerrados por día de la semana               | Debe      | RN-24, HU-ADM-02         |
| ADM-06 | Permitir ajustar el horario de cada barbero dentro del horario de la barbería               | Debería   | RN-05                    |
| ADM-07 | Permitir registrar feriados y cierres puntuales de toda la barbería                         | Debería   | RN-26                    |
| ADM-08 | Listar todas las citas de la barbería con filtros por fecha, barbero y estado               | Debe      |                          |
| ADM-09 | Permitir cancelar o reasignar una cita a otro barbero disponible                            | Debería   | RN-25                    |
| ADM-10 | Permitir configurar tiempo mínimo de cancelación y anticipación mínima y máxima             | Debería   | RN-06, RN-07, RN-13      |
| ADM-11 | Mostrar el panel de estadísticas del propietario                                            | Debe      | EST-01                   |
| ADM-12 | Permitir decidir si los barberos editan su disponibilidad y ven la agenda de sus compañeros | Podría    |                          |
| ADM-13 | Mostrar si la barbería es visible y qué le falta para publicarse                            | Debería   | BUS regla de publicación |
| ADM-14 | Permitir describir cada servicio con etiquetas de estilo que usa el asesor de IA            | Debe      | RN-30                    |
| ADM-15 | Permitir activar el anticipo y definir su monto                                             | Podría    | RN-34                    |

### 3.6 Validación y seguridad (SEG)

| Código | El sistema debe…                                                                               | Prioridad | Trazas               |
| ------ | ---------------------------------------------------------------------------------------------- | --------- | -------------------- |
| SEG-01 | Validar con un esquema todo dato de entrada antes de llegar a la lógica de negocio             | Debe      | RNF-06               |
| SEG-02 | Verificar el token de acceso en cada ruta protegida                                            | Debe      |                      |
| SEG-03 | Verificar que el rol permita la acción según la matriz de la sección 2.4                       | Debe      |                      |
| SEG-04 | Limitar toda consulta y escritura a la barbería de la membresía del usuario                    | Debe      | RNF-05, HU-SEG-01    |
| SEG-05 | Permitir a un cliente acceder solo a sus citas y a un barbero solo a las suyas                 | Debe      | HU-SEG-03            |
| SEG-06 | Guardar contraseñas con hash seguro, firmar tokens y mantener secretos en variables de entorno | Debe      | RNF-04, HU-SEG-02    |
| SEG-07 | Aplicar las reglas RN-01 a RN-11 con transacciones                                             | Debe      | RNF-07               |
| SEG-08 | Responder errores con un formato único sin exponer detalles internos                           | Debe      |                      |
| SEG-09 | Limitar los intentos por IP y por cuenta en inicio de sesión y registro                        | Debería   |                      |
| SEG-10 | Registrar en una bitácora las acciones críticas                                                | Debería   |                      |
| SEG-11 | Configurar cabeceras de seguridad HTTP y orígenes permitidos (CORS)                            | Debería   |                      |
| SEG-12 | Registrar logs técnicos sin contraseñas ni tokens                                              | Debería   |                      |
| SEG-13 | Procesar la foto del rostro en memoria y proteger las fotos de referencia hasta eliminarlas    | Debe      | RN-27, RN-31, RNF-20 |
| SEG-14 | Limitar las consultas diarias al asesor, el tamaño de imagen y los formatos a JPEG o PNG       | Debe      | RN-29                |
| SEG-15 | Mantener las claves de IA y pasarela solo como variables de entorno del servidor               | Debe      |                      |
| SEG-16 | Aceptar webhooks solo con firma válida y procesarlos una sola vez                              | Podría    |                      |

### 3.7 Asesor de estilo con IA (IA)

| Código | El sistema debe…                                                                                           | Prioridad | Trazas           |
| ------ | ---------------------------------------------------------------------------------------------------------- | --------- | ---------------- |
| IA-01  | Pedir consentimiento explícito antes de la primera consulta                                                | Debe      | RN-28            |
| IA-02  | Permitir tomar una selfie o elegir una foto de la galería, con guía de encuadre                            | Debe      |                  |
| IA-03  | Analizar la foto para identificar forma del rostro, tipo y largo del cabello y rasgos relevantes           | Debe      | HU-IA-01         |
| IA-04  | Recomendar hasta 3 cortes del catálogo de la barbería elegida con explicación, precio, duración y barberos | Debe      | RN-30            |
| IA-05  | Permitir reservar una recomendación con el servicio ya elegido                                             | Debe      | RES-13, HU-IA-02 |
| IA-06  | Mostrar al barbero la foto de referencia y el resumen del último servicio                                  | Debe      | AGE-12, HU-IA-03 |
| IA-07  | Mostrar el contador de consultas restantes del día                                                         | Debe      | RN-29            |
| IA-08  | Mostrar al cliente su historial de recomendaciones sin la foto                                             | Debería   |                  |
| IA-09  | Permitir retirar el consentimiento y borrar el historial de consultas                                      | Debería   | RN-28            |

### 3.8 Pagos (PAG)

| Código | El sistema debe…                                                                      | Prioridad | Trazas                  |
| ------ | ------------------------------------------------------------------------------------- | --------- | ----------------------- |
| PAG-01 | Registrar método, monto y fecha del pago al completar una cita                        | Debe      | RN-32, RN-33, HU-PAG-01 |
| PAG-02 | Listar los pagos de la barbería con filtros por fecha, barbero y método               | Debe      |                         |
| PAG-03 | Permitir al propietario corregir un pago con motivo, dejando registro en la auditoría | Debería   |                         |
| PAG-04 | Cobrar el anticipo en línea con una pasarela en modo de prueba                        | Podría    | RN-34, HU-PAG-02        |
| PAG-05 | Confirmar la cita solo cuando el webhook notifique el pago aprobado                   | Podría    | SEG-16                  |
| PAG-06 | Cancelar sola la cita pendiente cuyo anticipo no se pague en 15 minutos               | Podría    | RN-34                   |
| PAG-07 | Iniciar la devolución del anticipo según la regla RN-35                               | Podría    | RN-35                   |

### 3.9 Estadísticas (EST)

| Código | El sistema debe…                                                                                    | Prioridad | Trazas    |
| ------ | --------------------------------------------------------------------------------------------------- | --------- | --------- |
| EST-01 | Mostrar tarjetas de ingresos, citas, ocupación y ticket promedio comparadas con el periodo anterior | Debe      | HU-EST-01 |
| EST-02 | Filtrar por hoy, semana, mes o rango personalizado y por barbero                                    | Debe      |           |
| EST-03 | Mostrar ingresos totales y por barbero, por día y por método de pago                                | Debe      | RN-37     |
| EST-04 | Mostrar ocupación, mapa de calor de demanda, cancelaciones y ausencias                              | Debe      | HU-EST-02 |
| EST-05 | Mostrar los servicios más solicitados y los que más ingresos generan                                | Debe      |           |
| EST-06 | Mostrar consultas del asesor, recomendaciones que terminaron en reserva y cortes más recomendados   | Debe      |           |
| EST-07 | Mostrar clientes nuevos, recurrentes, frecuentes y sin visitas en 45 días                           | Debería   |           |
| EST-08 | Exportar el reporte del periodo en PDF o CSV                                                        | Debería   | HU-EST-03 |

## 4. Reglas de negocio

Las 38 reglas son la fuente de verdad del sistema: el backend las aplica siempre, aunque la app móvil ya las valide. Los valores marcados como _propuesta_ son configurables por barbería o por el servidor.

### 4.1 Reglas de reserva

| Código | Regla                                                                                                                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-01  | Una cita tiene exactamente un cliente, una barbería, un barbero, un servicio, una fecha y una hora de inicio                                                                                                    |
| RN-02  | La hora de fin es inicio + duración del servicio al reservar, y se guarda en la cita                                                                                                                            |
| RN-03  | El precio del servicio se copia a la cita al reservar (precio congelado)                                                                                                                                        |
| RN-04  | Un barbero no puede tener dos citas activas cuyos intervalos se solapen: A y B se solapan si inicio_A < fin_B y inicio_B < fin_A. Una cita que termina a las 10:00 y otra que empieza a las 10:00 no se solapan |
| RN-05  | La cita debe caer completamente dentro del horario de atención de la barbería y del horario laboral del barbero ese día                                                                                         |
| RN-06  | No se reserva en el pasado; se exige un margen mínimo de anticipación (propuesta: 30 minutos), configurable por barbería                                                                                        |
| RN-07  | La anticipación máxima de reserva está limitada (propuesta: 30 días)                                                                                                                                            |
| RN-08  | Un cliente no puede tener dos citas activas que se solapen, aunque sean en barberías distintas                                                                                                                  |
| RN-09  | Un cliente tiene como máximo 3 citas futuras activas por barbería (propuesta)                                                                                                                                   |
| RN-10  | Los horarios se ofrecen en bloques de 15 minutos y la duración de un servicio es múltiplo de 15                                                                                                                 |
| RN-11  | Si dos clientes reservan el mismo horario a la vez, solo uno tiene éxito y el otro recibe HORARIO_OCUPADO                                                                                                       |

### 4.2 Reglas de confirmación y cancelación

| Código | Regla                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| RN-12  | Una reserva válida se confirma automáticamente; si la barbería exige anticipo, nace pendiente y se confirma al aprobarse el pago (RN-34) |
| RN-13  | El cliente cancela hasta un límite antes del inicio (propuesta: 2 horas), configurable; pasado el límite debe contactar a la barbería    |
| RN-14  | El barbero y el propietario cancelan en cualquier momento antes del inicio, indicando un motivo                                          |
| RN-15  | Una cita cancelada libera el horario de inmediato                                                                                        |
| RN-16  | Una cita cancelada, completada o ausente no cambia más de estado                                                                         |
| RN-17  | Toda cancelación guarda quién la hizo, cuándo y el motivo (opcional para el cliente, obligatorio para el personal)                       |

### 4.3 Reglas de estados operativos

| Código | Regla                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| RN-18  | Solo el barbero asignado o el propietario marcan una cita como completada o ausencia                                               |
| RN-19  | Completada o ausencia solo desde la hora de inicio en adelante                                                                     |
| RN-20  | Una cita confirmada sin marcar 24 horas después de su fin se muestra al barbero como pendiente de cierre; no cambia sola de estado |

### 4.4 Reglas de servicios, horarios y personal

| Código | Regla                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| RN-21  | Un servicio con citas futuras no se elimina: se desactiva; las citas conservan precio y duración                  |
| RN-22  | El precio es positivo con dos decimales; la duración es múltiplo de 15 entre 15 y 240 minutos                     |
| RN-23  | Un barbero solo ofrece los servicios que el propietario le asignó                                                 |
| RN-24  | Cambiar el horario de atención no cancela citas; si una queda fuera, el sistema avisa al propietario con la lista |
| RN-25  | No se quita a un barbero con citas futuras sin reasignarlas o cancelarlas antes                                   |
| RN-26  | Un día libre o bloqueo impide nuevas reservas pero no elimina las existentes                                      |

### 4.5 Reglas del asesor de estilo

| Código | Regla                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| RN-27  | La foto del rostro se procesa en memoria y se descarta; solo se guarda la recomendación                                                    |
| RN-28  | Antes de la primera consulta hay consentimiento explícito; se guarda su fecha y puede retirarse                                            |
| RN-29  | Cada cliente tiene un límite de consultas diarias (propuesta: 5), configurable en el servidor                                              |
| RN-30  | El asesor solo recomienda servicios activos de la barbería elegida (máximo 3); si ninguno encaja, lo indica y sugiere consultar al barbero |
| RN-31  | Una cita admite como máximo una foto de referencia, que se elimina al llegar a un estado final                                             |

### 4.6 Reglas de pagos y estadísticas

| Código | Regla                                                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-32  | Solo una cita completada tiene pago registrado, a lo sumo uno; el monto sugerido es el precio congelado menos el anticipo, y si se cambia se exige un motivo     |
| RN-33  | Los métodos registrables son efectivo, transferencia y DeUna; el anticipo en línea se cobra con tarjeta en la pasarela                                           |
| RN-34  | Con anticipo, la cita nace pendiente y ocupa el horario; se confirma solo con el pago aprobado y si no se paga en 15 minutos se cancela sola y libera el horario |
| RN-35  | El anticipo se devuelve si el cliente cancela dentro del plazo de RN-13 o si la barbería cancela; si cancela tarde o no llega, la barbería lo conserva           |
| RN-36  | El anticipo pagado se descuenta del pago final                                                                                                                   |
| RN-37  | Los ingresos de las estadísticas se calculan con pagos registrados y anticipos conservados, no con el precio de las citas                                        |
| RN-38  | Las estadísticas solo incluyen datos de la barbería del propietario y se calculan en su zona horaria                                                             |

### 4.7 Precisiones de este documento

Estos casos admiten más de una lectura en los documentos fuente. Este DERCAS fija el criterio para que el código y las pruebas no los interpreten cada uno a su manera.

| Caso                                                    | Criterio adoptado                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cancelación exactamente en el límite de 2 horas (RN-13) | Se permite si inicio − ahora ≥ tiempo mínimo de cancelación; con menos tiempo se responde CANCELACION_TARDIA                                       |
| Cita que termina justo cuando empieza otra (RN-04)      | No hay solapamiento; el intervalo es semiabierto \[inicio, fin)                                                                                    |
| Cita pendiente que vence (RN-34)                        | La libera un proceso programado; la consulta de disponibilidad también ignora citas pendientes con anticipoVenceEn vencido, sin esperar al proceso |
| Completar una cita (RN-32)                              | El cambio a COMPLETADA y el pago final se guardan en una sola transacción: no queda una cita completada sin su pago                                |
| Acceso sin cuenta                                       | No hay acceso de invitado en el MVP: consultar barberías, servicios, barberos y disponibilidad exige sesión iniciada (rol Pub)                     |

### 4.8 Ciclo de vida de la cita

Una cita tiene cinco estados: PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA y AUSENTE. Los tres últimos son finales (RN-16).

&#91;embedded content: estados de una cita · 5 estados, 3 finales\]

Sin anticipo la cita nace confirmada; con anticipo nace pendiente y solo el pago aprobado la confirma. Desde ahí, el personal o el cliente (con límite de tiempo) la llevan a un estado final.

| Desde                           | Hacia      | Quién                          | Condición                                     | Regla        |
| ------------------------------- | ---------- | ------------------------------ | --------------------------------------------- | ------------ |
| (creación)                      | CONFIRMADA | Sistema                        | Reserva válida sin anticipo                   | RN-12        |
| (creación)                      | PENDIENTE  | Sistema                        | Reserva válida con anticipo activo            | RN-12, RN-34 |
| PENDIENTE                       | CONFIRMADA | Sistema                        | Webhook con pago aprobado                     | RN-34        |
| PENDIENTE                       | CANCELADA  | Sistema                        | Pasan 15 minutos sin pago                     | RN-34        |
| PENDIENTE o CONFIRMADA          | CANCELADA  | Cliente                        | Dentro del plazo de cancelación               | RN-13        |
| PENDIENTE o CONFIRMADA          | CANCELADA  | Barbero o propietario          | Antes del inicio, con motivo                  | RN-14, RN-17 |
| CONFIRMADA                      | COMPLETADA | Barbero asignado o propietario | Desde la hora de inicio                       | RN-18, RN-19 |
| CONFIRMADA                      | AUSENTE    | Barbero asignado o propietario | Desde la hora de inicio                       | RN-18, RN-19 |
| COMPLETADA, CANCELADA o AUSENTE | cualquiera | Nadie                          | Estado final: se responde TRANSICION_INVALIDA | RN-16        |

## 5. Casos de uso

Barberly tiene 25 casos de uso para cinco actores; siete de ellos concentran el riesgo del sistema (reserva, cancelación, cierre de cita con pago, bloqueo de horario, asesor de estilo, personal y anticipo) y se especifican paso a paso.

&#91;embedded content: mapa de casos de uso · 3 actores, 2 sistemas externos, 6 grupos\]

El barbero y el propietario comparten el grupo de agenda y atención; solo el propietario accede a administración y estadísticas, y solo el cliente al anticipo en línea.

### 5.1 Actores

| Actor             | Tipo                 | Participa en                               |
| ----------------- | -------------------- | ------------------------------------------ |
| Cliente           | Primario             | CU-01 a CU-09, CU-16, CU-17, CU-24         |
| Barbero           | Primario             | CU-10 a CU-15, CU-25                       |
| Propietario       | Primario             | CU-04, CU-11 a CU-15, CU-18 a CU-23, CU-25 |
| Proveedor de IA   | Secundario (sistema) | CU-16                                      |
| Pasarela de pagos | Secundario (sistema) | CU-24                                      |

### 5.2 Catálogo de casos de uso

| Código | Caso de uso                                   | Actor principal      | Funcionalidades                 |
| ------ | --------------------------------------------- | -------------------- | ------------------------------- |
| CU-01  | Registrarse                                   | Cliente              | AUT-01                          |
| CU-02  | Iniciar y renovar sesión                      | Todos                | AUT-02, AUT-04, AUT-08          |
| CU-03  | Cerrar sesión                                 | Todos                | AUT-03                          |
| CU-04  | Registrar una barbería                        | Usuario autenticado  | AUT-10, ADM-13                  |
| CU-05  | Explorar y consultar una barbería             | Cliente              | BUS-01 a BUS-08, BUS-10         |
| CU-06  | Consultar disponibilidad                      | Cliente              | RES-03, RES-04                  |
| CU-07  | Reservar una cita                             | Cliente              | RES-01 a RES-06, RES-12, RES-14 |
| CU-08  | Consultar mis citas e historial               | Cliente              | RES-07 a RES-09                 |
| CU-09  | Cancelar una cita (cliente)                   | Cliente              | RES-10                          |
| CU-10  | Consultar la agenda                           | Barbero              | AGE-01 a AGE-04, AGE-06, AGE-07 |
| CU-11  | Completar una cita y registrar el pago        | Barbero              | AGE-05, AGE-13, PAG-01          |
| CU-12  | Marcar ausencia del cliente                   | Barbero              | AGE-05                          |
| CU-13  | Cancelar o reasignar una cita (personal)      | Barbero, Propietario | AGE-05, ADM-09                  |
| CU-14  | Bloquear un horario o día libre               | Barbero              | AGE-08, AGE-09                  |
| CU-15  | Consultar la ficha de estilo                  | Barbero              | AGE-12, IA-06                   |
| CU-16  | Obtener una recomendación de estilo           | Cliente              | IA-01 a IA-04, IA-07            |
| CU-17  | Reservar una recomendación                    | Cliente              | IA-05, RES-13                   |
| CU-18  | Gestionar servicios y etiquetas de estilo     | Propietario          | ADM-02, ADM-03, ADM-14          |
| CU-19  | Configurar horarios y excepciones             | Propietario          | ADM-05 a ADM-07                 |
| CU-20  | Gestionar el personal                         | Propietario          | ADM-04, ADM-09                  |
| CU-21  | Configurar reglas y anticipo                  | Propietario          | ADM-10, ADM-15                  |
| CU-22  | Consultar estadísticas y exportar el reporte  | Propietario          | EST-01 a EST-08                 |
| CU-23  | Consultar y corregir pagos                    | Propietario          | PAG-02, PAG-03                  |
| CU-24  | Pagar el anticipo                             | Cliente              | PAG-04 a PAG-07, RES-15         |
| CU-25  | Registrar una cita para un cliente sin cuenta | Barbero, Propietario | RES-16                          |

### 5.3 Especificación de los casos críticos

#### CU-07 Reservar una cita

| Elemento        | Descripción                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actor           | Cliente                                                                                                                                                |
| Precondiciones  | Sesión iniciada; la barbería está publicada y tiene al menos un servicio, un barbero y un horario activos                                              |
| Postcondiciones | Existe una cita CONFIRMADA (o PENDIENTE con anticipo) con precio y duración congelados; el horario queda ocupado; se registra la auditoría de creación |
| Reglas          | RN-01 a RN-11, RN-12                                                                                                                                   |

Flujo principal:

1. El cliente toca Reservar cita en el detalle de una barbería.
2. Elige un servicio y luego un barbero o "Cualquiera disponible".
3. Elige una fecha; el calendario solo muestra días con al menos un horario libre.
4. Elige una hora entre los horarios que la API calculó para esa fecha, barbero y servicio.
5. Revisa el resumen y, si quiere, agrega notas o una foto de referencia.
6. Confirma; la app envía POST /api/v1/citas con una clave de idempotencia.
7. La API ejecuta las validaciones de la sección 8.5 dentro de una transacción que bloquea la agenda del barbero.
8. La API guarda la cita como CONFIRMADA y devuelve 201.
9. La app muestra la pantalla de éxito con acceso a la cita.

Flujos alternativos y excepciones:

- **A1, horario ya tomado:** la API responde HORARIO_OCUPADO (409); la app vuelve a mostrar los horarios actualizados.
- **A2, anticipo activo:** la cita nace PENDIENTE con anticipoVenceEn a 15 minutos y se continúa en CU-24.
- **A3, "Cualquiera disponible":** al confirmar, la API asigna al barbero con menos citas ese día; en empate, el de menor identificador.
- **A4, pérdida de conexión al confirmar:** la app consulta Mis citas antes de reintentar; la clave de idempotencia impide el duplicado.
- **A5, regla violada:** HORARIO_PASADO, ANTICIPACION_INSUFICIENTE, FECHA_DEMASIADO_LEJANA, FUERA_DE_HORARIO, BARBERO_NO_DISPONIBLE, CRUCE_DEL_CLIENTE o LIMITE_DE_CITAS, con mensaje en español.

#### CU-09 Cancelar una cita (cliente)

| Elemento        | Descripción                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actor           | Cliente                                                                                                                                          |
| Precondiciones  | La cita es del cliente y está PENDIENTE o CONFIRMADA                                                                                             |
| Postcondiciones | La cita queda CANCELADA con quién, cuándo y motivo; el horario se libera; se inicia la devolución si había anticipo pagado y se cancela a tiempo |
| Reglas          | RN-13, RN-15, RN-16, RN-17, RN-35                                                                                                                |

Flujo principal:

1. El cliente abre el detalle de la cita y toca Cancelar.
2. La app pide confirmación y un motivo opcional.
3. La API comprueba propiedad, estado no final y que inicio − ahora ≥ tiempo mínimo de cancelación.
4. La API marca la cita CANCELADA y libera el horario de inmediato.

Flujos alternativos y excepciones:

- **A1, fuera de plazo:** CANCELACION_TARDIA (409); la app muestra el teléfono de la barbería.
- **A2, cita en estado final:** TRANSICION_INVALIDA (409).
- **A3, cita ajena:** NO_ENCONTRADO (404), sin revelar que existe.

#### CU-11 Completar una cita y registrar el pago

| Elemento        | Descripción                                                                             |
| --------------- | --------------------------------------------------------------------------------------- |
| Actor           | Barbero asignado o propietario                                                          |
| Precondiciones  | La cita está CONFIRMADA y la hora de inicio ya pasó                                     |
| Postcondiciones | La cita queda COMPLETADA con un único pago registrado, disponible para las estadísticas |
| Reglas          | RN-18, RN-19, RN-32, RN-33, RN-36                                                       |

Flujo principal:

1. El barbero abre la cita desde la vista diaria y toca Completar (dos toques desde la vista diaria, que llevan a Registrar pago).
2. La app muestra el monto sugerido (precio congelado menos anticipo) y los métodos: efectivo, transferencia o DeUna.
3. El barbero confirma o ajusta el monto indicando un motivo.
4. La API valida y, en una sola transacción, cambia el estado a COMPLETADA y crea el pago; si algo falla, no se aplica ninguno de los dos.

Flujos alternativos y excepciones:

- **A1, cita futura:** el sistema impide completarla (RN-19).
- **A2, pago ya registrado:** PAGO_YA_REGISTRADO (409).
- **A3, cita no completada:** CITA_NO_COMPLETADA (409) al intentar registrar un pago.
- **A4, monto distinto al sugerido sin motivo:** DATOS_INVALIDOS (422).

#### CU-14 Bloquear un horario o día libre

| Elemento        | Descripción                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Actor           | Barbero o propietario                                                                                     |
| Precondiciones  | Sesión iniciada con membresía activa en la barbería                                                       |
| Postcondiciones | Se crea un Bloqueo y el rango desaparece de la disponibilidad pública; las citas existentes no se alteran |
| Reglas          | RN-04 (mismo criterio de intervalo), RN-26                                                                |

Flujo principal:

1. El barbero toca Bloquear horario en la vista diaria.
2. Elige fecha, hora de inicio, hora de fin y un motivo opcional.
3. La API comprueba si hay citas activas en ese rango.
4. Si no hay conflicto, guarda el bloqueo.

Flujos alternativos y excepciones:

- **A1, hay citas activas:** la API devuelve la lista; el barbero cancela esas citas con motivo o elige otro rango. No se bloquea encima de citas sin resolverlas.
- **A2, barbero sin permiso (puedeEditarHorario falso):** puede bloquear rangos puntuales de su agenda; un día completo o un cambio de su horario base responde ACCESO_DENEGADO (403).

#### CU-16 Obtener una recomendación de estilo

| Elemento        | Descripción                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Actor           | Cliente; Proveedor de IA como actor secundario                                                                      |
| Precondiciones  | Sesión iniciada, barbería elegida con servicios activos, consultas diarias disponibles                              |
| Postcondiciones | Se guarda una ConsultaEstilo con rasgos y recomendaciones, sin la foto; se descuenta una consulta del límite diario |
| Reglas          | RN-27 a RN-30                                                                                                       |

Flujo principal:

1. El cliente toca Descubre tu estilo en una barbería.
2. Si es su primera vez, acepta el consentimiento y se guarda su fecha (consentimientoIaEn).
3. Toma o elige una foto; la app la recorta y la comprime a 1024 px en el lado mayor.
4. La API verifica sesión, consentimiento, límite diario, formato JPEG o PNG y tamaño.
5. La API envía la imagen y el catálogo de la barbería (nombre, descripción y etiquetas) al modelo de IA.
6. El modelo responde en JSON con rasgos y hasta 3 servicios recomendados con su motivo de hasta 200 caracteres.
7. La API valida el JSON con un esquema, descarta servicios inexistentes o inactivos, guarda el resultado y descarta la foto.
8. La app muestra las recomendaciones con el aviso de que son sugerencias; el cliente reserva una (CU-17) o reintenta.

Flujos alternativos y excepciones:

- **A1, sin consentimiento:** CONSENTIMIENTO_IA_REQUERIDO (403).
- **A2, límite diario alcanzado:** LIMITE_IA_ALCANZADO (429), con la hora en que se renueva.
- **A3, foto inutilizable (varias personas, oscura, borrosa):** IMAGEN_NO_VALIDA (422) con consejo para otra foto; no se descuenta la consulta.
- **A4, el proveedor falla o tarda más de 15 segundos:** IA_NO_DISPONIBLE (503); no se descuenta la consulta.
- **A5, ningún servicio encaja:** se informa y se sugiere consultar al barbero.

#### CU-20 Gestionar el personal

| Elemento        | Descripción                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------- |
| Actor           | Propietario; usuario invitado para aceptar o rechazar                                        |
| Precondiciones  | El propietario tiene membresía PROPIETARIO activa                                            |
| Postcondiciones | La membresía cambia de estado (INVITADO, ACTIVO, INACTIVO) y la acción queda en la auditoría |
| Reglas          | RN-23, RN-25 y reglas de pertenencia de la sección 2.5                                       |

Flujo principal (invitar):

1. El propietario ingresa un correo.
2. Si el correo es de un usuario registrado, la API crea una membresía en estado INVITADO y la invitación aparece en la app del usuario.
3. El usuario acepta; la membresía pasa a ACTIVO y se crea su PerfilBarbero.
4. El propietario asigna los servicios que ese barbero ofrece.

Flujos alternativos y excepciones:

- **A1, el correo no está registrado:** la API responde igual que con un correo registrado, sin crear membresía, para no revelar qué correos tienen cuenta. La app muestra un mensaje neutro: "Si tiene cuenta, recibirá la invitación".
- **A2, desactivar con citas futuras:** BARBERO_CON_CITAS (409); el propietario reasigna o cancela antes.
- **A3, último propietario activo:** no puede desactivarse ni quitarse a sí mismo.
- **A4, barbería sin barberos activos:** se despublica automáticamente y se muestra la causa.

#### CU-24 Pagar el anticipo (funcionalidad extendida)

| Elemento        | Descripción                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Actor           | Cliente; Pasarela de pagos como actor secundario                                                                                     |
| Precondiciones  | La barbería tiene el anticipo activo con monto mayor que 0; el cliente creó una cita PENDIENTE                                       |
| Postcondiciones | Con pago aprobado la cita pasa a CONFIRMADA y se registra un Pago de tipo ANTICIPO; sin pago, la cita se cancela y libera el horario |
| Reglas          | RN-34, RN-35, RN-36                                                                                                                  |

Flujo principal:

1. La API crea la cita PENDIENTE con anticipoVenceEn a 15 minutos y el cobro en la pasarela.
2. La app abre el formulario seguro de la pasarela, con aviso de modo de prueba.
3. El cliente paga con una tarjeta de prueba; la app nunca recibe datos de tarjeta.
4. La pasarela envía un webhook; la API verifica la firma, registra el anticipo y confirma la cita.

Flujos alternativos y excepciones:

- **A1, pago fallido o vencido en 15 minutos:** la cita se cancela sola y se libera el horario (ANTICIPO_VENCIDO).
- **A2, webhook duplicado:** se procesa una sola vez por la referencia única del cobro.
- **A3, webhook posterior al vencimiento:** la cita cancelada no se reactiva y el anticipo se devuelve.
- **A4, firma inválida:** FIRMA_INVALIDA (401); no se procesa.
- **A5, el cliente no llega con anticipo pagado:** la cita pasa a AUSENTE y el anticipo cuenta como ingreso (RN-35, RN-37).

## 6. Historias de usuario y criterios de aceptación

Las 29 historias de usuario traducen cada módulo a criterios verificables en formato Dado, Cuando, Entonces; cada una se convierte en una prueba de aceptación y se traza a su caso de uso.

| Código    | Historia                                                                                 | Criterios de aceptación                                                                                                                                                                                                         | Caso de uso  |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| HU-AUT-01 | Como cliente nuevo, quiero crear una cuenta para reservar citas                          | Correo nuevo y datos válidos: la cuenta se crea y entro a la app. Correo ya registrado: error claro y no se crea otra cuenta. Contraseña de menos de 8 caracteres: veo qué requisito falta                                      | CU-01        |
| HU-AUT-02 | Como usuario, quiero mantener la sesión abierta para no escribir mi contraseña cada vez  | Credenciales correctas: entro a la pantalla de mi rol. Sesión vigente: al reabrir sigo dentro. Token de renovación revocado: se me pide iniciar sesión                                                                          | CU-02, CU-03 |
| HU-AUT-03 | Como propietario, quiero registrar mi barbería para recibir citas                        | Usuario autenticado con nombre, dirección y teléfono: queda como propietario. Sin servicios y horarios configurados: no aparece en el listado público                                                                           | CU-04        |
| HU-BUS-01 | Como cliente, quiero ver las barberías disponibles para elegir dónde reservar            | Al abrir el inicio veo las barberías activas. Una barbería sin servicios activos no aparece. Al llegar al final del listado se carga la siguiente página                                                                        | CU-05        |
| HU-BUS-02 | Como cliente, quiero ver servicios y precios antes de reservar                           | El detalle muestra cada servicio con precio y duración. Un servicio desactivado no se muestra                                                                                                                                   | CU-05        |
| HU-BUS-03 | Como cliente, quiero buscar una barbería por nombre                                      | El texto "clás" devuelve las barberías cuyo nombre lo contiene, sin distinguir tildes ni mayúsculas. Sin coincidencias: mensaje de sin resultados                                                                               | CU-05        |
| HU-RES-01 | Como cliente, quiero reservar un horario libre para asegurar mi atención                 | Horario libre: la cita queda confirmada y aparece en mis próximas. Horario tomado mientras elegía: aviso y opciones actualizadas. Horario pasado: se rechaza                                                                    | CU-07        |
| HU-RES-02 | Como cliente, quiero cancelar una cita para liberar el horario                           | Cita confirmada con 2 horas o más de anticipación: pasa a cancelada y el horario queda libre. Con menos tiempo: mensaje con el teléfono de la barbería                                                                          | CU-09        |
| HU-RES-03 | Como cliente, quiero ver mis citas próximas y mi historial                               | Mis citas muestra primero las próximas ordenadas por fecha. El historial filtrado por estado muestra solo ese estado                                                                                                            | CU-08        |
| HU-RES-04 | Como cliente, quiero que dos personas no tengan el mismo horario con el mismo barbero    | Dos solicitudes simultáneas para el mismo barbero y hora: una se confirma y la otra recibe HORARIO_OCUPADO                                                                                                                      | CU-07        |
| HU-AGE-01 | Como barbero, quiero ver mis citas del día para organizar mi jornada                     | Con citas hoy: orden cronológico con su estado. Día sin citas: mensaje y opción de bloquear. Cita cancelada: deja de aparecer como activa                                                                                       | CU-10        |
| HU-AGE-02 | Como barbero, quiero marcar el resultado de cada cita                                    | Cita iniciada: Completar la pasa a completada junto con su pago. Cita futura: el sistema lo impide. Cita en estado final: el sistema lo impide                                                                                  | CU-11, CU-12 |
| HU-AGE-03 | Como barbero, quiero bloquear un horario para que no me reserven mientras no estoy       | Rango sin citas: desaparece de la disponibilidad pública. Rango con citas activas: veo el conflicto y no se crea el bloqueo hasta resolverlo                                                                                    | CU-14        |
| HU-ADM-01 | Como propietario, quiero definir servicios y precios para que los clientes los vean      | Servicio válido: aparece en el catálogo público. Con citas futuras solo se desactiva. Cambio de precio: las citas existentes conservan el anterior                                                                              | CU-18        |
| HU-ADM-02 | Como propietario, quiero configurar mis horarios para que solo se reserve cuando atiendo | La disponibilidad pública solo ofrece horas dentro del horario. Un horario que deja citas fuera muestra la lista de afectadas                                                                                                   | CU-19        |
| HU-ADM-03 | Como propietario, quiero gestionar a mi personal para controlar quién atiende            | Correo registrado: recibe invitación pendiente. Correo no registrado: veo la misma respuesta y no se crea nada. Barbero con citas futuras: el sistema pide resolverlas antes de desactivarlo                                    | CU-20        |
| HU-ADM-04 | Como propietario, quiero ver las estadísticas de mi barbería                             | Con un rango de fechas veo indicadores calculados solo con datos de mi barbería                                                                                                                                                 | CU-22        |
| HU-SEG-01 | Como propietario, quiero que los datos de mi barbería sean privados                      | Usuario de otra barbería que consulta una cita mía recibe 404. Usuario sin sesión en ruta protegida recibe 401                                                                                                                  | Transversal  |
| HU-SEG-02 | Como usuario, quiero que mi contraseña esté protegida                                    | Al inspeccionar la tabla de usuarios, ninguna contraseña es legible                                                                                                                                                             | Transversal  |
| HU-SEG-03 | Como cliente, quiero que nadie sin permiso cancele mis citas                             | Una cita de otro cliente que intento cancelar da 404 y no cambia                                                                                                                                                                | Transversal  |
| HU-IA-01  | Como cliente, quiero subir una foto y recibir cortes recomendados                        | Con consentimiento y foto válida veo hasta 3 cortes del catálogo en menos de 10 segundos. Sin servicios que encajen: mensaje que sugiere consultar al barbero. Límite diario alcanzado: LIMITE_IA_ALCANZADO y cuándo se renueva | CU-16        |
| HU-IA-02  | Como cliente, quiero reservar directamente el corte recomendado                          | Al tocar Reservar, el flujo empieza con barbería y servicio ya elegidos                                                                                                                                                         | CU-17        |
| HU-IA-03  | Como barbero, quiero ver la foto de referencia antes de la cita                          | El detalle de una cita con foto de referencia muestra la foto y las notas. Al llegar a un estado final, la foto se elimina                                                                                                      | CU-15        |
| HU-IA-04  | Como cliente, quiero que mi foto no se guarde                                            | Tras una consulta terminada no existe copia de la foto del rostro en el almacenamiento del servidor                                                                                                                             | CU-16        |
| HU-PAG-01 | Como barbero, quiero registrar el pago al terminar una cita                              | Cita completada: un pago en efectivo por el monto sugerido queda guardado y aparece en los ingresos del día. Segundo pago: PAGO_YA_REGISTRADO. Cita no completada: el sistema lo impide                                         | CU-11        |
| HU-PAG-02 | Como propietario, quiero exigir un anticipo para reducir ausencias                       | Con anticipo activo la cita queda pendiente hasta pagar. Sin pago en 15 minutos se cancela y el horario se libera. Cancelación con 2 horas o más de anticipación: se inicia la devolución                                       | CU-21, CU-24 |
| HU-EST-01 | Como propietario, quiero ver mis ingresos del mes por barbero                            | Con el filtro Mes veo el total y el desglose por barbero, y ambos suman lo mismo                                                                                                                                                | CU-22        |
| HU-EST-02 | Como propietario, quiero saber qué horas tienen más demanda                              | El mapa de calor resalta las franjas con más citas                                                                                                                                                                              | CU-22        |
| HU-EST-03 | Como propietario, quiero exportar el reporte                                             | Exportar descarga un PDF o CSV con los mismos valores que el panel                                                                                                                                                              | CU-22        |

## 7. Requisitos no funcionales

Los 22 requisitos no funcionales fijan metas medibles para el MVP; los valores numéricos son propuestas que se ajustarán tras las primeras pruebas. Los tres que más condicionan el diseño son RNF-05 (aislamiento entre barberías), RNF-07 (cero citas solapadas) y RNF-20 (ninguna foto del rostro almacenada).

| Código | Categoría      | Requisito                                                                                                                                        | Verificación                                                  |
| ------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| RNF-01 | Rendimiento    | La consulta de disponibilidad responde en menos de 1 s con una barbería mediana (hasta 5 barberos y 1.000 citas)                                 | Prueba de carga con datos sembrados                           |
| RNF-02 | Rendimiento    | Las demás consultas responden en menos de 500 ms en condiciones normales                                                                         | Medición con Postman o Bruno                                  |
| RNF-03 | Rendimiento    | La app abre su pantalla principal en menos de 3 s en un Android de gama media                                                                    | Prueba manual cronometrada                                    |
| RNF-04 | Seguridad      | Ninguna contraseña ni token se guarda o registra en texto plano                                                                                  | Revisión de código y base de datos                            |
| RNF-05 | Seguridad      | Un usuario no lee ni modifica datos de otra barbería                                                                                             | Pruebas automáticas de aislamiento                            |
| RNF-06 | Seguridad      | Se rechaza el 100 % de las solicitudes con datos que incumplen el esquema                                                                        | Pruebas de validación por endpoint                            |
| RNF-07 | Integridad     | Cero citas solapadas por barbero, incluso con solicitudes simultáneas                                                                            | 20 solicitudes simultáneas al mismo horario: solo una exitosa |
| RNF-08 | Usabilidad     | Un cliente nuevo completa su primera reserva sin ayuda en menos de 3 min                                                                         | Prueba con usuarios reales                                    |
| RNF-09 | Usabilidad     | La interfaz funciona en pantallas de 5 a 7 pulgadas en vertical                                                                                  | Pruebas en el teléfono disponible                             |
| RNF-10 | Compatibilidad | Funciona en Android y se publica en Google Play; el código evita APIs exclusivas de una plataforma para publicar en iOS sin rehacer la app       | Prueba en dispositivo Android                                 |
| RNF-11 | Mantenibilidad | Backend en módulos con responsabilidades claras (monolito modular) y TypeScript con tipado estricto                                              | Revisión de estructura y compilación sin errores              |
| RNF-12 | Mantenibilidad | ESLint y Prettier con la misma configuración para todo el equipo                                                                                 | Linter en cada cambio                                         |
| RNF-13 | Testabilidad   | Las reglas RN-01 a RN-38 tienen pruebas automáticas                                                                                              | Informe de pruebas                                            |
| RNF-14 | Disponibilidad | Durante el piloto el servidor está disponible en el horario de atención de la barbería participante                                              | Seguimiento durante el piloto                                 |
| RNF-15 | Portabilidad   | El proyecto se instala y ejecuta desde cero con un README y un solo comando de configuración por aplicación                                      | Prueba de instalación limpia                                  |
| RNF-16 | Datos          | Copia de seguridad de la base de datos antes de cada cambio de esquema y antes del piloto                                                        | Lista de verificación del despliegue                          |
| RNF-17 | Privacidad     | Solo se almacenan los datos personales necesarios; el correo de un usuario no se muestra a otros                                                 | Revisión de las respuestas de la API                          |
| RNF-18 | Idioma         | Interfaz íntegra en español y mensajes de error comprensibles para no técnicos                                                                   | Revisión de textos                                            |
| RNF-19 | Rendimiento    | El asesor de estilo devuelve recomendaciones en menos de 10 s con conexión móvil normal                                                          | Medición cronometrada en el piloto                            |
| RNF-20 | Privacidad     | Ninguna foto del rostro queda en el servidor ni en los registros técnicos                                                                        | Revisión del almacenamiento y de los logs                     |
| RNF-21 | Costo          | El gasto en IA durante el piloto se mantiene dentro del presupuesto fijado, gracias al límite diario                                             | Panel de consumo del proveedor                                |
| RNF-22 | Publicación    | La app cumple las políticas de Google Play: política de privacidad pública, seguridad de datos completa y permisos justificados (cámara y fotos) | Aprobación de la revisión de Google Play                      |

### 7.1 Datos de prueba

Un script de semillas (seed) crea dos barberías, tres barberos, varios servicios, horarios, clientes y citas, para probar todos los roles sin cargar datos a mano. Las pruebas automáticas del asesor usan un proveedor de IA simulado con respuestas fijas, para no gastar consultas reales.

## 8. Arquitectura del sistema

Barberly usa una arquitectura cliente-servidor de tres capas (presentación, lógica de negocio y datos) con un monolito modular en el servidor: la app solo habla con la API, y solo la API toca la base de datos y los servicios externos.

&#91;embedded content: arquitectura en tres capas · app, API y datos\]

La API aplica las reglas del negocio y es la única que accede a MySQL y a los servicios externos; las claves de la IA y de la pasarela viven solo en el servidor.

### 8.1 Capa de presentación

App móvil en React Native con Expo y TypeScript. Muestra pantallas por rol, recoge las acciones del usuario y se comunica con la API.

| Necesidad                                           | Solución                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Navegación                                          | Expo Router                                                       |
| Consulta a la API, caché y estados de carga y error | TanStack Query                                                    |
| Formularios y validación                            | React Hook Form con Zod (esquemas compartidos con la API)         |
| Token de sesión                                     | expo-secure-store                                                 |
| Fechas, horas y zonas horarias                      | Luxon                                                             |
| Foto del cliente                                    | expo-image-picker y expo-image-manipulator (compresión a 1024 px) |
| Gráficos del panel                                  | react-native-gifted-charts                                        |

### 8.2 Capa de lógica de negocio

API en Node.js, Express y TypeScript. Un solo servidor dividido en módulos que corresponden a los de la sección 3: autenticación, barberías, reservas, agenda, administración, seguridad, asesor de estilo, pagos y estadísticas. Dentro de cada módulo una solicitud sigue este recorrido: ruta, controlador, servicio y acceso a datos con Prisma. Las reglas de negocio viven en los servicios, nunca en las rutas.

### 8.3 Capa de datos

MySQL 8 con Prisma ORM, que define los modelos, ejecuta consultas parametrizadas (previene inyección SQL) y gestiona migraciones versionadas. El modelo se detalla en la sección 9.

### 8.4 Decisiones de arquitectura

| Decisión               | Elección                                                                      | Justificación                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Comunicación           | API REST con JSON                                                             | Simple, conocida y suficiente para el MVP                                                                                                 |
| Estructura del backend | Monolito modular                                                              | Evita la complejidad de microservicios con un equipo reducido; los módulos permiten crecer con orden                                      |
| Base de datos          | MySQL                                                                         | Modelo relacional adecuado para citas, servicios y horarios, con amplia disponibilidad de alojamiento                                     |
| App móvil              | React Native con Expo                                                         | Un solo código para Android e iOS y pruebas rápidas con Expo Go                                                                           |
| Lenguaje               | TypeScript en app y API                                                       | Un solo lenguaje, tipos compartidos y menos errores                                                                                       |
| Acceso a datos         | Prisma ORM                                                                    | Modelos tipados y migraciones versionadas                                                                                                 |
| IA                     | Modelo de visión de un proveedor externo, consumido desde la API              | Entrenar un modelo propio no es viable en el plazo; un modelo multimodal ya reconoce rostros y cabello y responde en formato estructurado |
| Pagos                  | Registro manual en el núcleo; pasarela local en modo de prueba como extensión | El registro alimenta las estadísticas sin riesgo; la pasarela demuestra el flujo sin dinero real                                          |
| Publicación            | Google Play primero, iOS después                                              | Google Play cobra 25 USD una vez y Apple 99 USD por año                                                                                   |
| Fechas                 | UTC en la base, zona de la barbería al mostrar                                | Evita errores de zona horaria en citas                                                                                                    |

### 8.5 Concurrencia y validación de reservas

El punto más delicado del backend es impedir que dos clientes reserven el mismo hueco a la vez. Consultar y luego insertar no basta, porque ambas solicitudes pueden pasar la consulta antes de que alguna guarde. La creación de la cita se ejecuta entonces dentro de una transacción con dos protecciones:

1. **Bloqueo de la agenda del barbero:** `SELECT … FOR UPDATE` sobre la fila del barbero, con revalidación del cruce justo antes de insertar. Es la garantía principal, porque MySQL no ofrece restricciones de exclusión de rangos.
2. **Respaldo en la base de datos:** una restricción única que impide dos citas activas con el mismo barbero y la misma hora de inicio, para que un error de lógica no deje pasar un duplicado.

Decisiones de diseño que este DERCAS añade para que las dos protecciones funcionen:

- **Lecturas actuales dentro de la transacción:** las comprobaciones de cruce usan `SELECT … FOR UPDATE` o aislamiento READ COMMITTED, para ver las citas confirmadas por transacciones concurrentes.
- **Restricción única solo sobre citas activas:** MySQL no admite índices únicos parciales, y una restricción simple sobre (perfilBarberoId, iniciaEn) impediría reservar un horario cancelado. Se resuelve con una columna generada `inicioActivo`, que vale iniciaEn solo si el estado es PENDIENTE o CONFIRMADA (y NULL en otro caso), y un índice único sobre (perfilBarberoId, inicioActivo). Prisma no declara columnas generadas en su esquema, así que se añade con una migración SQL manual.
- **Reglas del cliente (RN-08, RN-09):** también se bloquea la fila del cliente. Para evitar interbloqueos, los bloqueos se toman siempre en el mismo orden: barbero y luego cliente.
- **Reintentos:** la restricción única (clienteId, claveIdempotencia) hace que repetir la solicitud devuelva la cita ya creada en lugar de un duplicado.

La API ejecuta estas validaciones en orden y se detiene en la primera que falle:

| Orden | Validación                                                      | Código de error                                                   |
| ----- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1     | Usuario autenticado y con rol cliente (o personal con permiso)  | AUTENTICACION_REQUERIDA, ACCESO_DENEGADO                          |
| 2     | Datos con el formato correcto                                   | DATOS_INVALIDOS                                                   |
| 3     | Barbería, servicio y barbero existen y están activos            | NO_ENCONTRADO, RECURSO_INACTIVO                                   |
| 4     | El barbero ofrece ese servicio                                  | SERVICIO_NO_OFRECIDO                                              |
| 5     | La fecha no es pasada y respeta la anticipación                 | HORARIO_PASADO, ANTICIPACION_INSUFICIENTE, FECHA_DEMASIADO_LEJANA |
| 6     | La cita cabe en el horario de la barbería y del barbero         | FUERA_DE_HORARIO                                                  |
| 7     | Sin bloqueos ni días libres en el intervalo                     | BARBERO_NO_DISPONIBLE                                             |
| 8     | Sin cruce con otras citas del barbero                           | HORARIO_OCUPADO                                                   |
| 9     | El cliente no tiene otra cita que se solape ni supera su límite | CRUCE_DEL_CLIENTE, LIMITE_DE_CITAS                                |

### 8.6 Cálculo de disponibilidad

La disponibilidad de un barbero para una fecha y un servicio se calcula en el backend así:

1. Tomar el horario laboral del barbero ese día, recortado al horario de la barbería.
2. Restar bloqueos manuales y días libres (vacaciones, descansos, almuerzo).
3. Restar las citas activas del barbero.
4. Del tiempo libre resultante, generar inicios cada 15 minutos donde quepa la duración completa del servicio.
5. Descartar los inicios anteriores a la hora actual más la anticipación mínima.

Con "Cualquiera disponible" se calcula la disponibilidad de todos los barberos que ofrecen el servicio y se unen los horarios libres. El rendimiento exigido (RNF-01) se apoya en el índice (perfilBarberoId, iniciaEn, estado).

### 8.7 Integración con servicios externos

La app móvil nunca se conecta directo a un servicio externo: todo pasa por la API, que guarda las credenciales como variables de entorno.

**Asesor de estilo.** El proveedor (Gemini, Claude u OpenAI) queda aislado detrás de una interfaz propia, de modo que puede cambiarse sin tocar el resto del código. Se elegirá comparando los tres con las mismas 10 fotos de prueba, según calidad y costo.

```ts
interface ProveedorAsesorEstilo {
  analizar(entrada: {
    imagen: Buffer; // solo en memoria
    tipoMime: "image/jpeg" | "image/png";
    catalogo: {
      id: string;
      nombre: string;
      descripcion?: string;
      etiquetasEstilo?: string;
    }[];
  }): Promise<{
    rasgos: {
      formaRostro: string;
      tipoCabello: string;
      largoCabello: string;
      notas?: string;
    };
    recomendaciones: { servicioId: string; motivo: string }[]; // máximo 3, motivo ≤ 200 caracteres
  }>;
}
```

La API valida la respuesta del modelo con un esquema Zod, descarta servicios inexistentes o inactivos (RN-30), aplica un tiempo máximo de 15 segundos y responde IA_NO_DISPONIBLE si el proveedor falla. Las pruebas automáticas usan una implementación simulada de la interfaz.

**Anticipo en línea (extendido).** La API crea el cobro en la pasarela (Kushki o Payphone, en modo de prueba) y la app abre el formulario seguro de la pasarela. La pasarela notifica el resultado por webhook; la API verifica la firma, registra el anticipo una sola vez (por la referencia única del cobro) y recién entonces confirma la cita.

### 8.8 Tecnologías y herramientas

| Grupo      | Tecnología                                                     | Utilidad                                                |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Backend    | Node.js LTS, Express, TypeScript                               | API REST                                                |
| Backend    | Zod                                                            | Validación de entradas con esquemas compartidos         |
| Backend    | bcrypt o argon2                                                | Hash de contraseñas                                     |
| Backend    | jsonwebtoken                                                   | Tokens de acceso sin sesiones en el servidor            |
| Datos      | MySQL 8, Prisma ORM                                            | Almacenamiento, consultas y migraciones                 |
| IA         | Gemini, Claude u OpenAI                                        | Análisis de la foto y recomendación                     |
| Pagos      | Kushki o Payphone en modo de prueba                            | Anticipo sin dinero real                                |
| Calidad    | Vitest o Jest, Supertest                                       | Pruebas de lógica y de API                              |
| Calidad    | ESLint, Prettier                                               | Código consistente, clave al trabajar con agentes de IA |
| Calidad    | Bruno                                                          | Colección de pruebas de la API versionada con Git       |
| Despliegue | Railway, Render o VPS; EAS Build y Submit; Google Play Console | Servidor con HTTPS y publicación de la app              |
| Gestión    | Git y GitHub, Visual Studio Code, Figma, Trello                | Versiones, edición, prototipos y tareas                 |

Se fijan las versiones principales (Node.js LTS, SDK de Expo, Prisma y MySQL 8) en los archivos de dependencias, porque Expo cambia de SDK con frecuencia y puede romper la compatibilidad con Expo Go.

### 8.9 Organización del repositorio

Un único repositorio Git (monorepo) con la app, la API y la documentación. Si Expo y los workspaces de npm dan problemas, las dos aplicaciones pueden quedar independientes dentro del mismo repositorio y compartir tipos de forma sencilla.

```text
barberly/
├── apps/
│   ├── movil/                  # App móvil con Expo
│   └── api/                    # Backend con Express
│       ├── prisma/
│       │   └── schema.prisma   # Modelo de datos (sección 9)
│       └── src/modulos/
│           └── reservas/       # Un módulo: rutas, controlador, servicio y pruebas
├── paquetes/
│   └── compartido/             # Tipos y esquemas Zod comunes
├── docs/                       # DERCAS y documentación
├── pruebas/                    # Pruebas de extremo a extremo
├── AGENTS.md
├── .gitignore
└── README.md
```

### 8.10 Tiempo y zona horaria

- Todas las fechas se guardan en UTC; se muestran en la zona de la barbería (America/Guayaquil, UTC-05:00, sin horario de verano).
- La API recibe y devuelve fechas en ISO 8601.
- Los horarios de atención se guardan como hora local por día de la semana, no como fechas absolutas.
- El estado abierta o cerrada se calcula en el servidor con la zona de la barbería, no con la hora del teléfono.

## 9. Modelo de datos

El modelo relacional se define con Prisma sobre MySQL 8 y tiene 13 entidades; la regla central es que la cita guarda su propio precio y duración, y que toda entidad de una barbería lleva su identificador de barbería para sostener el aislamiento entre negocios.

### 9.1 Convenciones

- Nombres en español, sin tildes ni ñ, para que el código se lea igual que este documento: modelos en PascalCase (`Cita`, `PerfilBarbero`), campos en camelCase (`iniciaEn`, `barberiaId`), tablas en minúsculas, plural y con guion bajo (`citas`, `perfiles_barbero`), estados en mayúsculas (`CONFIRMADA`).
- Las claves foráneas terminan en `Id` (`clienteId`) y las fechas con hora terminan en `En` (`creadoEn`, `canceladaEn`).
- Identificadores UUID (36 caracteres) para no exponer conteos; el campo se llama `id`.
- Todas las tablas incluyen `creadoEn` y `actualizadoEn` en UTC.
- Dinero como decimal con dos decimales, nunca punto flotante.
- Borrado lógico (`activo` o `estado`) en entidades con historial; borrado físico solo en datos sin valor histórico.
- Los tipos son orientativos y se ajustan al escribir el esquema.

### 9.2 Entidades y campos

| Modelo (Prisma)   | Tabla               | Qué guarda                                                             |
| ----------------- | ------------------- | ---------------------------------------------------------------------- |
| Usuario           | usuarios            | La cuenta de cualquier persona: cliente, barbero o propietario         |
| Barberia          | barberias           | Datos del negocio y sus reglas de cancelación, anticipación y anticipo |
| Membresia         | membresias          | El rol de un usuario dentro de una barbería                            |
| PerfilBarbero     | perfiles_barbero    | Los datos visibles del barbero dentro de una barbería                  |
| Servicio          | servicios           | El catálogo: precio, duración y etiquetas de estilo                    |
| ServicioBarbero   | servicios_barbero   | Qué servicios ofrece cada barbero                                      |
| HorarioAtencion   | horarios_atencion   | El horario semanal de la barbería o de un barbero                      |
| Bloqueo           | bloqueos            | Descansos, días libres, vacaciones y cierres                           |
| Cita              | citas               | La reserva, con su precio y duración congelados                        |
| ConsultaEstilo    | consultas_estilo    | El resultado del asesor de IA, sin la foto                             |
| Pago              | pagos               | El pago final o el anticipo de una cita                                |
| TokenRenovacion   | tokens_renovacion   | Las sesiones abiertas por dispositivo                                  |
| RegistroAuditoria | registros_auditoria | La bitácora de acciones críticas                                       |

#### Usuario

| Campo              | Tipo         | Restricciones                                       |
| ------------------ | ------------ | --------------------------------------------------- |
| id                 | UUID         | Clave primaria                                      |
| nombre             | texto (80)   | Obligatorio                                         |
| correo             | texto (120)  | Único, en minúsculas                                |
| telefono           | texto (20)   | Obligatorio, normalizado                            |
| claveHash          | texto        | Hash de la contraseña; obligatorio, nunca se expone |
| activo             | booleano     | Por defecto verdadero                               |
| consentimientoIaEn | fecha y hora | Nulo si no hay consentimiento (RN-28)               |

#### Barberia

| Campo                  | Tipo           | Restricciones                                            |
| ---------------------- | -------------- | -------------------------------------------------------- |
| id                     | UUID           | Clave primaria                                           |
| nombre                 | texto (80)     | Obligatorio, de 3 a 80 caracteres                        |
| descripcion            | texto (500)    | Opcional                                                 |
| direccion              | texto (200)    | Obligatorio                                              |
| telefono               | texto (20)     | Obligatorio                                              |
| urlPortada             | texto          | Opcional                                                 |
| zonaHoraria            | texto          | Por defecto America/Guayaquil                            |
| minutosMinCancelacion  | entero         | Por defecto 120 (RN-13)                                  |
| minutosMinAnticipacion | entero         | Por defecto 30 (RN-06)                                   |
| diasMaxAnticipacion    | entero         | Por defecto 30 (RN-07)                                   |
| publicada              | booleano       | Calculado según los requisitos de publicación            |
| anticipoActivo         | booleano       | Por defecto falso                                        |
| montoAnticipo          | decimal (10,2) | Obligatorio y mayor que 0 si anticipoActivo es verdadero |

#### Membresia y PerfilBarbero

| Entidad       | Campo                 | Tipo        | Restricciones                             |
| ------------- | --------------------- | ----------- | ----------------------------------------- |
| Membresia     | id                    | UUID        | Clave primaria                            |
| Membresia     | usuarioId, barberiaId | UUID        | Claves foráneas; el par es único          |
| Membresia     | rol                   | enumeración | PROPIETARIO o BARBERO                     |
| Membresia     | estado                | enumeración | INVITADO, ACTIVO o INACTIVO               |
| PerfilBarbero | id                    | UUID        | Clave primaria                            |
| PerfilBarbero | membresiaId           | UUID        | Único; vincula al barbero con la barbería |
| PerfilBarbero | nombreVisible         | texto (80)  | Nombre que ven los clientes               |
| PerfilBarbero | urlFoto               | texto       | Opcional                                  |
| PerfilBarbero | puedeEditarHorario    | booleano    | Por defecto falso                         |

#### Servicio y ServicioBarbero

| Entidad         | Campo                       | Tipo          | Restricciones                                       |
| --------------- | --------------------------- | ------------- | --------------------------------------------------- |
| Servicio        | id                          | UUID          | Clave primaria                                      |
| Servicio        | barberiaId                  | UUID          | Clave foránea                                       |
| Servicio        | nombre                      | texto (80)    | Único dentro de la barbería                         |
| Servicio        | descripcion                 | texto (300)   | Opcional                                            |
| Servicio        | etiquetasEstilo             | texto (200)   | Etiquetas separadas por comas, usadas por el asesor |
| Servicio        | precio                      | decimal (8,2) | Mayor que 0                                         |
| Servicio        | duracionMinutos             | entero        | Múltiplo de 15 entre 15 y 240                       |
| Servicio        | activo                      | booleano      | Por defecto verdadero                               |
| ServicioBarbero | perfilBarberoId, servicioId | UUID          | Clave compuesta: qué servicios ofrece cada barbero  |

#### HorarioAtencion y Bloqueo

| Entidad         | Campo                    | Tipo             | Restricciones                                    |
| --------------- | ------------------------ | ---------------- | ------------------------------------------------ |
| HorarioAtencion | id, barberiaId           | UUID             | Clave primaria y clave foránea                   |
| HorarioAtencion | perfilBarberoId          | UUID             | Opcional; vacío = horario general de la barbería |
| HorarioAtencion | diaSemana                | entero (0 a 6)   | Día de la semana                                 |
| HorarioAtencion | horaApertura, horaCierre | hora local       | Cierre posterior a la apertura                   |
| HorarioAtencion | inicioPausa, finPausa    | hora local       | Opcionales, dentro del horario                   |
| Bloqueo         | id, barberiaId           | UUID             | Clave primaria y clave foránea                   |
| Bloqueo         | perfilBarberoId          | UUID             | Opcional; vacío = cierre de toda la barbería     |
| Bloqueo         | iniciaEn, terminaEn      | fecha y hora UTC | Fin posterior al inicio                          |
| Bloqueo         | motivo                   | texto (200)      | Opcional                                         |

#### Cita

| Campo                                              | Tipo                   | Restricciones                                            |
| -------------------------------------------------- | ---------------------- | -------------------------------------------------------- |
| id                                                 | UUID                   | Clave primaria                                           |
| barberiaId, clienteId, perfilBarberoId, servicioId | UUID                   | Claves foráneas; clienteId opcional (sección 9.6)        |
| nombreCliente, telefonoCliente                     | texto (80), texto (20) | Solo en citas de clientes sin cuenta (sección 9.6)       |
| iniciaEn, terminaEn                                | fecha y hora UTC       | Fin = inicio + duración                                  |
| precioReserva                                      | decimal (8,2)          | Precio congelado (RN-03)                                 |
| duracionReserva                                    | entero                 | Duración congelada en minutos (RN-02)                    |
| estado                                             | enumeración            | PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA o AUSENTE   |
| notas                                              | texto (200)            | Opcional                                                 |
| canceladaPorId, canceladaEn, motivoCancelacion     | UUID, fecha, texto     | Se llenan solo al cancelar (RN-17)                       |
| claveIdempotencia                                  | texto                  | Opcional, única por cliente                              |
| urlFotoReferencia                                  | texto                  | Opcional; se elimina al llegar a un estado final (RN-31) |
| anticipoVenceEn                                    | fecha y hora           | Solo en citas pendientes por anticipo (RN-34)            |

#### ConsultaEstilo y Pago

| Entidad        | Campo                 | Tipo           | Restricciones                                        |
| -------------- | --------------------- | -------------- | ---------------------------------------------------- |
| ConsultaEstilo | id                    | UUID           | Clave primaria                                       |
| ConsultaEstilo | usuarioId, barberiaId | UUID           | Claves foráneas                                      |
| ConsultaEstilo | rasgos                | JSON           | Rasgos detectados; nunca la foto                     |
| ConsultaEstilo | recomendaciones       | JSON           | Hasta 3 servicios con su motivo                      |
| ConsultaEstilo | citaId                | UUID           | Opcional; se completa si terminó en reserva          |
| Pago           | id                    | UUID           | Clave primaria                                       |
| Pago           | citaId, barberiaId    | UUID           | Claves foráneas                                      |
| Pago           | tipo                  | enumeración    | ANTICIPO o FINAL                                     |
| Pago           | metodo                | enumeración    | EFECTIVO, TRANSFERENCIA, DEUNA o TARJETA             |
| Pago           | monto                 | decimal (10,2) | Mayor que 0                                          |
| Pago           | estado                | enumeración    | PENDIENTE, APROBADO, REEMBOLSADO o FALLIDO           |
| Pago           | referenciaPasarela    | texto          | Única; solo en anticipos en línea                    |
| Pago           | motivoAjuste          | texto (200)    | Obligatorio si el monto difiere del sugerido (RN-32) |

#### TokenRenovacion y RegistroAuditoria

| Entidad           | Campos                                                                            | Notas                                                                        |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| TokenRenovacion   | id, usuarioId, tokenHash, expiraEn, revocadoEn, dispositivo                       | Sesiones revocables por dispositivo; el token se guarda solo como hash       |
| RegistroAuditoria | id, barberiaId, actorId, accion, tipoEntidad, entidadId, antes, despues, creadoEn | Bitácora de acciones críticas; no se edita ni se elimina desde la aplicación |

### 9.3 Relaciones principales

- Un Usuario tiene muchas Membresia; una Barberia tiene muchas Membresia.
- Una Membresia de rol BARBERO (o de un propietario que también atiende) tiene un PerfilBarbero.
- Una Barberia tiene muchos Servicio, HorarioAtencion, Bloqueo y Cita.
- Un PerfilBarbero ofrece muchos Servicio a través de ServicioBarbero.
- Una Cita pertenece a un cliente (Usuario), un PerfilBarbero, un Servicio y una Barberia.
- Un Usuario tiene muchas ConsultaEstilo; una consulta pertenece a una barbería y puede vincularse a una cita.
- Una Cita tiene como máximo un Pago FINAL y un Pago ANTICIPO.

&#91;embedded content: modelo de datos · 12 de 13 entidades\]

El diagrama muestra las claves foráneas principales; Cita es el centro del modelo y los pagos y las consultas de estilo cuelgan de ella.

### 9.4 Índices y restricciones que protegen las reglas

| Objetivo                               | Medida en la base de datos                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Buscar disponibilidad rápido           | Índice en Cita (perfilBarberoId, iniciaEn, estado)                                                                                |
| Listar citas de un cliente             | Índice en Cita (clienteId, iniciaEn)                                                                                              |
| Listar citas de una barbería por fecha | Índice en Cita (barberiaId, iniciaEn)                                                                                             |
| Evitar correo duplicado                | Restricción única en Usuario.correo                                                                                               |
| Evitar doble reserva exacta            | Restricción única sobre (perfilBarberoId, inicioActivo), una columna generada que solo tiene valor en citas activas (sección 8.5) |
| Evitar reintentos duplicados           | Restricción única en Cita (clienteId, claveIdempotencia)                                                                          |
| Evitar membresía duplicada             | Restricción única en Membresia (usuarioId, barberiaId)                                                                            |
| Idempotencia de webhooks               | Restricción única en Pago.referenciaPasarela                                                                                      |
| Estadísticas de pagos                  | Índice en Pago (barberiaId, creadoEn)                                                                                             |
| Límite diario del asesor               | Índice en ConsultaEstilo (usuarioId, creadoEn)                                                                                    |
| Integridad referencial                 | Claves foráneas con restricción de borrado, sin borrado en cascada para citas                                                     |

### 9.5 Reglas de integridad de datos

- No se elimina físicamente un usuario, barbero, servicio o cita con historial: se desactiva.
- Las citas conservan el precio y la duración del momento de la reserva.
- Toda fecha se guarda en UTC y se convierte a hora local solo al presentar.
- Los datos de auditoría no se editan ni se eliminan desde la aplicación.
- La foto del rostro nunca llega al modelo de datos; solo se persiste el resultado de la consulta.

### 9.6 Citas de clientes sin cuenta

Los documentos fuente no coinciden: el informe base permite una cita sin usuario, con nombre y teléfono del cliente, mientras que la especificación detallada exige un cliente con cuenta. Para cumplir RES-16 se propone que clienteId sea opcional y que la cita guarde nombreCliente y telefonoCliente cuando se registra a mano, con la regla de que una cita tiene un cliente con cuenta o un nombre y teléfono, nunca ninguno. La decisión queda abierta en la sección 14.3.

### 9.7 Ejemplo del esquema en Prisma

Así se escribe la entidad Cita. Las palabras en inglés del ejemplo (`model`, `enum`, `String`, `DateTime`, `@id`, `@relation`, `@@map`…) son del lenguaje de Prisma y no se traducen; todo lo demás va en español.

```prisma
enum EstadoCita {
  PENDIENTE
  CONFIRMADA
  COMPLETADA
  CANCELADA
  AUSENTE
}

model Cita {
  id                String     @id @default(uuid())
  barberiaId        String
  clienteId         String?
  perfilBarberoId   String
  servicioId        String
  iniciaEn          DateTime
  terminaEn         DateTime
  precioReserva     Decimal    @db.Decimal(8, 2)
  duracionReserva   Int
  estado            EstadoCita
  notas             String?    @db.VarChar(200)
  claveIdempotencia String?
  creadoEn          DateTime   @default(now())
  actualizadoEn     DateTime   @updatedAt

  barberia      Barberia      @relation(fields: [barberiaId], references: [id])
  cliente       Usuario?      @relation(fields: [clienteId], references: [id])
  perfilBarbero PerfilBarbero @relation(fields: [perfilBarberoId], references: [id])
  servicio      Servicio      @relation(fields: [servicioId], references: [id])

  @@unique([clienteId, claveIdempotencia])
  @@index([perfilBarberoId, iniciaEn, estado])
  @@map("citas")
}
```

El ejemplo omite algunos campos de la tabla de la sección 9.2 para que se lea mejor; el esquema real los incluye todos.

## 10. Especificación de interfaces

Barberly expone una API REST versionada bajo /api/v1 que la app móvil consume, y una interfaz de usuario con una navegación distinta por rol; las dos interfaces externas (IA y pasarela) se describen en la sección 8.7.

### 10.1 Convenciones de la API

- JSON en solicitudes y respuestas, con campos en camelCase y en español (los mismos nombres del modelo de datos) y fechas en ISO 8601 UTC.
- Rutas en español, en minúsculas y con guiones, bajo el prefijo /api/v1.
- En la API, `barberoId` es el id del PerfilBarbero.
- Autenticación con la cabecera estándar `Authorization: Bearer <token de acceso>`; su nombre lo fija el protocolo HTTP y no se traduce.
- La barbería activa se deduce de la ruta (/barberias/:id/...) y se verifica contra la membresía del usuario.
- Paginación con `pagina` y `limite` (por defecto 1 y 10, máximo 50); la respuesta incluye el total.

Respuesta exitosa:

```json
{
  "datos": { "id": "..." },
  "meta": { "pagina": 1, "limite": 10, "total": 42 }
}
```

Respuesta de error:

```json
{
  "error": {
    "codigo": "HORARIO_OCUPADO",
    "mensaje": "El horario seleccionado ya no está disponible.",
    "detalles": []
  }
}
```

### 10.2 Endpoints

Roles: C = cliente, B = barbero, P = propietario, Pub = cualquier usuario autenticado.

#### Autenticación y usuarios

| Método | Ruta                          | Función                                                                          | Rol     | Éxito |
| ------ | ----------------------------- | -------------------------------------------------------------------------------- | ------- | ----- |
| POST   | /autenticacion/registro       | Registrar usuario y abrir sesión (devuelve los mismos tokens que iniciar sesión) | Pública | 201   |
| POST   | /autenticacion/iniciar-sesion | Iniciar sesión                                                                   | Pública | 200   |
| POST   | /autenticacion/renovar        | Renovar token de acceso                                                          | Pública | 200   |
| POST   | /autenticacion/cerrar-sesion  | Cerrar sesión                                                                    | Pub     | 204   |
| GET    | /usuarios/yo                  | Ver perfil y membresías                                                          | Pub     | 200   |
| PATCH  | /usuarios/yo                  | Editar perfil                                                                    | Pub     | 200   |
| PATCH  | /usuarios/yo/clave            | Cambiar contraseña                                                               | Pub     | 204   |
| GET    | /invitaciones/mias            | Ver mis invitaciones                                                             | Pub     | 200   |
| PATCH  | /invitaciones/:id             | Aceptar o rechazar invitación                                                    | Pub     | 200   |

#### Barberías y consulta

| Método | Ruta                          | Función                                                 | Rol | Éxito |
| ------ | ----------------------------- | ------------------------------------------------------- | --- | ----- |
| GET    | /barberias                    | Listar barberías (búsqueda y filtros)                   | Pub | 200   |
| GET    | /barberias/:id                | Detalle de barbería                                     | Pub | 200   |
| GET    | /barberias/:id/servicios      | Servicios activos                                       | Pub | 200   |
| GET    | /barberias/:id/barberos       | Barberos activos                                        | Pub | 200   |
| GET    | /barberias/:id/disponibilidad | Horarios libres (servicioId, barberoId opcional, fecha) | Pub | 200   |

#### Reservas

| Método | Ruta                 | Función                                               | Rol     | Éxito |
| ------ | -------------------- | ----------------------------------------------------- | ------- | ----- |
| POST   | /citas               | Crear cita                                            | C       | 201   |
| GET    | /citas/mias          | Mis citas (estado, desde, hasta)                      | C       | 200   |
| GET    | /citas/:id           | Detalle de una cita                                   | C, B, P | 200   |
| PATCH  | /citas/:id/cancelar  | Cancelar cita                                         | C, B, P | 200   |
| POST   | /barberias/:id/citas | Crear cita manual para un cliente sin cuenta (RES-16) | B, P    | 201   |

#### Agenda del barbero

| Método | Ruta                               | Función                                                                                                                         | Rol           | Éxito |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| GET    | /barberias/:id/agenda              | Agenda (fecha, o desde y hasta)                                                                                                 | B, P          | 200   |
| PATCH  | /citas/:id/estado                  | Marcar ausente, o completada con su pago en una sola transacción (cuerpo: metodo, monto y motivoAjuste si difiere del sugerido) | B, P          | 200   |
| POST   | /barberias/:id/bloqueos            | Crear bloqueo; un día libre exige permiso al barbero                                                                            | B, P          | 201   |
| GET    | /barberias/:id/bloqueos            | Listar bloqueos                                                                                                                 | B, P          | 200   |
| DELETE | /barberias/:id/bloqueos/:bloqueoId | Quitar un bloqueo                                                                                                               | B (propio), P | 204   |

#### Administración de la barbería

| Método | Ruta                                 | Función                                                                     | Rol | Éxito |
| ------ | ------------------------------------ | --------------------------------------------------------------------------- | --- | ----- |
| POST   | /barberias                           | Crear barbería                                                              | Pub | 201   |
| PATCH  | /barberias/:id                       | Editar datos y reglas                                                       | P   | 200   |
| POST   | /barberias/:id/servicios             | Crear servicio                                                              | P   | 201   |
| PATCH  | /barberias/:id/servicios/:servicioId | Editar, desactivar o reactivar servicio                                     | P   | 200   |
| PUT    | /barberias/:id/horarios              | Reemplazar el horario de atención                                           | P   | 200   |
| GET    | /barberias/:id/personal              | Listar personal e invitaciones                                              | P   | 200   |
| POST   | /barberias/:id/personal/invitaciones | Invitar barbero; misma respuesta si el correo no está registrado (CU-20 A1) | P   | 201   |
| PATCH  | /barberias/:id/personal/:membresiaId | Activar, desactivar o asignar servicios                                     | P   | 200   |
| GET    | /barberias/:id/citas                 | Todas las citas de la barbería                                              | P   | 200   |
| PATCH  | /citas/:id/reasignar                 | Reasignar cita a otro barbero                                               | P   | 200   |
| GET    | /barberias/:id/estadisticas          | Panel de estadísticas (desde, hasta, barberoId)                             | P   | 200   |
| GET    | /barberias/:id/estadisticas/exportar | Exportar el reporte (formato: pdf o csv)                                    | P   | 200   |

#### Asesor de estilo, pagos y webhooks

| Método | Ruta                           | Función                                             | Rol      | Éxito |
| ------ | ------------------------------ | --------------------------------------------------- | -------- | ----- |
| PUT    | /usuarios/yo/consentimiento-ia | Dar o retirar el consentimiento                     | C        | 200   |
| POST   | /barberias/:id/asesor-estilo   | Analizar la foto y recomendar (imagen en multipart) | C        | 200   |
| GET    | /consultas-estilo/mias         | Historial de consultas                              | C        | 200   |
| PUT    | /citas/:id/foto-referencia     | Adjuntar la foto de referencia                      | C        | 200   |
| DELETE | /citas/:id/foto-referencia     | Quitar la foto de referencia                        | C        | 204   |
| GET    | /citas/:id/ficha-estilo        | Ficha de estilo de la cita                          | B, P     | 200   |
| POST   | /citas/:id/pagos               | Registrar el pago de una cita                       | B, P     | 201   |
| PATCH  | /pagos/:id                     | Corregir un pago con motivo                         | P        | 200   |
| GET    | /barberias/:id/pagos           | Pagos (desde, hasta, barberoId, metodo)             | P        | 200   |
| POST   | /citas/:id/anticipo            | Crear el cobro del anticipo                         | C        | 201   |
| POST   | /pagos/webhook                 | Notificación de la pasarela, con firma verificada   | Pasarela | 200   |

### 10.3 Ejemplo: crear una cita

Solicitud `POST /api/v1/citas`:

```json
{
  "barberiaId": "b1f0...",
  "servicioId": "s7a2...",
  "barberoId": "c3d9...",
  "iniciaEn": "2026-11-05T15:00:00Z",
  "notas": "Corte bajo a los lados",
  "claveIdempotencia": "7f3c-..."
}
```

Respuesta 201:

```json
{
  "datos": {
    "id": "a8e1...",
    "estado": "CONFIRMADA",
    "iniciaEn": "2026-11-05T15:00:00Z",
    "terminaEn": "2026-11-05T15:45:00Z",
    "precioReserva": "8.00",
    "servicio": { "id": "s7a2...", "nombre": "Corte clásico" },
    "barbero": { "id": "c3d9...", "nombreVisible": "Carlos" }
  }
}
```

### 10.4 Códigos de estado HTTP

| Código | Cuándo se usa                                                 |
| ------ | ------------------------------------------------------------- |
| 200    | Consulta o actualización correcta                             |
| 201    | Recurso creado                                                |
| 204    | Operación correcta sin cuerpo                                 |
| 400    | Solicitud mal formada                                         |
| 401    | Falta autenticación o el token venció                         |
| 403    | Autenticado pero sin permiso para la acción                   |
| 404    | El recurso no existe o pertenece a otra barbería              |
| 409    | Conflicto de negocio (horario ocupado, cita en estado final)  |
| 422    | Datos con formato correcto que violan una regla de validación |
| 429    | Demasiadas solicitudes                                        |
| 500    | Error interno (mensaje genérico; el detalle solo en logs)     |
| 503    | Un servicio externo (IA o pasarela) no respondió a tiempo     |

El catálogo completo de códigos de error de negocio está en el anexo B.

### 10.5 Interfaz de usuario móvil

La app muestra una navegación distinta según el rol activo. Los prototipos se diseñan en Figma antes de programarlos.

| Rol         | Pestañas inferiores              | Pantallas principales                                                                                                                                                                                         |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todos       |                                  | Bienvenida, Inicio de sesión, Registro, Perfil (editar, cambiar contraseña, cerrar sesión, cambiar de barbería o rol), Invitaciones                                                                           |
| Cliente     | Explorar, Mis citas, Perfil      | Explorar, Detalle de barbería, Reserva (servicio, barbero, fecha y hora, resumen), Reserva exitosa, Mis citas (Próximas e Historial), Detalle de cita, Descubre tu estilo, Recomendaciones, Pago del anticipo |
| Barbero     | Hoy, Semana, Perfil              | Hoy (próxima cita, línea de tiempo, bloqueos), Semana, Detalle de cita con ficha de estilo, Bloquear horario, Mi disponibilidad, Registrar pago                                                               |
| Propietario | Resumen, Agenda, Gestión, Perfil | Resumen (ingresos y ocupación de hoy, avisos), Agenda de la barbería, Gestión (datos, servicios, personal, horarios, reglas, pagos, anticipo), Estadísticas (se abre desde Resumen y Gestión)                 |

Estados y mensajes comunes:

| Situación          | Comportamiento                                                           |
| ------------------ | ------------------------------------------------------------------------ |
| Cargando           | Indicador o esqueleto de la pantalla                                     |
| Vacío              | Mensaje explicativo y, si aplica, botón para la acción siguiente         |
| Error de red       | Mensaje con botón Reintentar                                             |
| Sesión vencida     | La app intenta renovar el token; si no puede, lleva al inicio de sesión  |
| Acción destructiva | Pide confirmación (cancelar, desactivar)                                 |
| Error de negocio   | Se traduce a texto comprensible en español a partir del código de la API |
| Sin conexión       | Datos guardados en modo lectura con aviso; las escrituras se bloquean    |

### 10.6 Principios de usabilidad

- Español como único idioma del MVP, con textos centralizados para traducir después.
- Flujo de reserva de máximo cinco pasos, con barra de progreso.
- Botones principales al alcance del pulgar, con tamaño táctil mínimo de 44 por 44 puntos.
- Contraste suficiente y texto legible sin zoom.
- Desde la vista diaria, dos toques llevan al barbero a Registrar pago (abrir la cita y tocar Completar); al confirmar, la cita queda completada con su pago.

### 10.7 Documentación y pruebas de la API

La API se documenta con una especificación OpenAPI y se mantiene una colección de Bruno (o Postman) con un caso por endpoint y por cada error de negocio relevante.

## 11. Seguridad y privacidad

El riesgo de seguridad más grave de Barberly es que el propietario de una barbería vea o modifique datos de otra; por eso el aislamiento por membresía se aplica en una capa central y se prueba endpoint por endpoint.

### 11.1 Amenazas y controles

| Amenaza                                                                                                       | Control                                                                                                                          | Requisitos                |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Fuga de datos entre barberías                                                                                 | Filtro por barbería obtenido de la membresía, nunca del cliente; respuesta 404 en lugar de 403                                   | SEG-04, RNF-05, HU-SEG-01 |
| Doble reserva por solicitudes simultáneas                                                                     | Transacción con bloqueo y restricción única de respaldo                                                                          | SEG-07, RNF-07            |
| Escalada de privilegios                                                                                       | Autorización por rol en cada solicitud, consultando la membresía vigente                                                         | SEG-03, SEG-05            |
| Filtración de la base de datos                                                                                | Contraseñas con hash bcrypt o argon2; tokens de renovación guardados como hash                                                   | SEG-06, RNF-04            |
| Robo de token en el teléfono                                                                                  | Almacenamiento seguro (expo-secure-store); token de acceso de 15 minutos; renovación revocable por dispositivo                   | AUT-03, AUT-04            |
| Fuerza bruta en el inicio de sesión                                                                           | Límite por IP y por cuenta; espera temporal tras 5 intentos fallidos                                                             | SEG-09                    |
| Inyección SQL                                                                                                 | Consultas parametrizadas con Prisma y validación de entrada con esquemas                                                         | SEG-01                    |
| Enumeración de cuentas o recursos                                                                             | Mensaje genérico "Correo o contraseña incorrectos"; 404 para recursos ajenos                                                     | AUT-02                    |
| Abuso o sobrecosto del asesor de IA                                                                           | Límite diario por cliente, tamaño máximo de imagen y solo JPEG o PNG                                                             | SEG-14, RNF-21            |
| Exposición de la foto del rostro                                                                              | Procesamiento en memoria, consentimiento explícito, sin registro en logs                                                         | SEG-13, RNF-20            |
| Instrucciones maliciosas en el catálogo o en la imagen hacia el modelo de IA (control añadido en este DERCAS) | El modelo solo responde con un JSON de esquema fijo y la API acepta únicamente identificadores de servicios activos del catálogo | RN-30                     |
| Notificación falsa de la pasarela                                                                             | Verificación de firma y procesamiento único por referencia                                                                       | SEG-16                    |
| Filtración de secretos                                                                                        | Variables de entorno en el servidor y archivo de ejemplo sin valores reales; nada en el repositorio                              | SEG-15                    |
| Fuga por logs                                                                                                 | Registros técnicos sin contraseñas, tokens ni fotos                                                                              | SEG-12                    |

### 11.2 Cadena de verificación de una solicitud

Toda solicitud protegida pasa por estas capas en orden; si una falla, se corta y se responde con el error correspondiente.

| Orden | Capa                                                                           | Resultado si falla         |
| ----- | ------------------------------------------------------------------------------ | -------------------------- |
| 1     | Límite de solicitudes: rechaza abusos antes de hacer trabajo costoso           | 429                        |
| 2     | Autenticación: valida el token de acceso                                       | 401                        |
| 3     | Contexto de barbería: identifica la barbería activa y la membresía del usuario | 404 o 403                  |
| 4     | Autorización: comprueba que el rol permita la acción                           | 403                        |
| 5     | Validación de datos: revisa cuerpo, parámetros y consulta contra el esquema    | 400 o 422                  |
| 6     | Regla de propiedad: el recurso pertenece a la barbería o al usuario            | 404                        |
| 7     | Lógica de negocio: aplica las reglas del módulo                                | 409 o 422                  |
| 8     | Auditoría: registra la acción crítica                                          | Sin efecto para el usuario |

### 11.3 Aislamiento entre barberías

- Todo modelo que pertenezca a una barbería guarda su identificador de barbería.
- Las consultas del backend se construyen siempre con el filtro de barbería de la membresía; un middleware central lo aplica para que ningún endpoint dependa de recordarlo.
- Si un recurso existe pero es de otra barbería, la API responde 404 para no revelar su existencia.
- Pruebas automáticas dedicadas: cada endpoint se prueba con un usuario de otra barbería y debe fallar.
- Los permisos por barbería no viajan en el token: el backend los consulta en cada solicitud, para que un cambio de rol surta efecto de inmediato.

### 11.4 Autenticación y sesiones

| Elemento                      | Especificación                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Token de acceso               | JWT de corta duración (propuesta: 15 minutos) con el identificador del usuario          |
| Token de renovación           | Larga duración (propuesta: 7 a 30 días), guardado como hash y revocable por dispositivo |
| Almacenamiento en el teléfono | expo-secure-store, no almacenamiento simple                                             |
| Inicio de sesión fallido      | Mensaje genérico sin revelar si falló el correo o la contraseña                         |
| Intentos fallidos             | Espera temporal tras 5 intentos desde la misma cuenta o IP                              |
| Transporte                    | Solo HTTPS fuera del entorno local de desarrollo                                        |

Validaciones de los datos de registro:

| Campo      | Regla                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Nombre     | Obligatorio, 2 a 80 caracteres, sin caracteres de control                                                      |
| Correo     | Obligatorio, formato válido, único, guardado en minúsculas                                                     |
| Teléfono   | Obligatorio, 7 a 15 dígitos, formato ecuatoriano aceptado (09XXXXXXXX o +5939XXXXXXXX), normalizado al guardar |
| Contraseña | Mínimo 8 caracteres, al menos una letra y un número, máximo 72                                                 |

### 11.5 Validación de datos

- Se valida en la app para dar respuesta rápida y siempre otra vez en el backend, que es la única validación confiable.
- Se rechaza todo campo no esperado en el cuerpo de la solicitud.
- Los identificadores se validan como tales (UUID) antes de consultar la base de datos.
- Los textos libres (notas, descripciones) se limpian y limitan en longitud.
- Las consultas usan Prisma, que parametriza y previene la inyección SQL.

### 11.6 Privacidad y protección de datos personales

- Datos personales mínimos: nombre, correo y teléfono; el correo nunca se expone a terceros.
- La foto del rostro se procesa en memoria, se envía solo al modelo de IA y se descarta; solo se guarda el resultado de la recomendación (RN-27).
- La foto de referencia se guarda con acceso restringido y se elimina cuando la cita llega a un estado final (RN-31).
- Consentimiento explícito antes de la primera consulta, con fecha guardada y posibilidad de retirarlo y borrar el historial (RN-28, IA-09).
- Conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador: consentimiento explícito, uso limitado a la recomendación y eliminación oportuna.
- La política de privacidad pública exigida por Google Play explica este tratamiento.
- La app nunca recibe ni guarda datos de tarjeta; el cobro ocurre en el formulario de la pasarela y, en modo de prueba, la interfaz lo indica.

### 11.7 Auditoría

| Evento                                    | Datos guardados                                 |
| ----------------------------------------- | ----------------------------------------------- |
| Cita creada                               | Usuario, cita, barbería, fecha y hora           |
| Cita cancelada                            | Usuario que cancela, motivo, momento            |
| Cambio de estado de cita                  | Estado anterior, estado nuevo, usuario          |
| Cambio de precio o servicio               | Valor anterior, valor nuevo, usuario            |
| Alta o baja de personal                   | Persona afectada, quien lo hizo                 |
| Inicio de sesión fallido repetido         | Cuenta, IP, momento                             |
| Pago registrado o corregido               | Cita, monto, método, motivo del ajuste, usuario |
| Anticipo aprobado, vencido o devuelto     | Cita, monto, referencia de la pasarela, momento |
| Consentimiento del asesor dado o retirado | Usuario, momento                                |

### 11.8 Otras medidas de endurecimiento

- Cabeceras de seguridad HTTP y orígenes permitidos (CORS) configurados.
- Formato único de errores, sin exponer detalles internos ni trazas.
- Secretos solo en variables de entorno, con un archivo de ejemplo sin valores reales.
- Los datos de auditoría no se editan ni se eliminan desde la aplicación.

## 12. Plan de verificación y validación

El MVP se da por cerrado cuando los 14 casos de prueba obligatorios pasan, las funcionalidades Debe están probadas y al menos una barbería real usó la app; la prioridad de las pruebas va a lo que más daño causaría si fallara: cruces de horario y fuga de datos entre barberías.

### 12.1 Estrategia de pruebas

| Nivel                 | Qué se prueba                                                                                            | Herramienta                               | Prioridad |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------- |
| Unitarias             | Reglas de negocio: disponibilidad, solapamiento, transiciones de estado, validación de cancelación       | Vitest o Jest                             | Alta      |
| Integración de API    | Endpoints completos contra una base de prueba: permisos, aislamiento entre barberías, errores de negocio | Supertest con Vitest o Jest               | Alta      |
| Concurrencia          | Varias reservas simultáneas al mismo horario                                                             | Script con solicitudes en paralelo        | Alta      |
| Servicios externos    | Asesor con proveedor simulado; webhooks con firmas de prueba                                             | Dobles de prueba y sandbox de la pasarela | Alta      |
| Manual en dispositivo | Recorridos completos por rol en Android con Expo Go                                                      | Lista de verificación                     | Alta      |
| Aceptación            | Criterios de cada historia de usuario                                                                    | Lista de verificación por historia        | Alta      |
| Contrato de API       | Respuestas con el formato documentado                                                                    | Colección Bruno o Postman                 | Media     |
| Interfaz móvil        | Componentes y flujos críticos (reserva, cancelación)                                                     | React Native Testing Library              | Media     |

### 12.2 Casos de prueba obligatorios

| Código | Caso                                                                | Resultado esperado                                                       | Trazas                  |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------- |
| PO-01  | Reservar en un horario libre                                        | Éxito: cita CONFIRMADA                                                   | RN-12, HU-RES-01        |
| PO-02  | Reservar en un horario ocupado                                      | HORARIO_OCUPADO                                                          | RN-04, RN-11            |
| PO-03  | Reservar con un servicio que termina justo cuando empieza otra cita | Éxito, sin solapamiento                                                  | RN-04                   |
| PO-04  | Reservar en el pasado, fuera de horario y en día libre              | HORARIO_PASADO, FUERA_DE_HORARIO y BARBERO_NO_DISPONIBLE respectivamente | RN-05, RN-06, RN-26     |
| PO-05  | Veinte solicitudes simultáneas al mismo horario                     | Se crea una sola cita                                                    | RNF-07, HU-RES-04       |
| PO-06  | Usuario de otra barbería consulta, edita o cancela recursos ajenos  | 404 en todos los casos                                                   | RNF-05, HU-SEG-01       |
| PO-07  | Un cliente intenta acciones de barbero o propietario                | 403                                                                      | Matriz 2.4              |
| PO-08  | Cancelación dentro y fuera del tiempo mínimo                        | Éxito dentro; CANCELACION_TARDIA fuera                                   | RN-13, HU-RES-02        |
| PO-09  | Cambiar una cita en estado final                                    | TRANSICION_INVALIDA                                                      | RN-16                   |
| PO-10  | Desactivar un barbero con citas futuras                             | BARBERO_CON_CITAS                                                        | RN-25                   |
| PO-11  | Consulta al asesor con el proveedor simulado                        | Hasta 3 recomendaciones, todas del catálogo de la barbería               | RN-30, HU-IA-01         |
| PO-12  | Consulta al asesor por encima del límite diario                     | LIMITE_IA_ALCANZADO                                                      | RN-29                   |
| PO-13  | Registrar el pago de una cita no completada o por segunda vez       | CITA_NO_COMPLETADA o PAGO_YA_REGISTRADO                                  | RN-32, HU-PAG-01        |
| PO-14  | Revisar el servidor tras una consulta al asesor                     | No queda copia de la foto                                                | RN-27, HU-IA-04, RNF-20 |

Casos adicionales recomendados por este DERCAS: reintento con la misma clave de idempotencia (una sola cita), reserva de un horario cancelado previamente (debe poder tomarse), anticipo vencido que libera el horario, y webhook duplicado o con firma inválida.

### 12.3 Definición de terminado

Una funcionalidad está terminada cuando:

- Cumple todos los criterios de aceptación de su historia de usuario.
- Tiene pruebas automáticas de sus reglas críticas y todas pasan.
- El linter y la compilación de TypeScript no muestran errores.
- Se probó manualmente en el teléfono Android.
- La documentación de la API y el README reflejan el cambio.
- Otra persona, o una revisión formal, aprobó los cambios antes de integrarlos a la rama principal.

### 12.4 Plan de validación con barberías reales

1. **Selección:** contactar a una o dos barberías pequeñas y explicarles el objetivo del proyecto.
2. **Carga inicial:** registrar sus servicios, precios, horarios y barberos junto con el propietario.
3. **Uso guiado:** los barberos usan la agenda durante una o dos semanas y se invita a clientes habituales a reservar.
4. **Observación:** anotar dudas, errores, pasos confusos y funciones que echan en falta.
5. **Entrevista breve:** preguntar al propietario y a los barberos qué les ahorró tiempo y qué cambiarían.
6. **Decisión:** priorizar mejoras para la siguiente versión según lo observado.

Indicadores del piloto: citas creadas, cancelaciones, ausencias, errores reportados, tiempo medio de reserva, conversión del asesor (meta de al menos 20 %) y satisfacción de 1 a 5 de propietario, barberos y clientes.

### 12.5 Criterios para cerrar el MVP

- Todas las funcionalidades Debe están implementadas y probadas.
- Los 14 casos de prueba obligatorios pasan.
- No hay errores conocidos que permitan cruces de horario o acceso a datos de otra barbería.
- Al menos una barbería real usó la app durante el piloto.
- La app está publicada en Google Play, o la prueba cerrada está aprobada si la revisión de Google aún no termina.

## 13. Despliegue, publicación y plan de desarrollo

Para que una barbería use Barberly, la API y la base de datos deben vivir en un servidor con HTTPS y no en el computador de desarrollo; la publicación en Google Play exige una prueba cerrada de 14 días, por lo que conviene iniciarla unas tres semanas antes de la entrega.

### 13.1 Despliegue del MVP

| Elemento               | Especificación                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API                    | Servicio de Node.js en Railway, Render o un VPS, según costo y disponibilidad                                                                             |
| Base de datos          | MySQL gestionado por el mismo proveedor o instalado en el VPS; migraciones con `prisma migrate deploy`                                                    |
| HTTPS                  | Certificado de la plataforma; la app solo se conecta por HTTPS                                                                                            |
| Variables de entorno   | Credenciales de base de datos, secretos de tokens, clave de IA y credenciales de la pasarela en el panel del proveedor, nunca en el repositorio           |
| Copias de seguridad    | Respaldo automático y una prueba de restauración antes de empezar con las barberías (RNF-16)                                                              |
| Entornos               | Desarrollo local con su propia base de datos y producción con sus propias variables                                                                       |
| Distribución de la app | Expo Go en desarrollo; EAS Build para una versión de prueba que se distribuye por la prueba interna de Google Play; development build si Expo Go no basta |

### 13.2 Publicación en Google Play

1. Crear la cuenta de desarrollador en Google Play Console (pago único de 25 USD y verificación de identidad).
2. Generar el paquete AAB firmado con EAS Build y subirlo con EAS Submit o desde la consola.
3. Completar la ficha de la tienda: nombre, descripción, ícono, capturas, clasificación de contenido y la sección de seguridad de datos, que declara el uso de cámara y fotos.
4. Publicar la política de privacidad en una URL pública que explique el tratamiento de las fotos y de los datos de las citas.
5. Ejecutar la prueba cerrada: las cuentas personales creadas después del 13 de noviembre de 2023 necesitan al menos 12 testers inscritos de forma continua durante 14 días antes de solicitar acceso a producción. Los compañeros de clase y los barberos pueden ser los testers.
6. Solicitar acceso a producción y publicar tras la revisión de Google.

### 13.3 Preparación para iOS

El mismo código sirve para iOS. Publicarlo requiere la membresía del Apple Developer Program (99 USD por año) pero no una Mac, porque EAS Build compila y firma en la nube. Por costo y tiempo queda como trabajo futuro (RNF-10).

### 13.4 Entorno de desarrollo

Linux Mint Cinnamon con Node.js, npm, Git y Visual Studio Code ya instalados; se verifican versiones antes de instalar algo nuevo. El desarrollo inicia con Expo Go, por lo que no hace falta Android Studio ni un emulador al comienzo. El teléfono y el computador deben estar en la misma red, o se usa el modo túnel de Expo.

### 13.5 Uso de agentes de IA en el desarrollo

Los agentes de IA apoyan el desarrollo con tareas concretas (un módulo, un endpoint, una pantalla, pruebas) y cada cambio se revisa y aprueba antes de integrarse a la rama principal. El archivo AGENTS.md define arquitectura, convenciones de código, comandos de ejecución y las reglas que los agentes deben seguir; se redacta a partir de las secciones 4, 8 y 11 de este documento.

### 13.6 Plan por fases

La duración real depende del tiempo del equipo y del calendario del curso; se fija el orden y lo que entrega cada fase.

| Fase                          | Alcance                                                                                                                      | Entrega                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0. Preparación                | Repositorio y monorepo, Node, Expo, TypeScript, MySQL, Prisma, AGENTS.md, linter, formato, primera migración vacía           | Proyecto que compila y corre en el teléfono          |
| 1. Base y autenticación       | Modelo de datos completo, semillas, registro, inicio de sesión, renovación, roles y membresías                               | Usuarios que entran según su rol                     |
| 2. Catálogo y administración  | Registro de barbería, servicios con etiquetas de estilo, horarios, personal, publicación y consulta                          | Barbería configurable y visible para clientes        |
| 3. Reservas                   | Disponibilidad, creación y cancelación, validaciones, concurrencia, citas próximas e historial                               | Flujo de reserva completo y seguro                   |
| 4. Agenda del barbero y pagos | Vistas diaria y semanal, cambio de estados, bloqueos, días libres, registro del pago                                         | Barberos que operan su jornada y cobran desde la app |
| 5. Asesor de estilo con IA    | Consentimiento, captura y compresión, integración con el modelo, recomendaciones reservables, ficha de estilo, límite diario | El diferencial funcionando de punta a punta          |
| 6. Estadísticas               | Panel del propietario, gráficos, mapa de calor, exportación                                                                  | Propietario que ve el rendimiento de su barbería     |
| 7. Pulido y seguridad         | Límite de solicitudes, auditoría, errores y textos, pruebas de aislamiento, concurrencia y privacidad de fotos               | MVP estable                                          |
| 8. Piloto y prueba cerrada    | Pruebas con barberías reales y prueba cerrada de Google Play con 12 testers durante 14 días                                  | Informe de resultados                                |
| 9. Publicación                | Ficha de la tienda, política de privacidad, acceso a producción                                                              | Barberly en Google Play                              |
| Extendida. Anticipo en línea  | Pasarela en modo de prueba, webhooks, vencimiento y devoluciones                                                             | Reservas con anticipo demostrables sin dinero real   |

## 14. Riesgos, decisiones abiertas y trabajo futuro

Los riesgos que más pueden afectar el proyecto son el alcance excesivo para el tiempo disponible y el retraso por la prueba cerrada de Google Play, ambos de probabilidad alta; los dos riesgos de mayor impacto técnico (cruces de horario y fuga entre barberías) ya tienen mitigaciones de diseño.

### 14.1 Riesgos y mitigación

| Riesgo                                                         | Probabilidad | Impacto  | Mitigación                                                                                            |
| -------------------------------------------------------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| Cruces de horario por reservas simultáneas                     | Media        | Alto     | Transacción con bloqueo, restricción única de respaldo y prueba de concurrencia (PO-05)               |
| Filtración de datos entre barberías                            | Baja         | Muy alto | Filtro por membresía en toda consulta, respuesta 404 y pruebas de aislamiento (PO-06)                 |
| Alcance demasiado grande para el tiempo                        | Alta         | Alto     | Priorización MoSCoW, entrega por fases y dejar los Podría para después                                |
| Retraso en la publicación por la prueba cerrada de Google Play | Alta         | Alto     | Iniciar la prueba con al menos 12 testers unas tres semanas antes de la entrega                       |
| Errores de zona horaria en citas                               | Media        | Alto     | Guardar en UTC, convertir solo al mostrar, pruebas con fechas límite                                  |
| Código generado por agentes de IA con errores o inconsistente  | Media        | Medio    | Tareas pequeñas, revisión obligatoria, AGENTS.md con reglas claras y pruebas automáticas              |
| Limitaciones de Expo Go (módulos nativos, notificaciones)      | Media        | Medio    | Evitar módulos nativos en el MVP; evaluar compilación propia solo si es necesario                     |
| La barbería piloto no encuentra útil la app                    | Media        | Alto     | Involucrar al propietario desde el inicio y mantener configurables las reglas                         |
| Clientes que no reservan o no cancelan a tiempo                | Alta         | Medio    | Registro de ausencias; recordatorios en una versión futura                                            |
| Servidor no disponible durante el piloto                       | Media        | Medio    | Definir dónde se aloja el backend y probarlo antes                                                    |
| Pérdida de datos                                               | Baja         | Alto     | Copias de seguridad antes de migraciones y del piloto                                                 |
| Recomendaciones de IA poco acertadas                           | Media        | Medio    | Limitar al catálogo, usar etiquetas de estilo, probar con fotos variadas y avisar que son sugerencias |
| Costo o caída del proveedor de IA                              | Baja         | Medio    | Límite diario, tiempo máximo de espera, mensaje amable y proveedor intercambiable                     |
| Manejo indebido de fotos del rostro                            | Baja         | Muy alto | No almacenar la foto, consentimiento explícito y política de privacidad pública                       |
| Complejidad de la pasarela de pagos                            | Media        | Medio    | Anticipo como funcionalidad extendida y solo en modo de prueba                                        |

### 14.2 Decisiones abiertas

| N.º | Decisión                                                                | Propuesta actual                                                                                                                              | Quién decide     |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | ¿Un cliente reserva más de un servicio por cita?                        | No en el MVP: un servicio por cita                                                                                                            | Equipo y docente |
| 2   | ¿Las reservas se confirman solas o requieren aprobación?                | Confirmación automática                                                                                                                       | Barbería piloto  |
| 3   | Tiempo mínimo para cancelar                                             | 2 horas, configurable                                                                                                                         | Barbería piloto  |
| 4   | Anticipación mínima y máxima de reserva                                 | 30 minutos y 30 días, configurables                                                                                                           | Barbería piloto  |
| 5   | Tamaño del bloque de tiempo                                             | 15 minutos                                                                                                                                    | Equipo           |
| 6   | ¿El barbero ve la agenda de sus compañeros?                             | No por defecto, opción del propietario                                                                                                        | Barbería piloto  |
| 7   | ¿Cómo se cobra el servicio?                                             | En el local con registro en la app; anticipo en línea opcional y solo en modo de prueba                                                       | Equipo y docente |
| 8   | ¿Cómo se entrega la invitación a un barbero?                            | Dentro de la app, a un usuario ya registrado                                                                                                  | Equipo           |
| 9   | ¿Dónde se aloja el backend en el piloto?                                | Railway, Render o un VPS con HTTPS, según costo                                                                                               | Equipo           |
| 10  | ¿Recuperación de contraseña por correo en el MVP?                       | Opcional; requiere un servicio de envío de correos                                                                                            | Equipo y docente |
| 11  | ¿Qué hacer con citas sin cerrar tras 24 horas?                          | Solo avisar al barbero                                                                                                                        | Barbería piloto  |
| 12  | ¿El propietario crea citas para clientes que llaman?                    | Sí, como funcionalidad Debería                                                                                                                | Barbería piloto  |
| 13  | ¿Qué proveedor de IA usa el asesor?                                     | Comparar Gemini, Claude y OpenAI con las mismas 10 fotos y elegir por calidad y costo                                                         | Equipo           |
| 14  | ¿Qué pasarela se usa para el anticipo?                                  | Kushki o Payphone, según su entorno de pruebas                                                                                                | Equipo           |
| 15  | ¿Monto del anticipo y si la barbería lo quiere?                         | Opcional por barbería; propuesta de 2 USD                                                                                                     | Barbería piloto  |
| 16  | ¿Se retira POST /citas/:id/pagos?                                       | Completar ya exige el pago, así que la ruta queda sin uso normal; mantenerla hasta especificar el módulo de pagos, porque PO-13 la usa        | Equipo           |
| 17  | ¿Cómo evitar que la lista de personal revele qué correos tienen cuenta? | Sin definir: GET /barberias/:id/personal muestra las invitaciones, y una fila nueva delata la cuenta aunque el mensaje de CU-20 A1 sea neutro | Equipo y docente |

### 14.3 Inconsistencias entre los documentos fuente

Al consolidar el informe base y la especificación detallada aparecieron diferencias. Este DERCAS adopta el criterio de la tercera columna; conviene confirmarlas antes de redactar el AGENTS.md.

| Tema                          | Diferencia                                                                                                      | Criterio adoptado                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Cliente sin cuenta            | El informe base permite una cita sin usuario (nombre y teléfono); la especificación exige un cliente con cuenta | clienteId opcional más nombreCliente y telefonoCliente (sección 9.6)                                   |
| Cita manual                   | La ruta para registrar una cita manual está en el informe base y falta en la especificación                     | Se incluye como POST /barberias/:id/citas (RES-16, Debería)                                            |
| Agenda del barbero            | El informe base usa una ruta por barbero; la especificación, una ruta por barbería                              | Se adopta GET /barberias/:id/agenda, que respeta el aislamiento entre barberías                        |
| Confirmación de la cita       | El informe base la describe como transición automática de pendiente a confirmada                                | Se adopta la especificación: nace CONFIRMADA sin anticipo y PENDIENTE solo con anticipo (RN-12, RN-34) |
| Plazo de cancelación          | "Hasta 2 horas antes" frente a "más de 2 horas"                                                                 | Se permite si inicio − ahora ≥ 120 minutos (sección 4.7)                                               |
| Restricción única de respaldo | Una restricción simple sobre (barbero, inicio) impediría reutilizar un horario cancelado                        | Columna generada que solo cuenta citas activas (sección 8.5)                                           |
| Número de entidades           | El informe base cuenta 11; el modelo detallado añade TokenRenovacion y RegistroAuditoria                        | 13 entidades (sección 9)                                                                               |
| Idioma de los nombres         | Los documentos fuente nombran entidades, campos, rutas y errores en inglés                                      | Todo en español salvo lo que impone la tecnología (sección 1.5)                                        |
| Foto de usuario               | AUT-05 pedía editar la foto, pero Usuario no tiene ese campo                                                    | Se quita del MVP y pasa a funcionalidades futuras (sección 14.4)                                       |
| Permiso para bloquear         | CU-14 dejaba bloquear rangos sin permiso; la matriz y la API exigían permiso para todo bloqueo                  | Rangos puntuales para todo barbero; días libres y horario base con permiso (sección 2.4)               |
| Consulta pública              | El título de la sección 10.2 decía "consulta pública", pero sus rutas exigen sesión                             | Exigen sesión; se corrige el título (sección 4.7)                                                      |
| Sesión tras el registro       | HU-AUT-01 entra a la app, pero la ruta no decía si devolvía tokens                                              | El registro abre sesión y devuelve los tokens                                                          |

### 14.4 Funcionalidades futuras

- Publicación en App Store (iOS) con el mismo código.
- Notificaciones push y recordatorios de cita (por ejemplo, 24 horas y 1 hora antes).
- Suscripciones de pago para barberías (plan gratuito y premium).
- Cobros con dinero real mediante cuentas comerciales de cada barbería.
- Prueba virtual del corte sobre la foto del cliente.
- Lista de espera inteligente con los horarios liberados por cancelaciones.
- Aviso de "ya toca tu corte" según la frecuencia de visitas.
- Resumen semanal del negocio redactado por IA.
- Reseñas y calificaciones; galería de trabajos de cada barbero.
- Foto de perfil del usuario.
- Citas recurrentes y citas con varios servicios combinados.
- Promociones y programas de fidelidad automatizados.
- Panel web para propietarios y múltiples sucursales por propietario.

## 15. Trazabilidad y anexos

Los 14 casos de prueba obligatorios cubren reservas, seguridad, asesor de IA y pagos; los demás módulos se verifican con las pruebas de aceptación de sus historias de usuario.

### 15.1 Matriz de trazabilidad por módulo

| Módulo         | Funcionalidades | Reglas de negocio               | Casos de uso         | Historias      | Verificación                                        |
| -------------- | --------------- | ------------------------------- | -------------------- | -------------- | --------------------------------------------------- |
| Autenticación  | AUT-01 a AUT-10 | Validaciones de la sección 11.4 | CU-01 a CU-04        | HU-AUT-01 a 03 | Aceptación; RNF-04, RNF-06                          |
| Búsqueda       | BUS-01 a BUS-10 | RN-21                           | CU-05                | HU-BUS-01 a 03 | Aceptación; RNF-02, RNF-03                          |
| Reservas       | RES-01 a RES-16 | RN-01 a RN-17                   | CU-06 a CU-09, CU-25 | HU-RES-01 a 04 | PO-01 a PO-05, PO-08, PO-09; RNF-01, RNF-07, RNF-08 |
| Agenda         | AGE-01 a AGE-13 | RN-18 a RN-20, RN-26            | CU-10 a CU-15        | HU-AGE-01 a 03 | PO-09; aceptación                                   |
| Administración | ADM-01 a ADM-15 | RN-21 a RN-26                   | CU-18 a CU-21        | HU-ADM-01 a 04 | PO-10; aceptación                                   |
| Seguridad      | SEG-01 a SEG-16 | RN-04, RN-11                    | Transversal          | HU-SEG-01 a 03 | PO-06, PO-07; RNF-04 a RNF-06, RNF-17               |
| Asesor de IA   | IA-01 a IA-09   | RN-27 a RN-31                   | CU-15 a CU-17        | HU-IA-01 a 04  | PO-11, PO-12, PO-14; RNF-19 a RNF-21                |
| Pagos          | PAG-01 a PAG-07 | RN-32 a RN-36                   | CU-11, CU-23, CU-24  | HU-PAG-01 a 02 | PO-13; aceptación                                   |
| Estadísticas   | EST-01 a EST-08 | RN-37, RN-38                    | CU-22                | HU-EST-01 a 03 | Aceptación; RNF-02                                  |

### 15.2 Objetivos medibles frente a requisitos

| Objetivo (sección 1.3)         | Requisitos que lo sostienen                                     | Cómo se comprueba                          |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------ |
| Cero cruces de horario         | RN-04, RN-11, SEG-07, restricción única                         | PO-02, PO-05, RNF-07                       |
| Reserva en 5 pasos o menos     | RES-01 a RES-06, principio de usabilidad de la sección 10.6     | RNF-08 con usuarios reales                 |
| Disponibilidad en menos de 1 s | Índice (perfilBarberoId, iniciaEn, estado), cálculo en servidor | RNF-01                                     |
| Funciones Debe al 100 %        | Secciones 3.1 a 3.9                                             | Criterios de cierre de la sección 12.5     |
| Recomendación útil y rápida    | IA-01 a IA-07, RN-27 a RN-31                                    | RNF-19, conversión del asesor en el piloto |
| Publicación en Google Play     | Sección 13.2, RNF-22                                            | Aprobación de la revisión de Google        |

### Anexo A. Glosario

Los términos del proyecto están definidos en la sección 1.4.

### Anexo B. Catálogo de errores de negocio

| Código                      | HTTP | Significado                                               |
| --------------------------- | ---- | --------------------------------------------------------- |
| DATOS_INVALIDOS             | 422  | Algún campo no cumple su validación                       |
| AUTENTICACION_REQUERIDA     | 401  | Falta el token o es inválido                              |
| TOKEN_VENCIDO               | 401  | El token de acceso venció                                 |
| ACCESO_DENEGADO             | 403  | El rol no permite la acción                               |
| NO_ENCONTRADO               | 404  | Recurso inexistente o de otra barbería                    |
| CORREO_REGISTRADO           | 409  | Ya existe una cuenta con ese correo                       |
| CREDENCIALES_INVALIDAS      | 401  | Correo o contraseña incorrectos                           |
| HORARIO_OCUPADO             | 409  | El horario ya fue reservado                               |
| HORARIO_PASADO              | 422  | El horario ya pasó                                        |
| ANTICIPACION_INSUFICIENTE   | 422  | No cumple la anticipación mínima                          |
| FECHA_DEMASIADO_LEJANA      | 422  | Supera la anticipación máxima                             |
| FUERA_DE_HORARIO            | 422  | Fuera del horario de atención                             |
| BARBERO_NO_DISPONIBLE       | 409  | El barbero tiene un bloqueo o día libre                   |
| SERVICIO_NO_OFRECIDO        | 422  | El barbero no ofrece ese servicio                         |
| RECURSO_INACTIVO            | 409  | Servicio, barbero o barbería desactivados                 |
| CRUCE_DEL_CLIENTE           | 409  | El cliente ya tiene una cita que se solapa                |
| LIMITE_DE_CITAS             | 409  | El cliente superó el máximo de citas activas              |
| CANCELACION_TARDIA          | 409  | Pasó el tiempo límite para cancelar                       |
| TRANSICION_INVALIDA         | 409  | La cita no puede cambiar a ese estado                     |
| BARBERO_CON_CITAS           | 409  | El barbero tiene citas futuras sin resolver               |
| DEMASIADAS_SOLICITUDES      | 429  | Demasiados intentos                                       |
| CONSENTIMIENTO_IA_REQUERIDO | 403  | Falta el consentimiento para usar el asesor               |
| LIMITE_IA_ALCANZADO         | 429  | Se alcanzó el límite diario de consultas al asesor        |
| IA_NO_DISPONIBLE            | 503  | El servicio de IA falló o no respondió a tiempo           |
| IMAGEN_NO_VALIDA            | 422  | La foto no muestra un solo rostro reconocible             |
| CITA_NO_COMPLETADA          | 409  | Solo se registra el pago de citas completadas             |
| PAGO_YA_REGISTRADO          | 409  | La cita ya tiene un pago registrado                       |
| ANTICIPO_VENCIDO            | 409  | Venció el plazo para pagar el anticipo                    |
| FIRMA_INVALIDA              | 401  | La notificación de la pasarela no tiene una firma válida  |
| INTERNO                     | 500  | Error interno (mensaje genérico; el detalle solo en logs) |
