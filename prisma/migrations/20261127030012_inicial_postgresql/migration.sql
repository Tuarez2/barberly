-- CreateEnum
CREATE TYPE "RolMembresia" AS ENUM ('PROPIETARIO', 'BARBERO');

-- CreateEnum
CREATE TYPE "EstadoMembresia" AS ENUM ('INVITADO', 'ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'AUSENTE');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ANTICIPO', 'FINAL');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'DEUNA', 'TARJETA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'REEMBOLSADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "claveHash" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "consentimientoIaEn" TIMESTAMPTZ(3),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barberias" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(500),
    "direccion" VARCHAR(200) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "archivoPortada" VARCHAR(255),
    "zonaHoraria" VARCHAR(60) NOT NULL DEFAULT 'America/Guayaquil',
    "minutosMinCancelacion" INTEGER NOT NULL DEFAULT 120,
    "minutosMinAnticipacion" INTEGER NOT NULL DEFAULT 30,
    "diasMaxAnticipacion" INTEGER NOT NULL DEFAULT 30,
    "maxCitasActivas" INTEGER NOT NULL DEFAULT 3,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "anticipoActivo" BOOLEAN NOT NULL DEFAULT false,
    "montoAnticipo" DECIMAL(10,2),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "barberias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresias" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "rol" "RolMembresia" NOT NULL,
    "estado" "EstadoMembresia" NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "membresias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles_barbero" (
    "id" UUID NOT NULL,
    "membresiaId" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "nombreVisible" VARCHAR(80) NOT NULL,
    "archivoFoto" VARCHAR(255),
    "puedeEditarHorario" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "perfiles_barbero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(300),
    "etiquetasEstilo" VARCHAR(200) NOT NULL DEFAULT '',
    "precio" DECIMAL(8,2) NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_barbero" (
    "perfilBarberoId" UUID NOT NULL,
    "servicioId" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "servicios_barbero_pkey" PRIMARY KEY ("perfilBarberoId","servicioId")
);

-- CreateTable
CREATE TABLE "horarios_atencion" (
    "id" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "perfilBarberoId" UUID,
    "diaSemana" SMALLINT NOT NULL,
    "horaApertura" CHAR(5) NOT NULL,
    "horaCierre" CHAR(5) NOT NULL,
    "inicioPausa" CHAR(5),
    "finPausa" CHAR(5),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "horarios_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueos" (
    "id" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "perfilBarberoId" UUID,
    "iniciaEn" TIMESTAMPTZ(3) NOT NULL,
    "terminaEn" TIMESTAMPTZ(3) NOT NULL,
    "motivo" VARCHAR(200),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bloqueos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "clienteId" UUID,
    "perfilBarberoId" UUID NOT NULL,
    "servicioId" UUID NOT NULL,
    "nombreCliente" VARCHAR(80),
    "telefonoCliente" VARCHAR(20),
    "iniciaEn" TIMESTAMPTZ(3) NOT NULL,
    "terminaEn" TIMESTAMPTZ(3) NOT NULL,
    "precioReserva" DECIMAL(8,2) NOT NULL,
    "duracionReserva" INTEGER NOT NULL,
    "estado" "EstadoCita" NOT NULL,
    "notas" VARCHAR(200),
    "canceladaPorId" UUID,
    "canceladaEn" TIMESTAMPTZ(3),
    "motivoCancelacion" VARCHAR(200),
    "claveIdempotencia" VARCHAR(64),
    "archivoFotoReferencia" VARCHAR(255),
    "anticipoVenceEn" TIMESTAMPTZ(3),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_estilo" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "rasgos" JSONB NOT NULL,
    "recomendaciones" JSONB NOT NULL,
    "citaId" UUID,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "consultas_estilo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "citaId" UUID NOT NULL,
    "barberiaId" UUID NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "referenciaPasarela" VARCHAR(120),
    "motivoAjuste" VARCHAR(200),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_renovacion" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiraEn" TIMESTAMPTZ(3) NOT NULL,
    "revocadoEn" TIMESTAMPTZ(3),
    "dispositivo" VARCHAR(100),
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tokens_renovacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_recuperacion" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "codigoHash" VARCHAR(100) NOT NULL,
    "expiraEn" TIMESTAMPTZ(3) NOT NULL,
    "usadoEn" TIMESTAMPTZ(3),
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "codigos_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" UUID NOT NULL,
    "barberiaId" UUID,
    "actorId" UUID,
    "accion" VARCHAR(60) NOT NULL,
    "tipoEntidad" VARCHAR(40) NOT NULL,
    "entidadId" UUID,
    "antes" JSONB,
    "despues" JSONB,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "barberias_activo_publicada_idx" ON "barberias"("activo", "publicada");

-- CreateIndex
CREATE INDEX "membresias_barberiaId_idx" ON "membresias"("barberiaId");

-- CreateIndex
CREATE UNIQUE INDEX "membresias_usuarioId_barberiaId_key" ON "membresias"("usuarioId", "barberiaId");

-- CreateIndex
CREATE UNIQUE INDEX "membresias_id_barberiaId_key" ON "membresias"("id", "barberiaId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_barbero_membresiaId_key" ON "perfiles_barbero"("membresiaId");

-- CreateIndex
CREATE INDEX "perfiles_barbero_barberiaId_idx" ON "perfiles_barbero"("barberiaId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_barbero_membresiaId_barberiaId_key" ON "perfiles_barbero"("membresiaId", "barberiaId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_barbero_id_barberiaId_key" ON "perfiles_barbero"("id", "barberiaId");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_barberiaId_nombre_key" ON "servicios"("barberiaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_id_barberiaId_key" ON "servicios"("id", "barberiaId");

-- CreateIndex
CREATE INDEX "servicios_barbero_servicioId_barberiaId_idx" ON "servicios_barbero"("servicioId", "barberiaId");

-- CreateIndex
CREATE INDEX "servicios_barbero_barberiaId_idx" ON "servicios_barbero"("barberiaId");

-- CreateIndex
CREATE INDEX "horarios_atencion_perfilBarberoId_idx" ON "horarios_atencion"("perfilBarberoId");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_atencion_barberiaId_perfilBarberoId_diaSemana_key" ON "horarios_atencion"("barberiaId", "perfilBarberoId", "diaSemana");

-- CreateIndex
CREATE INDEX "bloqueos_barberiaId_iniciaEn_idx" ON "bloqueos"("barberiaId", "iniciaEn");

-- CreateIndex
CREATE INDEX "bloqueos_perfilBarberoId_iniciaEn_idx" ON "bloqueos"("perfilBarberoId", "iniciaEn");

-- CreateIndex
CREATE INDEX "citas_perfilBarberoId_iniciaEn_estado_idx" ON "citas"("perfilBarberoId", "iniciaEn", "estado");

-- CreateIndex
CREATE INDEX "citas_clienteId_iniciaEn_idx" ON "citas"("clienteId", "iniciaEn");

-- CreateIndex
CREATE INDEX "citas_barberiaId_iniciaEn_idx" ON "citas"("barberiaId", "iniciaEn");

-- CreateIndex
CREATE INDEX "citas_servicioId_barberiaId_idx" ON "citas"("servicioId", "barberiaId");

-- CreateIndex
CREATE INDEX "citas_canceladaPorId_idx" ON "citas"("canceladaPorId");

-- CreateIndex
CREATE UNIQUE INDEX "citas_clienteId_claveIdempotencia_key" ON "citas"("clienteId", "claveIdempotencia");

-- CreateIndex
CREATE UNIQUE INDEX "citas_id_barberiaId_key" ON "citas"("id", "barberiaId");

-- CreateIndex
CREATE INDEX "consultas_estilo_usuarioId_creadoEn_idx" ON "consultas_estilo"("usuarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "consultas_estilo_barberiaId_idx" ON "consultas_estilo"("barberiaId");

-- CreateIndex
CREATE INDEX "consultas_estilo_citaId_idx" ON "consultas_estilo"("citaId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_referenciaPasarela_key" ON "pagos"("referenciaPasarela");

-- CreateIndex
CREATE INDEX "pagos_barberiaId_creadoEn_idx" ON "pagos"("barberiaId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_citaId_tipo_key" ON "pagos"("citaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_renovacion_tokenHash_key" ON "tokens_renovacion"("tokenHash");

-- CreateIndex
CREATE INDEX "tokens_renovacion_usuarioId_idx" ON "tokens_renovacion"("usuarioId");

-- CreateIndex
CREATE INDEX "codigos_recuperacion_usuarioId_creadoEn_idx" ON "codigos_recuperacion"("usuarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "registros_auditoria_barberiaId_creadoEn_idx" ON "registros_auditoria"("barberiaId", "creadoEn");

-- CreateIndex
CREATE INDEX "registros_auditoria_actorId_idx" ON "registros_auditoria"("actorId");

-- AddForeignKey
ALTER TABLE "membresias" ADD CONSTRAINT "membresias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "membresias" ADD CONSTRAINT "membresias_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "perfiles_barbero" ADD CONSTRAINT "perfiles_barbero_membresiaId_barberiaId_fkey" FOREIGN KEY ("membresiaId", "barberiaId") REFERENCES "membresias"("id", "barberiaId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "perfiles_barbero" ADD CONSTRAINT "perfiles_barbero_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "servicios_barbero" ADD CONSTRAINT "servicios_barbero_perfilBarberoId_barberiaId_fkey" FOREIGN KEY ("perfilBarberoId", "barberiaId") REFERENCES "perfiles_barbero"("id", "barberiaId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "servicios_barbero" ADD CONSTRAINT "servicios_barbero_servicioId_barberiaId_fkey" FOREIGN KEY ("servicioId", "barberiaId") REFERENCES "servicios"("id", "barberiaId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "servicios_barbero" ADD CONSTRAINT "servicios_barbero_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "horarios_atencion" ADD CONSTRAINT "horarios_atencion_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "horarios_atencion" ADD CONSTRAINT "horarios_atencion_perfilBarberoId_fkey" FOREIGN KEY ("perfilBarberoId") REFERENCES "perfiles_barbero"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_perfilBarberoId_fkey" FOREIGN KEY ("perfilBarberoId") REFERENCES "perfiles_barbero"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_perfilBarberoId_barberiaId_fkey" FOREIGN KEY ("perfilBarberoId", "barberiaId") REFERENCES "perfiles_barbero"("id", "barberiaId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicioId_barberiaId_fkey" FOREIGN KEY ("servicioId", "barberiaId") REFERENCES "servicios"("id", "barberiaId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_canceladaPorId_fkey" FOREIGN KEY ("canceladaPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "consultas_estilo" ADD CONSTRAINT "consultas_estilo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "consultas_estilo" ADD CONSTRAINT "consultas_estilo_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "consultas_estilo" ADD CONSTRAINT "consultas_estilo_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_citaId_barberiaId_fkey" FOREIGN KEY ("citaId", "barberiaId") REFERENCES "citas"("id", "barberiaId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tokens_renovacion" ADD CONSTRAINT "tokens_renovacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "codigos_recuperacion" ADD CONSTRAINT "codigos_recuperacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "barberias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Restricciones CHECK (Prisma no las modela; DERCAS §9.2, §9.5 y §9.6).
ALTER TABLE "barberias"
    ADD CONSTRAINT "ck_barberias_minutos_cancelacion" CHECK ("minutosMinCancelacion" >= 0),
    ADD CONSTRAINT "ck_barberias_minutos_anticipacion" CHECK ("minutosMinAnticipacion" >= 0),
    ADD CONSTRAINT "ck_barberias_dias_anticipacion" CHECK ("diasMaxAnticipacion" >= 1),
    ADD CONSTRAINT "ck_barberias_max_citas_activas" CHECK ("maxCitasActivas" BETWEEN 1 AND 10),
    ADD CONSTRAINT "ck_barberias_anticipo" CHECK ("anticipoActivo" = FALSE OR "montoAnticipo" > 0),
    ADD CONSTRAINT "ck_barberias_monto_anticipo" CHECK ("montoAnticipo" IS NULL OR "montoAnticipo" > 0);

ALTER TABLE "servicios"
    ADD CONSTRAINT "ck_servicios_precio" CHECK ("precio" > 0),
    ADD CONSTRAINT "ck_servicios_duracion" CHECK ("duracionMinutos" BETWEEN 15 AND 240 AND "duracionMinutos" % 15 = 0);

ALTER TABLE "horarios_atencion"
    ADD CONSTRAINT "ck_horarios_dia_semana" CHECK ("diaSemana" BETWEEN 0 AND 6),
    ADD CONSTRAINT "ck_horarios_formato" CHECK (
        "horaApertura" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND "horaCierre" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND ("inicioPausa" IS NULL OR "inicioPausa" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
        AND ("finPausa" IS NULL OR "finPausa" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    ),
    ADD CONSTRAINT "ck_horarios_cierre" CHECK ("horaCierre" > "horaApertura"),
    ADD CONSTRAINT "ck_horarios_pausa" CHECK (
        ("inicioPausa" IS NULL AND "finPausa" IS NULL)
        OR ("inicioPausa" >= "horaApertura" AND "finPausa" > "inicioPausa" AND "finPausa" <= "horaCierre")
    );

ALTER TABLE "bloqueos"
    ADD CONSTRAINT "ck_bloqueos_rango" CHECK ("terminaEn" > "iniciaEn");

ALTER TABLE "citas"
    ADD CONSTRAINT "ck_citas_cliente" CHECK (
        "clienteId" IS NOT NULL OR ("nombreCliente" IS NOT NULL AND "telefonoCliente" IS NOT NULL)
    ),
    ADD CONSTRAINT "ck_citas_precio" CHECK ("precioReserva" > 0),
    ADD CONSTRAINT "ck_citas_duracion" CHECK ("duracionReserva" BETWEEN 15 AND 240 AND "duracionReserva" % 15 = 0),
    ADD CONSTRAINT "ck_citas_fin" CHECK ("terminaEn" = "iniciaEn" + make_interval(mins => "duracionReserva"));

ALTER TABLE "pagos"
    ADD CONSTRAINT "ck_pagos_monto" CHECK ("monto" > 0);

ALTER TABLE "codigos_recuperacion"
    ADD CONSTRAINT "ck_codigos_intentos" CHECK ("intentos" >= 0);

-- RN-04 y D-19: dos citas activas del mismo barbero nunca se solapan, ni siquiera en parte.
-- Reemplaza a la columna generada inicioActivo de MySQL: la base compara rangos [iniciaEn, terminaEn).
-- La transaccion con FOR UPDATE sigue siendo la garantia principal (skill reservas-concurrencia);
-- esta restriccion es el respaldo que un error de logica no puede saltarse.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "citas"
    ADD CONSTRAINT "ex_citas_barbero_sin_cruce" EXCLUDE USING gist (
        "perfilBarberoId" WITH =,
        tstzrange("iniciaEn", "terminaEn", '[)') WITH &&
    ) WHERE ("estado" IN ('PENDIENTE', 'CONFIRMADA'));
