// Autenticacion: registro (T1.5, AUT-01, HU-AUT-01, SEG-06, §11.4, D-03, D-14) e inicio de sesion
// (T1.6, AUT-02, HU-AUT-02, SEG-09, D-05, D-16), renovar y cerrar sesion
// (T1.7, AUT-03, AUT-04, D-17) y perfil con membresias (T1.8, AUT-08, D-05, D-18).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { configuracion } from '../../compartido/configuracion';
import { reiniciarLimites } from '../../compartido/limites';
import { fijarAhora, restaurarAhora } from '../../compartido/reloj';
import {
  CLAVE_PRUEBA,
  crearBarberiaDePrueba,
  crearBarberoDePrueba,
  crearUsuarioDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../../pruebas/fabricas';
import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';

const RUTA = '/api/v1/autenticacion/registro';

function datosValidos(cambios: Record<string, unknown> = {}) {
  return {
    nombre: 'Ana Pérez',
    correo: 'ana@correo.ec',
    telefono: '0991234567',
    clave: 'Barberly2026',
    ...cambios,
  };
}

function registrar(cuerpo: Record<string, unknown>) {
  return request(app).post(RUTA).send(cuerpo);
}

async function esperarInvalido(cuerpo: Record<string, unknown>, campo: string) {
  const respuesta = await registrar(cuerpo);
  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  expect(respuesta.body.error.detalles).toEqual(
    expect.arrayContaining([expect.objectContaining({ campo })]),
  );
  expect(await baseDatos.usuario.count()).toBe(0);
  return respuesta;
}

beforeEach(async () => {
  await limpiarBase();
  reiniciarLimites();
});

afterEach(() => {
  restaurarAhora();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('HU-AUT-01: POST /api/v1/autenticacion/registro', () => {
  it('AUT-01: con un correo nuevo y datos validos crea la cuenta y devuelve los tokens (201)', async () => {
    const respuesta = await registrar(datosValidos());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toEqual({
      datos: {
        usuario: {
          id: expect.any(String),
          nombre: 'Ana Pérez',
          correo: 'ana@correo.ec',
          telefono: '+593991234567',
        },
        tokenAcceso: expect.any(String),
        tokenRenovacion: expect.any(String),
      },
    });
    expect(await baseDatos.usuario.count()).toBe(1);
  });

  it('AUT-01: el token de acceso es un JWT de 15 minutos con el id del usuario (D-03)', async () => {
    const { body } = await registrar(datosValidos());

    const contenido = jwt.verify(body.datos.tokenAcceso, configuracion.JWT_SECRETO, {
      algorithms: ['HS256'],
    });
    if (typeof contenido === 'string') throw new Error('Se esperaba un JWT con contenido');
    expect(contenido.sub).toBe(body.datos.usuario.id);
    expect((contenido.exp ?? 0) - (contenido.iat ?? 0)).toBe(
      configuracion.TOKEN_ACCESO_MINUTOS * 60,
    );
  });

  it('AUT-01: abre una sesion de 30 dias con el token de renovacion guardado como hash (D-03, D-04)', async () => {
    fijarAhora(new Date('2026-11-21T15:00:00Z'));

    const { body } = await registrar(datosValidos({ dispositivo: 'Pixel 7' }));

    expect(await baseDatos.tokenRenovacion.count()).toBe(1);
    const sesion = await baseDatos.tokenRenovacion.findFirstOrThrow();
    expect(sesion.usuarioId).toBe(body.datos.usuario.id);
    expect(sesion.tokenHash).not.toBe(body.datos.tokenRenovacion);
    expect(sesion.tokenHash).toHaveLength(64);
    expect(sesion.expiraEn.toISOString()).toBe('2026-12-21T15:00:00.000Z');
    expect(sesion.revocadoEn).toBeNull();
    expect(sesion.dispositivo).toBe('Pixel 7');
  });

  it('SEG-06: guarda la contrasena con bcrypt de costo 12 y nunca la devuelve', async () => {
    const respuesta = await registrar(datosValidos());

    const usuario = await baseDatos.usuario.findUniqueOrThrow({
      where: { correo: 'ana@correo.ec' },
    });
    expect(usuario.claveHash).not.toBe('Barberly2026');
    expect(bcrypt.getRounds(usuario.claveHash)).toBe(12);
    expect(await bcrypt.compare('Barberly2026', usuario.claveHash)).toBe(true);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/claveHash|tokenHash|Barberly2026/);
  });

  it('AUT-01: el usuario nace activo, sin membresias (rol cliente) y sin consentimiento de IA', async () => {
    const { body } = await registrar(datosValidos());

    const usuario = await baseDatos.usuario.findUniqueOrThrow({
      where: { id: body.datos.usuario.id },
      include: { membresias: true },
    });
    expect(usuario.activo).toBe(true);
    expect(usuario.membresias).toHaveLength(0);
    expect(usuario.consentimientoIaEn).toBeNull();
  });

  it('AUT-01: dos registros abren sesiones con tokens distintos', async () => {
    const primero = await registrar(datosValidos());
    const segundo = await registrar(datosValidos({ correo: 'luis@correo.ec' }));

    expect(primero.body.datos.tokenRenovacion).not.toBe(segundo.body.datos.tokenRenovacion);
    expect(await baseDatos.tokenRenovacion.count()).toBe(2);
  });

  it('HU-AUT-01: con un correo ya registrado responde 409 CORREO_REGISTRADO y no crea otra cuenta', async () => {
    await crearUsuarioDePrueba({ correo: 'ana@correo.ec' });

    const respuesta = await registrar(datosValidos());

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('CORREO_REGISTRADO');
    expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
    expect(await baseDatos.usuario.count()).toBe(1);
    expect(await baseDatos.tokenRenovacion.count()).toBe(0);
  });

  it('HU-AUT-01: el correo repetido se detecta sin importar mayusculas ni espacios', async () => {
    await crearUsuarioDePrueba({ correo: 'ana@correo.ec' });

    const respuesta = await registrar(datosValidos({ correo: '  ANA@Correo.EC ' }));

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('CORREO_REGISTRADO');
    expect(await baseDatos.usuario.count()).toBe(1);
  });

  it('HU-AUT-01: dos registros simultaneos con el mismo correo crean una sola cuenta', async () => {
    const respuestas = await Promise.all([registrar(datosValidos()), registrar(datosValidos())]);

    const estados = respuestas.map((respuesta) => respuesta.status).sort();
    expect(estados).toEqual([201, 409]);
    expect(await baseDatos.usuario.count()).toBe(1);
  });

  it('HU-AUT-01: con una contrasena de menos de 8 caracteres indica que requisito falta', async () => {
    const respuesta = await esperarInvalido(datosValidos({ clave: 'Barb201' }), 'clave');

    const detalle = respuesta.body.error.detalles.find(
      (problema: { campo: string }) => problema.campo === 'clave',
    );
    expect(detalle.mensaje).toMatch(/8/);
  });

  it('§10.1: un campo no esperado responde 422 DATOS_INVALIDOS (§11.5)', async () => {
    const respuesta = await registrar(datosValidos({ rol: 'PROPIETARIO' }));

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(await baseDatos.usuario.count()).toBe(0);
  });

  it('§10.1: sin cuerpo responde 422 DATOS_INVALIDOS', async () => {
    const respuesta = await request(app).post(RUTA);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});

describe('§11.4: validaciones del registro', () => {
  describe('nombre: obligatorio, 2 a 80 caracteres, sin caracteres de control', () => {
    it.each([
      ['2 caracteres', 'Al'],
      ['80 caracteres', 'A'.repeat(80)],
    ])('acepta %s', async (_caso, nombre) => {
      const respuesta = await registrar(datosValidos({ nombre }));
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.usuario.nombre).toBe(nombre);
    });

    it('quita los espacios de los extremos', async () => {
      const respuesta = await registrar(datosValidos({ nombre: '  Ana Pérez  ' }));
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.usuario.nombre).toBe('Ana Pérez');
    });

    it.each([
      ['falta', undefined],
      ['vacio', ''],
      ['1 caracter', 'A'],
      ['1 caracter con espacios', '  A  '],
      ['81 caracteres', 'A'.repeat(81)],
      ['salto de linea', 'Ana\nPérez'],
      ['caracter nulo', 'Ana\u0000'],
      ['caracter de formato (U+202E)', 'Ana\u202ePérez'],
      ['caracter de ancho cero', 'Ana\u200bPérez'],
      ['no es texto', 123],
    ])('rechaza %s', async (_caso, nombre) => {
      await esperarInvalido(datosValidos({ nombre }), 'nombre');
    });
  });

  describe('correo: obligatorio, formato valido, guardado en minusculas', () => {
    it('lo guarda en minusculas y sin espacios', async () => {
      const respuesta = await registrar(datosValidos({ correo: '  Ana.Perez@Correo.EC ' }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.usuario.correo).toBe('ana.perez@correo.ec');
      const usuario = await baseDatos.usuario.findFirstOrThrow();
      expect(usuario.correo).toBe('ana.perez@correo.ec');
    });

    it('acepta 120 caracteres', async () => {
      const correo = `${'a'.repeat(110)}@correo.ec`;
      const respuesta = await registrar(datosValidos({ correo }));
      expect(respuesta.status).toBe(201);
    });

    it.each([
      ['falta', undefined],
      ['vacio', ''],
      ['sin arroba', 'ana.correo.ec'],
      ['sin dominio', 'ana@'],
      ['con espacios internos', 'ana perez@correo.ec'],
      ['121 caracteres', `${'a'.repeat(111)}@correo.ec`],
    ])('rechaza %s', async (_caso, correo) => {
      await esperarInvalido(datosValidos({ correo }), 'correo');
    });
  });

  describe('telefono: 7 a 15 digitos, formato ecuatoriano normalizado (D-14)', () => {
    it.each([
      ['09XXXXXXXX', '0991234567', '+593991234567'],
      ['+5939XXXXXXXX', '+593991234567', '+593991234567'],
      ['con espacios y guiones', '099 123-4567', '+593991234567'],
      ['7 digitos', '2345678', '2345678'],
      ['15 digitos', '123456789012345', '123456789012345'],
      ['internacional con +', '+14155550123', '+14155550123'],
    ])('acepta %s', async (_caso, telefono, guardado) => {
      const respuesta = await registrar(datosValidos({ telefono }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.usuario.telefono).toBe(guardado);
      const usuario = await baseDatos.usuario.findFirstOrThrow();
      expect(usuario.telefono).toBe(guardado);
    });

    it.each([
      ['falta', undefined],
      ['vacio', ''],
      ['6 digitos', '234567'],
      ['16 digitos', '1234567890123456'],
      ['con letras', '09912345ab'],
      ['+ en medio', '099+1234567'],
      ['no es texto', 991234567],
    ])('rechaza %s', async (_caso, telefono) => {
      await esperarInvalido(datosValidos({ telefono }), 'telefono');
    });
  });

  describe('clave: 8 a 72 caracteres, al menos una letra y un numero', () => {
    it.each([
      ['8 caracteres', 'Barber12'],
      ['72 caracteres', `${'a'.repeat(71)}1`],
    ])('acepta %s', async (_caso, clave) => {
      const respuesta = await registrar(datosValidos({ clave }));
      expect(respuesta.status).toBe(201);
    });

    it.each([
      ['falta', undefined],
      ['7 caracteres', 'Barber1'],
      ['73 caracteres', `${'a'.repeat(72)}1`],
      ['sin numero', 'Barberlyy'],
      ['sin letra', '12345678'],
      ['72 caracteres que pasan de 72 bytes (D-14)', `${'ñ'.repeat(71)}1`],
    ])('rechaza %s', async (_caso, clave) => {
      await esperarInvalido(datosValidos({ clave }), 'clave');
    });
  });

  describe('dispositivo: opcional, maximo 100 caracteres (D-04)', () => {
    it('acepta el registro sin dispositivo', async () => {
      const respuesta = await registrar(datosValidos());
      expect(respuesta.status).toBe(201);
      const sesion = await baseDatos.tokenRenovacion.findFirstOrThrow();
      expect(sesion.dispositivo).toBeNull();
    });

    it('acepta 100 caracteres', async () => {
      const respuesta = await registrar(datosValidos({ dispositivo: 'd'.repeat(100) }));
      expect(respuesta.status).toBe(201);
    });

    it('rechaza 101 caracteres', async () => {
      await esperarInvalido(datosValidos({ dispositivo: 'd'.repeat(101) }), 'dispositivo');
    });

    it('rechaza caracteres de control', async () => {
      await esperarInvalido(datosValidos({ dispositivo: 'Pixel\u00007' }), 'dispositivo');
    });
  });
});

describe('SEG-09, D-03: limite de registro por IP', () => {
  it('permite 5 registros por hora y el sexto responde 429 DEMASIADAS_SOLICITUDES', async () => {
    for (let numero = 1; numero <= 5; numero += 1) {
      const respuesta = await registrar(datosValidos({ correo: `cliente${numero}@correo.ec` }));
      expect(respuesta.status).toBe(201);
    }

    const sexta = await registrar(datosValidos({ correo: 'cliente6@correo.ec' }));

    expect(sexta.status).toBe(429);
    expect(sexta.body.error.codigo).toBe('DEMASIADAS_SOLICITUDES');
    expect(await baseDatos.usuario.count()).toBe(5);
  });

  it('D-14: cuenta tambien las solicitudes rechazadas', async () => {
    for (let numero = 1; numero <= 5; numero += 1) {
      const respuesta = await registrar(datosValidos({ clave: 'corta' }));
      expect(respuesta.status).toBe(422);
    }

    const sexta = await registrar(datosValidos());

    expect(sexta.status).toBe(429);
    expect(await baseDatos.usuario.count()).toBe(0);
  });
});

describe('§10.7: documentacion del registro', () => {
  it('GET /api/v1/documentacion incluye POST /autenticacion/registro', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    expect(body.paths['/autenticacion/registro'].post.responses).toEqual(
      expect.objectContaining({
        201: expect.anything(),
        409: expect.anything(),
        422: expect.anything(),
        429: expect.anything(),
      }),
    );
  });
});

describe('D-15: IP del cliente detras de un proxy', () => {
  const proxiesOriginales = configuracion.PROXIES_CONFIABLES;

  afterEach(() => {
    configuracion.PROXIES_CONFIABLES = proxiesOriginales;
  });

  function registrarDesde(reenviadoPor: string, numero: number) {
    return request(app)
      .post(RUTA)
      .set('X-Forwarded-For', reenviadoPor)
      .send(datosValidos({ correo: `cliente${numero}@correo.ec` }));
  }

  it('con 1 proxy, cada IP de cliente tiene su propio limite', async () => {
    configuracion.PROXIES_CONFIABLES = 1;

    for (let numero = 1; numero <= 5; numero += 1) {
      expect((await registrarDesde('203.0.113.1', numero)).status).toBe(201);
    }
    const agotada = await registrarDesde('203.0.113.1', 6);
    const otraIp = await registrarDesde('203.0.113.2', 7);

    expect(agotada.status).toBe(429);
    expect(otraIp.status).toBe(201);
  });

  it('con 1 proxy, una IP inventada por el cliente no salta el limite', async () => {
    configuracion.PROXIES_CONFIABLES = 1;

    // El cliente inventa la parte izquierda; el proxy agrega a la derecha la IP real.
    for (let numero = 1; numero <= 5; numero += 1) {
      const respuesta = await registrarDesde(`198.51.100.${numero}, 203.0.113.1`, numero);
      expect(respuesta.status).toBe(201);
    }
    const sexta = await registrarDesde('198.51.100.99, 203.0.113.1', 6);

    expect(sexta.status).toBe(429);
  });

  it('sin proxies (por defecto), X-Forwarded-For se ignora', async () => {
    configuracion.PROXIES_CONFIABLES = 0;

    for (let numero = 1; numero <= 5; numero += 1) {
      expect((await registrarDesde(`203.0.113.${numero}`, numero)).status).toBe(201);
    }
    const sexta = await registrarDesde('203.0.113.99', 6);

    expect(sexta.status).toBe(429);
  });
});

const RUTA_INICIO = '/api/v1/autenticacion/iniciar-sesion';
const CORREO_ANA = 'ana@correo.ec';

function iniciarSesion(cuerpo: Record<string, unknown>, ip?: string) {
  const peticion = request(app).post(RUTA_INICIO);
  if (ip) peticion.set('X-Forwarded-For', ip);
  return peticion.send(cuerpo);
}

function crearAna(cambios: { activo?: boolean } = {}) {
  return crearUsuarioDePrueba({
    nombre: 'Ana Pérez',
    correo: CORREO_ANA,
    telefono: '+593991234567',
    ...cambios,
  });
}

describe('HU-AUT-02: POST /api/v1/autenticacion/iniciar-sesion', () => {
  it('AUT-02: con credenciales correctas responde 200 con el usuario y los tokens (D-14)', async () => {
    const ana = await crearAna();

    const respuesta = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: {
        usuario: {
          id: ana.id,
          nombre: 'Ana Pérez',
          correo: CORREO_ANA,
          telefono: '+593991234567',
        },
        tokenAcceso: expect.any(String),
        tokenRenovacion: expect.any(String),
      },
    });
    expect(JSON.stringify(respuesta.body)).not.toMatch(/claveHash|tokenHash|activo/);
  });

  it('AUT-02: el token de acceso es un JWT con el id del usuario (D-03)', async () => {
    const ana = await crearAna();

    const { body } = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA });

    const contenido = jwt.verify(body.datos.tokenAcceso, configuracion.JWT_SECRETO, {
      algorithms: ['HS256'],
    });
    if (typeof contenido === 'string') throw new Error('Se esperaba un JWT con contenido');
    expect(contenido.sub).toBe(ana.id);
    expect((contenido.exp ?? 0) - (contenido.iat ?? 0)).toBe(
      configuracion.TOKEN_ACCESO_MINUTOS * 60,
    );
  });

  it('D-04: cada inicio abre su propia sesion de 30 dias con su dispositivo', async () => {
    const ana = await crearAna();
    fijarAhora(new Date('2026-11-21T15:00:00Z'));

    const primero = await iniciarSesion({
      correo: CORREO_ANA,
      clave: CLAVE_PRUEBA,
      dispositivo: 'Pixel 7',
    });
    const segundo = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA });

    expect(primero.body.datos.tokenRenovacion).not.toBe(segundo.body.datos.tokenRenovacion);
    const sesiones = await baseDatos.tokenRenovacion.findMany({
      where: { usuarioId: ana.id },
      orderBy: { dispositivo: { sort: 'desc', nulls: 'last' } },
    });
    expect(sesiones.map((sesion) => sesion.dispositivo)).toEqual(['Pixel 7', null]);
    for (const sesion of sesiones) {
      expect(sesion.expiraEn.toISOString()).toBe('2026-12-21T15:00:00.000Z');
      expect(sesion.revocadoEn).toBeNull();
      expect(sesion.tokenHash).toHaveLength(64);
    }
  });

  it('AUT-02: el correo no distingue mayusculas ni espacios', async () => {
    await crearAna();

    const respuesta = await iniciarSesion({ correo: '  ANA@Correo.EC ', clave: CLAVE_PRUEBA });

    expect(respuesta.status).toBe(200);
  });

  it('§11.4: con la clave incorrecta responde 401 CREDENCIALES_INVALIDAS y no abre sesion', async () => {
    await crearAna();

    const respuesta = await iniciarSesion({ correo: CORREO_ANA, clave: 'OtraClave99' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(await baseDatos.tokenRenovacion.count()).toBe(0);
  });

  it('§11.4: con un correo inexistente responde lo mismo que con la clave incorrecta', async () => {
    await crearAna();

    const claveIncorrecta = await iniciarSesion({ correo: CORREO_ANA, clave: 'OtraClave99' });
    const correoInexistente = await iniciarSesion({
      correo: 'nadie@correo.ec',
      clave: CLAVE_PRUEBA,
    });

    expect(correoInexistente.status).toBe(401);
    expect(correoInexistente.body).toEqual(claveIncorrecta.body);
  });

  it('D-05: un usuario inactivo con la clave correcta recibe CREDENCIALES_INVALIDAS', async () => {
    await crearAna({ activo: false });

    const respuesta = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(await baseDatos.tokenRenovacion.count()).toBe(0);
  });

  it('D-16: una clave que no cumple las reglas del registro responde 401, no 422', async () => {
    await crearAna();

    const respuesta = await iniciarSesion({ correo: CORREO_ANA, clave: 'abc' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  it.each([
    ['un campo no esperado', { correo: CORREO_ANA, clave: CLAVE_PRUEBA, rol: 'PROPIETARIO' }, ''],
    ['sin correo', { clave: CLAVE_PRUEBA }, 'correo'],
    ['un correo mal escrito', { correo: 'ana.correo.ec', clave: CLAVE_PRUEBA }, 'correo'],
    ['sin clave', { correo: CORREO_ANA }, 'clave'],
    ['la clave vacia', { correo: CORREO_ANA, clave: '' }, 'clave'],
    ['una clave de 73 caracteres', { correo: CORREO_ANA, clave: `${'a'.repeat(72)}1` }, 'clave'],
    [
      'un dispositivo de 101 caracteres',
      { correo: CORREO_ANA, clave: CLAVE_PRUEBA, dispositivo: 'd'.repeat(101) },
      'dispositivo',
    ],
  ])('D-16: con %s responde 422 DATOS_INVALIDOS', async (_caso, cuerpo, campo) => {
    await crearAna();

    const respuesta = await iniciarSesion(cuerpo);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(respuesta.body.error.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo })]),
    );
  });
});

describe('SEG-09, D-03, D-16: limite de inicios fallidos', () => {
  const proxiesOriginales = configuracion.PROXIES_CONFIABLES;

  beforeEach(() => {
    // Con un proxy de confianza, cada prueba elige la IP del cliente (D-15).
    configuracion.PROXIES_CONFIABLES = 1;
  });

  afterEach(() => {
    configuracion.PROXIES_CONFIABLES = proxiesOriginales;
    vi.useRealTimers();
  });

  async function fallar(veces: number, correo: string, ip: (intento: number) => string) {
    for (let intento = 1; intento <= veces; intento += 1) {
      const respuesta = await iniciarSesion({ correo, clave: 'OtraClave99' }, ip(intento));
      expect(respuesta.status).toBe(401);
    }
  }

  it('por cuenta: tras 5 fallos, el sexto intento responde 429 aunque la clave sea correcta y venga de otra IP', async () => {
    await crearAna();
    await fallar(5, CORREO_ANA, (intento) => `203.0.113.${intento}`);

    const respuesta = await iniciarSesion(
      { correo: CORREO_ANA, clave: CLAVE_PRUEBA },
      '203.0.113.50',
    );

    expect(respuesta.status).toBe(429);
    expect(respuesta.body.error.codigo).toBe('DEMASIADAS_SOLICITUDES');
    expect(await baseDatos.tokenRenovacion.count()).toBe(0);
  });

  it('por cuenta: el contador usa el correo normalizado', async () => {
    await crearAna();
    const variantes = [
      'ana@correo.ec',
      'ANA@correo.ec',
      ' Ana@Correo.ec',
      'ana@CORREO.EC ',
      'aNa@correo.ec',
    ];
    for (const [indice, correo] of variantes.entries()) {
      const respuesta = await iniciarSesion(
        { correo, clave: 'OtraClave99' },
        `203.0.113.${indice + 1}`,
      );
      expect(respuesta.status).toBe(401);
    }

    const respuesta = await iniciarSesion(
      { correo: CORREO_ANA, clave: CLAVE_PRUEBA },
      '203.0.113.50',
    );

    expect(respuesta.status).toBe(429);
  });

  it('por IP: tras 5 fallos con cuentas distintas, la misma IP queda bloqueada para cualquier cuenta', async () => {
    await crearAna();
    for (let intento = 1; intento <= 5; intento += 1) {
      const respuesta = await iniciarSesion(
        { correo: `nadie${intento}@correo.ec`, clave: 'OtraClave99' },
        '203.0.113.7',
      );
      expect(respuesta.status).toBe(401);
    }

    const mismaIp = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, '203.0.113.7');
    const otraIp = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, '203.0.113.8');

    expect(mismaIp.status).toBe(429);
    expect(otraIp.status).toBe(200);
  });

  it('4 fallos todavia permiten entrar con la clave correcta', async () => {
    await crearAna();
    await fallar(4, CORREO_ANA, () => '203.0.113.7');

    const respuesta = await iniciarSesion(
      { correo: CORREO_ANA, clave: CLAVE_PRUEBA },
      '203.0.113.7',
    );

    expect(respuesta.status).toBe(200);
  });

  it('D-16: los 422 no cuentan como fallos', async () => {
    await crearAna();
    for (let intento = 1; intento <= 6; intento += 1) {
      const respuesta = await iniciarSesion({ correo: CORREO_ANA, clave: '' }, '203.0.113.7');
      expect(respuesta.status).toBe(422);
    }

    const respuesta = await iniciarSesion(
      { correo: CORREO_ANA, clave: CLAVE_PRUEBA },
      '203.0.113.7',
    );

    expect(respuesta.status).toBe(200);
  });

  it('D-16: un inicio correcto no reinicia el contador', async () => {
    await crearAna();
    await fallar(4, CORREO_ANA, () => '203.0.113.7');
    expect(
      (await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, '203.0.113.7')).status,
    ).toBe(200);
    await fallar(1, CORREO_ANA, () => '203.0.113.7');

    const respuesta = await iniciarSesion(
      { correo: CORREO_ANA, clave: CLAVE_PRUEBA },
      '203.0.113.7',
    );

    expect(respuesta.status).toBe(429);
  });

  it('D-03: pasados 15 minutos desde el primer fallo se puede volver a entrar', async () => {
    await crearAna();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-21T15:00:00Z'));
    await fallar(5, CORREO_ANA, () => '203.0.113.7');

    vi.setSystemTime(new Date('2026-11-21T15:14:59Z'));
    const antes = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, '203.0.113.7');
    vi.setSystemTime(new Date('2026-11-21T15:15:01Z'));
    const despues = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, '203.0.113.7');

    expect(antes.status).toBe(429);
    expect(despues.status).toBe(200);
  });
});

describe('§10.7: documentacion del inicio de sesion', () => {
  it('GET /api/v1/documentacion incluye POST /autenticacion/iniciar-sesion', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    expect(body.paths['/autenticacion/iniciar-sesion'].post.responses).toEqual(
      expect.objectContaining({
        200: expect.anything(),
        401: expect.anything(),
        422: expect.anything(),
        429: expect.anything(),
      }),
    );
  });
});

describe('SEG-09, D-16: limite de inicios fallidos, casos de borde', () => {
  const proxiesOriginales = configuracion.PROXIES_CONFIABLES;

  beforeEach(() => {
    configuracion.PROXIES_CONFIABLES = 1;
  });

  afterEach(() => {
    configuracion.PROXIES_CONFIABLES = proxiesOriginales;
    vi.useRealTimers();
  });

  function contar(respuestas: { status: number }[]) {
    return respuestas.reduce<Record<number, number>>((cuenta, { status }) => {
      cuenta[status] = (cuenta[status] ?? 0) + 1;
      return cuenta;
    }, {});
  }

  it('por cuenta: 10 intentos simultaneos desde IPs distintas dan 5 fallos y 5 bloqueos', async () => {
    await crearAna();

    const respuestas = await Promise.all(
      Array.from({ length: 10 }, (_, indice) =>
        iniciarSesion({ correo: CORREO_ANA, clave: 'OtraClave99' }, `203.0.113.${indice + 1}`),
      ),
    );

    expect(contar(respuestas)).toEqual({ 401: 5, 429: 5 });
  });

  it('por IP: 10 intentos simultaneos con correos distintos dan 5 fallos y 5 bloqueos', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 10 }, (_, indice) =>
        iniciarSesion({ correo: `nadie${indice}@correo.ec`, clave: 'OtraClave99' }, '203.0.113.7'),
      ),
    );

    expect(contar(respuestas)).toEqual({ 401: 5, 429: 5 });
  });

  it('por cuenta: un correo inexistente se bloquea igual que uno existente, sin delatar cual existe', async () => {
    await crearAna();
    const correos = [CORREO_ANA, 'nadie@correo.ec'];

    const bloqueos = [];
    for (const [indiceCorreo, correo] of correos.entries()) {
      for (let intento = 1; intento <= 5; intento += 1) {
        const ip = `198.51.${indiceCorreo}.${intento}`;
        expect((await iniciarSesion({ correo, clave: 'OtraClave99' }, ip)).status).toBe(401);
      }
      bloqueos.push(
        await iniciarSesion({ correo, clave: 'OtraClave99' }, `198.51.${indiceCorreo}.99`),
      );
    }

    expect(bloqueos.map((respuesta) => respuesta.status)).toEqual([429, 429]);
    expect(bloqueos[0]?.body).toEqual(bloqueos[1]?.body);
  }, 20_000);

  it('D-16: la ventana empieza en el primer fallo, no en un intento correcto ni en un 422', async () => {
    await crearAna();
    vi.useFakeTimers({ toFake: ['Date'] });
    const ip = '203.0.113.7';

    vi.setSystemTime(new Date('2026-11-21T15:00:00Z'));
    expect((await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, ip)).status).toBe(200);
    expect((await iniciarSesion({ correo: CORREO_ANA, clave: '' }, ip)).status).toBe(422);

    vi.setSystemTime(new Date('2026-11-21T15:10:00Z'));
    for (let intento = 1; intento <= 5; intento += 1) {
      expect((await iniciarSesion({ correo: CORREO_ANA, clave: 'OtraClave99' }, ip)).status).toBe(
        401,
      );
    }

    // 15:16 ya pasa de 15 minutos desde el primer intento, pero no desde el primer fallo.
    vi.setSystemTime(new Date('2026-11-21T15:16:00Z'));
    const dentro = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, ip);
    vi.setSystemTime(new Date('2026-11-21T15:25:01Z'));
    const fuera = await iniciarSesion({ correo: CORREO_ANA, clave: CLAVE_PRUEBA }, ip);

    expect(dentro.status).toBe(429);
    expect(fuera.status).toBe(200);
  });

  it('D-16: solo el limite por IP envia la cabecera RateLimit, con su propio nombre', async () => {
    await crearAna();

    const respuesta = await iniciarSesion(
      { correo: CORREO_ANA, clave: 'OtraClave99' },
      '203.0.113.7',
    );

    // draft-8 junta las entradas: la del limite general de app.ts y la de inicio-ip, ninguna de la cuenta.
    const nombres = (cabecera: string | undefined) =>
      (cabecera ?? '').split(',').map((entrada) => entrada.trim().split(';')[0]);
    expect(nombres(respuesta.headers.ratelimit)).toEqual(['"300-in-1min"', '"inicio-ip"']);
    expect(nombres(respuesta.headers['ratelimit-policy'])).toEqual([
      '"300-in-1min"',
      '"inicio-ip"',
    ]);
  });
});

const RUTA_RENOVAR = '/api/v1/autenticacion/renovar';
const RUTA_CERRAR = '/api/v1/autenticacion/cerrar-sesion';

async function abrirSesionDe(correo: string, dispositivo?: string) {
  const { body } = await iniciarSesion({ correo, clave: CLAVE_PRUEBA, dispositivo });
  return body.datos as { usuario: { id: string }; tokenAcceso: string; tokenRenovacion: string };
}

function renovar(cuerpo: unknown) {
  return request(app)
    .post(RUTA_RENOVAR)
    .send(cuerpo as object);
}

function cerrarSesion(tokenAcceso: string | undefined, cuerpo: unknown) {
  const peticion = request(app).post(RUTA_CERRAR);
  if (tokenAcceso) peticion.set(cabeceraDePrueba(tokenAcceso));
  return peticion.send(cuerpo as object);
}

function sesionesVigentes(usuarioId: string) {
  return baseDatos.tokenRenovacion.count({ where: { usuarioId, revocadoEn: null } });
}

describe('AUT-04, D-17: POST /api/v1/autenticacion/renovar', () => {
  it('HU-AUT-02: con un token vigente responde 200 con tokens nuevos, sin el usuario', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);

    const respuesta = await renovar({ tokenRenovacion: sesion.tokenRenovacion });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: { tokenAcceso: expect.any(String), tokenRenovacion: expect.any(String) },
    });
    expect(respuesta.body.datos.tokenRenovacion).not.toBe(sesion.tokenRenovacion);
    const contenido = jwt.verify(respuesta.body.datos.tokenAcceso, configuracion.JWT_SECRETO, {
      algorithms: ['HS256'],
    });
    if (typeof contenido === 'string') throw new Error('Se esperaba un JWT con contenido');
    expect(contenido.sub).toBe(sesion.usuario.id);
  });

  it('D-03: rota la sesion: revoca la fila anterior y crea otra con el mismo dispositivo y 30 dias nuevos', async () => {
    await crearAna();
    fijarAhora(new Date('2026-11-21T15:00:00Z'));
    const sesion = await abrirSesionDe(CORREO_ANA, 'Pixel 7');

    fijarAhora(new Date('2026-11-25T10:00:00Z'));
    await renovar({ tokenRenovacion: sesion.tokenRenovacion });

    const filas = await baseDatos.tokenRenovacion.findMany({
      where: { usuarioId: sesion.usuario.id },
      orderBy: { creadoEn: 'asc' },
    });
    expect(filas).toHaveLength(2);
    const [anterior, nueva] = filas;
    expect(anterior?.revocadoEn?.toISOString()).toBe('2026-11-25T10:00:00.000Z');
    expect(nueva?.revocadoEn).toBeNull();
    expect(nueva?.dispositivo).toBe('Pixel 7');
    expect(nueva?.expiraEn.toISOString()).toBe('2026-12-25T10:00:00.000Z');
  });

  it('HU-AUT-02: el token anterior ya no sirve y el nuevo si', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);
    const { body } = await renovar({ tokenRenovacion: sesion.tokenRenovacion });

    const conAnterior = await renovar({ tokenRenovacion: sesion.tokenRenovacion });
    const conNuevo = await renovar({ tokenRenovacion: body.datos.tokenRenovacion });

    expect(conAnterior.status).toBe(401);
    expect(conAnterior.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect(conNuevo.status).toBe(200);
  });

  it('D-04: renovar una sesion no toca las demas del usuario', async () => {
    await crearAna();
    const telefono = await abrirSesionDe(CORREO_ANA, 'Pixel 7');
    const tableta = await abrirSesionDe(CORREO_ANA, 'Tableta');

    await renovar({ tokenRenovacion: telefono.tokenRenovacion });

    expect(await sesionesVigentes(telefono.usuario.id)).toBe(2);
    expect((await renovar({ tokenRenovacion: tableta.tokenRenovacion })).status).toBe(200);
  });

  it('D-02: con un token vencido responde 401 AUTENTICACION_REQUERIDA; un milisegundo antes todavia sirve', async () => {
    await crearAna();
    fijarAhora(new Date('2026-11-21T15:00:00Z'));
    const primera = await abrirSesionDe(CORREO_ANA);
    const segunda = await abrirSesionDe(CORREO_ANA);

    fijarAhora(new Date('2026-12-21T14:59:59.999Z'));
    const antes = await renovar({ tokenRenovacion: primera.tokenRenovacion });
    fijarAhora(new Date('2026-12-21T15:00:00.000Z'));
    const justoAlVencer = await renovar({ tokenRenovacion: segunda.tokenRenovacion });

    expect(antes.status).toBe(200);
    expect(justoAlVencer.status).toBe(401);
    expect(justoAlVencer.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-02, D-05: vencido, revocado, inexistente e inactivo responden exactamente lo mismo', async () => {
    await crearAna();
    const luis = await crearUsuarioDePrueba({ correo: 'luis@correo.ec' });
    const vencida = await abrirSesionDe(CORREO_ANA);
    const revocada = await abrirSesionDe(CORREO_ANA);
    const inactiva = await abrirSesionDe('luis@correo.ec');
    await baseDatos.tokenRenovacion.updateMany({
      where: { usuarioId: vencida.usuario.id },
      data: { expiraEn: new Date('2020-01-01T00:00:00Z') },
    });
    await cerrarSesion(revocada.tokenAcceso, { tokenRenovacion: revocada.tokenRenovacion });
    await baseDatos.usuario.update({ where: { id: luis.id }, data: { activo: false } });

    const respuestas = await Promise.all([
      renovar({ tokenRenovacion: vencida.tokenRenovacion }),
      renovar({ tokenRenovacion: revocada.tokenRenovacion }),
      renovar({ tokenRenovacion: 'token-que-no-existe' }),
      renovar({ tokenRenovacion: inactiva.tokenRenovacion }),
    ]);

    for (const respuesta of respuestas) {
      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toEqual(respuestas[0]?.body);
    }
    expect(respuestas[0]?.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-05: un usuario inactivo no puede renovar y su sesion no rota', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);
    await baseDatos.usuario.update({ where: { id: sesion.usuario.id }, data: { activo: false } });

    const respuesta = await renovar({ tokenRenovacion: sesion.tokenRenovacion });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect(await baseDatos.tokenRenovacion.count()).toBe(1);
  });

  it('D-17: de cinco renovaciones simultaneas con el mismo token solo una gana', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);

    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () => renovar({ tokenRenovacion: sesion.tokenRenovacion })),
    );

    expect(respuestas.filter((respuesta) => respuesta.status === 200)).toHaveLength(1);
    expect(respuestas.filter((respuesta) => respuesta.status === 401)).toHaveLength(4);
    expect(await sesionesVigentes(sesion.usuario.id)).toBe(1);
    expect(await baseDatos.tokenRenovacion.count()).toBe(2);
  });

  it.each([
    ['sin cuerpo', undefined],
    ['sin token', {}],
    ['el token vacio', { tokenRenovacion: '' }],
    ['un token que no es texto', { tokenRenovacion: 123 }],
    ['un token de mas de 128 caracteres', { tokenRenovacion: 't'.repeat(129) }],
    ['un campo no esperado', { tokenRenovacion: 'abc', usuarioId: 'otro' }],
  ])('D-17: con %s responde 422 DATOS_INVALIDOS', async (_caso, cuerpo) => {
    const respuesta = await renovar(cuerpo);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});

describe('AUT-03, D-17: POST /api/v1/autenticacion/cerrar-sesion', () => {
  it('AUT-03: revoca la sesion del dispositivo y responde 204 sin cuerpo', async () => {
    await crearAna();
    fijarAhora(new Date('2026-11-21T15:00:00Z'));
    const sesion = await abrirSesionDe(CORREO_ANA);

    const respuesta = await cerrarSesion(sesion.tokenAcceso, {
      tokenRenovacion: sesion.tokenRenovacion,
    });

    expect(respuesta.status).toBe(204);
    expect(respuesta.text).toBe('');
    const fila = await baseDatos.tokenRenovacion.findFirstOrThrow();
    expect(fila.revocadoEn?.toISOString()).toBe('2026-11-21T15:00:00.000Z');
  });

  it('HU-AUT-02: despues de cerrar sesion, renovar con ese token pide iniciar sesion', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);
    await cerrarSesion(sesion.tokenAcceso, { tokenRenovacion: sesion.tokenRenovacion });

    const respuesta = await renovar({ tokenRenovacion: sesion.tokenRenovacion });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-04: cierra solo esa sesion; las de otros dispositivos siguen vigentes', async () => {
    await crearAna();
    const telefono = await abrirSesionDe(CORREO_ANA, 'Pixel 7');
    const tableta = await abrirSesionDe(CORREO_ANA, 'Tableta');

    await cerrarSesion(telefono.tokenAcceso, { tokenRenovacion: telefono.tokenRenovacion });

    expect(await sesionesVigentes(telefono.usuario.id)).toBe(1);
    expect((await renovar({ tokenRenovacion: tableta.tokenRenovacion })).status).toBe(200);
  });

  it('SEG-02: sin token de acceso responde 401 y no revoca nada', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);

    const respuesta = await cerrarSesion(undefined, { tokenRenovacion: sesion.tokenRenovacion });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect(await sesionesVigentes(sesion.usuario.id)).toBe(1);
  });

  it('SEG-02: con el token de acceso vencido responde 401 TOKEN_VENCIDO y no revoca nada', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);

    const respuesta = await cerrarSesion(tokenDePrueba(sesion.usuario.id, -1), {
      tokenRenovacion: sesion.tokenRenovacion,
    });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('TOKEN_VENCIDO');
    expect(await sesionesVigentes(sesion.usuario.id)).toBe(1);
  });

  it('D-17: con el token de renovacion de otro usuario responde 204 y no lo revoca', async () => {
    await crearAna();
    await crearUsuarioDePrueba({ correo: 'luis@correo.ec' });
    const ana = await abrirSesionDe(CORREO_ANA);
    const luis = await abrirSesionDe('luis@correo.ec');

    const respuesta = await cerrarSesion(ana.tokenAcceso, {
      tokenRenovacion: luis.tokenRenovacion,
    });

    expect(respuesta.status).toBe(204);
    expect(await sesionesVigentes(luis.usuario.id)).toBe(1);
    expect(await sesionesVigentes(ana.usuario.id)).toBe(1);
    expect((await renovar({ tokenRenovacion: luis.tokenRenovacion })).status).toBe(200);
  });

  it('D-17: cerrar dos veces la misma sesion o con un token inexistente responde 204', async () => {
    await crearAna();
    fijarAhora(new Date('2026-11-21T15:00:00Z'));
    const sesion = await abrirSesionDe(CORREO_ANA);
    await cerrarSesion(sesion.tokenAcceso, { tokenRenovacion: sesion.tokenRenovacion });

    fijarAhora(new Date('2026-11-21T16:00:00Z'));
    const otraVez = await cerrarSesion(sesion.tokenAcceso, {
      tokenRenovacion: sesion.tokenRenovacion,
    });
    const inexistente = await cerrarSesion(sesion.tokenAcceso, { tokenRenovacion: 'no-existe' });

    expect(otraVez.status).toBe(204);
    expect(inexistente.status).toBe(204);
    // La fecha de revocacion no cambia al repetir.
    const fila = await baseDatos.tokenRenovacion.findFirstOrThrow();
    expect(fila.revocadoEn?.toISOString()).toBe('2026-11-21T15:00:00.000Z');
  });

  it.each([
    ['sin token', {}],
    ['el token vacio', { tokenRenovacion: '' }],
    ['un campo no esperado', { tokenRenovacion: 'abc', todas: true }],
  ])('D-17: con %s responde 422 DATOS_INVALIDOS', async (_caso, cuerpo) => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);

    const respuesta = await cerrarSesion(sesion.tokenAcceso, cuerpo);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(await sesionesVigentes(sesion.usuario.id)).toBe(1);
  });
});

describe('§10.7: documentacion de renovar y cerrar sesion', () => {
  it('GET /api/v1/documentacion incluye renovar y cerrar sesion', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    expect(Object.keys(body.paths['/autenticacion/renovar'].post.responses)).toEqual(
      expect.arrayContaining(['200', '401', '422']),
    );
    const cerrar = body.paths['/autenticacion/cerrar-sesion'].post;
    expect(Object.keys(cerrar.responses)).toEqual(expect.arrayContaining(['204', '401', '422']));
    expect(cerrar.security).toEqual([{ bearer: [] }]);
  });
});

const RUTA_YO = '/api/v1/usuarios/yo';

function consultarYo(usuarioId?: string) {
  const peticion = request(app).get(RUTA_YO);
  if (usuarioId) peticion.set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
  return peticion;
}

describe('AUT-08, D-18: GET /api/v1/usuarios/yo', () => {
  beforeEach(async () => {
    await escenarioBase();
  });

  it('un cliente recibe su perfil y la lista de membresias vacia', async () => {
    const respuesta = await consultarYo(IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: {
        id: IDS_PRUEBA.cliente,
        nombre: 'Cliente',
        correo: 'cliente@barberly.test',
        telefono: '0991234567',
        consentimientoIaEn: null,
        membresias: [],
      },
    });
  });

  it('un propietario ve su membresia sin barberoId', async () => {
    const respuesta = await consultarYo(IDS_PRUEBA.propietario);

    expect(respuesta.body.datos.membresias).toEqual([
      {
        id: expect.any(String),
        rol: 'PROPIETARIO',
        barberoId: null,
        barberia: { id: IDS_PRUEBA.barberia, nombre: 'Barberia Centro' },
      },
    ]);
  });

  it('un barbero ve su membresia con el id de su PerfilBarbero (§10.1)', async () => {
    const respuesta = await consultarYo(IDS_PRUEBA.barbero);

    expect(respuesta.body.datos.membresias).toEqual([
      {
        id: expect.any(String),
        rol: 'BARBERO',
        barberoId: IDS_PRUEBA.perfilBarbero,
        barberia: { id: IDS_PRUEBA.barberia, nombre: 'Barberia Centro' },
      },
    ]);
  });

  it('AUT-09: con roles en varias barberias las devuelve todas, ordenadas por nombre de barberia', async () => {
    await crearBarberoDePrueba({
      usuarioId: IDS_PRUEBA.propietario,
      barberiaId: IDS_PRUEBA.otraBarberia,
      perfilId: idPrueba(310),
      servicioIds: [IDS_PRUEBA.servicioOtra],
    });
    await crearBarberiaDePrueba({ propietarioId: IDS_PRUEBA.propietario, nombre: 'Alfa Barberia' });

    const { body } = await consultarYo(IDS_PRUEBA.propietario);

    expect(
      body.datos.membresias.map((membresia: { rol: string; barberia: { nombre: string } }) => [
        membresia.barberia.nombre,
        membresia.rol,
      ]),
    ).toEqual([
      ['Alfa Barberia', 'PROPIETARIO'],
      ['Barberia Centro', 'PROPIETARIO'],
      ['Barberia Norte', 'BARBERO'],
    ]);
    expect(body.datos.membresias[2].barberoId).toBe(idPrueba(310));
  });

  it('D-18: no incluye membresias INVITADO ni INACTIVO ni de barberias inactivas', async () => {
    await baseDatos.membresia.createMany({
      data: [
        {
          id: idPrueba(501),
          usuarioId: IDS_PRUEBA.cliente,
          barberiaId: IDS_PRUEBA.barberia,
          rol: 'BARBERO',
          estado: 'INVITADO',
        },
        {
          id: idPrueba(502),
          usuarioId: IDS_PRUEBA.cliente,
          barberiaId: IDS_PRUEBA.otraBarberia,
          rol: 'BARBERO',
          estado: 'INACTIVO',
        },
      ],
    });
    const { barberia } = await crearBarberiaDePrueba({
      propietarioId: IDS_PRUEBA.cliente,
      nombre: 'Barberia Cerrada',
    });
    await baseDatos.barberia.update({ where: { id: barberia.id }, data: { activo: false } });

    const respuesta = await consultarYo(IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.membresias).toEqual([]);
  });

  it('RN-28: devuelve la fecha del consentimiento de IA en ISO 8601 UTC', async () => {
    await baseDatos.usuario.update({
      where: { id: IDS_PRUEBA.cliente },
      data: { consentimientoIaEn: new Date('2026-11-20T18:30:00Z') },
    });

    const { body } = await consultarYo(IDS_PRUEBA.cliente);

    expect(body.datos.consentimientoIaEn).toBe('2026-11-20T18:30:00.000Z');
  });

  it('RNF-17: no expone la clave, el estado de la cuenta ni datos de otros usuarios', async () => {
    const { body } = await consultarYo(IDS_PRUEBA.barbero);

    const texto = JSON.stringify(body);
    expect(texto).not.toMatch(/claveHash|activo|estado|usuarioId/);
    expect(texto).not.toMatch(/propietario@barberly\.test|cliente@barberly\.test|barbero\.otra/);
    expect(Object.keys(body.datos.membresias[0].barberia)).toEqual(['id', 'nombre']);
  });

  it('SEG-02: sin token responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await consultarYo();

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-05: un usuario inactivo con un token vigente responde 401 AUTENTICACION_REQUERIDA', async () => {
    await baseDatos.usuario.update({ where: { id: IDS_PRUEBA.cliente }, data: { activo: false } });

    const respuesta = await consultarYo(IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-18: con el token de un usuario que no existe responde 401', async () => {
    const respuesta = await consultarYo(idPrueba(999));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-05: tras desactivar la cuenta, cerrar sesion tambien responde 401', async () => {
    await crearAna();
    const sesion = await abrirSesionDe(CORREO_ANA);
    await baseDatos.usuario.update({ where: { id: sesion.usuario.id }, data: { activo: false } });

    const respuesta = await cerrarSesion(sesion.tokenAcceso, {
      tokenRenovacion: sesion.tokenRenovacion,
    });

    expect(respuesta.status).toBe(401);
  });

  it('§10.7: la documentacion incluye GET /usuarios/yo con token de acceso', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    const yo = body.paths['/usuarios/yo'].get;
    expect(Object.keys(yo.responses)).toEqual(expect.arrayContaining(['200', '401']));
    expect(yo.security).toEqual([{ bearer: [] }]);
  });
});
