// Restricciones del modelo que protegen las reglas en la propia base (DERCAS §8.5, §9.4, §9.6 y §11.3).
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  crearCitaDePrueba,
  crearUsuarioDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  limpiarBase,
} from '../pruebas/fabricas';
import { baseDatos } from './base-datos';

const INICIO = new Date('2026-12-01T15:00:00.000Z');

function datosCita(cambios: Record<string, unknown> = {}) {
  return {
    barberiaId: IDS_PRUEBA.barberia,
    clienteId: IDS_PRUEBA.cliente,
    perfilBarberoId: IDS_PRUEBA.perfilBarbero,
    servicioId: IDS_PRUEBA.servicioCorte,
    iniciaEn: INICIO,
    terminaEn: new Date('2026-12-01T15:30:00.000Z'),
    precioReserva: '8.00',
    duracionReserva: 30,
    estado: 'CONFIRMADA' as const,
    ...cambios,
  };
}

describe('Modelo de datos (T1.2)', () => {
  beforeEach(async () => {
    await limpiarBase();
    await escenarioBase();
  });

  afterAll(async () => {
    await limpiarBase();
    await baseDatos.$disconnect();
  });

  describe('§8.5: doble reserva con inicioActivo', () => {
    it('RN-04: rechaza dos citas activas del mismo barbero a la misma hora', async () => {
      await baseDatos.cita.create({ data: datosCita() });

      await expect(
        baseDatos.cita.create({ data: datosCita({ estado: 'PENDIENTE' }) }),
      ).rejects.toMatchObject({
        code: 'P2002',
      });
    });

    it('RN-04: permite reservar el horario de una cita cancelada', async () => {
      const cancelada = await baseDatos.cita.create({ data: datosCita() });
      await baseDatos.cita.update({ where: { id: cancelada.id }, data: { estado: 'CANCELADA' } });

      await expect(baseDatos.cita.create({ data: datosCita() })).resolves.toMatchObject({
        estado: 'CONFIRMADA',
      });
    });

    it('inicioActivo solo tiene valor en citas PENDIENTE o CONFIRMADA', async () => {
      const cita = await baseDatos.cita.create({ data: datosCita() });
      expect(cita.inicioActivo).toEqual(INICIO);

      const completada = await baseDatos.cita.update({
        where: { id: cita.id },
        data: { estado: 'COMPLETADA' },
      });
      expect(completada.inicioActivo).toBeNull();
    });
  });

  describe('§9.6: citas de clientes sin cuenta', () => {
    it('acepta una cita sin cliente si trae nombre y telefono', async () => {
      const datos = datosCita({
        clienteId: null,
        nombreCliente: 'Juan',
        telefonoCliente: '0991234567',
      });

      await expect(baseDatos.cita.create({ data: datos })).resolves.toMatchObject({
        clienteId: null,
      });
    });

    it('rechaza una cita sin cliente ni nombre y telefono', async () => {
      await expect(baseDatos.cita.create({ data: datosCita({ clienteId: null }) })).rejects.toThrow(
        /ck_citas_cliente/,
      );
    });
  });

  describe('§9.2: valores de la cita', () => {
    it('RN-02: rechaza un fin distinto de inicio + duracion', async () => {
      const datos = datosCita({ terminaEn: new Date('2026-12-01T15:45:00.000Z') });

      await expect(baseDatos.cita.create({ data: datos })).rejects.toThrow(/ck_citas_fin/);
    });

    it('rechaza un servicio con duracion que no es multiplo de 15', async () => {
      const datos = {
        barberiaId: IDS_PRUEBA.barberia,
        nombre: 'Cejas',
        precio: '3.00',
        duracionMinutos: 20,
      };

      await expect(baseDatos.servicio.create({ data: datos })).rejects.toThrow(
        /ck_servicios_duracion/,
      );
    });

    it('rechaza un horario que cierra antes de abrir', async () => {
      const datos = {
        barberiaId: IDS_PRUEBA.barberia,
        perfilBarberoId: IDS_PRUEBA.perfilBarbero,
        diaSemana: 1,
        horaApertura: '18:00',
        horaCierre: '09:00',
      };

      await expect(baseDatos.horarioAtencion.create({ data: datos })).rejects.toThrow(
        /ck_horarios_cierre/,
      );
    });
  });

  describe('§11.3: aislamiento entre barberias', () => {
    it('rechaza una cita con un servicio de otra barberia', async () => {
      await expect(
        baseDatos.cita.create({ data: datosCita({ servicioId: IDS_PRUEBA.servicioOtra }) }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('rechaza ofrecer en un perfil un servicio de otra barberia', async () => {
      const datos = {
        perfilBarberoId: IDS_PRUEBA.perfilBarbero,
        servicioId: IDS_PRUEBA.servicioOtra,
        barberiaId: IDS_PRUEBA.barberia,
      };

      await expect(baseDatos.servicioBarbero.create({ data: datos })).rejects.toMatchObject({
        code: 'P2003',
      });
    });
  });

  describe('§9.4: restricciones unicas', () => {
    it('rechaza una membresia duplicada para el mismo usuario y barberia', async () => {
      const datos = {
        usuarioId: IDS_PRUEBA.barbero,
        barberiaId: IDS_PRUEBA.barberia,
        rol: 'PROPIETARIO' as const,
        estado: 'ACTIVO' as const,
      };

      await expect(baseDatos.membresia.create({ data: datos })).rejects.toMatchObject({
        code: 'P2002',
      });
    });

    it('rechaza un segundo pago FINAL para la misma cita', async () => {
      const cita = await crearCitaDePrueba({
        barberiaId: IDS_PRUEBA.barberia,
        perfilBarberoId: IDS_PRUEBA.perfilBarbero,
        servicioId: IDS_PRUEBA.servicioCorte,
        iniciaEn: INICIO,
        estado: 'COMPLETADA',
      });
      const pago = {
        citaId: cita.id,
        barberiaId: IDS_PRUEBA.barberia,
        tipo: 'FINAL' as const,
        metodo: 'EFECTIVO' as const,
        monto: '8.00',
        estado: 'APROBADO' as const,
      };
      await baseDatos.pago.create({ data: pago });

      await expect(baseDatos.pago.create({ data: pago })).rejects.toMatchObject({ code: 'P2002' });
    });

    it('rechaza un correo repetido', async () => {
      await expect(crearUsuarioDePrueba({ correo: 'cliente@barberly.test' })).rejects.toMatchObject(
        {
          code: 'P2002',
        },
      );
    });
  });
});
