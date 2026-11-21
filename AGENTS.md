# AGENTS.md — Barberly (API)

Barberly: citas para barberías con asesor de estilo por IA. Este repositorio es `barberly-api`: la API (monolito modular en Express) y la documentación del proyecto en `docs/`.
Hay tres repositorios (D-11), clonados en la misma carpeta: `barberly-api` (este), `barberly-movil` (app de clientes y barberos) y `barberly-panel` (panel web del propietario, D-10). La app y el panel leen la documentación en `../barberly-api/docs/`.
`src/compartido/contrato.ts` es el contrato común: la app y el panel guardan una copia; si cambia, se copia en la misma funcionalidad.
Fuente de verdad: `docs/DERCAS.md` + `docs/decisiones.md`; si se contradicen, gana la decisión más reciente. Si difieren de este archivo, ganan ellos: avisa, no improvises.

## Stack (fijo: no cambies de librería sin preguntar)

- API: Node.js LTS, Express, TypeScript estricto, Zod, Prisma, MySQL 8, JWT, `bcryptjs`, Vitest + Supertest.
- App (`barberly-movil`): React Native, Expo Router, TanStack Query, React Hook Form + Zod, Luxon, expo-secure-store, jest-expo.
- Panel (`barberly-panel`, D-10): React + Vite, React Router, TanStack Query, React Hook Form + Zod, Luxon, Vitest + Testing Library; sesión según D-12.
- ESLint y Prettier. Sin microservicios. Toda dependencia nueva se justifica en el PR.

## Nombres

- Lo propio va en español sin tildes ni ñ: modelos, tablas, campos, enums, rutas, JSON, errores, módulos, carpetas, archivos, funciones, variables, tipos y pruebas.
- En inglés solo lo que impone la tecnología: palabras reservadas, librerías y sus APIs, métodos y cabeceras HTTP, `id`, términos técnicos (`token`, `hash`, `webhook`, `JWT`) y archivos estándar.
- Modelos `PascalCase`; campos y variables `camelCase`; enums y errores `MAYUSCULAS`; rutas y archivos en minúsculas con guiones.
- Claves foráneas en `Id`; fechas con hora en `En`; booleanos sin prefijo inglés (`activo`).

## Flujo SDD

1. Lee `docs/especificaciones/<modulo>.md` y lo que referencia.
2. Si cambia el comportamiento, actualiza antes la especificación.
3. Presenta un plan de 5 a 8 líneas y espera OK.
4. Tareas pequeñas, una rama por tarea, un PR por funcionalidad; no refactorices fuera del alcance.
5. Pruebas desde los criterios de aceptación.
6. Corre `lint`, `typecheck` y `test`.
7. Cita los códigos RN/AUT en commits y pruebas.

## Tareas y Git

- Si la tarea no está en `docs/hoja-de-ruta.md`, primero se agrega.
- El usuario crea las ramas y hace commit, merge y PR. Claude hace push de la rama actual cuando el usuario lo indica.
- Nunca push a `main` ni con `--force`: `main` solo recibe código por PR con CI verde.
- Los especialistas no crean ramas ni hacen commit o push.

## Comandos

- `npm install` en la raíz.
- `npm run dev` · `npm run lint` · `npm run typecheck` · `npm run test` · `npm run seed` · `npm run formato`.
- `npx prisma migrate dev` · `npx prisma migrate deploy` (producción).

## Referencias

- `docs/reglas.md` (RN) · `docs/errores.md` · `docs/decisiones.md` · `docs/especificaciones/` · `docs/especificaciones/preparacion.md` (Fase 0).
- `docs/flujo-de-trabajo.md` (roles, ramas, commits y PR) · `docs/hoja-de-ruta.md` (tareas, ramas y estado: solo la fila de la tarea, nunca completa).
- `docs/identidad-visual.md` (tokens; enlace a Figma) · `docs/pantallas.md` (pantalla → nodo, ruta y endpoints).
- `docs/DERCAS.md`: solo la sección puntual, nunca completo.

## Reglas no negociables

- Reglas de negocio: el backend las aplica siempre; ver `docs/reglas.md`.
- Reservas: transacción con bloqueo; ver skill `reservas-concurrencia`.
- Disponibilidad: cálculo en el backend; ver skill `disponibilidad-horarios`.
- Seguridad: aislamiento por barbería, recurso ajeno → 404; ver skill `multi-tenencia-seguridad`.
- API: lógica solo en `servicio.ts`; ver skill `arquitectura-api`.
- Datos: UUID, `Decimal`, UTC y borrado lógico; ver skill `prisma-mysql`.
- Imágenes: ver skill `almacen-archivos`.
- Pruebas: cada regla y endpoint, también con otra barbería; ver skill `pruebas-api`.
- App y panel web: solo hablan con la API y viven en sus repositorios; la app no tiene pantallas de propietario (D-10).

## Hecho significa

Cumple su HU · pruebas pasan · `lint` y `typecheck` limpios · `documentacion.ts`, Bruno y README del módulo actualizados.

## No hacer

- Nombrar en inglés algo propio.
- Saltarse la validación de reservas "porque la app ya valida".
- Incumplir RN-27 (foto del rostro); ver skill `multi-tenencia-seguridad`.
- Exponer correos de otros usuarios o datos entre barberías.
- Usar `float` para dinero o fechas locales en BD.
- Hacer cobros reales: la pasarela solo en modo de prueba.
- Inventar endpoints, campos o errores: usa DERCAS §9, §10 y Anexo B, o pregunta.
