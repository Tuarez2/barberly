// Fabricas de prueba (T1.3, DERCAS §7.1, skill pruebas-api).
import bcrypt from 'bcryptjs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { baseDatos } from '../compartido/base-datos';
import {
  CLAVE_PRUEBA,
  crearCitaDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  limpiarBase,
} from './fabricas';

describe('Fabricas de prueba (T1.3)', () => {
  beforeEach(async () => {
    await limpiarBase();
    await escenarioBase();
  });

  afterAll(async () => {
    await limpiarBase();
    await baseDatos.$disconnect();
  });

  it('escenarioBase deja dos barberias publicadas, cada una con su propietario y su barbero', async () => {
    const barberias = await baseDatos.barberia.findMany({
      include: { membresias: true, perfilesBarbero: true, servicios: true },
      orderBy: { id: 'asc' },
    });

    expect(barberias.map((b) => b.id)).toEqual([IDS_PRUEBA.barberia, IDS_PRUEBA.otraBarberia]);
    for (const barberia of barberias) {
      expect(barberia.publicada).toBe(true);
      expect(barberia.membresias.map((m) => m.rol).sort()).toEqual(['BARBERO', 'PROPIETARIO']);
      expect(barberia.perfilesBarbero).toHaveLength(1);
      expect(barberia.servicios.length).toBeGreaterThan(0);
    }
  });

  it('los datos de cada barberia no se mezclan (§11.3)', async () => {
    const serviciosOtra = await baseDatos.servicio.findMany({
      where: { barberiaId: IDS_PRUEBA.otraBarberia },
    });

    expect(serviciosOtra.map((s) => s.id)).toEqual([IDS_PRUEBA.servicioOtra]);
  });

  it('los usuarios guardan el hash de CLAVE_PRUEBA, nunca la clave', async () => {
    const cliente = await baseDatos.usuario.findUniqueOrThrow({
      where: { id: IDS_PRUEBA.cliente },
    });

    expect(cliente.claveHash).not.toBe(CLAVE_PRUEBA);
    await expect(bcrypt.compare(CLAVE_PRUEBA, cliente.claveHash)).resolves.toBe(true);
  });

  it('crearCitaDePrueba congela precio y duracion del servicio (RN-02, RN-03)', async () => {
    const iniciaEn = new Date('2026-12-01T15:00:00.000Z');
    const cita = await crearCitaDePrueba({
      barberiaId: IDS_PRUEBA.barberia,
      perfilBarberoId: IDS_PRUEBA.perfilBarbero,
      servicioId: IDS_PRUEBA.servicioCorte,
      iniciaEn,
    });

    expect(cita.precioReserva.toString()).toBe('8');
    expect(cita.duracionReserva).toBe(30);
    expect(cita.terminaEn).toEqual(new Date('2026-12-01T15:30:00.000Z'));
  });

  it('limpiarBase reinicia los ids generados para que se repitan', async () => {
    const primera = await crearCitaDePrueba({
      barberiaId: IDS_PRUEBA.barberia,
      perfilBarberoId: IDS_PRUEBA.perfilBarbero,
      servicioId: IDS_PRUEBA.servicioCorte,
      iniciaEn: new Date('2026-12-01T15:00:00.000Z'),
    });
    await limpiarBase();
    await escenarioBase();
    const segunda = await crearCitaDePrueba({
      barberiaId: IDS_PRUEBA.barberia,
      perfilBarberoId: IDS_PRUEBA.perfilBarbero,
      servicioId: IDS_PRUEBA.servicioCorte,
      iniciaEn: new Date('2026-12-01T15:00:00.000Z'),
    });

    expect(segunda.id).toBe(primera.id);
  });
});
