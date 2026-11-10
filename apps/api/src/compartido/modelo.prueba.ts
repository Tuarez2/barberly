// Restricciones del modelo que protegen las reglas en la propia base (DERCAS §8.5, §9.4, §9.6 y §11.3).
// Las fabricas completas llegan en T1.3; aqui se crea solo lo minimo con UUID fijos.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { baseDatos } from './base-datos';

const IDS = {
  propietario: '00000000-0000-4000-8000-000000000101',
  barbero: '00000000-0000-4000-8000-000000000102',
  cliente: '00000000-0000-4000-8000-000000000103',
  barberia: '00000000-0000-4000-8000-000000000201',
  otraBarberia: '00000000-0000-4000-8000-000000000202',
  membresia: '00000000-0000-4000-8000-000000000301',
  perfil: '00000000-0000-4000-8000-000000000401',
  servicio: '00000000-0000-4000-8000-000000000501',
  servicioAjeno: '00000000-0000-4000-8000-000000000502',
} as const;

const INICIO = new Date('2026-12-01T15:00:00.000Z');
const FIN = new Date('2026-12-01T15:30:00.000Z');

async function limpiar() {
  await baseDatos.registroAuditoria.deleteMany();
  await baseDatos.pago.deleteMany();
  await baseDatos.consultaEstilo.deleteMany();
  await baseDatos.cita.deleteMany();
  await baseDatos.bloqueo.deleteMany();
  await baseDatos.horarioAtencion.deleteMany();
  await baseDatos.servicioBarbero.deleteMany();
  await baseDatos.servicio.deleteMany();
  await baseDatos.perfilBarbero.deleteMany();
  await baseDatos.membresia.deleteMany();
  await baseDatos.codigoRecuperacion.deleteMany();
  await baseDatos.tokenRenovacion.deleteMany();
  await baseDatos.barberia.deleteMany();
  await baseDatos.usuario.deleteMany();
}

function usuario(id: string, correo: string) {
  return { id, nombre: 'Prueba', correo, telefono: '0991234567', claveHash: 'hash-de-prueba' };
}

function barberia(id: string) {
  return {
    id,
    nombre: 'Barberia de prueba',
    direccion: 'Av. Siempre Viva',
    telefono: '0991234567',
  };
}

async function sembrar() {
  await baseDatos.usuario.createMany({
    data: [
      usuario(IDS.propietario, 'propietario@prueba.ec'),
      usuario(IDS.barbero, 'barbero@prueba.ec'),
      usuario(IDS.cliente, 'cliente@prueba.ec'),
    ],
  });
  await baseDatos.barberia.createMany({
    data: [barberia(IDS.barberia), barberia(IDS.otraBarberia)],
  });
  await baseDatos.membresia.create({
    data: {
      id: IDS.membresia,
      usuarioId: IDS.barbero,
      barberiaId: IDS.barberia,
      rol: 'BARBERO',
      estado: 'ACTIVO',
    },
  });
  await baseDatos.perfilBarbero.create({
    data: {
      id: IDS.perfil,
      membresiaId: IDS.membresia,
      barberiaId: IDS.barberia,
      nombreVisible: 'Barbero',
    },
  });
  await baseDatos.servicio.createMany({
    data: [
      {
        id: IDS.servicio,
        barberiaId: IDS.barberia,
        nombre: 'Corte',
        precio: '8.50',
        duracionMinutos: 30,
      },
      {
        id: IDS.servicioAjeno,
        barberiaId: IDS.otraBarberia,
        nombre: 'Corte',
        precio: '8.50',
        duracionMinutos: 30,
      },
    ],
  });
}

function datosCita(cambios: Record<string, unknown> = {}) {
  return {
    barberiaId: IDS.barberia,
    clienteId: IDS.cliente,
    perfilBarberoId: IDS.perfil,
    servicioId: IDS.servicio,
    iniciaEn: INICIO,
    terminaEn: FIN,
    precioReserva: '8.50',
    duracionReserva: 30,
    estado: 'CONFIRMADA' as const,
    ...cambios,
  };
}

describe('Modelo de datos (T1.2)', () => {
  beforeEach(async () => {
    await limpiar();
    await sembrar();
  });

  afterAll(async () => {
    await limpiar();
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
        barberiaId: IDS.barberia,
        nombre: 'Barba',
        precio: '5.00',
        duracionMinutos: 20,
      };

      await expect(baseDatos.servicio.create({ data: datos })).rejects.toThrow(
        /ck_servicios_duracion/,
      );
    });

    it('rechaza un horario que cierra antes de abrir', async () => {
      const datos = {
        barberiaId: IDS.barberia,
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
        baseDatos.cita.create({ data: datosCita({ servicioId: IDS.servicioAjeno }) }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('rechaza ofrecer en un perfil un servicio de otra barberia', async () => {
      const datos = {
        perfilBarberoId: IDS.perfil,
        servicioId: IDS.servicioAjeno,
        barberiaId: IDS.barberia,
      };

      await expect(baseDatos.servicioBarbero.create({ data: datos })).rejects.toMatchObject({
        code: 'P2003',
      });
    });
  });

  describe('§9.4: restricciones unicas', () => {
    it('rechaza una membresia duplicada para el mismo usuario y barberia', async () => {
      const datos = {
        usuarioId: IDS.barbero,
        barberiaId: IDS.barberia,
        rol: 'PROPIETARIO' as const,
        estado: 'ACTIVO' as const,
      };

      await expect(baseDatos.membresia.create({ data: datos })).rejects.toMatchObject({
        code: 'P2002',
      });
    });

    it('rechaza un segundo pago FINAL para la misma cita', async () => {
      const cita = await baseDatos.cita.create({ data: datosCita({ estado: 'COMPLETADA' }) });
      const pago = {
        citaId: cita.id,
        barberiaId: IDS.barberia,
        tipo: 'FINAL' as const,
        metodo: 'EFECTIVO' as const,
        monto: '8.50',
        estado: 'APROBADO' as const,
      };
      await baseDatos.pago.create({ data: pago });

      await expect(baseDatos.pago.create({ data: pago })).rejects.toMatchObject({ code: 'P2002' });
    });

    it('rechaza un correo repetido', async () => {
      const datos = usuario('00000000-0000-4000-8000-000000000199', 'cliente@prueba.ec');

      await expect(baseDatos.usuario.create({ data: datos })).rejects.toMatchObject({
        code: 'P2002',
      });
    });
  });
});
