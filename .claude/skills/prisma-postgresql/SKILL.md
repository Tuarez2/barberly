---
name: prisma-postgresql
description: "Modelo Prisma con PostgreSQL, migraciones, restricciones CHECK y EXCLUDE, y seed. Usar al tocar schema.prisma, migraciones o seed. No usar para consultas de servicios (arquitectura-api)."
user-invocable: false
---

# Prisma + PostgreSQL (D-19)

## Convenciones
- Modelos `PascalCase` en español (`Cita`, `PerfilBarbero`) con `@@map("citas")` (tabla `snake_case` plural).
- Campos `camelCase`; FK terminan en `Id`; fechas con hora terminan en `En`. En SQL manual, los nombres van entre comillas dobles (`"perfilBarberoId"`).
- `id String @id @default(uuid()) @db.Uuid` y toda FK `@db.Uuid`.
- Dinero segun DERCAS §9.2: `@db.Decimal(8,2)` en `Servicio.precio` y `Cita.precioReserva`; `@db.Decimal(10,2)` en `Barberia.montoAnticipo` y `Pago.monto`. Nunca `Float`.
- Fechas `DateTime @db.Timestamptz(3)`: se guardan en UTC y PostgreSQL conserva la zona.
- `Json` se guarda como `jsonb`. Enteros pequenos con `@db.SmallInt`.
- Enums en `MAYUSCULAS`. Borrado logico (`activo`/`estado`) en entidades con historial.
- `@@index` en cada FK y en columnas de filtro frecuente (`barberiaId`, `iniciaEn`). Cada modelo de una barberia lleva `barberiaId` con `@@index`.
- Nombres del modelo: solo los del DERCAS §9.
- Conexion: adaptador `@prisma/adapter-pg` en `src/compartido/base-datos.ts`.

## Migraciones
1. `npx prisma migrate dev --create-only --name <descripcion-en-minusculas>`.
2. Revisa el `.sql` generado. Rechaza cualquier `DROP` inesperado.
3. Lo que Prisma no modela va al final del mismo `.sql`: restricciones `CHECK` (`ck_<tabla>_<regla>`) y `EXCLUDE` (`ex_<tabla>_<regla>`).
4. Aplica con `npx prisma migrate dev`. Produccion: `migrate deploy`.
5. Nunca `migrate reset` sin confirmacion del usuario.

## Citas sin cruce (RN-04)
La migracion inicial crea la extension `btree_gist` y esta restriccion:
```sql
ALTER TABLE "citas" ADD CONSTRAINT "ex_citas_barbero_sin_cruce" EXCLUDE USING gist (
  "perfilBarberoId" WITH =,
  tstzrange("iniciaEn", "terminaEn", '[)') WITH &&
) WHERE ("estado" IN ('PENDIENTE', 'CONFIRMADA'));
```
- Impide cualquier solape (no solo la misma hora de inicio). Citas contiguas (`[15:00,15:30)` y `[15:30,16:00)`) son validas.
- Si se viola, PostgreSQL responde `23P01`; detectalo con `esCruceDeCitas(error)` de `src/compartido/errores-base-datos.ts`.
- Indice unico violado: `esDuplicado(error)` (`P2002`).
- Unico adicional: `@@unique([clienteId, claveIdempotencia])`.
- Prisma no ve la restriccion: revisa siempre con `--create-only` que una migracion futura no la borre.

## Seed
`npm run seed` crea: 1 propietario, 1 barberia con horarios, 2 barberos, servicios con etiquetas, 1 cliente y, para pruebas de aislamiento, una segunda barberia con su propietario. Usa UUID fijos, claves de ejemplo solo de desarrollo y las mismas fabricas que las pruebas cuando sea posible.
