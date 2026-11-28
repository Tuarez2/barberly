// Recuperar la contrasena con un codigo temporal de 6 digitos enviado por correo
// (T1.15, AUT-07, D-01, D-15): POST /autenticacion/recuperar-clave y /autenticacion/restablecer-clave.
// El correo sale por EnvioCorreo; aqui lo captura el doble de src/pruebas/envio-correo.ts.
// La IP del cliente solo se elige con PROXIES_CONFIABLES = 1 (D-15); restablecer-clave admite 10
// solicitudes por IP por hora, asi que ningun otro caso pasa de 10.
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { configuracion } from '../../compartido/configuracion';
import { reiniciarLimites } from '../../compartido/limites';
import { registro } from '../../compartido/registro';
import { CLAVE_PRUEBA, crearUsuarioDePrueba, idPrueba, limpiarBase } from '../../pruebas/fabricas';
import {
  desinstalarEnvioCorreoDePrueba,
  envioCorreoDePrueba,
  instalarEnvioCorreoDePrueba,
  usarEnvioCorreoPorDefecto,
} from '../../pruebas/envio-correo';

const RUTA_RECUPERAR = '/api/v1/autenticacion/recuperar-clave';
const RUTA_RESTABLECER = '/api/v1/autenticacion/restablecer-clave';
const RUTA_INICIO = '/api/v1/autenticacion/iniciar-sesion';
const RUTA_RENOVAR = '/api/v1/autenticacion/renovar';

const ID_ANA = idPrueba(1);
const ID_LUIS = idPrueba(2);
const CORREO_ANA = 'ana@correo.ec';
const CORREO_LUIS = 'luis@correo.ec';
const CORREO_INEXISTENTE = 'nadie@correo.ec';
const CLAVE_NUEVA = 'Navaja2027';
const QUINCE_MINUTOS_MS = 15 * 60 * 1000;

// bcrypt (costo 12) en el codigo, la clave nueva y los inicios de sesion: varios segundos por caso.
const OPCIONES_LENTAS = { timeout: 20_000 };

function recuperar(cuerpo: unknown, ip?: string) {
  const peticion = request(app).post(RUTA_RECUPERAR);
  if (ip) peticion.set('X-Forwarded-For', ip);
  return peticion.send(cuerpo as object);
}

function restablecer(cuerpo: unknown, ip?: string) {
  const peticion = request(app).post(RUTA_RESTABLECER);
  if (ip) peticion.set('X-Forwarded-For', ip);
  return peticion.send(cuerpo as object);
}

function iniciarSesion(correo: string, clave: string) {
  return request(app).post(RUTA_INICIO).send({ correo, clave });
}

// Pide un codigo y devuelve el que capturo EnvioCorreo.
async function pedirCodigo(correo: string = CORREO_ANA): Promise<string> {
  const respuesta = await recuperar({ correo });
  expect(respuesta.status).toBe(202);
  return envioCorreoDePrueba.ultimoCodigo(correo);
}

// Otro codigo de 6 digitos distinto del correcto.
function codigoErroneo(codigo: string, desplazamiento = 1): string {
  return ((Number(codigo) + desplazamiento) % 1_000_000).toString().padStart(6, '0');
}

function codigosDe(usuarioId: string) {
  return baseDatos.codigoRecuperacion.findMany({
    where: { usuarioId },
    orderBy: { creadoEn: 'asc' },
  });
}

async function codigoVigente(usuarioId: string = ID_ANA) {
  const vigentes = (await codigosDe(usuarioId)).filter((codigo) => codigo.usadoEn === null);
  expect(vigentes).toHaveLength(1);
  return vigentes[0]!;
}

async function esperarClaveIntacta(usuarioId: string = ID_ANA) {
  const { claveHash } = await baseDatos.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  expect(await bcrypt.compare(CLAVE_PRUEBA, claveHash)).toBe(true);
}

function esperarCodigoInvalido(respuesta: request.Response) {
  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error.codigo).toBe('CODIGO_INVALIDO');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  return respuesta.body.error.mensaje as string;
}

function esperarInvalido(respuesta: request.Response, campo?: string) {
  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  expect(respuesta.body.error.detalles).toEqual(expect.any(Array));
  if (campo) {
    expect(respuesta.body.error.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo })]),
    );
  }
}

function esperarDemasiadas(respuesta: request.Response) {
  expect(respuesta.status).toBe(429);
  expect(respuesta.body.error.codigo).toBe('DEMASIADAS_SOLICITUDES');
}

function restablecimiento(codigo: string, cambios: Record<string, unknown> = {}) {
  return { correo: CORREO_ANA, codigo, claveNueva: CLAVE_NUEVA, ...cambios };
}

beforeEach(async () => {
  await limpiarBase();
  reiniciarLimites();
  instalarEnvioCorreoDePrueba();
  await crearUsuarioDePrueba({ id: ID_ANA, nombre: 'Ana Pérez', correo: CORREO_ANA });
  await crearUsuarioDePrueba({ id: ID_LUIS, nombre: 'Luis Mora', correo: CORREO_LUIS });
});

afterEach(() => {
  vi.useRealTimers();
  desinstalarEnvioCorreoDePrueba();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('AUT-07: POST /api/v1/autenticacion/recuperar-clave', () => {
  it('AUT-07: con un correo registrado responde 202 { datos: { mensaje } }, crea un codigo y lo envia por EnvioCorreo', async () => {
    const respuesta = await recuperar({ correo: CORREO_ANA });

    expect(respuesta.status).toBe(202);
    expect(respuesta.body).toEqual({ datos: { mensaje: expect.any(String) } });
    expect(envioCorreoDePrueba.enviados).toHaveLength(1);
    expect(envioCorreoDePrueba.enviados[0]!.correo).toBe(CORREO_ANA);
    expect(await codigosDe(ID_ANA)).toHaveLength(1);
  });

  it('AUT-07: responde igual exista o no el correo y este activa o no la cuenta', async () => {
    await crearUsuarioDePrueba({ correo: 'inactiva@correo.ec', activo: false });

    const registrado = await recuperar({ correo: CORREO_ANA });
    const inexistente = await recuperar({ correo: CORREO_INEXISTENTE });
    const inactiva = await recuperar({ correo: 'inactiva@correo.ec' });

    for (const respuesta of [inexistente, inactiva]) {
      expect(respuesta.status).toBe(registrado.status);
      expect(respuesta.body).toEqual(registrado.body);
    }
    expect(registrado.status).toBe(202);
  });

  it('AUT-07: con un correo inexistente no crea codigo ni llama a EnvioCorreo', async () => {
    const respuesta = await recuperar({ correo: CORREO_INEXISTENTE });

    expect(respuesta.status).toBe(202);
    expect(await baseDatos.codigoRecuperacion.count()).toBe(0);
    expect(envioCorreoDePrueba.enviados).toHaveLength(0);
  });

  it('AUT-07, D-05: con una cuenta inactiva no crea codigo ni llama a EnvioCorreo', async () => {
    await crearUsuarioDePrueba({ correo: 'inactiva@correo.ec', activo: false });

    const respuesta = await recuperar({ correo: 'inactiva@correo.ec' });

    expect(respuesta.status).toBe(202);
    expect(await baseDatos.codigoRecuperacion.count()).toBe(0);
    expect(envioCorreoDePrueba.enviados).toHaveLength(0);
  });

  it('D-01: el codigo enviado tiene exactamente 6 digitos y no aparece en la respuesta', async () => {
    const respuesta = await recuperar({ correo: CORREO_ANA });
    expect(respuesta.status).toBe(202);
    const codigo = envioCorreoDePrueba.ultimoCodigo(CORREO_ANA);

    expect(codigo).toMatch(/^\d{6}$/);
    expect(JSON.stringify(respuesta.body)).not.toContain(codigo);
  });

  it('D-01: el codigo se guarda solo como hash de bcrypt, con intentos 0 y sin usar', async () => {
    const codigo = await pedirCodigo();

    const guardado = await codigoVigente();
    expect(guardado.codigoHash).not.toBe(codigo);
    expect(guardado.codigoHash).not.toContain(codigo);
    expect(guardado.codigoHash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare(codigo, guardado.codigoHash)).toBe(true);
    expect(guardado.intentos).toBe(0);
    expect(guardado.usadoEn).toBeNull();
  });

  it('D-01: el codigo vence 15 minutos despues de pedirlo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-27T15:00:00Z'));

    await pedirCodigo();

    const guardado = await codigoVigente();
    expect(guardado.expiraEn.toISOString()).toBe('2026-11-27T15:15:00.000Z');
  });

  it('D-01: el correo se normaliza (minusculas y sin espacios) antes de buscar al usuario', async () => {
    const respuesta = await recuperar({ correo: '  ANA@Correo.EC ' });

    expect(respuesta.status).toBe(202);
    expect(envioCorreoDePrueba.enviadosA(CORREO_ANA)).toHaveLength(1);
    expect(await codigosDe(ID_ANA)).toHaveLength(1);
  });

  it(
    'AUT-07: dado un codigo nuevo, cuando se pide otro, el primero queda usado y responde CODIGO_INVALIDO',
    OPCIONES_LENTAS,
    async () => {
      const primero = await pedirCodigo();
      const segundo = await pedirCodigo();
      expect(envioCorreoDePrueba.enviadosA(CORREO_ANA)).toHaveLength(2);

      const codigos = await codigosDe(ID_ANA);
      expect(codigos).toHaveLength(2);
      expect(codigos[0]!.usadoEn).not.toBeNull();
      expect(codigos[1]!.usadoEn).toBeNull();

      if (primero !== segundo) {
        esperarCodigoInvalido(await restablecer(restablecimiento(primero)));
        await esperarClaveIntacta();
      }
      expect((await restablecer(restablecimiento(segundo))).status).toBe(204);
    },
  );

  it('aislamiento: pedir un codigo para un usuario no toca los codigos de otro', async () => {
    await pedirCodigo(CORREO_LUIS);
    await pedirCodigo(CORREO_ANA);

    const deLuis = await codigoVigente(ID_LUIS);
    expect(deLuis.usadoEn).toBeNull();
    expect(envioCorreoDePrueba.enviadosA(CORREO_LUIS)).toHaveLength(1);
  });

  it('D-01: la ruta es publica: funciona sin token de acceso', async () => {
    const respuesta = await request(app).post(RUTA_RECUPERAR).send({ correo: CORREO_ANA });

    expect(respuesta.status).toBe(202);
  });
});

describe('AUT-07, D-14: validaciones de recuperar-clave', () => {
  it('sin correo responde DATOS_INVALIDOS', async () => {
    esperarInvalido(await recuperar({}), 'correo');
    expect(envioCorreoDePrueba.enviados).toHaveLength(0);
  });

  it.each(['ana', 'ana@', '@correo.ec', '', 'ana correo@correo.ec'])(
    'con el correo %j responde DATOS_INVALIDOS',
    async (correo) => {
      esperarInvalido(await recuperar({ correo }), 'correo');
      expect(await baseDatos.codigoRecuperacion.count()).toBe(0);
    },
  );

  it('con un correo que no es texto responde DATOS_INVALIDOS', async () => {
    esperarInvalido(await recuperar({ correo: 123 }), 'correo');
  });

  it('D-14: un campo extra responde DATOS_INVALIDOS y no crea codigo', async () => {
    esperarInvalido(await recuperar({ correo: CORREO_ANA, clave: CLAVE_NUEVA }));
    expect(await baseDatos.codigoRecuperacion.count()).toBe(0);
    expect(envioCorreoDePrueba.enviados).toHaveLength(0);
  });
});

describe('AUT-07, D-15: limite de recuperar-clave por correo y por IP', () => {
  const proxiesOriginales = configuracion.PROXIES_CONFIABLES;

  beforeEach(() => {
    // Con un proxy de confianza, cada prueba elige la IP del cliente (D-15).
    configuracion.PROXIES_CONFIABLES = 1;
  });

  afterEach(() => {
    configuracion.PROXIES_CONFIABLES = proxiesOriginales;
  });

  it(
    'AUT-07: el 4.º pedido de la hora para el mismo correo responde DEMASIADAS_SOLICITUDES aunque venga de otra IP',
    OPCIONES_LENTAS,
    async () => {
      for (let pedido = 1; pedido <= 3; pedido += 1) {
        const respuesta = await recuperar({ correo: CORREO_ANA }, `203.0.113.${pedido}`);
        expect(respuesta.status).toBe(202);
      }

      const cuarto = await recuperar({ correo: CORREO_ANA }, '203.0.113.50');

      esperarDemasiadas(cuarto);
      expect(await codigosDe(ID_ANA)).toHaveLength(3);
      expect(envioCorreoDePrueba.enviadosA(CORREO_ANA)).toHaveLength(3);
    },
  );

  it('AUT-07: el limite por correo usa el correo normalizado', OPCIONES_LENTAS, async () => {
    const variantes = ['ana@correo.ec', 'ANA@correo.ec', ' Ana@Correo.ec '];
    for (const [indice, correo] of variantes.entries()) {
      const respuesta = await recuperar({ correo }, `203.0.113.${indice + 1}`);
      expect(respuesta.status).toBe(202);
    }

    esperarDemasiadas(await recuperar({ correo: 'aNa@correo.EC' }, '203.0.113.50'));
  });

  it('AUT-07: el limite por correo cuenta tambien los correos que no existen', async () => {
    for (let pedido = 1; pedido <= 3; pedido += 1) {
      const respuesta = await recuperar({ correo: CORREO_INEXISTENTE }, `203.0.113.${pedido}`);
      expect(respuesta.status).toBe(202);
    }

    esperarDemasiadas(await recuperar({ correo: CORREO_INEXISTENTE }, '203.0.113.50'));
  });

  it('AUT-07: el limite de un correo no afecta a otro correo', OPCIONES_LENTAS, async () => {
    for (let pedido = 1; pedido <= 3; pedido += 1) {
      await recuperar({ correo: CORREO_ANA }, `203.0.113.${pedido}`);
    }

    const otro = await recuperar({ correo: CORREO_LUIS }, '203.0.113.50');

    expect(otro.status).toBe(202);
    expect(envioCorreoDePrueba.enviadosA(CORREO_LUIS)).toHaveLength(1);
  });

  it('D-15: el 6.º pedido de la hora desde la misma IP responde DEMASIADAS_SOLICITUDES; otra IP sigue', async () => {
    for (let pedido = 1; pedido <= 5; pedido += 1) {
      const respuesta = await recuperar({ correo: `nadie${pedido}@correo.ec` }, '203.0.113.7');
      expect(respuesta.status).toBe(202);
    }

    const mismaIp = await recuperar({ correo: CORREO_ANA }, '203.0.113.7');
    const otraIp = await recuperar({ correo: CORREO_ANA }, '203.0.113.8');

    esperarDemasiadas(mismaIp);
    expect(otraIp.status).toBe(202);
    expect(envioCorreoDePrueba.enviadosA(CORREO_ANA)).toHaveLength(1);
  });

  it('AUT-07: pasada una hora se puede volver a pedir un codigo', OPCIONES_LENTAS, async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-27T15:00:00Z'));
    for (let pedido = 1; pedido <= 3; pedido += 1) {
      await recuperar({ correo: CORREO_ANA }, `203.0.113.${pedido}`);
    }

    vi.setSystemTime(new Date('2026-11-27T15:59:59Z'));
    const antes = await recuperar({ correo: CORREO_ANA }, '203.0.113.50');
    vi.setSystemTime(new Date('2026-11-27T16:00:01Z'));
    const despues = await recuperar({ correo: CORREO_ANA }, '203.0.113.51');

    esperarDemasiadas(antes);
    expect(despues.status).toBe(202);
  });
});

describe('AUT-07: POST /api/v1/autenticacion/restablecer-clave', () => {
  it(
    'AUT-07: con un codigo vigente y correcto responde 204 sin cuerpo y marca el codigo como usado',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      const respuesta = await restablecer(restablecimiento(codigo));

      expect(respuesta.status).toBe(204);
      expect(respuesta.body).toEqual({});
      const [guardado] = await codigosDe(ID_ANA);
      expect(guardado!.usadoEn).not.toBeNull();
    },
  );

  it(
    'AUT-07: la clave nueva sirve para iniciar sesion y la vieja no',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      expect((await restablecer(restablecimiento(codigo))).status).toBe(204);

      expect((await iniciarSesion(CORREO_ANA, CLAVE_NUEVA)).status).toBe(200);
      const vieja = await iniciarSesion(CORREO_ANA, CLAVE_PRUEBA);
      expect(vieja.status).toBe(401);
      expect(vieja.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    },
  );

  it(
    'AUT-07: revoca todos los TokenRenovacion del usuario y no los de otro',
    OPCIONES_LENTAS,
    async () => {
      const telefono = (await iniciarSesion(CORREO_ANA, CLAVE_PRUEBA)).body.datos;
      const tableta = (await iniciarSesion(CORREO_ANA, CLAVE_PRUEBA)).body.datos;
      const deLuis = (await iniciarSesion(CORREO_LUIS, CLAVE_PRUEBA)).body.datos;
      const codigo = await pedirCodigo();

      expect((await restablecer(restablecimiento(codigo))).status).toBe(204);

      const tokensAna = await baseDatos.tokenRenovacion.findMany({ where: { usuarioId: ID_ANA } });
      expect(tokensAna).toHaveLength(2);
      expect(tokensAna.every((token) => token.revocadoEn !== null)).toBe(true);
      for (const sesion of [telefono, tableta]) {
        const renovada = await request(app)
          .post(RUTA_RENOVAR)
          .send({ tokenRenovacion: sesion.tokenRenovacion });
        expect(renovada.status).toBe(401);
        expect(renovada.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
      }
      const tokensLuis = await baseDatos.tokenRenovacion.findMany({
        where: { usuarioId: ID_LUIS },
      });
      expect(tokensLuis.every((token) => token.revocadoEn === null)).toBe(true);
      expect(
        (await request(app).post(RUTA_RENOVAR).send({ tokenRenovacion: deLuis.tokenRenovacion }))
          .status,
      ).toBe(200);
    },
  );

  it('AUT-07: no abre sesion: no crea tokens de renovacion', OPCIONES_LENTAS, async () => {
    const codigo = await pedirCodigo();

    await restablecer(restablecimiento(codigo));

    expect(await baseDatos.tokenRenovacion.count()).toBe(0);
  });

  it(
    'AUT-07: reusar el codigo responde CODIGO_INVALIDO y no cambia la clave',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();
      expect((await restablecer(restablecimiento(codigo))).status).toBe(204);

      esperarCodigoInvalido(
        await restablecer(restablecimiento(codigo, { claveNueva: 'Tijera2028' })),
      );

      expect((await iniciarSesion(CORREO_ANA, CLAVE_NUEVA)).status).toBe(200);
    },
  );

  it(
    'D-01: dos restablecimientos simultaneos con el mismo codigo: solo uno tiene exito',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      const respuestas = await Promise.all([
        restablecer(restablecimiento(codigo, { claveNueva: 'Navaja2027' })),
        restablecer(restablecimiento(codigo, { claveNueva: 'Tijera2028' })),
      ]);

      expect(respuestas.filter((r) => r.status === 204)).toHaveLength(1);
      expect(respuestas.filter((r) => r.body.error?.codigo === 'CODIGO_INVALIDO')).toHaveLength(1);
    },
  );

  it('D-01: el codigo correcto se acepta con el correo normalizado', OPCIONES_LENTAS, async () => {
    const codigo = await pedirCodigo();

    const respuesta = await restablecer(restablecimiento(codigo, { correo: ' ANA@Correo.ec ' }));

    expect(respuesta.status).toBe(204);
  });

  it('D-01: un codigo de hace 14 minutos todavia sirve', OPCIONES_LENTAS, async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-27T15:00:00Z'));
    const codigo = await pedirCodigo();

    vi.setSystemTime(new Date('2026-11-27T15:14:00Z'));
    const respuesta = await restablecer(restablecimiento(codigo));

    expect(respuesta.status).toBe(204);
  });

  it(
    'AUT-07: un codigo de hace 16 minutos responde CODIGO_INVALIDO y no cambia la clave',
    OPCIONES_LENTAS,
    async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-27T15:00:00Z'));
      const codigo = await pedirCodigo();

      vi.setSystemTime(new Date(Date.parse('2026-11-27T15:00:00Z') + QUINCE_MINUTOS_MS + 60_000));
      esperarCodigoInvalido(await restablecer(restablecimiento(codigo)));

      await esperarClaveIntacta();
    },
  );

  it(
    'D-01: un codigo erroneo responde CODIGO_INVALIDO y suma un intento',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      esperarCodigoInvalido(await restablecer(restablecimiento(codigoErroneo(codigo))));

      expect((await codigoVigente()).intentos).toBe(1);
      await esperarClaveIntacta();
    },
  );

  it('D-01: tras 4 codigos erroneos el correcto todavia sirve', OPCIONES_LENTAS, async () => {
    const codigo = await pedirCodigo();
    for (let intento = 1; intento <= 4; intento += 1) {
      esperarCodigoInvalido(await restablecer(restablecimiento(codigoErroneo(codigo, intento))));
    }

    expect((await restablecer(restablecimiento(codigo))).status).toBe(204);
  });

  it(
    'AUT-07: tras 5 codigos erroneos el correcto tambien responde CODIGO_INVALIDO',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();
      for (let intento = 1; intento <= 5; intento += 1) {
        esperarCodigoInvalido(await restablecer(restablecimiento(codigoErroneo(codigo, intento))));
      }

      esperarCodigoInvalido(await restablecer(restablecimiento(codigo)));

      const guardado = (await codigosDe(ID_ANA))[0]!;
      expect(guardado.intentos).toBe(5);
      await esperarClaveIntacta();
    },
  );

  it(
    'D-01: los intentos no pasan de 5 aunque lleguen 8 codigos erroneos a la vez',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      const respuestas = await Promise.all(
        Array.from({ length: 8 }, (_valor, indice) =>
          restablecer(restablecimiento(codigoErroneo(codigo, indice + 1))),
        ),
      );

      expect(respuestas.every((r) => r.body.error?.codigo === 'CODIGO_INVALIDO')).toBe(true);
      expect((await codigosDe(ID_ANA))[0]!.intentos).toBe(5);
      esperarCodigoInvalido(await restablecer(restablecimiento(codigo)));
    },
  );

  it(
    'D-01: tras agotar los intentos, pedir un codigo nuevo permite restablecer',
    OPCIONES_LENTAS,
    async () => {
      const agotado = await pedirCodigo();
      for (let intento = 1; intento <= 5; intento += 1) {
        await restablecer(restablecimiento(codigoErroneo(agotado, intento)));
      }

      const nuevo = await pedirCodigo();

      expect((await restablecer(restablecimiento(nuevo))).status).toBe(204);
    },
  );

  it('D-01: sin ningun codigo pedido responde CODIGO_INVALIDO', async () => {
    esperarCodigoInvalido(await restablecer(restablecimiento('123456')));

    await esperarClaveIntacta();
  });

  it('D-01: con un correo inexistente responde CODIGO_INVALIDO', async () => {
    esperarCodigoInvalido(
      await restablecer(restablecimiento('123456', { correo: CORREO_INEXISTENTE })),
    );
  });

  it(
    'D-05: si la cuenta se desactiva despues de pedir el codigo, responde CODIGO_INVALIDO',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();
      await baseDatos.usuario.update({ where: { id: ID_ANA }, data: { activo: false } });

      esperarCodigoInvalido(await restablecer(restablecimiento(codigo)));

      await esperarClaveIntacta();
    },
  );

  it(
    'D-01: todos los casos de CODIGO_INVALIDO usan el mismo mensaje',
    OPCIONES_LENTAS,
    async () => {
      const sinCodigo = esperarCodigoInvalido(await restablecer(restablecimiento('123456')));
      const inexistente = esperarCodigoInvalido(
        await restablecer(restablecimiento('123456', { correo: CORREO_INEXISTENTE })),
      );
      const codigo = await pedirCodigo();
      const erroneo = esperarCodigoInvalido(
        await restablecer(restablecimiento(codigoErroneo(codigo))),
      );
      expect((await restablecer(restablecimiento(codigo))).status).toBe(204);
      const usado = esperarCodigoInvalido(await restablecer(restablecimiento(codigo)));

      expect(new Set([sinCodigo, inexistente, erroneo, usado]).size).toBe(1);
    },
  );

  it(
    'aislamiento: el codigo de otro usuario no sirve y no toca la clave de ninguno',
    OPCIONES_LENTAS,
    async () => {
      let deLuis = await pedirCodigo(CORREO_LUIS);
      const deAna = await pedirCodigo(CORREO_ANA);
      // Dos codigos aleatorios de 6 digitos pueden coincidir (1 en un millon): se pide otro a Luis.
      if (deLuis === deAna) deLuis = await pedirCodigo(CORREO_LUIS);

      esperarCodigoInvalido(await restablecer(restablecimiento(deLuis)));

      expect((await codigoVigente(ID_ANA)).intentos).toBe(1);
      expect((await codigoVigente(ID_LUIS)).intentos).toBe(0);
      await esperarClaveIntacta(ID_ANA);
      await esperarClaveIntacta(ID_LUIS);
    },
  );

  it(
    'aislamiento: restablecer la clave de un usuario no cambia la de otro',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      expect((await restablecer(restablecimiento(codigo))).status).toBe(204);

      await esperarClaveIntacta(ID_LUIS);
      expect((await iniciarSesion(CORREO_LUIS, CLAVE_PRUEBA)).status).toBe(200);
    },
  );
});

describe('AUT-07, §11.4, D-14: validaciones de restablecer-clave', () => {
  it.each([
    ['5 digitos', '12345'],
    ['7 digitos', '1234567'],
    ['letras', 'abcdef'],
    ['espacios', '123 45'],
    ['vacio', ''],
  ])(
    'un codigo con %s responde DATOS_INVALIDOS y no gasta un intento',
    OPCIONES_LENTAS,
    async (_caso, codigoMal) => {
      await pedirCodigo();

      esperarInvalido(await restablecer(restablecimiento(codigoMal)), 'codigo');

      expect((await codigoVigente()).intentos).toBe(0);
    },
  );

  it('un codigo numerico (no texto) responde DATOS_INVALIDOS', async () => {
    esperarInvalido(await restablecer(restablecimiento('123456', { codigo: 123456 })), 'codigo');
  });

  it.each([
    ['menos de 8 caracteres', 'Corta1'],
    ['sin numero', 'SoloLetras'],
    ['sin letra', '12345678'],
    ['mas de 72 caracteres', `A1${'a'.repeat(71)}`],
    ['mas de 72 bytes en UTF-8', `A1${'ñ'.repeat(40)}`],
  ])(
    'una claveNueva %s responde DATOS_INVALIDOS y no gasta un intento',
    OPCIONES_LENTAS,
    async (_caso, claveNueva) => {
      const codigo = await pedirCodigo();

      esperarInvalido(await restablecer(restablecimiento(codigo, { claveNueva })), 'claveNueva');

      expect((await codigoVigente()).intentos).toBe(0);
      await esperarClaveIntacta();
    },
  );

  it('una claveNueva de exactamente 72 caracteres se acepta', OPCIONES_LENTAS, async () => {
    const codigo = await pedirCodigo();

    const respuesta = await restablecer(
      restablecimiento(codigo, { claveNueva: `A1${'a'.repeat(70)}` }),
    );

    expect(respuesta.status).toBe(204);
  });

  it('un correo con formato invalido responde DATOS_INVALIDOS', async () => {
    esperarInvalido(await restablecer(restablecimiento('123456', { correo: 'ana' })), 'correo');
  });

  it.each(['correo', 'codigo', 'claveNueva'])(
    'sin %s responde DATOS_INVALIDOS',
    OPCIONES_LENTAS,
    async (campo) => {
      const codigo = await pedirCodigo();
      const cuerpo: Record<string, unknown> = restablecimiento(codigo);
      delete cuerpo[campo];

      esperarInvalido(await restablecer(cuerpo), campo);

      expect((await codigoVigente()).intentos).toBe(0);
    },
  );

  it(
    'D-14: un campo extra responde DATOS_INVALIDOS, no gasta un intento ni cambia la clave',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();

      esperarInvalido(await restablecer(restablecimiento(codigo, { clave: CLAVE_NUEVA })));

      const guardado = await codigoVigente();
      expect(guardado.intentos).toBe(0);
      expect(guardado.usadoEn).toBeNull();
      await esperarClaveIntacta();
    },
  );
});

describe('AUT-07, D-15: limite de restablecer-clave por IP', () => {
  const proxiesOriginales = configuracion.PROXIES_CONFIABLES;

  beforeEach(() => {
    configuracion.PROXIES_CONFIABLES = 1;
  });

  afterEach(() => {
    configuracion.PROXIES_CONFIABLES = proxiesOriginales;
  });

  it(
    'AUT-07: tras 10 solicitudes de la hora desde una IP (validas o no), la 11.ª responde DEMASIADAS_SOLICITUDES aunque el codigo sea correcto',
    OPCIONES_LENTAS,
    async () => {
      const codigo = await pedirCodigo();
      // 4 codigos erroneos (CODIGO_INVALIDO) y 6 cuerpos invalidos (DATOS_INVALIDOS): todos cuentan.
      for (let intento = 1; intento <= 4; intento += 1) {
        const respuesta = await restablecer(
          restablecimiento(codigoErroneo(codigo, intento)),
          '203.0.113.7',
        );
        expect(respuesta.body.error.codigo).toBe('CODIGO_INVALIDO');
      }
      for (let intento = 1; intento <= 6; intento += 1) {
        const respuesta = await restablecer(restablecimiento('12345'), '203.0.113.7');
        expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
      }

      esperarDemasiadas(await restablecer(restablecimiento(codigo), '203.0.113.7'));

      // El 429 no gasta el codigo ni suma un intento; desde otra IP todavia sirve.
      const guardado = await codigoVigente();
      expect(guardado.intentos).toBe(4);
      await esperarClaveIntacta();
      expect((await restablecer(restablecimiento(codigo), '203.0.113.8')).status).toBe(204);
    },
  );

  it('AUT-07: 10 solicitudes desde una IP todavia se atienden', async () => {
    for (let intento = 1; intento <= 10; intento += 1) {
      const respuesta = await restablecer(restablecimiento('12345'), '203.0.113.7');
      expect(respuesta.status).toBe(422);
    }
  });

  it('AUT-07: el limite cuenta solicitudes de correos distintos desde la misma IP', async () => {
    for (let intento = 1; intento <= 10; intento += 1) {
      await restablecer(
        restablecimiento('123456', { correo: `nadie${intento}@correo.ec` }),
        '203.0.113.7',
      );
    }

    esperarDemasiadas(
      await restablecer(restablecimiento('123456', { correo: CORREO_LUIS }), '203.0.113.7'),
    );
  }, 20_000);

  it('AUT-07: pasada una hora se puede volver a restablecer desde esa IP', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-27T15:00:00Z'));
    for (let intento = 1; intento <= 10; intento += 1) {
      await restablecer(restablecimiento('12345'), '203.0.113.7');
    }

    vi.setSystemTime(new Date('2026-11-27T15:59:59Z'));
    const antes = await restablecer(restablecimiento('12345'), '203.0.113.7');
    vi.setSystemTime(new Date('2026-11-27T16:00:01Z'));
    const despues = await restablecer(restablecimiento('12345'), '203.0.113.7');

    esperarDemasiadas(antes);
    expect(despues.status).toBe(422);
    expect(despues.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});

describe('D-01: fallos de EnvioCorreo y concurrencia de recuperar-clave', () => {
  it.each(['rechazo', 'excepcion'] as const)(
    'D-01: si EnvioCorreo falla (%s), recuperar-clave responde 202 con la misma respuesta',
    OPCIONES_LENTAS,
    async (fallo) => {
      const neutra = await recuperar({ correo: CORREO_INEXISTENTE });
      envioCorreoDePrueba.fallar(fallo);

      const respuesta = await recuperar({ correo: CORREO_ANA });
      // Deja correr el manejo del rechazo antes de terminar la prueba.
      await new Promise((resolver) => setImmediate(resolver));

      expect(respuesta.status).toBe(202);
      expect(respuesta.body).toEqual(neutra.body);
      expect(envioCorreoDePrueba.enviadosA(CORREO_ANA)).toHaveLength(1);
      const guardado = await codigoVigente();
      expect(
        await bcrypt.compare(envioCorreoDePrueba.ultimoCodigo(CORREO_ANA), guardado.codigoHash),
      ).toBe(true);
    },
  );

  it(
    'D-01: dos recuperar-clave simultaneos para el mismo correo dejan un solo codigo vigente',
    OPCIONES_LENTAS,
    async () => {
      const respuestas = await Promise.all([
        recuperar({ correo: CORREO_ANA }),
        recuperar({ correo: CORREO_ANA }),
      ]);

      expect(respuestas.map((r) => r.status)).toEqual([202, 202]);
      expect(await codigosDe(ID_ANA)).toHaveLength(2);
      const vigente = await codigoVigente();
      const enviados = envioCorreoDePrueba.enviadosA(CORREO_ANA).map((e) => e.codigo);
      expect(enviados).toHaveLength(2);
      const coincidencias = await Promise.all(
        enviados.map((codigo) => bcrypt.compare(codigo, vigente.codigoHash)),
      );
      expect(coincidencias).toContain(true);
    },
  );
});

describe('D-01, RNF-17: el log por defecto en produccion', () => {
  const entornoOriginal = configuracion.NODE_ENV;
  const NIVELES = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

  afterEach(() => {
    configuracion.NODE_ENV = entornoOriginal;
    vi.restoreAllMocks();
  });

  // Captura todo lo que se registra, sin escribirlo.
  function espiarRegistro(): unknown[][] {
    const llamadas: unknown[][] = [];
    for (const nivel of NIVELES) {
      vi.spyOn(registro, nivel).mockImplementation((...argumentos: unknown[]) => {
        llamadas.push(argumentos);
      });
    }
    return llamadas;
  }

  function serializar(llamadas: unknown[][]): string {
    return JSON.stringify(llamadas, (_clave, valor: unknown) =>
      valor instanceof Error ? { nombre: valor.name, mensaje: valor.message } : valor,
    );
  }

  it(
    'D-01: con EnvioCorreo por defecto y NODE_ENV production no registra ni el codigo ni el correo',
    OPCIONES_LENTAS,
    async () => {
      usarEnvioCorreoPorDefecto();
      configuracion.NODE_ENV = 'production';
      const llamadas = espiarRegistro();

      const respuesta = await recuperar({ correo: CORREO_ANA });
      await new Promise((resolver) => setImmediate(resolver));

      expect(respuesta.status).toBe(202);
      const guardado = await codigoVigente();
      const texto = serializar(llamadas);
      expect(texto.toLowerCase()).not.toContain(CORREO_ANA);
      // El codigo no se conoce aqui: ninguna secuencia de 6 digitos del log coincide con su hash.
      const candidatos = [...new Set(texto.match(/\d{6}/g) ?? [])];
      for (const candidato of candidatos) {
        expect(await bcrypt.compare(candidato, guardado.codigoHash)).toBe(false);
      }
    },
  );
});

describe('§10.7: documentacion de recuperar la contrasena', () => {
  it('GET /api/v1/documentacion incluye POST /autenticacion/recuperar-clave y /autenticacion/restablecer-clave', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    const recuperarDoc = body.paths['/autenticacion/recuperar-clave']?.post;
    const restablecerDoc = body.paths['/autenticacion/restablecer-clave']?.post;
    expect(Object.keys(recuperarDoc?.responses ?? {})).toEqual(
      expect.arrayContaining(['202', '422', '429']),
    );
    expect(Object.keys(restablecerDoc?.responses ?? {})).toEqual(
      expect.arrayContaining(['204', '422', '429']),
    );
    // Publicas: no exigen token de acceso.
    expect(recuperarDoc.security ?? []).not.toEqual([{ bearer: [] }]);
    expect(restablecerDoc.security ?? []).not.toEqual([{ bearer: [] }]);
  });
});
