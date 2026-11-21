import { afterAll, describe, expect, it } from 'vitest';

import { baseDatos } from './base-datos';

describe('Fase 0: base de datos', () => {
  afterAll(() => baseDatos.$disconnect());

  it('conecta a barberly_prueba con el adaptador', async () => {
    const filas = await baseDatos.$queryRaw<{ base: string }[]>`SELECT DATABASE() AS base`;

    expect(filas).toEqual([{ base: 'barberly_prueba' }]);
  });
});
