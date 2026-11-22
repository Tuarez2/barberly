// Autenticacion: registro de usuario (T1.5, AUT-01, HU-AUT-01, SEG-06, §11.4, D-03, D-14).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { configuracion } from '../../compartido/configuracion';
import { reiniciarLimites } from '../../compartido/limites';
import { fijarAhora, restaurarAhora } from '../../compartido/reloj';
import { crearUsuarioDePrueba, limpiarBase } from '../../pruebas/fabricas';

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
