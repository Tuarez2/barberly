# Especificación: busqueda

## Propósito
Que el cliente encuentre una barbería y vea su detalle (datos, horario, servicios y barberos) antes de reservar.

## Funcionalidades
| Código | Qué debe hacer | Prioridad |
| --- | --- | --- |
| BUS-01 | Listar de forma paginada las barberías activas y publicadas con nombre, dirección, portada y estado abierta o cerrada | Debe |
| BUS-02 | Buscar por nombre mientras el usuario escribe, sin distinguir tildes ni mayúsculas | Debe |
| BUS-03 | Filtrar por servicio ofrecido y por abierto ahora | Debería |
| BUS-04 | Ordenar por nombre (único orden del MVP; cercanía queda fuera) | Podría |
| BUS-05 | Mostrar el detalle: descripción, dirección, teléfono, horario por día, servicios y barberos | Debe |
| BUS-06 | Mostrar el catálogo de servicios activos con descripción corta, precio y duración | Debe |
| BUS-07 | Mostrar los barberos con foto opcional y los servicios que ofrecen | Debe |
| BUS-08 | Mostrar el horario semanal y las excepciones visibles | Debe |
| BUS-09 | Marcar favoritas | Podría (fuera de alcance) |
| BUS-10 | Botón Reservar en el detalle y en cada servicio (solo app) | Debe |

## Reglas aplicables
RN-21 (un servicio desactivado no se muestra) y D-07 (listado solo con `activo` y `publicada`). Sin RN nuevas. Ver docs/reglas.md.

## Modelo
Referencia: DERCAS §9.2. Solo lectura: Barberia, HorarioAtencion, Bloqueo, Servicio, ServicioBarbero, PerfilBarbero, Membresia.
- Visible al público: Barberia con `activo` y `publicada` verdaderos (D-07). Las URL (`urlPortada`, `urlFoto`) se generan al leer con AlmacenArchivos; nunca se expone la clave del archivo.
- `abierta` se calcula en `zonaHoraria` de la barbería con el horario general (`perfilBarberoId` nulo): hay un HorarioAtencion del `diaSemana` de hoy con `horaApertura` <= ahora < `horaCierre`, fuera de `inicioPausa`-`finPausa`, y sin Bloqueo de la barbería (`perfilBarberoId` nulo) que cubra el instante. `diaSemana`: 0 = domingo a 6 = sábado.
- Todas las rutas exigen sesión (Pub, §10.2): sin token, AUTENTICACION_REQUERIDA.

Listado, GET /barberias (BUS-01 a BUS-04):
- Query: `q` (1 a 80 caracteres tras recortar; coincide si el nombre lo contiene, sin tildes ni mayúsculas, con `%` y `_` literales), `servicio` (texto, mismas reglas: barberías con un Servicio activo cuyo nombre lo contiene), `abierta` (`true`: solo las abiertas ahora), `pagina` y `limite` (§10.1: 1 y 10 por defecto, máximo 50). `orden` solo admite `nombre` (por defecto, ascendente, luego `id`). Parámetro desconocido, `limite` mayor de 50 o `q` vacío → DATOS_INVALIDOS.
- 200 `{ datos: [{ id, nombre, direccion, urlPortada, abierta }], meta: { pagina, limite, total } }`. `urlPortada` es null sin portada. Sin coincidencias: `datos` vacío y `total` 0 (no es error).

Detalle, GET /barberias/:id (BUS-05, BUS-08):
- 200 `{ datos: { id, nombre, descripcion, direccion, telefono, urlPortada, abierta, horarios: [{ diaSemana, horaApertura, horaCierre, inicioPausa, finPausa }], cierres: [{ iniciaEn, terminaEn }] } }`. Horas locales `HH:mm`; `horarios` solo del horario general, ordenado por día; los días sin fila no atienden. `cierres`: Bloqueo de toda la barbería que aún no terminó y empieza dentro de `diasMaxAnticipacion`, por `iniciaEn`; sin `motivo`.
- Barbería inexistente, inactiva o no publicada, o id que no es UUID: NO_ENCONTRADO 404, también para quien no es miembro. Un miembro ACTIVO la ve aunque no esté publicada, con `publicada` y `activo` extra en la respuesta (la usa Gestión, pantalla 23:2147).
- No incluye servicios ni barberos: la app los pide en sus rutas (como en docs/pantallas.md).

Servicios, GET /barberias/:id/servicios (BUS-06):
- 200 `{ datos: [{ id, nombre, descripcion, precio, duracionMinutos }], meta: { total } }`: solo `activo` verdadero, por nombre, sin paginar. `precio` es texto con dos decimales ("25.00"); `descripcion` null si no hay. No expone `etiquetasEstilo`. Misma visibilidad y NO_ENCONTRADO que el detalle.

Barberos, GET /barberias/:id/barberos (BUS-07):
- 200 `{ datos: [{ id, nombreVisible, urlFoto, servicios: [servicioId] }], meta: { total } }`: `id` es el PerfilBarbero (§10.1); solo membresía ACTIVO, con el Usuario `activo` verdadero (D-33: la cuenta desactivada, D-05, se oculta aunque la membresía sea ACTIVO) y con al menos un servicio activo asignado; `servicios` solo trae ids de servicios activos. Por `nombreVisible`, sin paginar. Nunca expone correo ni teléfono del barbero. Misma visibilidad que el detalle.

## API
Prefijo /api/v1. Pub = cualquier usuario autenticado.
| Método | Ruta | Rol | Éxito |
| --- | --- | --- | --- |
| GET | /barberias | Pub | 200 |
| GET | /barberias/:id | Pub | 200 |
| GET | /barberias/:id/servicios | Pub | 200 |
| GET | /barberias/:id/barberos | Pub | 200 |

## Errores
DATOS_INVALIDOS, AUTENTICACION_REQUERIDA, TOKEN_VENCIDO, NO_ENCONTRADO. Ver docs/errores.md.

## Pantallas
Tomadas de docs/pantallas.md.

| Pantalla | Nodo de Figma | Ruta |
| --- | --- | --- |
| Explorar | 4:8 | (cliente)/explorar |
| Explorar sin resultados | 22:1517 | (cliente)/explorar |
| Detalle de barbería | 10:240 | (cliente)/barberias/[id] |
| Reserva 1 Servicio (destino de Reservar, BUS-10) | 9:56 | (cliente)/barberias/[id]/reserva/servicio |
| Carga, Error de red, Sin conexión | 22:1949, 22:1954, 22:1961 | estados de cada pantalla |

Explorar: búsqueda con espera de 300 ms tras la última tecla, esqueletos de carga (D-26), Chips para Abierta ahora y servicio, página siguiente al llegar al final. Reservar del detalle abre Reserva 1; Reservar de un servicio abre Reserva 2 (barbero) con el servicio ya elegido.

## Criterios de aceptación
- HU-BUS-01: Dadas 12 barberías activas y publicadas y `limite` 10, cuando se pide GET /barberias, entonces 10 por nombre con `meta.total` 12; con `pagina=2`, 2 más.
- HU-BUS-01: Dadas una barbería sin servicios activos (no publicada), una inactiva y una publicada, cuando se lista, entonces solo sale la publicada.
- HU-BUS-03: Dadas "Clásica Norte" y "Barber Sur", cuando `q=clas` y `q=CLÁS`, entonces ambas veces solo "Clásica Norte"; con `q=zzz`, `datos` vacío y 200.
- BUS-03: Dado hoy martes 10:00 en America/Guayaquil con horario 09:00-18:00 y pausa 13:00-14:00, cuando `abierta=true`, entonces sale; a las 13:30 o con un Bloqueo de barbería vigente, no sale y su `abierta` es false.
- BUS-03: Dado un servicio "Corte clásico" en una barbería, cuando `servicio=corte`, entonces solo salen barberías con un servicio activo así; uno desactivado no cuenta.
- BUS-01: Dados `limite=51`, `pagina=0`, `q=` o `orden=cercania`, cuando se lista, entonces DATOS_INVALIDOS; sin token, AUTENTICACION_REQUERIDA.
- BUS-05: Dada una barbería publicada, cuando GET /barberias/:id, entonces 200 con horarios por día, `cierres` futuros sin `motivo` y sin `claveArchivo` ni reglas internas; con un UUID inexistente, NO_ENCONTRADO.
- BUS-05: Dada una no publicada, cuando la pide un cliente, entonces NO_ENCONTRADO; cuando la pide su propietario, 200 con `publicada` false.
- HU-BUS-02: Dados un servicio activo ("Corte", "25.00", 30) y otro desactivado, cuando GET /barberias/:id/servicios, entonces solo el activo con precio y `duracionMinutos`.
- BUS-07: Dado un barbero ACTIVO con 2 servicios y otro INACTIVO, cuando GET /barberias/:id/barberos, entonces solo el activo, con sus 2 ids y `urlFoto` null sin foto.
- BUS-07 (D-33): Dado un barbero con membresía ACTIVO y Usuario inactivo, cuando GET /barberias/:id/barberos, entonces no aparece y `meta.total` no lo cuenta.
- BUS-10: Dado el detalle abierto, cuando toca Reservar en el servicio "Corte", entonces la app abre la reserva con ese servicio elegido.

## Pruebas
- Casos PO: §15.1 no asigna ninguno; se verifica con aceptación y SEG-02 (no ver otra barbería no publicada).
- Por regla: D-07 (no publicada o inactiva no aparece ni se abre), RN-21 (servicio inactivo oculto), `abierta` en límites (apertura inclusive, cierre y pausa exclusivos).

## Fuera de alcance
- Favoritos (BUS-09: sin endpoint en §10.2), orden por cercanía, disponibilidad (módulo de reservas), servicios inactivos y lectura de horarios para el propietario (Huecos 2 y 3 de docs/pantallas.md) y la regla que calcula `publicada` (ADM-13).

## Dudas
Menores (Decidido, lo más simple):
1. `servicio` filtra por texto del nombre, no por id: los ids son de cada barbería (§10.2 no define el filtro).
2. Filtro `abierta` y `diaSemana` 0 = domingo; `abierta` usa solo el horario general.
3. Búsqueda sin tildes con la extensión `unaccent` de PostgreSQL (migración nueva); si se usa `$queryRaw`, solo con plantilla etiquetada `Prisma.sql` (nunca concatenar `q`); alternativa: columna `nombreBusqueda`.
4. Servicios y barberos no se paginan; el detalle no los incrusta (BUS-05 los lista, la app los pide aparte).
5. `precio` como texto "25.00"; `limite` > 50 es DATOS_INVALIDOS en vez de recortarse.
Ninguna abierta. Decidido (para el PR):
6. Barbería no publicada o inactiva en el detalle: NO_ENCONTRADO salvo para miembros ACTIVO, que la ven con `publicada` y `activo` (D-32). Hasta ADM-13, `publicada` se fija en las semillas.
7. BUS-08: cierres futuros de toda la barbería dentro de `diasMaxAnticipacion`, sin motivo (D-32).

## Referencias
DERCAS §3.2, §6 (HU-BUS-01 a HU-BUS-03), §9.2, §10.1, §10.2, D-07, D-10, D-26, D-32, D-33.
