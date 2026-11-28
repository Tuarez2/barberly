// Detalle publico, GET /barberias/:id, /barberias/:id/servicios y /barberias/:id/barberos
// (T2.9, BUS-05 a BUS-08, HU-BUS-02, D-07, D-31, D-32).
// La especificacion vive en docs/especificaciones/busqueda.md (Detalle, Servicios, Barberos y Dudas 4 a 7).
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { fijarAhora, restaurarAhora } from '../../compartido/reloj';
import {
  crearBarberiaDePrueba,
  crearBarberoDePrueba,
  crearUsuarioDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../../pruebas/fabricas';
import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';

const RUTA = '/api/v1/barberias';
const DIRECCION = 'Av. 9 de Octubre 100, Guayaquil';
const TELEFONO_BARBERIA = '042345678';
const CENTRO = IDS_PRUEBA.barberia;
const NORTE = IDS_PRUEBA.otraBarberia;

// Duena de las barberias extra; no es miembro de las del escenario base.
const DUENA = IDS_PRUEBA.usuario;

// 2026-12-01 es martes; America/Guayaquil es UTC-5 todo el ano.
function fechaLocal(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00-05:00`);
}
const AHORA = fechaLocal('2026-12-01', '10:00');

function pedir(ruta: string, usuarioId: string = IDS_PRUEBA.cliente) {
  return request(app)
    .get(`${RUTA}${ruta}`)
    .set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
}
const detalle = (id: string, usuarioId?: string) => pedir(`/${id}`, usuarioId);
const listarServicios = (id: string, usuarioId?: string) => pedir(`/${id}/servicios`, usuarioId);
const listarBarberos = (id: string, usuarioId?: string) => pedir(`/${id}/barberos`, usuarioId);

// Exige 200 primero: mientras la ruta no exista, el fallo muestra el 404 y no un TypeError.
function datos(respuesta: request.Response) {
  expect(respuesta.status).toBe(200);
  return respuesta.body.datos;
}

function esperarNoEncontrado(respuesta: request.Response) {
  expect(respuesta.status).toBe(404);
  expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  expect(respuesta.body.datos).toBeUndefined();
}

// Horario general que crearBarberiaDePrueba da a Centro y Norte: 09:00-19:00 los 7 dias, pausa 13:00-14:00.
const HORARIOS_BASE = [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
  diaSemana,
  horaApertura: '09:00',
  horaCierre: '19:00',
  inicioPausa: '13:00',
  finPausa: '14:00',
}));

const CENTRO_PUBLICA = {
  id: CENTRO,
  nombre: 'Barberia Centro',
  descripcion: null,
  direccion: DIRECCION,
  telefono: TELEFONO_BARBERIA,
  urlPortada: null,
  abierta: true,
  horarios: HORARIOS_BASE,
  cierres: [],
};

const CLAVES_DETALLE = [
  'abierta',
  'cierres',
  'descripcion',
  'direccion',
  'horarios',
  'id',
  'nombre',
  'telefono',
  'urlPortada',
];

async function actualizarBarberia(id: string, data: { publicada?: boolean; activo?: boolean }) {
  await baseDatos.barberia.update({ where: { id }, data });
}

async function cambiarEstadoMembresia(
  usuarioId: string,
  barberiaId: string,
  estado: 'ACTIVO' | 'INACTIVO' | 'INVITADO',
) {
  await baseDatos.membresia.update({
    where: { usuarioId_barberiaId: { usuarioId, barberiaId } },
    data: { estado },
  });
}

async function crearBloqueo(datosBloqueo: {
  numero: number;
  barberiaId?: string;
  perfilBarberoId?: string;
  iniciaEn: Date;
  terminaEn: Date;
  motivo?: string;
}) {
  return baseDatos.bloqueo.create({
    data: {
      id: idPrueba(datosBloqueo.numero),
      barberiaId: datosBloqueo.barberiaId ?? CENTRO,
      perfilBarberoId: datosBloqueo.perfilBarberoId,
      iniciaEn: datosBloqueo.iniciaEn,
      terminaEn: datosBloqueo.terminaEn,
      motivo: datosBloqueo.motivo,
    },
  });
}

const cierre = (bloqueo: { iniciaEn: Date; terminaEn: Date }) => ({
  iniciaEn: bloqueo.iniciaEn.toISOString(),
  terminaEn: bloqueo.terminaEn.toISOString(),
});

beforeEach(async () => {
  await limpiarBase();
  // Centro (propietario, barbero Carlos con Corte clasico y Barba) y Norte (propietaria otra,
  // barbero Andres), ambas publicadas; mas un cliente.
  await escenarioBase();
  await crearUsuarioDePrueba({ id: DUENA, nombre: 'Duena', correo: 'duena@barberly.test' });
  fijarAhora(AHORA);
});

afterEach(() => {
  restaurarAhora();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('BUS-05: GET /api/v1/barberias/:id', () => {
  it('BUS-05: responde 200 { datos } con descripcion, direccion, telefono, portada, abierta, horarios y cierres', async () => {
    const respuesta = await detalle(CENTRO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: CENTRO_PUBLICA });
  });

  it('BUS-05: sin claveArchivo ni reglas internas: solo las claves del contrato, sin publicada ni activo para el publico', async () => {
    await baseDatos.barberia.update({
      where: { id: CENTRO },
      data: { archivoPortada: 'portadas/centro.webp', descripcion: 'Cortes desde 1990' },
    });

    const barberia = datos(await detalle(CENTRO));

    expect(Object.keys(barberia).sort()).toEqual(CLAVES_DETALLE);
    expect(barberia.descripcion).toBe('Cortes desde 1990');
    expect(barberia.urlPortada).toEqual(expect.any(String));
    for (const interno of [
      'archivoPortada',
      'zonaHoraria',
      'minutosMinCancelacion',
      'minutosMinAnticipacion',
      'diasMaxAnticipacion',
      'maxCitasActivas',
      'anticipoActivo',
      'montoAnticipo',
      'publicada',
      'activo',
    ]) {
      expect(barberia).not.toHaveProperty(interno);
    }
  });

  it('BUS-05: no expone correos ni telefonos de los usuarios ni datos de otra barberia', async () => {
    const respuesta = await detalle(CENTRO);

    expect(respuesta.status).toBe(200);
    const texto = JSON.stringify(respuesta.body);
    expect(texto).not.toContain('@');
    expect(texto).not.toContain('0991234567');
    expect(texto).not.toContain(NORTE);
    expect(texto).not.toContain('Barberia Norte');
  });

  it('BUS-05: abierta es false en la pausa (13:30) y true de nuevo a las 14:00', async () => {
    fijarAhora(fechaLocal('2026-12-01', '13:30'));
    const enPausa = datos(await detalle(CENTRO));
    fijarAhora(fechaLocal('2026-12-01', '14:00'));
    const despues = datos(await detalle(CENTRO));

    expect(enPausa.abierta).toBe(false);
    expect(despues.abierta).toBe(true);
  });

  it('D-31: abierta es false con un Bloqueo vigente de la barberia y no con el de un barbero', async () => {
    await crearBloqueo({
      numero: 500,
      perfilBarberoId: IDS_PRUEBA.perfilBarbero,
      iniciaEn: fechaLocal('2026-12-01', '09:00'),
      terminaEn: fechaLocal('2026-12-01', '12:00'),
    });
    expect(datos(await detalle(CENTRO)).abierta).toBe(true);

    await crearBloqueo({
      numero: 501,
      iniciaEn: fechaLocal('2026-12-01', '09:30'),
      terminaEn: fechaLocal('2026-12-01', '11:00'),
    });
    expect(datos(await detalle(CENTRO)).abierta).toBe(false);
  });
});

describe('BUS-08: horario semanal y cierres visibles', () => {
  it('BUS-08: horarios solo del horario general, ordenados por dia; los dias sin fila no salen; pausa null si no hay', async () => {
    await baseDatos.horarioAtencion.deleteMany({ where: { barberiaId: CENTRO } });
    await baseDatos.horarioAtencion.createMany({
      data: [
        {
          id: idPrueba(510),
          barberiaId: CENTRO,
          diaSemana: 5,
          horaApertura: '10:00',
          horaCierre: '20:00',
        },
        {
          id: idPrueba(511),
          barberiaId: CENTRO,
          diaSemana: 1,
          horaApertura: '08:30',
          horaCierre: '17:00',
          inicioPausa: '12:00',
          finPausa: '13:00',
        },
        {
          id: idPrueba(512),
          barberiaId: CENTRO,
          diaSemana: 0,
          horaApertura: '09:00',
          horaCierre: '13:00',
        },
        // Horario propio del barbero: no es el horario general de la barberia (D-31).
        {
          id: idPrueba(513),
          barberiaId: CENTRO,
          perfilBarberoId: IDS_PRUEBA.perfilBarbero,
          diaSemana: 3,
          horaApertura: '07:00',
          horaCierre: '22:00',
        },
      ],
    });

    const barberia = datos(await detalle(CENTRO));

    expect(barberia.horarios).toEqual([
      {
        diaSemana: 0,
        horaApertura: '09:00',
        horaCierre: '13:00',
        inicioPausa: null,
        finPausa: null,
      },
      {
        diaSemana: 1,
        horaApertura: '08:30',
        horaCierre: '17:00',
        inicioPausa: '12:00',
        finPausa: '13:00',
      },
      {
        diaSemana: 5,
        horaApertura: '10:00',
        horaCierre: '20:00',
        inicioPausa: null,
        finPausa: null,
      },
    ]);
    // Martes sin fila general: no atiende aunque el barbero tenga horario el miercoles.
    expect(barberia.abierta).toBe(false);
  });

  it('BUS-08: sin horario general responde horarios vacio', async () => {
    await baseDatos.horarioAtencion.deleteMany({ where: { barberiaId: CENTRO } });

    const barberia = datos(await detalle(CENTRO));

    expect(barberia.horarios).toEqual([]);
    expect(barberia.abierta).toBe(false);
  });

  it('D-32: cierres trae los Bloqueo de toda la barberia que no terminaron y empiezan dentro de diasMaxAnticipacion, por iniciaEn y sin motivo', async () => {
    // Creados fuera de orden para comprobar el orden por iniciaEn.
    const futuro = await crearBloqueo({
      numero: 520,
      iniciaEn: fechaLocal('2026-12-10', '09:00'),
      terminaEn: fechaLocal('2026-12-10', '18:00'),
      motivo: 'Capacitacion',
    });
    const vigente = await crearBloqueo({
      numero: 521,
      iniciaEn: fechaLocal('2026-12-01', '09:30'),
      terminaEn: fechaLocal('2026-12-01', '11:00'),
      motivo: 'Fumigacion',
    });
    const dentroDelLimite = await crearBloqueo({
      numero: 522,
      iniciaEn: fechaLocal('2026-12-29', '09:00'),
      terminaEn: fechaLocal('2026-12-29', '19:00'),
    });
    // Ya termino.
    await crearBloqueo({
      numero: 523,
      iniciaEn: fechaLocal('2026-11-30', '09:00'),
      terminaEn: fechaLocal('2026-11-30', '12:00'),
      motivo: 'Pasado',
    });
    // Empieza despues de los 30 dias de diasMaxAnticipacion.
    await crearBloqueo({
      numero: 524,
      iniciaEn: fechaLocal('2027-01-15', '09:00'),
      terminaEn: fechaLocal('2027-01-15', '19:00'),
    });
    // De un barbero, no de toda la barberia.
    await crearBloqueo({
      numero: 525,
      perfilBarberoId: IDS_PRUEBA.perfilBarbero,
      iniciaEn: fechaLocal('2026-12-05', '09:00'),
      terminaEn: fechaLocal('2026-12-05', '19:00'),
      motivo: 'Vacaciones de Carlos',
    });
    // De otra barberia.
    await crearBloqueo({
      numero: 526,
      barberiaId: NORTE,
      iniciaEn: fechaLocal('2026-12-04', '09:00'),
      terminaEn: fechaLocal('2026-12-04', '19:00'),
      motivo: 'Norte cerrada',
    });

    const respuesta = await detalle(CENTRO);
    const barberia = datos(respuesta);

    expect(barberia.cierres).toEqual([cierre(vigente), cierre(futuro), cierre(dentroDelLimite)]);
    const texto = JSON.stringify(respuesta.body);
    for (const motivo of [
      'Capacitacion',
      'Fumigacion',
      'Pasado',
      'Vacaciones',
      'Norte cerrada',
      'motivo',
    ]) {
      expect(texto).not.toContain(motivo);
    }
  });

  it('D-32: un Bloqueo que termina justo ahora ya no es un cierre', async () => {
    await crearBloqueo({
      numero: 530,
      iniciaEn: fechaLocal('2026-12-01', '08:00'),
      terminaEn: AHORA,
    });

    expect(datos(await detalle(CENTRO)).cierres).toEqual([]);
  });

  it('D-32: la ventana de cierres usa el diasMaxAnticipacion de la barberia', async () => {
    await baseDatos.barberia.update({ where: { id: CENTRO }, data: { diasMaxAnticipacion: 7 } });
    const dentro = await crearBloqueo({
      numero: 540,
      iniciaEn: fechaLocal('2026-12-06', '09:00'),
      terminaEn: fechaLocal('2026-12-06', '19:00'),
    });
    await crearBloqueo({
      numero: 541,
      iniciaEn: fechaLocal('2026-12-10', '09:00'),
      terminaEn: fechaLocal('2026-12-10', '19:00'),
    });

    expect(datos(await detalle(CENTRO)).cierres).toEqual([cierre(dentro)]);
  });
});

describe('D-07, D-32: visibilidad del detalle para miembros', () => {
  it('BUS-05: no publicada: el cliente recibe NO_ENCONTRADO; su propietario 200 con publicada false y activo true', async () => {
    await actualizarBarberia(CENTRO, { publicada: false });

    const propietario = await detalle(CENTRO, IDS_PRUEBA.propietario);
    const cliente = await detalle(CENTRO, IDS_PRUEBA.cliente);

    expect(propietario.status).toBe(200);
    expect(propietario.body).toEqual({
      datos: { ...CENTRO_PUBLICA, publicada: false, activo: true },
    });
    esperarNoEncontrado(cliente);
  });

  it('D-32: inactiva (aunque publicada): el cliente recibe NO_ENCONTRADO; su propietario 200 con activo false', async () => {
    await actualizarBarberia(CENTRO, { publicada: true, activo: false });

    const propietario = await detalle(CENTRO, IDS_PRUEBA.propietario);
    const cliente = await detalle(CENTRO, IDS_PRUEBA.cliente);

    expect(propietario.status).toBe(200);
    expect(propietario.body).toEqual({
      datos: { ...CENTRO_PUBLICA, publicada: true, activo: false },
    });
    esperarNoEncontrado(cliente);
  });

  it('D-32: un barbero ACTIVO de la barberia tambien la ve sin publicar, con publicada y activo', async () => {
    await actualizarBarberia(CENTRO, { publicada: false });

    const barberia = datos(await detalle(CENTRO, IDS_PRUEBA.barbero));

    expect(barberia).toMatchObject({ id: CENTRO, publicada: false, activo: true });
  });
});

// La especificacion fija la misma visibilidad y NO_ENCONTRADO para las tres rutas.
// Cada caso de 404 compara contra un control en 200 para no pasar mientras la ruta no exista.
describe.each([
  ['detalle', ''],
  ['servicios', '/servicios'],
  ['barberos', '/barberos'],
])('D-07, D-32: visibilidad de GET /barberias/:id%s (%s)', (_nombre, sufijo) => {
  const pedirRuta = (id: string, usuarioId?: string) => pedir(`/${id}${sufijo}`, usuarioId);

  it('BUS-05: un UUID inexistente responde NO_ENCONTRADO', async () => {
    expect((await pedirRuta(CENTRO)).status).toBe(200);

    esperarNoEncontrado(await pedirRuta(idPrueba(999)));
  });

  it.each(['no-es-uuid', '123', '00000000-0000-4000-8000-00000000020Z'])(
    'un id que no es UUID (%s) responde NO_ENCONTRADO y no DATOS_INVALIDOS',
    async (id) => {
      expect((await pedirRuta(CENTRO)).status).toBe(200);

      esperarNoEncontrado(await pedirRuta(id));
    },
  );

  it('D-07: no publicada: NO_ENCONTRADO para el cliente; 200 para su propietario', async () => {
    await actualizarBarberia(CENTRO, { publicada: false });

    expect((await pedirRuta(CENTRO, IDS_PRUEBA.propietario)).status).toBe(200);
    esperarNoEncontrado(await pedirRuta(CENTRO, IDS_PRUEBA.cliente));
  });

  it('D-07: inactiva: NO_ENCONTRADO para el cliente; 200 para su propietario', async () => {
    await actualizarBarberia(CENTRO, { activo: false });

    expect((await pedirRuta(CENTRO, IDS_PRUEBA.propietario)).status).toBe(200);
    esperarNoEncontrado(await pedirRuta(CENTRO, IDS_PRUEBA.cliente));
  });

  it.each(['INACTIVO', 'INVITADO'] as const)(
    'D-32: un barbero con membresia %s no ve su barberia no publicada; uno ACTIVO si',
    async (estado) => {
      await actualizarBarberia(CENTRO, { publicada: false });
      expect((await pedirRuta(CENTRO, IDS_PRUEBA.barbero)).status).toBe(200);

      await cambiarEstadoMembresia(IDS_PRUEBA.barbero, CENTRO, estado);

      esperarNoEncontrado(await pedirRuta(CENTRO, IDS_PRUEBA.barbero));
    },
  );

  it('SEG-02: otra barberia: el propietario y el barbero de Norte reciben NO_ENCONTRADO de Centro sin publicar', async () => {
    await actualizarBarberia(CENTRO, { publicada: false });
    expect((await pedirRuta(CENTRO, IDS_PRUEBA.propietario)).status).toBe(200);

    esperarNoEncontrado(await pedirRuta(CENTRO, IDS_PRUEBA.propietarioOtra));
    esperarNoEncontrado(await pedirRuta(CENTRO, IDS_PRUEBA.barberoOtra));
  });

  it('SEG-02: otra barberia: el propietario de Centro recibe NO_ENCONTRADO de Norte inactiva', async () => {
    await actualizarBarberia(NORTE, { activo: false });
    expect((await pedirRuta(NORTE, IDS_PRUEBA.propietarioOtra)).status).toBe(200);

    esperarNoEncontrado(await pedirRuta(NORTE, IDS_PRUEBA.propietario));
  });

  it.each([
    ['cliente', IDS_PRUEBA.cliente],
    ['barbero', IDS_PRUEBA.barbero],
    ['propietario', IDS_PRUEBA.propietario],
    ['propietaria de otra barberia', IDS_PRUEBA.propietarioOtra],
  ])(
    'Pub: cualquier usuario autenticado (%s) recibe 200 de una publicada',
    async (_rol, usuarioId) => {
      expect((await pedirRuta(CENTRO, usuarioId)).status).toBe(200);
    },
  );
});

describe('D-32: la membresia en otra barberia no da la vista de miembro', () => {
  it('la propietaria de Norte ve Centro publicada sin publicada ni activo', async () => {
    const barberia = datos(await detalle(CENTRO, IDS_PRUEBA.propietarioOtra));

    expect(Object.keys(barberia).sort()).toEqual(CLAVES_DETALLE);
  });
});

describe('HU-BUS-02: GET /api/v1/barberias/:id/servicios (BUS-06)', () => {
  it('BUS-06: responde 200 { datos, meta: { total } } por nombre con id, nombre, descripcion, precio y duracionMinutos', async () => {
    const respuesta = await listarServicios(CENTRO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: [
        {
          id: IDS_PRUEBA.servicioBarba,
          nombre: 'Barba',
          descripcion: null,
          precio: '5.00',
          duracionMinutos: 30,
        },
        {
          id: IDS_PRUEBA.servicioCorte,
          nombre: 'Corte clasico',
          descripcion: null,
          precio: '8.00',
          duracionMinutos: 30,
        },
      ],
      meta: { total: 2 },
    });
  });

  it('HU-BUS-02, RN-21: con "Corte" (25.00, 30) activo y otro desactivado, solo sale el activo con precio y duracionMinutos', async () => {
    const { barberia, servicios } = await crearBarberiaDePrueba({
      id: idPrueba(600),
      propietarioId: DUENA,
      nombre: 'Barberia Sur',
      servicios: [
        { id: idPrueba(601), nombre: 'Corte', precio: '25.00', duracionMinutos: 30 },
        { id: idPrueba(602), nombre: 'Afeitado', precio: '12.00', duracionMinutos: 45 },
      ],
    });
    await actualizarBarberia(barberia.id, { publicada: true });
    await baseDatos.servicio.update({ where: { id: servicios[1]!.id }, data: { activo: false } });
    await baseDatos.servicio.update({
      where: { id: servicios[0]!.id },
      data: { descripcion: 'Con tijera y maquina' },
    });

    const respuesta = await listarServicios(barberia.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: [
        {
          id: idPrueba(601),
          nombre: 'Corte',
          descripcion: 'Con tijera y maquina',
          precio: '25.00',
          duracionMinutos: 30,
        },
      ],
      meta: { total: 1 },
    });
  });

  it.each([
    ['25', '25.00'],
    ['8.5', '8.50'],
    ['1234.05', '1234.05'],
    ['0.99', '0.99'],
  ])('BUS-06: precio guardado %s se envia como el texto "%s"', async (guardado, enviado) => {
    await baseDatos.servicio.update({
      where: { id: IDS_PRUEBA.servicioCorte },
      data: { precio: guardado },
    });

    const corte = datos(await listarServicios(CENTRO)).find(
      (servicio: { id: string }) => servicio.id === IDS_PRUEBA.servicioCorte,
    );

    expect(corte.precio).toBe(enviado);
  });

  it('BUS-06: no expone etiquetasEstilo, activo, barberiaId ni fechas', async () => {
    for (const servicio of datos(await listarServicios(CENTRO))) {
      expect(Object.keys(servicio).sort()).toEqual([
        'descripcion',
        'duracionMinutos',
        'id',
        'nombre',
        'precio',
      ]);
    }
  });

  it('RN-21: sin servicios activos responde 200 con datos vacio y total 0', async () => {
    await baseDatos.servicio.updateMany({ where: { barberiaId: CENTRO }, data: { activo: false } });

    const respuesta = await listarServicios(CENTRO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: [], meta: { total: 0 } });
  });

  it('RN-21: el propietario tampoco ve los servicios desactivados (fuera de alcance: Gestion)', async () => {
    await baseDatos.servicio.update({
      where: { id: IDS_PRUEBA.servicioBarba },
      data: { activo: false },
    });

    const servicios = datos(await listarServicios(CENTRO, IDS_PRUEBA.propietario));

    expect(servicios.map((servicio: { id: string }) => servicio.id)).toEqual([
      IDS_PRUEBA.servicioCorte,
    ]);
  });

  it('otra barberia: nunca trae servicios de otra barberia', async () => {
    const centro = datos(await listarServicios(CENTRO));
    const norte = datos(await listarServicios(NORTE));

    expect(centro.map((servicio: { id: string }) => servicio.id)).not.toContain(
      IDS_PRUEBA.servicioOtra,
    );
    expect(norte.map((servicio: { id: string }) => servicio.id)).toEqual([IDS_PRUEBA.servicioOtra]);
  });
});

describe('BUS-07: GET /api/v1/barberias/:id/barberos', () => {
  const ordenar = (ids: string[]) => [...ids].sort();

  async function crearOtroBarbero(datosBarbero: {
    numero: number;
    nombreVisible: string;
    servicioIds: string[];
    barberiaId?: string;
  }) {
    await crearUsuarioDePrueba({
      id: idPrueba(datosBarbero.numero),
      nombre: datosBarbero.nombreVisible,
      correo: `barbero${datosBarbero.numero}@barberly.test`,
      telefono: '0987654321',
    });
    return crearBarberoDePrueba({
      usuarioId: idPrueba(datosBarbero.numero),
      barberiaId: datosBarbero.barberiaId ?? CENTRO,
      perfilId: idPrueba(datosBarbero.numero + 1),
      nombreVisible: datosBarbero.nombreVisible,
      servicioIds: datosBarbero.servicioIds,
    });
  }

  it('BUS-07: responde 200 { datos, meta: { total } } con id del PerfilBarbero, nombreVisible, urlFoto y servicios', async () => {
    const respuesta = await listarBarberos(CENTRO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: [
        {
          id: IDS_PRUEBA.perfilBarbero,
          nombreVisible: 'Carlos',
          urlFoto: null,
          servicios: expect.any(Array),
        },
      ],
      meta: { total: 1 },
    });
    expect(ordenar(respuesta.body.datos[0].servicios)).toEqual(
      ordenar([IDS_PRUEBA.servicioCorte, IDS_PRUEBA.servicioBarba]),
    );
  });

  it('BUS-07: con un barbero ACTIVO con 2 servicios y otro INACTIVO, solo sale el activo con sus 2 ids y urlFoto null', async () => {
    await crearOtroBarbero({
      numero: 700,
      nombreVisible: 'Alberto',
      servicioIds: [IDS_PRUEBA.servicioCorte],
    });
    await cambiarEstadoMembresia(idPrueba(700), CENTRO, 'INACTIVO');

    const barberos = datos(await listarBarberos(CENTRO));

    expect(barberos).toHaveLength(1);
    expect(barberos[0].id).toBe(IDS_PRUEBA.perfilBarbero);
    expect(barberos[0].urlFoto).toBeNull();
    expect(ordenar(barberos[0].servicios)).toEqual(
      ordenar([IDS_PRUEBA.servicioCorte, IDS_PRUEBA.servicioBarba]),
    );
  });

  it('BUS-07: un barbero INVITADO no sale', async () => {
    await crearOtroBarbero({
      numero: 710,
      nombreVisible: 'Alberto',
      servicioIds: [IDS_PRUEBA.servicioCorte],
    });
    await cambiarEstadoMembresia(idPrueba(710), CENTRO, 'INVITADO');

    const respuesta = await listarBarberos(CENTRO);

    expect(datos(respuesta).map((barbero: { id: string }) => barbero.id)).toEqual([
      IDS_PRUEBA.perfilBarbero,
    ]);
    expect(respuesta.body.meta).toEqual({ total: 1 });
  });

  it.each([
    ['el cliente', IDS_PRUEBA.cliente],
    ['el propietario', IDS_PRUEBA.propietario],
  ])(
    'D-33: un barbero con membresia ACTIVO y Usuario inactivo no sale ni cuenta en meta.total; el otro ACTIVO si (consulta %s)',
    async (_quien, usuarioId) => {
      // Alberto ordenaria antes que Carlos: si se colara, quedaria primero.
      await crearOtroBarbero({
        numero: 760,
        nombreVisible: 'Alberto',
        servicioIds: [IDS_PRUEBA.servicioCorte],
      });
      await baseDatos.usuario.update({ where: { id: idPrueba(760) }, data: { activo: false } });

      const respuesta = await listarBarberos(CENTRO, usuarioId);

      expect(datos(respuesta).map((barbero: { id: string }) => barbero.id)).toEqual([
        IDS_PRUEBA.perfilBarbero,
      ]);
      expect(respuesta.body.meta).toEqual({ total: 1 });
    },
  );

  it('BUS-07, RN-21: sin servicios o solo con servicios desactivados no sale; servicios solo trae ids activos', async () => {
    await crearOtroBarbero({ numero: 720, nombreVisible: 'Sin servicios', servicioIds: [] });
    await crearOtroBarbero({
      numero: 730,
      nombreVisible: 'Solo barba',
      servicioIds: [IDS_PRUEBA.servicioBarba],
    });
    await baseDatos.servicio.update({
      where: { id: IDS_PRUEBA.servicioBarba },
      data: { activo: false },
    });

    const respuesta = await listarBarberos(CENTRO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: [
        {
          id: IDS_PRUEBA.perfilBarbero,
          nombreVisible: 'Carlos',
          urlFoto: null,
          servicios: [IDS_PRUEBA.servicioCorte],
        },
      ],
      meta: { total: 1 },
    });
  });

  it('BUS-07: ordena por nombreVisible', async () => {
    await crearOtroBarbero({
      numero: 740,
      nombreVisible: 'Zoe',
      servicioIds: [IDS_PRUEBA.servicioCorte],
    });
    await crearOtroBarbero({
      numero: 750,
      nombreVisible: 'Alberto',
      servicioIds: [IDS_PRUEBA.servicioBarba],
    });

    const respuesta = await listarBarberos(CENTRO);

    expect(
      datos(respuesta).map((barbero: { nombreVisible: string }) => barbero.nombreVisible),
    ).toEqual(['Alberto', 'Carlos', 'Zoe']);
    expect(respuesta.body.meta).toEqual({ total: 3 });
  });

  it('BUS-07: urlFoto es una URL cuando hay foto y nunca expone la clave del archivo', async () => {
    await baseDatos.perfilBarbero.update({
      where: { id: IDS_PRUEBA.perfilBarbero },
      data: { archivoFoto: 'fotos/carlos.webp' },
    });

    const [carlos] = datos(await listarBarberos(CENTRO));

    expect(carlos.urlFoto).toEqual(expect.any(String));
    expect(carlos).not.toHaveProperty('archivoFoto');
  });

  it('BUS-07: nunca expone correo ni telefono del barbero, ni su membresia o usuario', async () => {
    const respuesta = await listarBarberos(CENTRO);

    expect(respuesta.status).toBe(200);
    const texto = JSON.stringify(respuesta.body);
    expect(texto).not.toContain('@');
    expect(texto).not.toContain('0991234567');
    expect(texto).not.toContain(IDS_PRUEBA.barbero);
    for (const barbero of respuesta.body.datos) {
      expect(Object.keys(barbero).sort()).toEqual(['id', 'nombreVisible', 'servicios', 'urlFoto']);
    }
  });

  it('otra barberia: nunca trae barberos ni servicios de otra barberia', async () => {
    const centro = await listarBarberos(CENTRO);
    const norte = await listarBarberos(NORTE);

    expect(datos(centro).map((barbero: { id: string }) => barbero.id)).toEqual([
      IDS_PRUEBA.perfilBarbero,
    ]);
    expect(JSON.stringify(centro.body)).not.toContain(IDS_PRUEBA.servicioOtra);
    expect(datos(norte)).toEqual([
      {
        id: IDS_PRUEBA.perfilBarberoOtra,
        nombreVisible: 'Andres',
        urlFoto: null,
        servicios: [IDS_PRUEBA.servicioOtra],
      },
    ]);
  });
});

describe.each([
  ['detalle', `/${CENTRO}`],
  ['servicios', `/${CENTRO}/servicios`],
  ['barberos', `/${CENTRO}/barberos`],
])('SEG-02: sesion en GET /barberias/:id (%s)', (_nombre, ruta) => {
  it('sin token responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(app).get(`${RUTA}${ruta}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('con un token invalido responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(app)
      .get(`${RUTA}${ruta}`)
      .set({ Authorization: 'Bearer no-es-un-jwt' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('con el token de acceso vencido responde 401 TOKEN_VENCIDO', async () => {
    const respuesta = await request(app)
      .get(`${RUTA}${ruta}`)
      .set(cabeceraDePrueba(tokenDePrueba(IDS_PRUEBA.cliente, -1)));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('TOKEN_VENCIDO');
  });

  it('sin token y con un id inexistente responde 401 antes que 404', async () => {
    const respuesta = await request(app).get(`${RUTA}${ruta.replace(CENTRO, idPrueba(999))}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });
});

describe('Solo lectura', () => {
  it('las tres rutas no modifican la barberia, sus servicios ni sus barberos', async () => {
    const leer = async () => ({
      barberias: await baseDatos.barberia.findMany({ orderBy: { id: 'asc' } }),
      servicios: await baseDatos.servicio.findMany({ orderBy: { id: 'asc' } }),
      perfiles: await baseDatos.perfilBarbero.findMany({ orderBy: { id: 'asc' } }),
    });
    const antes = await leer();

    expect((await detalle(CENTRO)).status).toBe(200);
    expect((await listarServicios(CENTRO)).status).toBe(200);
    expect((await listarBarberos(CENTRO)).status).toBe(200);

    expect(await leer()).toEqual(antes);
  });
});

describe('§10.7: documentacion de GET /barberias/:id y sus subrutas', () => {
  it.each(['/barberias/{id}', '/barberias/{id}/servicios', '/barberias/{id}/barberos'])(
    'GET /api/v1/documentacion incluye GET %s con token de acceso y 200, 401 y 404',
    async (ruta) => {
      const { body } = await request(app).get('/api/v1/documentacion');

      const operacion = body.paths[ruta]?.get;
      expect(operacion).toBeDefined();
      expect(Object.keys(operacion.responses)).toEqual(
        expect.arrayContaining(['200', '401', '404']),
      );
      expect(operacion.security).toEqual([{ bearer: [] }]);
    },
  );
});
