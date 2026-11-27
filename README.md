# Barberly — API

API de Barberly (citas para barberías con asesor de estilo por IA), hecha con Express, Prisma y PostgreSQL (D-19). Aquí también está la documentación del proyecto: `docs/` (DERCAS, decisiones, reglas, errores, especificaciones, pantallas y hoja de ruta).

Barberly tiene tres repositorios (D-11) que se clonan en la misma carpeta:

- `barberly-api`: este repositorio.
- `barberly-movil`: app con Expo para clientes y barberos.
- `barberly-panel`: panel web del propietario (D-10).

`src/compartido/contrato.ts` es el contrato común; la app y el panel guardan una copia. `pruebas/` guarda las pruebas de extremo a extremo.

## Requisitos

- Node.js 26 (`nvm use` lee `.nvmrc`).
- PostgreSQL 16 o superior en local (o Docker con `compose.yaml`).

## Instalación

```bash
nvm use
npm install
```

Crea el usuario y las bases en PostgreSQL. La forma más rápida en Linux Mint instala PostgreSQL si falta, crea todo, migra, siembra e imprime los datos para DBeaver:

```bash
bash scripts/crear-base-local.sh
```

Opción A, con Docker (usa `compose.yaml`):

```bash
docker compose up -d   # PostgreSQL 17 con las bases barberly y barberly_prueba
```

Opción B, PostgreSQL instalado en Linux Mint (`sudo apt install postgresql`), cambia `CLAVE`:

```bash
sudo -u postgres psql -c "CREATE USER barberly WITH PASSWORD 'CLAVE' CREATEDB;"
sudo -u postgres createdb -O barberly barberly
sudo -u postgres createdb -O barberly barberly_prueba
```

`CREATEDB` lo necesita `prisma migrate dev`, que crea y borra una base temporal. La extensión `btree_gist` (restricción sin cruces de citas, D-19) viene incluida en PostgreSQL y la activa la primera migración. En DBeaver crea una conexión de tipo PostgreSQL con los mismos datos.

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
