-- CreateTable
CREATE TABLE `usuarios` (
    `id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `correo` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `claveHash` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `consentimientoIaEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barberias` (
    `id` CHAR(36) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `direccion` VARCHAR(200) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `archivoPortada` VARCHAR(255) NULL,
    `zonaHoraria` VARCHAR(60) NOT NULL DEFAULT 'America/Guayaquil',
    `minutosMinCancelacion` INTEGER NOT NULL DEFAULT 120,
    `minutosMinAnticipacion` INTEGER NOT NULL DEFAULT 30,
    `diasMaxAnticipacion` INTEGER NOT NULL DEFAULT 30,
    `maxCitasActivas` INTEGER NOT NULL DEFAULT 3,
    `publicada` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `anticipoActivo` BOOLEAN NOT NULL DEFAULT false,
    `montoAnticipo` DECIMAL(10, 2) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `barberias_activo_publicada_idx`(`activo`, `publicada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membresias` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `rol` ENUM('PROPIETARIO', 'BARBERO') NOT NULL,
    `estado` ENUM('INVITADO', 'ACTIVO', 'INACTIVO') NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `membresias_barberiaId_idx`(`barberiaId`),
    UNIQUE INDEX `membresias_usuarioId_barberiaId_key`(`usuarioId`, `barberiaId`),
    UNIQUE INDEX `membresias_id_barberiaId_key`(`id`, `barberiaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfiles_barbero` (
    `id` CHAR(36) NOT NULL,
    `membresiaId` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `nombreVisible` VARCHAR(80) NOT NULL,
    `archivoFoto` VARCHAR(255) NULL,
    `puedeEditarHorario` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `perfiles_barbero_membresiaId_key`(`membresiaId`),
    INDEX `perfiles_barbero_barberiaId_idx`(`barberiaId`),
    UNIQUE INDEX `perfiles_barbero_membresiaId_barberiaId_key`(`membresiaId`, `barberiaId`),
    UNIQUE INDEX `perfiles_barbero_id_barberiaId_key`(`id`, `barberiaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicios` (
    `id` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` VARCHAR(300) NULL,
    `etiquetasEstilo` VARCHAR(200) NOT NULL DEFAULT '',
    `precio` DECIMAL(8, 2) NOT NULL,
    `duracionMinutos` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `servicios_barberiaId_nombre_key`(`barberiaId`, `nombre`),
    UNIQUE INDEX `servicios_id_barberiaId_key`(`id`, `barberiaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicios_barbero` (
    `perfilBarberoId` CHAR(36) NOT NULL,
    `servicioId` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `servicios_barbero_servicioId_barberiaId_idx`(`servicioId`, `barberiaId`),
    INDEX `servicios_barbero_barberiaId_idx`(`barberiaId`),
    PRIMARY KEY (`perfilBarberoId`, `servicioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horarios_atencion` (
    `id` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `perfilBarberoId` CHAR(36) NULL,
    `diaSemana` TINYINT NOT NULL,
    `horaApertura` CHAR(5) NOT NULL,
    `horaCierre` CHAR(5) NOT NULL,
    `inicioPausa` CHAR(5) NULL,
    `finPausa` CHAR(5) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `horarios_atencion_perfilBarberoId_idx`(`perfilBarberoId`),
    UNIQUE INDEX `horarios_atencion_barberiaId_perfilBarberoId_diaSemana_key`(`barberiaId`, `perfilBarberoId`, `diaSemana`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloqueos` (
    `id` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `perfilBarberoId` CHAR(36) NULL,
    `iniciaEn` DATETIME(3) NOT NULL,
    `terminaEn` DATETIME(3) NOT NULL,
    `motivo` VARCHAR(200) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `bloqueos_barberiaId_iniciaEn_idx`(`barberiaId`, `iniciaEn`),
    INDEX `bloqueos_perfilBarberoId_iniciaEn_idx`(`perfilBarberoId`, `iniciaEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `clienteId` CHAR(36) NULL,
    `perfilBarberoId` CHAR(36) NOT NULL,
    `servicioId` CHAR(36) NOT NULL,
    `nombreCliente` VARCHAR(80) NULL,
    `telefonoCliente` VARCHAR(20) NULL,
    `iniciaEn` DATETIME(3) NOT NULL,
    `terminaEn` DATETIME(3) NOT NULL,
    `precioReserva` DECIMAL(8, 2) NOT NULL,
    `duracionReserva` INTEGER NOT NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'AUSENTE') NOT NULL,
    `notas` VARCHAR(200) NULL,
    `canceladaPorId` CHAR(36) NULL,
    `canceladaEn` DATETIME(3) NULL,
    `motivoCancelacion` VARCHAR(200) NULL,
    `claveIdempotencia` VARCHAR(64) NULL,
    `archivoFotoReferencia` VARCHAR(255) NULL,
    `anticipoVenceEn` DATETIME(3) NULL,
    -- Columna generada (DERCAS §8.5, skill reservas-concurrencia): solo tiene valor en citas activas.
    `inicioActivo` DATETIME(3) GENERATED ALWAYS AS (CASE WHEN `estado` IN ('PENDIENTE', 'CONFIRMADA') THEN `iniciaEn` ELSE NULL END) STORED,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `citas_perfilBarberoId_iniciaEn_estado_idx`(`perfilBarberoId`, `iniciaEn`, `estado`),
    INDEX `citas_clienteId_iniciaEn_idx`(`clienteId`, `iniciaEn`),
    INDEX `citas_barberiaId_iniciaEn_idx`(`barberiaId`, `iniciaEn`),
    INDEX `citas_servicioId_barberiaId_idx`(`servicioId`, `barberiaId`),
    INDEX `citas_canceladaPorId_idx`(`canceladaPorId`),
    UNIQUE INDEX `uq_citas_barbero_inicio_activo`(`perfilBarberoId`, `inicioActivo`),
    UNIQUE INDEX `citas_clienteId_claveIdempotencia_key`(`clienteId`, `claveIdempotencia`),
    UNIQUE INDEX `citas_id_barberiaId_key`(`id`, `barberiaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultas_estilo` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `rasgos` JSON NOT NULL,
    `recomendaciones` JSON NOT NULL,
    `citaId` CHAR(36) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `consultas_estilo_usuarioId_creadoEn_idx`(`usuarioId`, `creadoEn`),
    INDEX `consultas_estilo_barberiaId_idx`(`barberiaId`),
    INDEX `consultas_estilo_citaId_idx`(`citaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` CHAR(36) NOT NULL,
    `citaId` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NOT NULL,
    `tipo` ENUM('ANTICIPO', 'FINAL') NOT NULL,
    `metodo` ENUM('EFECTIVO', 'TRANSFERENCIA', 'DEUNA', 'TARJETA') NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `estado` ENUM('PENDIENTE', 'APROBADO', 'REEMBOLSADO', 'FALLIDO') NOT NULL,
    `referenciaPasarela` VARCHAR(120) NULL,
    `motivoAjuste` VARCHAR(200) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pagos_referenciaPasarela_key`(`referenciaPasarela`),
    INDEX `pagos_barberiaId_creadoEn_idx`(`barberiaId`, `creadoEn`),
    UNIQUE INDEX `pagos_citaId_tipo_key`(`citaId`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_renovacion` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `revocadoEn` DATETIME(3) NULL,
    `dispositivo` VARCHAR(100) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tokens_renovacion_tokenHash_key`(`tokenHash`),
    INDEX `tokens_renovacion_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codigos_recuperacion` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NOT NULL,
    `codigoHash` VARCHAR(100) NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `usadoEn` DATETIME(3) NULL,
    `intentos` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `codigos_recuperacion_usuarioId_creadoEn_idx`(`usuarioId`, `creadoEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros_auditoria` (
    `id` CHAR(36) NOT NULL,
    `barberiaId` CHAR(36) NULL,
    `actorId` CHAR(36) NULL,
    `accion` VARCHAR(60) NOT NULL,
    `tipoEntidad` VARCHAR(40) NOT NULL,
    `entidadId` CHAR(36) NULL,
    `antes` JSON NULL,
    `despues` JSON NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registros_auditoria_barberiaId_creadoEn_idx`(`barberiaId`, `creadoEn`),
    INDEX `registros_auditoria_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `membresias` ADD CONSTRAINT `membresias_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `membresias` ADD CONSTRAINT `membresias_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `perfiles_barbero` ADD CONSTRAINT `perfiles_barbero_membresiaId_barberiaId_fkey` FOREIGN KEY (`membresiaId`, `barberiaId`) REFERENCES `membresias`(`id`, `barberiaId`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `perfiles_barbero` ADD CONSTRAINT `perfiles_barbero_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `servicios` ADD CONSTRAINT `servicios_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `servicios_barbero` ADD CONSTRAINT `servicios_barbero_perfilBarberoId_barberiaId_fkey` FOREIGN KEY (`perfilBarberoId`, `barberiaId`) REFERENCES `perfiles_barbero`(`id`, `barberiaId`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `servicios_barbero` ADD CONSTRAINT `servicios_barbero_servicioId_barberiaId_fkey` FOREIGN KEY (`servicioId`, `barberiaId`) REFERENCES `servicios`(`id`, `barberiaId`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `servicios_barbero` ADD CONSTRAINT `servicios_barbero_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `horarios_atencion` ADD CONSTRAINT `horarios_atencion_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `horarios_atencion` ADD CONSTRAINT `horarios_atencion_perfilBarberoId_fkey` FOREIGN KEY (`perfilBarberoId`) REFERENCES `perfiles_barbero`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bloqueos` ADD CONSTRAINT `bloqueos_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bloqueos` ADD CONSTRAINT `bloqueos_perfilBarberoId_fkey` FOREIGN KEY (`perfilBarberoId`) REFERENCES `perfiles_barbero`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_perfilBarberoId_barberiaId_fkey` FOREIGN KEY (`perfilBarberoId`, `barberiaId`) REFERENCES `perfiles_barbero`(`id`, `barberiaId`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_servicioId_barberiaId_fkey` FOREIGN KEY (`servicioId`, `barberiaId`) REFERENCES `servicios`(`id`, `barberiaId`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_canceladaPorId_fkey` FOREIGN KEY (`canceladaPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `consultas_estilo` ADD CONSTRAINT `consultas_estilo_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `consultas_estilo` ADD CONSTRAINT `consultas_estilo_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `consultas_estilo` ADD CONSTRAINT `consultas_estilo_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `citas`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_citaId_barberiaId_fkey` FOREIGN KEY (`citaId`, `barberiaId`) REFERENCES `citas`(`id`, `barberiaId`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tokens_renovacion` ADD CONSTRAINT `tokens_renovacion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `codigos_recuperacion` ADD CONSTRAINT `codigos_recuperacion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `registros_auditoria` ADD CONSTRAINT `registros_auditoria_barberiaId_fkey` FOREIGN KEY (`barberiaId`) REFERENCES `barberias`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `registros_auditoria` ADD CONSTRAINT `registros_auditoria_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Restricciones CHECK (Prisma no las modela; DERCAS §9.2, §9.5 y §9.6).
ALTER TABLE `barberias`
    ADD CONSTRAINT `ck_barberias_minutos_cancelacion` CHECK (`minutosMinCancelacion` >= 0),
    ADD CONSTRAINT `ck_barberias_minutos_anticipacion` CHECK (`minutosMinAnticipacion` >= 0),
    ADD CONSTRAINT `ck_barberias_dias_anticipacion` CHECK (`diasMaxAnticipacion` >= 1),
    ADD CONSTRAINT `ck_barberias_max_citas_activas` CHECK (`maxCitasActivas` BETWEEN 1 AND 10),
    ADD CONSTRAINT `ck_barberias_anticipo` CHECK (`anticipoActivo` = FALSE OR `montoAnticipo` > 0),
    ADD CONSTRAINT `ck_barberias_monto_anticipo` CHECK (`montoAnticipo` IS NULL OR `montoAnticipo` > 0);

ALTER TABLE `servicios`
    ADD CONSTRAINT `ck_servicios_precio` CHECK (`precio` > 0),
    ADD CONSTRAINT `ck_servicios_duracion` CHECK (`duracionMinutos` BETWEEN 15 AND 240 AND `duracionMinutos` % 15 = 0);

ALTER TABLE `horarios_atencion`
    ADD CONSTRAINT `ck_horarios_dia_semana` CHECK (`diaSemana` BETWEEN 0 AND 6),
    ADD CONSTRAINT `ck_horarios_formato` CHECK (
        REGEXP_LIKE(`horaApertura`, '^([01][0-9]|2[0-3]):[0-5][0-9]$')
        AND REGEXP_LIKE(`horaCierre`, '^([01][0-9]|2[0-3]):[0-5][0-9]$')
        AND (`inicioPausa` IS NULL OR REGEXP_LIKE(`inicioPausa`, '^([01][0-9]|2[0-3]):[0-5][0-9]$'))
        AND (`finPausa` IS NULL OR REGEXP_LIKE(`finPausa`, '^([01][0-9]|2[0-3]):[0-5][0-9]$'))
    ),
    ADD CONSTRAINT `ck_horarios_cierre` CHECK (`horaCierre` > `horaApertura`),
    ADD CONSTRAINT `ck_horarios_pausa` CHECK (
        (`inicioPausa` IS NULL AND `finPausa` IS NULL)
        OR (`inicioPausa` >= `horaApertura` AND `finPausa` > `inicioPausa` AND `finPausa` <= `horaCierre`)
    );

ALTER TABLE `bloqueos`
    ADD CONSTRAINT `ck_bloqueos_rango` CHECK (`terminaEn` > `iniciaEn`);

ALTER TABLE `citas`
    ADD CONSTRAINT `ck_citas_cliente` CHECK (
        `clienteId` IS NOT NULL OR (`nombreCliente` IS NOT NULL AND `telefonoCliente` IS NOT NULL)
    ),
    ADD CONSTRAINT `ck_citas_precio` CHECK (`precioReserva` > 0),
    ADD CONSTRAINT `ck_citas_duracion` CHECK (`duracionReserva` BETWEEN 15 AND 240 AND `duracionReserva` % 15 = 0),
    ADD CONSTRAINT `ck_citas_fin` CHECK (`terminaEn` = `iniciaEn` + INTERVAL `duracionReserva` MINUTE);

ALTER TABLE `pagos`
    ADD CONSTRAINT `ck_pagos_monto` CHECK (`monto` > 0);

ALTER TABLE `codigos_recuperacion`
    ADD CONSTRAINT `ck_codigos_intentos` CHECK (`intentos` >= 0);
