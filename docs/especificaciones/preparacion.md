# Preparación (Fase 0)

Deja el monorepo instalado y en verde, sin lógica de negocio, para poder orquestar las fases siguientes. Referencias: DERCAS §8.9, §13.4, §13.6.

## Cómo se ejecuta

- En la sesión principal, **sin orquestador ni subagentes**.
- Orden: raíz → `apps/movil` → `paquetes/compartido` → `apps/api`. `create-expo-app` necesita que `apps/movil` no exista.

## Raíz

- `package.json` con workspaces `["apps/*", "paquetes/*"]`.
- `.nvmrc` con el Node LTS activo.
- `tsconfig.base.json` (`strict`).
- ESLint (flat config) y Prettier compartidos; `.editorconfig`.
- `README.md`: instalación en un solo comando (RNF-15).

## MySQL local

- Bases `barberly` y `barberly_prueba`.
- `.env.example` y `.env.prueba.example` sin valores reales, con todas las variables que valida `configuracion.ts`.

## apps/api

- Express 5 + TypeScript. Desarrollo con `tsx watch src/servidor.ts`; compilación con tsup (incluye `@barberly/compartido` en el paquete).
- `src/app.ts` exporta la app (para Supertest), con `helmet`, `cors`, `express-rate-limit` y logs con `pino` (skill `arquitectura-api`).
- `src/servidor.ts` solo hace `listen` y arranca las tareas programadas.
- `src/rutas.ts` registra los módulos bajo `/api/v1`. `GET /api/v1/salud` responde 200.
- `src/compartido/`:
  - `errores.ts` (`ErrorNegocio`).
  - `configuracion.ts` (variables de entorno validadas con Zod al arrancar).
  - `base-datos.ts`.
  - `reloj.ts` (`ahora()`, que las pruebas pueden fijar).
  - Middlewares `autenticar`, `contextoBarberia`, `exigirRol`, `validar` y `manejarErrores`.
- `prisma/schema.prisma` con solo datasource y generator, más una primera migración vacía. El modelo completo es la Fase 1.
- `src/pruebas/` con `fabricas.ts` y `sesiones.ts`.
- `vitest.config.ts` con include `*.prueba.ts` y `fileParallelism: false`, un `globalSetup` que aplica `prisma migrate deploy` sobre `barberly_prueba`, y una prueba de humo de `/salud`.
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `seed`.

## paquetes/compartido

- Nombre `@barberly/compartido`, sin paso de compilación (`"main": "src/index.ts"`).
- Esquemas Zod y tipos comunes.

## apps/movil

- Creada con `npx create-expo-app@latest apps/movil` (plantilla por defecto, TypeScript y Expo Router).
- `app.json`:
  - `name` "Barberly", `slug` "barberly", `scheme` "barberly".
  - `userInterfaceStyle` "automatic".
  - `android.package` "com.cristhiantuarez.barberly" (no se puede cambiar después de publicar).
- Ícono y splash exportados desde `assets/marca/`.
- Grupos de rutas `(autenticacion)`, `(cliente)`, `(barbero)` y `(propietario)`.
- `src/tema/` y fuentes según la skill `diseno-movil`.
- `src/api/cliente.ts` con la URL de la API desde `EXPO_PUBLIC_URL_API`.
- Pruebas con `jest-expo` y `@testing-library/react-native` (skill `expo-pantallas`).

## Hecho

- `npm install` en la raíz funciona desde cero.
- `lint`, `typecheck` y `test` en verde.
- La app abre en Expo Go y muestra la pantalla Bienvenida con las fuentes de la marca.
