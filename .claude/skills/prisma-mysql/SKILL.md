---
name: prisma-mysql
description: Convenciones de Prisma con MySQL 8 para Barberly (nombres en español, UUID, Decimal, migraciones revisadas, columna generada inicioActivo, seed). Usar al tocar schema.prisma o crear migraciones.
---

# Prisma + MySQL 8

## Convenciones
- Modelos `PascalCase` en español (`Cita`, `PerfilBarbero`) con `@@map("citas")` (tabla `snake_case` plural).
- Campos `camelCase`; FK terminan en `Id`; fechas con hora terminan en `En`.
- `id String @id @default(uuid()) @db.Char(36)`. Dinero segun DERCAS §9.2: `@db.Decimal(8,2)` en `Servicio.precio` y `Cita.precioReserva`; `@db.Decimal(10,2)` en `Barberia.montoAnticipo` y `Pago.monto`. Fechas `DateTime @db.DateTime(3)` en UTC.
- Enums en `MAYUSCULAS`. Borrado logico (`activo`/`estado`) en entidades con historial.
- `@@index` en cada FK y en columnas de filtro frecuente (`barberiaId`, `iniciaEn`).
- Nombres del modelo: solo los del DERCAS §9.

## Migraciones
1. `npx prisma migrate dev --create-only --name <descripcion-en-minusculas>`.
2. Revisa el `.sql` generado. Rechaza cualquier `DROP` inesperado.
3. Aplica con `npx prisma migrate dev`. Produccion: `migrate deploy`.
4. Nunca `migrate reset` sin confirmacion del usuario.

## Columna generada de concurrencia (migracion SQL manual)
Prisma no modela columnas generadas: agregala en una migracion creada con `--create-only`.
```sql
ALTER TABLE citas
  ADD COLUMN inicioActivo DATETIME(3)
    GENERATED ALWAYS AS (CASE WHEN estado IN ('PENDIENTE','CONFIRMADA') THEN iniciaEn ELSE NULL END) STORED,
  ADD UNIQUE INDEX uq_citas_barbero_inicio_activo (perfilBarberoId, inicioActivo);
```
- En `schema.prisma` declara `inicioActivo DateTime? @db.DateTime(3)` (solo lectura; nunca se escribe desde la app).
- Prisma puede proponer borrar la columna o el indice en migraciones futuras: revisa siempre con `--create-only`.
- Unico adicional: `@@unique([clienteId, claveIdempotencia])`.

## Seed
`npm run seed` crea: 1 propietario, 1 barberia con horarios, 2 barberos, servicios con etiquetas, 1 cliente y, para pruebas de aislamiento, una segunda barberia con su propietario. Claves de ejemplo solo para desarrollo.
