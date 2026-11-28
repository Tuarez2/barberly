import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  crearBarberiaDePrueba,
  crearUsuarioDePrueba,
  IDS_PRUEBA,
  limpiarBase,
} from '../pruebas/fabricas';
import { baseDatos } from './base-datos';

describe('Fase 0: base de datos', () => {
  afterAll(() => baseDatos.$disconnect());

  it('conecta a barberly_prueba con el adaptador', async () => {
    const filas = await baseDatos.$queryRaw<{ base: string }[]>`SELECT current_database() AS base`;

    expect(filas).toEqual([{ base: 'barberly_prueba' }]);
  });
});

// Regresion D-19 y §8.6: la sesion del adaptador va en UTC. Si la sesion tomara la zona del servidor
// (p. ej. America/Guayaquil), los Date que envia el adaptador se guardarian corridos 5 horas.
describe('D-19 §8.6: timestamptz en UTC', () => {
  const INSTANTE = new Date('2026-03-10T15:00:00.000Z');
  const BLOQUEO_ID = '00000000-0000-4000-8000-000000000901';

  beforeEach(async () => {
    await limpiarBase();
    await crearUsuarioDePrueba({
      id: IDS_PRUEBA.propietario,
      correo: 'propietario@barberly.test',
    });
    await crearBarberiaDePrueba({
      id: IDS_PRUEBA.barberia,
      propietarioId: IDS_PRUEBA.propietario,
      conHorario: false,
    });
    await baseDatos.bloqueo.create({
      data: {
        id: BLOQUEO_ID,
        barberiaId: IDS_PRUEBA.barberia,
        iniciaEn: INSTANTE,
        terminaEn: new Date('2026-03-10T16:00:00.000Z'),
      },
    });
  });

  afterAll(() => limpiarBase());

  it('la sesion del cliente baseDatos usa TimeZone UTC', async () => {
    const filas = await baseDatos.$queryRaw<
      { zona: string }[]
    >`SELECT current_setting('TimeZone') AS zona`;

    expect(filas).toEqual([{ zona: 'UTC' }]);
  });

  it('un Date guardado con Prisma queda en el mismo instante UTC en la base y al leerlo', async () => {
    const filas = await baseDatos.$queryRaw<{ utc: string }[]>`
      SELECT ("iniciaEn" AT TIME ZONE 'UTC')::text AS utc FROM bloqueos WHERE id = ${BLOQUEO_ID}::uuid`;
    const leido = await baseDatos.bloqueo.findUniqueOrThrow({ where: { id: BLOQUEO_ID } });

    expect(filas).toEqual([{ utc: '2026-03-10 15:00:00' }]);
    expect(leido.iniciaEn.toISOString()).toBe('2026-03-10T15:00:00.000Z');
  });

  it('un Date enviado por $queryRaw como ::timestamptz es el mismo instante que el guardado', async () => {
    const filas = await baseDatos.$queryRaw<{ igualGuardado: boolean; igualLiteral: boolean }[]>`
      SELECT "iniciaEn" = ${INSTANTE}::timestamptz AS "igualGuardado",
             ${INSTANTE}::timestamptz = '2026-03-10T15:00:00Z'::timestamptz AS "igualLiteral"
      FROM bloqueos WHERE id = ${BLOQUEO_ID}::uuid`;

    expect(filas).toEqual([{ igualGuardado: true, igualLiteral: true }]);
  });
});
