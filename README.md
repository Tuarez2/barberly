# Barberly

App móvil de citas para barberías con asesor de estilo por IA. Monorepo con npm workspaces:

- `apps/movil`: app con Expo.
- `apps/api`: API con Express, Prisma y MySQL 8.
- `paquetes/compartido`: tipos y esquemas Zod comunes.
- `docs/`: especificaciones y decisiones. `pruebas/`: pruebas de extremo a extremo.

## Requisitos

- Node.js 26 (`nvm use` lee `.nvmrc`).
- MySQL 8 en local.
- Expo Go para Android, compatible con el SDK 58, en la misma red que el computador.

## Instalación

```bash
nvm use
npm install
```

Crea las bases y el usuario en MySQL (cambia `CLAVE`):

```sql
CREATE DATABASE barberly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE barberly_prueba CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'barberly'@'localhost' IDENTIFIED BY 'CLAVE';
GRANT ALL PRIVILEGES ON barberly.* TO 'barberly'@'localhost';
GRANT ALL PRIVILEGES ON barberly_prueba.* TO 'barberly'@'localhost';
-- prisma migrate dev crea y borra una base temporal.
GRANT ALL PRIVILEGES ON `prisma\_migrate\_shadow\_db%`.* TO 'barberly'@'localhost';
```

Copia las variables de entorno y complétalas:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/api/.env.prueba.example apps/api/.env.prueba
cp apps/movil/.env.example apps/movil/.env
```

Aplica las migraciones:

```bash
cd apps/api && npx prisma migrate deploy
```

## Uso

```bash
npm run dev -w apps/api      # API en http://localhost:3000/api/v1
npm run start -w apps/movil  # Expo: escanea el QR con Expo Go
```

En el teléfono, `EXPO_PUBLIC_URL_API` debe usar la IP local del computador. Sin red común: `npx expo start --tunnel` en `apps/movil`.

## Verificación

```bash
bash .claude/skills/verificar/scripts/verificar.sh
```

Corre `lint`, `typecheck` y `test` en la API y en la app. Las pruebas de la API usan la base `barberly_prueba`.
