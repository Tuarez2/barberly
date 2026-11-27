#!/usr/bin/env bash
# Crea PostgreSQL local para Barberly en Linux Mint (D-19): instala PostgreSQL si falta,
# crea el usuario y las bases barberly y barberly_prueba, aplica las migraciones y carga las semillas.
# Uso (desde api/): bash scripts/crear-base-local.sh
# Pide tu clave de sudo solo para instalar PostgreSQL y crear el usuario.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

USUARIO="${USUARIO:-barberly}"
CLAVE="${CLAVE:-clave_local}"

if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando PostgreSQL..."
  sudo apt-get update
  sudo apt-get install -y postgresql
fi
sudo systemctl enable --now postgresql

echo "Creando el usuario $USUARIO..."
sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$USUARIO') THEN
    CREATE ROLE $USUARIO LOGIN PASSWORD '$CLAVE' CREATEDB;
  ELSE
    ALTER ROLE $USUARIO LOGIN PASSWORD '$CLAVE' CREATEDB;
  END IF;
END
\$\$;
SQL

for base in barberly barberly_prueba; do
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$base'" | grep -q 1; then
    echo "La base $base ya existe."
  else
    sudo -u postgres createdb -O "$USUARIO" "$base"
    echo "Base $base creada."
  fi
done

echo "Aplicando migraciones y semillas..."
npx prisma migrate deploy
npm run seed

cat <<TEXTO

Listo. Conexión para DBeaver CE (Nueva conexión → PostgreSQL):
  Host: localhost   Puerto: 5432   Base: barberly
  Usuario: $USUARIO   Contraseña: $CLAVE
  Pestaña PostgreSQL: marca "Show all databases" para ver también barberly_prueba.
Tu .env y tu .env.prueba deben usar:
  postgresql://$USUARIO:$CLAVE@localhost:5432/barberly
  postgresql://$USUARIO:$CLAVE@localhost:5432/barberly_prueba
TEXTO
