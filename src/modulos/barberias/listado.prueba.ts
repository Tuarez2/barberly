// Listado publico, GET /barberias (T2.8, BUS-01 a BUS-04, HU-BUS-01, HU-BUS-03, D-07, D-31, D-32).
// La especificacion vive en docs/especificaciones/busqueda.md (Listado y Dudas 1 a 6).
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { fijarAhora, restaurarAhora } from '../../compartido/reloj';
import {
  crearBarberiaDePrueba,
  crearUsuarioDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../../pruebas/fabricas';
import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';

const RUTA = '/api/v1/barberias';
const DIRECCION = 'Av. 9 de Octubre 100, Guayaquil';

// Duena de las barberias extra de cada prueba; no es miembro de las del escenario base.
const DUENA = IDS_PRUEBA.usuario;

// diaSemana: 0 = domingo (Duda 2). 2026-12-01 es martes; America/Guayaquil es UTC-5 todo el ano.
const MARTES = 2;
function martesLocal(hora: string): Date {
  return new Date(`2026-12-01T${hora}:00-05:00`);
}

function listar(
  consulta: Record<string, string | number> = {},
  usuarioId: string = IDS_PRUEBA.cliente,
) {
  return request(app)
    .get(RUTA)
    .query(consulta)
    .set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
}

// Exigen 200 primero: mientras la ruta no exista, el fallo muestra el 404 y no un TypeError.
function nombres(respuesta: request.Response): string[] {
  expect(respuesta.status).toBe(200);
  return respuesta.body.datos.map((barberia: { nombre: string }) => barberia.nombre);
}

function elemento(respuesta: request.Response, id: string) {
  expect(respuesta.status).toBe(200);
  return respuesta.body.datos.find((barberia: { id: string }) => barberia.id === id);
}

interface OpcionesBarberia {
  id?: string;
  nombre: string;
  publicada?: boolean;
  activo?: boolean;
  conHorario?: boolean;
  servicios?: { nombre: string; precio: string; duracionMinutos: number }[];
}

async function crearBarberia(opciones: OpcionesBarberia) {
  const { barberia, servicios } = await crearBarberiaDePrueba({
    id: opciones.id,
    propietarioId: DUENA,
    nombre: opciones.nombre,
    conHorario: opciones.conHorario,
    servicios: opciones.servicios,
  });
  await baseDatos.barberia.update({
    where: { id: barberia.id },
    data: { publicada: opciones.publicada ?? true, activo: opciones.activo ?? true },
  });
  return { barberia, servicios };
}

// Horario del criterio BUS-03: solo los martes, 09:00-18:00 con pausa 13:00-14:00.
async function crearBarberiaDeMartes(
  id: string = idPrueba(260),
  horarioId: string = idPrueba(261),
  nombre: string = 'Barberia Martes',
) {
  const { barberia } = await crearBarberia({ id, nombre, conHorario: false });
  await baseDatos.horarioAtencion.create({
    data: {
      id: horarioId,
      barberiaId: barberia.id,
      diaSemana: MARTES,
      horaApertura: '09:00',
      horaCierre: '18:00',
      inicioPausa: '13:00',
      finPausa: '14:00',
    },
  });
  return barberia;
}

async function esperarInvalido(consulta: Record<string, string | number>) {
  const respuesta = await listar(consulta);

  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  expect(respuesta.body.error.detalles).toEqual(expect.any(Array));
  expect(respuesta.body.datos).toBeUndefined();
  return respuesta;
}

beforeEach(async () => {
  await limpiarBase();
  // Dos barberias publicadas con sus propietarios (Centro y Norte, 09:00-19:00 todos los dias).
  await escenarioBase();
  await crearUsuarioDePrueba({ id: DUENA, nombre: 'Duena', correo: 'duena@barberly.test' });
  fijarAhora(martesLocal('10:00'));
});

afterEach(() => {
  restaurarAhora();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('HU-BUS-01: GET /api/v1/barberias', () => {
  it('BUS-01: responde 200 con { datos, meta } y solo id, nombre, direccion, urlPortada y abierta', async () => {
    const respuesta = await listar();

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: [
        {
          id: IDS_PRUEBA.barberia,
          nombre: 'Barberia Centro',
          direccion: DIRECCION,
          urlPortada: null,
          abierta: true,
        },
        {
          id: IDS_PRUEBA.otraBarberia,
          nombre: 'Barberia Norte',
          direccion: DIRECCION,
          urlPortada: null,
          abierta: true,
        },
      ],
      meta: { pagina: 1, limite: 10, total: 2 },
    });
  });

  it('HU-BUS-01: con 12 barberias y limite 10 da 10 por nombre con total 12; pagina=2 da las 2 restantes', async () => {
    for (let numero = 10; numero >= 1; numero -= 1) {
      await crearBarberia({ nombre: `Barberia ${numero.toString().padStart(2, '0')}` });
    }

    const primera = await listar({ limite: 10 });
    const segunda = await listar({ limite: 10, pagina: 2 });

    expect(primera.status).toBe(200);
    expect(nombres(primera)).toEqual(
      Array.from(
        { length: 10 },
        (_, indice) => `Barberia ${(indice + 1).toString().padStart(2, '0')}`,
      ),
    );
    expect(primera.body.meta).toEqual({ pagina: 1, limite: 10, total: 12 });
    expect(segunda.status).toBe(200);
    expect(nombres(segunda)).toEqual(['Barberia Centro', 'Barberia Norte']);
    expect(segunda.body.meta).toEqual({ pagina: 2, limite: 10, total: 12 });
  });

  it('BUS-01: sin pagina ni limite usa 1 y 10', async () => {
    for (let numero = 1; numero <= 11; numero += 1) {
      await crearBarberia({ nombre: `Barberia ${numero.toString().padStart(2, '0')}` });
    }

    const respuesta = await listar();

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toHaveLength(10);
    expect(respuesta.body.meta).toEqual({ pagina: 1, limite: 10, total: 13 });
  });

  it('BUS-01: limite=1 y pagina=2 devuelve la segunda y refleja la paginacion en meta', async () => {
    const respuesta = await listar({ limite: 1, pagina: 2 });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barberia Norte']);
    expect(respuesta.body.meta).toEqual({ pagina: 2, limite: 1, total: 2 });
  });

  it('BUS-01: limite=50 (el maximo) se acepta', async () => {
    const respuesta = await listar({ limite: 50 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.meta).toEqual({ pagina: 1, limite: 50, total: 2 });
  });

  it('BUS-01: una pagina sin resultados responde 200 con datos vacio y el total real', async () => {
    const respuesta = await listar({ pagina: 3 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: [], meta: { pagina: 3, limite: 10, total: 2 } });
  });

  it('HU-BUS-01, D-07: una no publicada (sin servicios activos) y una inactiva no salen; la publicada si', async () => {
    await crearBarberia({ nombre: 'Alfa sin publicar', publicada: false, servicios: [] });
    await crearBarberia({ nombre: 'Alfa inactiva', publicada: true, activo: false });
    await crearBarberia({ nombre: 'Alfa publicada' });

    const respuesta = await listar();

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Alfa publicada', 'Barberia Centro', 'Barberia Norte']);
    expect(respuesta.body.meta.total).toBe(3);
  });

  it('D-07: publicada pero inactiva tampoco cuenta en total ni aparece al buscarla por nombre', async () => {
    await crearBarberia({ nombre: 'Alfa inactiva', publicada: true, activo: false });
    await crearBarberia({ nombre: 'Alfa sin publicar', publicada: false });

    const respuesta = await listar({ q: 'alfa' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: [], meta: { pagina: 1, limite: 10, total: 0 } });
  });

  it('BUS-04: orden=nombre se acepta; con el mismo nombre desempata por id', async () => {
    await crearBarberia({ id: idPrueba(250), nombre: 'Barberia Centro' });

    const respuesta = await listar({ orden: 'nombre' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.map((barberia: { id: string }) => barberia.id)).toEqual([
      IDS_PRUEBA.barberia,
      idPrueba(250),
      IDS_PRUEBA.otraBarberia,
    ]);
  });

  it('BUS-01: urlPortada es una URL cuando hay portada y nunca expone la clave del archivo', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.barberia },
      data: { archivoPortada: 'portadas/centro.webp' },
    });

    const respuesta = await listar();

    expect(respuesta.status).toBe(200);
    const centro = elemento(respuesta, IDS_PRUEBA.barberia);
    expect(centro.urlPortada).toEqual(expect.any(String));
    expect(centro).not.toHaveProperty('archivoPortada');
    expect(elemento(respuesta, IDS_PRUEBA.otraBarberia).urlPortada).toBeNull();
  });

  it('sin datos personales: no expone correos ni telefonos de usuarios, ni telefono ni reglas de la barberia', async () => {
    const respuesta = await listar();

    expect(respuesta.status).toBe(200);
    const texto = JSON.stringify(respuesta.body);
    expect(texto).not.toContain('@');
    expect(texto).not.toContain('0991234567');
    expect(texto).not.toContain('042345678');
    for (const barberia of respuesta.body.datos) {
      expect(Object.keys(barberia).sort()).toEqual([
        'abierta',
        'direccion',
        'id',
        'nombre',
        'urlPortada',
      ]);
    }
  });
});

describe('HU-BUS-03: busqueda por nombre (BUS-02)', () => {
  beforeEach(async () => {
    await crearBarberia({ nombre: 'Clásica Norte' });
    await crearBarberia({ nombre: 'Barber Sur' });
  });

  it('HU-BUS-03: q=clas y q=CLÁS devuelven solo "Clásica Norte"', async () => {
    for (const q of ['clas', 'CLÁS']) {
      const respuesta = await listar({ q });

      expect(respuesta.status).toBe(200);
      expect(nombres(respuesta)).toEqual(['Clásica Norte']);
      expect(respuesta.body.meta).toEqual({ pagina: 1, limite: 10, total: 1 });
    }
  });

  it('HU-BUS-03: q=zzz responde 200 con datos vacio y total 0', async () => {
    const respuesta = await listar({ q: 'zzz' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: [], meta: { pagina: 1, limite: 10, total: 0 } });
  });

  it('BUS-02: q=centro encuentra "Barbería Centro" (tilde en el nombre, no en la busqueda)', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.barberia },
      data: { nombre: 'Barbería Centro' },
    });

    const porCentro = await listar({ q: 'centro' });
    const porBarberia = await listar({ q: 'BARBERIA' });

    expect(nombres(porCentro)).toEqual(['Barbería Centro']);
    // Sin fijar el orden entre ambas: depende de la intercalacion de la base con la tilde.
    expect(nombres(porBarberia).sort()).toEqual(['Barberia Norte', 'Barbería Centro']);
  });

  it('BUS-02: coincide en cualquier parte del nombre', async () => {
    const respuesta = await listar({ q: 'norte' });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barberia Norte', 'Clásica Norte']);
  });

  it('BUS-02: q se recorta antes de buscar', async () => {
    const respuesta = await listar({ q: '  sur  ' });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barber Sur']);
  });

  it.each([
    ['%', 'Corte 100% Fino'],
    ['_', 'Corte_Fino'],
  ])('BUS-02: %s se busca literal, no como comodin', async (q, nombre) => {
    await crearBarberia({ nombre });

    const respuesta = await listar({ q });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual([nombre]);
  });

  it('BUS-02: q de 80 caracteres se acepta', async () => {
    const respuesta = await listar({ q: 'c'.repeat(80) });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toEqual([]);
  });

  it('BUS-02: q se combina con la paginacion', async () => {
    const respuesta = await listar({ q: 'norte', limite: 1, pagina: 2 });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Clásica Norte']);
    expect(respuesta.body.meta).toEqual({ pagina: 2, limite: 1, total: 2 });
  });
});

describe('BUS-03: filtro por servicio', () => {
  it('BUS-03: servicio=corte solo trae barberias con un servicio activo que lo contiene; uno desactivado no cuenta', async () => {
    // Norte tiene "Corte clasico" desactivado; Solo Barba no ofrece corte.
    await baseDatos.servicio.update({
      where: { id: IDS_PRUEBA.servicioOtra },
      data: { activo: false },
    });
    await crearBarberia({
      nombre: 'Solo Barba',
      servicios: [{ nombre: 'Barba', precio: '5.00', duracionMinutos: 30 }],
    });

    const respuesta = await listar({ servicio: 'corte' });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barberia Centro']);
    expect(respuesta.body.meta.total).toBe(1);
  });

  it('BUS-03: servicio no distingue tildes ni mayusculas y no repite la barberia con varios servicios que coinciden', async () => {
    await crearBarberia({
      nombre: 'Clásica Norte',
      servicios: [
        { nombre: 'Corte clásico', precio: '8.00', duracionMinutos: 30 },
        { nombre: 'Corte infantil', precio: '6.00', duracionMinutos: 30 },
      ],
    });

    const respuesta = await listar({ servicio: 'CÓRTE', q: 'clasica' });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Clásica Norte']);
    expect(respuesta.body.meta.total).toBe(1);
  });

  it('BUS-03: servicio sin coincidencias responde 200 con datos vacio', async () => {
    const respuesta = await listar({ servicio: 'tinte' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: [], meta: { pagina: 1, limite: 10, total: 0 } });
  });

  it('BUS-03: % en servicio se busca literal', async () => {
    const respuesta = await listar({ servicio: '%' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toEqual([]);
  });
});

describe('BUS-03: abierta ahora (zona America/Guayaquil, horario general)', () => {
  let martesId: string;

  beforeEach(async () => {
    martesId = (await crearBarberiaDeMartes()).id;
  });

  it('BUS-03: martes 10:00 con horario 09:00-18:00 sale con abierta=true', async () => {
    const respuesta = await listar({ abierta: 'true' });

    expect(respuesta.status).toBe(200);
    expect(elemento(respuesta, martesId)).toEqual({
      id: martesId,
      nombre: 'Barberia Martes',
      direccion: DIRECCION,
      urlPortada: null,
      abierta: true,
    });
  });

  it('BUS-03: a las 13:30 (pausa) no sale con abierta=true y su abierta es false', async () => {
    fijarAhora(martesLocal('13:30'));

    const filtrada = await listar({ abierta: 'true' });
    const todas = await listar();

    expect(filtrada.status).toBe(200);
    expect(elemento(filtrada, martesId)).toBeUndefined();
    expect(elemento(todas, martesId).abierta).toBe(false);
  });

  it('BUS-03: con un Bloqueo de la barberia vigente no sale y su abierta es false', async () => {
    await baseDatos.bloqueo.create({
      data: {
        id: idPrueba(270),
        barberiaId: martesId,
        iniciaEn: martesLocal('09:30'),
        terminaEn: martesLocal('11:00'),
        motivo: 'Fumigacion',
      },
    });

    const filtrada = await listar({ abierta: 'true' });
    const todas = await listar();

    expect(elemento(filtrada, martesId)).toBeUndefined();
    expect(elemento(todas, martesId).abierta).toBe(false);
    expect(JSON.stringify(todas.body)).not.toContain('Fumigacion');
  });

  it('BUS-03: un Bloqueo de la barberia ya terminado o que aun no empieza no la cierra', async () => {
    await baseDatos.bloqueo.createMany({
      data: [
        {
          id: idPrueba(271),
          barberiaId: martesId,
          iniciaEn: martesLocal('09:00'),
          terminaEn: martesLocal('09:59'),
        },
        {
          id: idPrueba(272),
          barberiaId: martesId,
          iniciaEn: martesLocal('10:01'),
          terminaEn: martesLocal('11:00'),
        },
      ],
    });

    const respuesta = await listar({ abierta: 'true' });

    expect(elemento(respuesta, martesId)?.abierta).toBe(true);
  });

  it('BUS-03: el Bloqueo de un barbero no cierra la barberia', async () => {
    await baseDatos.bloqueo.create({
      data: {
        id: idPrueba(273),
        barberiaId: IDS_PRUEBA.barberia,
        perfilBarberoId: IDS_PRUEBA.perfilBarbero,
        iniciaEn: martesLocal('09:00'),
        terminaEn: martesLocal('12:00'),
      },
    });

    const respuesta = await listar({ abierta: 'true' });

    expect(elemento(respuesta, IDS_PRUEBA.barberia)?.abierta).toBe(true);
  });

  it.each([
    ['08:59', false],
    ['09:00', true],
    ['12:59', true],
    ['13:00', false],
    ['13:59', false],
    ['14:00', true],
    ['17:59', true],
    ['18:00', false],
  ])(
    'BUS-03: a las %s abierta es %s (apertura inclusive; cierre y pausa exclusivos)',
    async (hora, abierta) => {
      fijarAhora(martesLocal(hora));

      const todas = await listar();
      const filtrada = await listar({ abierta: 'true' });

      expect(elemento(todas, martesId).abierta).toBe(abierta);
      expect(elemento(filtrada, martesId) !== undefined).toBe(abierta);
    },
  );

  it('BUS-03: un dia sin fila de horario no atiende (miercoles 10:00)', async () => {
    fijarAhora(new Date('2026-12-02T10:00:00-05:00'));

    const todas = await listar();

    expect(elemento(todas, martesId).abierta).toBe(false);
    expect(elemento(todas, IDS_PRUEBA.barberia).abierta).toBe(true);
  });

  it('BUS-03: usa la hora local de la barberia, no UTC', async () => {
    // 11:00 UTC es 06:00 en Guayaquil (cerrada); 22:00 UTC es 17:00 (abierta).
    fijarAhora(new Date('2026-12-01T11:00:00Z'));
    const temprano = await listar();
    fijarAhora(new Date('2026-12-01T22:00:00Z'));
    const tarde = await listar();

    expect(elemento(temprano, martesId).abierta).toBe(false);
    expect(elemento(tarde, martesId).abierta).toBe(true);
  });

  it('BUS-03: el martes 20:00 local (miercoles en UTC) sigue siendo martes y esta cerrada', async () => {
    fijarAhora(new Date('2026-12-02T01:00:00Z'));

    const respuesta = await listar();

    expect(elemento(respuesta, martesId).abierta).toBe(false);
  });

  describe('con otra barberia en Europe/Madrid (UTC+1 en diciembre)', () => {
    let madridId: string;

    beforeEach(async () => {
      madridId = (await crearBarberiaDeMartes(idPrueba(290), idPrueba(291), 'Barberia Madrid')).id;
      await baseDatos.barberia.update({
        where: { id: madridId },
        data: { zonaHoraria: 'Europe/Madrid' },
      });
    });

    it('BUS-03: martes 17:30 UTC (12:30 Guayaquil, 18:30 Madrid) solo la de Guayaquil esta abierta', async () => {
      fijarAhora(new Date('2026-12-01T17:30:00Z'));

      const todas = await listar();
      const filtrada = await listar({ abierta: 'true' });

      expect(elemento(todas, martesId).abierta).toBe(true);
      expect(elemento(todas, madridId).abierta).toBe(false);
      expect(elemento(filtrada, martesId)).toBeDefined();
      expect(elemento(filtrada, madridId)).toBeUndefined();
    });

    it('BUS-03: martes 09:00 UTC (04:00 Guayaquil, 10:00 Madrid) solo la de Madrid esta abierta', async () => {
      fijarAhora(new Date('2026-12-01T09:00:00Z'));

      const todas = await listar();
      const filtrada = await listar({ abierta: 'true' });

      expect(elemento(todas, martesId).abierta).toBe(false);
      expect(elemento(todas, madridId).abierta).toBe(true);
      expect(elemento(filtrada, martesId)).toBeUndefined();
      expect(elemento(filtrada, madridId)).toBeDefined();
    });
  });

  it('D-31: una barberia con solo horario propio de barbero (sin horario general) no esta abierta', async () => {
    const { barberia, servicios } = await crearBarberia({
      id: idPrueba(280),
      nombre: 'Solo Barberos',
      conHorario: false,
    });
    const membresia = await baseDatos.membresia.create({
      data: {
        id: idPrueba(281),
        usuarioId: IDS_PRUEBA.cliente,
        barberiaId: barberia.id,
        rol: 'BARBERO',
        estado: 'ACTIVO',
      },
    });
    const perfil = await baseDatos.perfilBarbero.create({
      data: {
        id: idPrueba(282),
        membresiaId: membresia.id,
        barberiaId: barberia.id,
        nombreVisible: 'Pedro',
      },
    });
    await baseDatos.servicioBarbero.create({
      data: { perfilBarberoId: perfil.id, servicioId: servicios[0]!.id, barberiaId: barberia.id },
    });
    await baseDatos.horarioAtencion.create({
      data: {
        id: idPrueba(283),
        barberiaId: barberia.id,
        perfilBarberoId: perfil.id,
        diaSemana: MARTES,
        horaApertura: '08:00',
        horaCierre: '20:00',
      },
    });

    const todas = await listar();
    const filtrada = await listar({ abierta: 'true' });

    expect(elemento(todas, barberia.id).abierta).toBe(false);
    expect(elemento(filtrada, barberia.id)).toBeUndefined();
  });

  it('BUS-03: abierta=true se combina con q y con la paginacion', async () => {
    fijarAhora(martesLocal('18:30'));

    const respuesta = await listar({ abierta: 'true', q: 'barberia', limite: 1 });

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barberia Centro']);
    expect(respuesta.body.meta).toEqual({ pagina: 1, limite: 1, total: 2 });
  });
});

describe('BUS-01: validacion de la consulta', () => {
  it.each([
    ['limite=51', { limite: 51 }],
    ['limite=0', { limite: 0 }],
    ['limite no numerico', { limite: 'diez' }],
    ['pagina=0', { pagina: 0 }],
    ['pagina negativa', { pagina: -1 }],
    ['pagina decimal', { pagina: 1.5 }],
    ['q vacio', { q: '' }],
    ['q solo espacios', { q: '   ' }],
    ['q de 81 caracteres', { q: 'c'.repeat(81) }],
    ['servicio vacio', { servicio: '' }],
    ['orden=cercania', { orden: 'cercania' }],
    ['abierta=si', { abierta: 'si' }],
    ['parametro desconocido', { ciudad: 'Guayaquil' }],
    ['barberiaId (parametro desconocido)', { barberiaId: IDS_PRUEBA.otraBarberia }],
  ])('%s responde 422 DATOS_INVALIDOS', async (_caso, consulta) => {
    await esperarInvalido(consulta);
  });

  it('limite=51 indica el campo limite en detalles', async () => {
    const respuesta = await esperarInvalido({ limite: 51 });

    expect(respuesta.body.error.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'limite' })]),
    );
  });
});

describe('SEG-02: sesion en GET /barberias (Pub)', () => {
  it('sin token responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(app).get(RUTA);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('con un token invalido responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(app).get(RUTA).set({ Authorization: 'Bearer no-es-un-jwt' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('con el token de acceso vencido responde 401 TOKEN_VENCIDO', async () => {
    const respuesta = await request(app)
      .get(RUTA)
      .set(cabeceraDePrueba(tokenDePrueba(IDS_PRUEBA.cliente, -1)));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('TOKEN_VENCIDO');
  });

  it.each([
    ['cliente', IDS_PRUEBA.cliente],
    ['barbero', IDS_PRUEBA.barbero],
    ['propietario', IDS_PRUEBA.propietario],
  ])('cualquier usuario autenticado (%s) recibe el mismo listado', async (_rol, usuarioId) => {
    const respuesta = await listar({}, usuarioId);

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barberia Centro', 'Barberia Norte']);
  });
});

describe('Aislamiento: otra barberia', () => {
  it('SEG-02: la barberia no publicada de otro propietario no sale para el propietario de otra barberia', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.otraBarberia },
      data: { publicada: false },
    });

    const respuesta = await listar({}, IDS_PRUEBA.propietario);

    expect(respuesta.status).toBe(200);
    expect(nombres(respuesta)).toEqual(['Barberia Centro']);
    expect(respuesta.body.meta.total).toBe(1);
  });

  it('D-07, D-32: el listado es publico: ni sus propios miembros ACTIVO ven su barberia no publicada', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.otraBarberia },
      data: { publicada: false },
    });

    for (const usuarioId of [IDS_PRUEBA.propietarioOtra, IDS_PRUEBA.barberoOtra]) {
      const respuesta = await listar({}, usuarioId);

      expect(respuesta.status).toBe(200);
      expect(nombres(respuesta)).toEqual(['Barberia Centro']);
    }
  });

  it('una barberia inactiva de otro propietario no sale aunque se busque por su nombre exacto', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.otraBarberia },
      data: { activo: false },
    });

    const respuesta = await listar({ q: 'Barberia Norte' }, IDS_PRUEBA.propietario);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: [], meta: { pagina: 1, limite: 10, total: 0 } });
  });

  it('listar no modifica ninguna barberia', async () => {
    const antes = await baseDatos.barberia.findMany({ orderBy: { id: 'asc' } });

    expect((await listar({ q: 'barberia', abierta: 'true' })).status).toBe(200);

    expect(await baseDatos.barberia.findMany({ orderBy: { id: 'asc' } })).toEqual(antes);
  });
});

describe('§10.7: documentacion de GET /barberias', () => {
  it('GET /api/v1/documentacion incluye GET /barberias con token de acceso', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    const listado = body.paths['/barberias']?.get;
    expect(listado).toBeDefined();
    expect(Object.keys(listado.responses)).toEqual(expect.arrayContaining(['200', '401', '422']));
    expect(listado.security).toEqual([{ bearer: [] }]);
  });
});
