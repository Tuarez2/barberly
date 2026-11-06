# AGENTS.md — Barberly

App móvil de citas para barberías con asesor de estilo por IA. Monolito modular en monorepo: `apps/movil` (Expo), `apps/api` (Express), `paquetes/compartido` (tipos y esquemas Zod), `docs/`, `pruebas/`.
Fuente de verdad: `docs/DERCAS.md`. Si difiere de este archivo, gana el DERCAS: avisa, no improvises.

## Stack (fijo: no cambies de librería sin preguntar)

- App: React Native, Expo Router, TypeScript estricto, TanStack Query, React Hook Form + Zod, Luxon, expo-secure-store, jest-expo.
- API: Node.js LTS, Express, TypeScript estricto, Zod, Prisma, MySQL 8, JWT, `bcryptjs`, Vitest + Supertest.
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

## Comandos (ajustar al crear los package.json)

- `npm install` una sola vez en la raíz (workspaces `apps/*`, `paquetes/*`).
- Scripts: `npm run <script> -w apps/api` o `-w apps/movil`.
- En `apps/api`: `npx prisma migrate dev` · `npx prisma migrate deploy` (producción).
- En `apps/movil`: `npx expo start` (Expo Go, Android).

## Referencias

- `docs/reglas.md` (RN) · `docs/errores.md` · `docs/especificaciones/` · `docs/especificaciones/preparacion.md` (Fase 0).
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
- App: solo habla con la API; ver skills `expo-pantallas` y `diseno-movil`.

## Hecho significa

Cumple su HU · pruebas pasan · `lint` y `typecheck` limpios · probado en Android (Expo Go) si toca la app · `documentacion.ts`, Bruno y README del módulo actualizados.

## No hacer

- Nombrar en inglés algo propio.
- Saltarse la validación de reservas "porque la app ya valida".
- Incumplir RN-27 (foto del rostro); ver skill `multi-tenencia-seguridad`.
- Exponer correos de otros usuarios o datos entre barberías.
- Usar `float` para dinero o fechas locales en BD.
- Hacer cobros reales: la pasarela solo en modo de prueba.
- Inventar endpoints, campos o errores: usa DERCAS §9, §10 y Anexo B, o pregunta.
