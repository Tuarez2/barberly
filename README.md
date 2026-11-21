# Barberly — API

API de Barberly (citas para barberías con asesor de estilo por IA), hecha con Express, Prisma y MySQL 8. Aquí también está la documentación del proyecto: `docs/` (DERCAS, decisiones, reglas, errores, especificaciones, pantallas y hoja de ruta).

Barberly tiene tres repositorios (D-11) que se clonan en la misma carpeta:

- `barberly-api`: este repositorio.
- `barberly-movil`: app con Expo para clientes y barberos.
- `barberly-panel`: panel web del propietario (D-10).

`src/compartido/contrato.ts` es el contrato común; la app y el panel guardan una copia. `pruebas/` guarda las pruebas de extremo a extremo.

## Requisitos

- Node.js 26 (`nvm use` lee `.nvmrc`).
- MySQL 8 en local.

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
cp .env.example .env
cp .env.prueba.example .env.prueba
```

Para usar el panel web en local, agrega su origen a `ORIGENES_CORS` (por ejemplo `http://localhost:5173`).

Aplica las migraciones y carga las semillas:

```bash
npx prisma migrate deploy
npm run seed
```

## Uso

```bash
npm run dev   # API en http://localhost:3000/api/v1
```

La documentación OpenAPI está en `GET /api/v1/documentacion`, y la colección de Bruno en `bruno/`.

## Verificación

```bash
bash .claude/skills/verificar/scripts/verificar.sh
```

Corre `lint`, `typecheck` y `test`. Las pruebas usan la base `barberly_prueba`.
