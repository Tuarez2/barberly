// Registrar barberia, POST /barberias (T1.9, AUT-10, HU-AUT-03, D-07, D-13).
// La especificacion vive en docs/especificaciones/autenticacion.md; la ruta es de Administracion (§10.2).
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { reiniciarLimites } from '../../compartido/limites';
import { restaurarAhora } from '../../compartido/reloj';
import {
  crearUsuarioDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../../pruebas/fabricas';
import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';

const RUTA = '/api/v1/barberias';
const RUTA_YO = '/api/v1/usuarios/yo';

// Usuario sin membresias que registra su primera barberia.
const ANA = IDS_PRUEBA.usuario;

function datosValidos(cambios: Record<string, unknown> = {}) {
  return {
    nombre: 'Corte Fino',
    direccion: 'Av. Amazonas 123',
    telefono: '0991234567',
    ...cambios,
  };
}

function registrarBarberia(cuerpo: Record<string, unknown>, usuarioId: string = ANA) {
  return request(app)
    .post(RUTA)
    .set(cabeceraDePrueba(tokenDePrueba(usuarioId)))
    .send(cuerpo);
}

function consultarYo(usuarioId: string) {
  return request(app)
    .get(RUTA_YO)
    .set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
}

async function contar() {
  return {
    barberias: await baseDatos.barberia.count(),
    membresias: await baseDatos.membresia.count(),
  };
}

// 422 DATOS_INVALIDOS con el campo en detalles y sin crear barberia ni membresia (HU-AUT-03).
async function esperarInvalido(cuerpo: Record<string, unknown>, campo?: string) {
  const antes = await contar();
  const respuesta = await registrarBarberia(cuerpo);

  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  expect(respuesta.body.error.detalles).toEqual(expect.any(Array));
  if (campo) {
    expect(respuesta.body.error.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo })]),
    );
  }
  expect(await contar()).toEqual(antes);
  return respuesta;
}

beforeEach(async () => {
  await limpiarBase();
  reiniciarLimites();
  // Dos barberias con sus propietarios para los casos de aislamiento.
  await escenarioBase();
  await crearUsuarioDePrueba({ id: ANA, nombre: 'Ana Pérez', correo: 'ana@correo.ec' });
});

afterEach(() => {
  restaurarAhora();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('HU-AUT-03: POST /api/v1/barberias', () => {
  it('HU-AUT-03: con nombre, direccion y telefono responde 201 sin publicar, telefono normalizado y membresia PROPIETARIO ACTIVO', async () => {
    const respuesta = await registrarBarberia(datosValidos());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toEqual({
      datos: {
        id: expect.any(String),
        nombre: 'Corte Fino',
        descripcion: null,
        direccion: 'Av. Amazonas 123',
        telefono: '+593991234567',
        publicada: false,
        activo: true,
        membresia: { id: expect.any(String), rol: 'PROPIETARIO', estado: 'ACTIVO' },
      },
    });
  });

  it('HU-AUT-03: el usuario queda como propietario: GET /usuarios/yo incluye la membresia nueva', async () => {
    const { body } = await registrarBarberia(datosValidos());

    const yo = await consultarYo(ANA);

    expect(yo.status).toBe(200);
    expect(yo.body.datos.membresias).toEqual([
      {
        id: body.datos.membresia.id,
        rol: 'PROPIETARIO',
        barberoId: null,
        barberia: { id: body.datos.id, nombre: 'Corte Fino' },
      },
    ]);
  });

  it('AUT-10: guarda la barberia activa y la membresia del usuario autenticado en la base', async () => {
    const { body } = await registrarBarberia(datosValidos());

    const barberia = await baseDatos.barberia.findUniqueOrThrow({ where: { id: body.datos.id } });
    expect(barberia).toMatchObject({
      nombre: 'Corte Fino',
      descripcion: null,
      direccion: 'Av. Amazonas 123',
      telefono: '+593991234567',
      publicada: false,
      activo: true,
    });
    const membresias = await baseDatos.membresia.findMany({ where: { barberiaId: barberia.id } });
    expect(membresias).toEqual([
      expect.objectContaining({
        id: body.datos.membresia.id,
        usuarioId: ANA,
        rol: 'PROPIETARIO',
        estado: 'ACTIVO',
      }),
    ]);
  });

  it('D-07: nace sin publicar aunque el usuario ya tenga una barberia publicada, y no la publica', async () => {
    const respuesta = await registrarBarberia(
      datosValidos({ nombre: 'Segunda sede' }),
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.datos.publicada).toBe(false);
    // Sin servicios, horarios ni barberos: el listado publico (solo publicadas) no la incluye.
    const publicadas = await baseDatos.barberia.findMany({ where: { publicada: true } });
    expect(publicadas.map((barberia) => barberia.id).sort()).toEqual(
      [IDS_PRUEBA.barberia, IDS_PRUEBA.otraBarberia].sort(),
    );
    expect(await baseDatos.servicio.count({ where: { barberiaId: respuesta.body.datos.id } })).toBe(
      0,
    );
    expect(
      await baseDatos.horarioAtencion.count({ where: { barberiaId: respuesta.body.datos.id } }),
    ).toBe(0);
  });

  it('AUT-10: reglas y zona horaria quedan en sus valores por defecto', async () => {
    const { body } = await registrarBarberia(datosValidos());

    const barberia = await baseDatos.barberia.findUniqueOrThrow({ where: { id: body.datos.id } });
    expect(barberia).toMatchObject({
      zonaHoraria: 'America/Guayaquil',
      minutosMinCancelacion: 120,
      minutosMinAnticipacion: 30,
      diasMaxAnticipacion: 30,
      maxCitasActivas: 3,
      anticipoActivo: false,
      montoAnticipo: null,
      archivoPortada: null,
    });
  });

  it('AUT-10: guarda la descripcion cuando se envia', async () => {
    const respuesta = await registrarBarberia(
      datosValidos({ descripcion: 'Cortes clasicos y modernos' }),
    );

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.datos.descripcion).toBe('Cortes clasicos y modernos');
    const barberia = await baseDatos.barberia.findUniqueOrThrow({
      where: { id: respuesta.body.datos.id },
    });
    expect(barberia.descripcion).toBe('Cortes clasicos y modernos');
  });

  it('AUT-10: un usuario puede registrar varias barberias, incluso con el mismo nombre', async () => {
    const primera = await registrarBarberia(datosValidos());
    const segunda = await registrarBarberia(datosValidos());

    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(201);
    expect(segunda.body.datos.id).not.toBe(primera.body.datos.id);
    const { body } = await consultarYo(ANA);
    expect(body.datos.membresias).toHaveLength(2);
  });

  it('AUT-10: el nombre de una barberia ajena no impide registrar otra igual', async () => {
    const respuesta = await registrarBarberia(datosValidos({ nombre: 'Barberia Centro' }));

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.datos.id).not.toBe(IDS_PRUEBA.barberia);
  });

  it('HU-AUT-03: con nombre de 2 caracteres responde DATOS_INVALIDOS y no crea barberia ni membresia', async () => {
    await esperarInvalido(datosValidos({ nombre: 'Co' }), 'nombre');
  });

  it('HU-AUT-03: sin direccion responde DATOS_INVALIDOS y no crea barberia ni membresia', async () => {
    await esperarInvalido(datosValidos({ direccion: undefined }), 'direccion');
  });

  it.each([
    ['publicada', { publicada: true }],
    ['activo', { activo: false }],
    ['zonaHoraria', { zonaHoraria: 'America/Bogota' }],
    ['minutosMinCancelacion', { minutosMinCancelacion: 0 }],
    ['propietarioId', { propietarioId: IDS_PRUEBA.propietarioOtra }],
    ['id', { id: idPrueba(999) }],
  ])(
    'HU-AUT-03: con el campo extra %s responde DATOS_INVALIDOS y no crea nada',
    async (_caso, extra) => {
      await esperarInvalido(datosValidos(extra));
    },
  );

  it('§10.1: sin cuerpo responde 422 DATOS_INVALIDOS', async () => {
    const antes = await contar();
    const respuesta = await request(app)
      .post(RUTA)
      .set(cabeceraDePrueba(tokenDePrueba(ANA)));

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(await contar()).toEqual(antes);
  });
});

describe('AUT-10: validaciones de POST /barberias', () => {
  describe('nombre: obligatorio, 3 a 80 caracteres, sin caracteres de control', () => {
    it.each([
      ['3 caracteres', 'Fin'],
      ['80 caracteres', 'B'.repeat(80)],
    ])('acepta %s', async (_caso, nombre) => {
      const respuesta = await registrarBarberia(datosValidos({ nombre }));
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.nombre).toBe(nombre);
    });

    it.each([
      ['falta', undefined],
      ['vacio', ''],
      ['2 caracteres', 'Co'],
      ['81 caracteres', 'B'.repeat(81)],
      ['salto de linea', 'Corte\nFino'],
      ['caracter nulo', 'Corte Fino\u0000'],
      ['caracter de formato (U+202E)', 'Corte\u202e Fino'],
      ['caracter de ancho cero (U+200B)', 'Corte\u200b Fino'],
      ['no es texto', 123],
    ])('rechaza %s', async (_caso, nombre) => {
      await esperarInvalido(datosValidos({ nombre }), 'nombre');
    });
  });

  describe('direccion: obligatoria, 3 a 200 caracteres, sin caracteres de control', () => {
    it.each([
      ['3 caracteres', 'Av1'],
      ['200 caracteres', 'D'.repeat(200)],
    ])('acepta %s', async (_caso, direccion) => {
      const respuesta = await registrarBarberia(datosValidos({ direccion }));
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.direccion).toBe(direccion);
    });

    it.each([
      ['falta', undefined],
      ['vacia', ''],
      ['2 caracteres', 'Av'],
      ['201 caracteres', 'D'.repeat(201)],
      ['salto de linea', 'Av. Amazonas\n123'],
      ['caracter nulo', 'Av. Amazonas 123\u0000'],
      ['caracter de formato (U+202E)', 'Av. Amazonas\u202e 123'],
      ['caracter de ancho cero (U+200B)', 'Av. Amazonas\u200b 123'],
      ['no es texto', 123],
    ])('rechaza %s', async (_caso, direccion) => {
      await esperarInvalido(datosValidos({ direccion }), 'direccion');
    });
  });

  describe('telefono: validacion y normalizacion de Usuario (D-14)', () => {
    it.each([
      ['09XXXXXXXX', '0991234567', '+593991234567'],
      ['+5939XXXXXXXX', '+593991234567', '+593991234567'],
      ['con espacios y guiones', '099 123-4567', '+593991234567'],
      ['7 digitos', '2345678', '2345678'],
      ['15 digitos', '123456789012345', '123456789012345'],
      ['internacional con +', '+14155550123', '+14155550123'],
    ])('acepta %s', async (_caso, telefono, guardado) => {
      const respuesta = await registrarBarberia(datosValidos({ telefono }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.telefono).toBe(guardado);
      const barberia = await baseDatos.barberia.findUniqueOrThrow({
        where: { id: respuesta.body.datos.id },
      });
      expect(barberia.telefono).toBe(guardado);
    });

    it.each([
      ['falta', undefined],
      ['vacio', ''],
      ['6 digitos', '234567'],
      ['16 digitos', '1234567890123456'],
      ['con letras', '09912345ab'],
      ['+ en medio', '099+1234567'],
      ['caracter nulo', '0991234567\u0000'],
      ['no es texto', 991234567],
    ])('rechaza %s', async (_caso, telefono) => {
      await esperarInvalido(datosValidos({ telefono }), 'telefono');
    });
  });

  describe('descripcion: opcional, hasta 500 caracteres; vacia se guarda null', () => {
    it('acepta 500 caracteres', async () => {
      const descripcion = 'd'.repeat(500);
      const respuesta = await registrarBarberia(datosValidos({ descripcion }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.descripcion).toBe(descripcion);
    });

    it('vacia se guarda null', async () => {
      const respuesta = await registrarBarberia(datosValidos({ descripcion: '' }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.datos.descripcion).toBeNull();
      const barberia = await baseDatos.barberia.findUniqueOrThrow({
        where: { id: respuesta.body.datos.id },
      });
      expect(barberia.descripcion).toBeNull();
    });

    it.each([
      ['501 caracteres', 'd'.repeat(501)],
      ['caracter nulo', 'Cortes\u0000'],
      ['caracter de formato (U+202E)', 'Cortes\u202e clasicos'],
      ['caracter de ancho cero (U+200B)', 'Cortes\u200b clasicos'],
      ['caracter de control (escape)', 'Cortes\u001b[31m'],
      ['no es texto', 123],
    ])('rechaza %s', async (_caso, descripcion) => {
      await esperarInvalido(datosValidos({ descripcion }), 'descripcion');
    });
  });
});

describe('SEG-02: sesion en POST /barberias', () => {
  it('sin token responde 401 AUTENTICACION_REQUERIDA y no crea nada', async () => {
    const antes = await contar();
    const respuesta = await request(app).post(RUTA).send(datosValidos());

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect(await contar()).toEqual(antes);
  });

  it('con un token invalido responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(app)
      .post(RUTA)
      .set({ Authorization: 'Bearer no-es-un-jwt' })
      .send(datosValidos());

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('con el token de acceso vencido responde 401 TOKEN_VENCIDO y no crea nada', async () => {
    const antes = await contar();
    const respuesta = await request(app)
      .post(RUTA)
      .set(cabeceraDePrueba(tokenDePrueba(ANA, -1)))
      .send(datosValidos());

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('TOKEN_VENCIDO');
    expect(await contar()).toEqual(antes);
  });

  it('D-05: un usuario inactivo con un token vigente responde 401 y no crea nada', async () => {
    await baseDatos.usuario.update({ where: { id: ANA }, data: { activo: false } });
    const antes = await contar();

    const respuesta = await registrarBarberia(datosValidos());

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect(await contar()).toEqual(antes);
  });

  it('D-18: con el token de un usuario que no existe responde 401 y no crea nada', async () => {
    const antes = await contar();

    const respuesta = await registrarBarberia(datosValidos(), idPrueba(999));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect(await contar()).toEqual(antes);
  });
});

describe('Aislamiento: otra barberia', () => {
  it('la barberia nueva no da membresia en otra barberia ni al propietario de otra', async () => {
    const { body } = await registrarBarberia(
      datosValidos({ nombre: 'Alfa Barberia' }),
      IDS_PRUEBA.propietario,
    );

    const propio = await consultarYo(IDS_PRUEBA.propietario);
    expect(
      propio.body.datos.membresias.map((membresia: { rol: string; barberia: { id: string } }) => [
        membresia.barberia.id,
        membresia.rol,
      ]),
    ).toEqual([
      [body.datos.id, 'PROPIETARIO'],
      [IDS_PRUEBA.barberia, 'PROPIETARIO'],
    ]);
    const ajeno = await consultarYo(IDS_PRUEBA.propietarioOtra);
    expect(
      ajeno.body.datos.membresias.map(
        (membresia: { barberia: { id: string } }) => membresia.barberia.id,
      ),
    ).toEqual([IDS_PRUEBA.otraBarberia]);
    expect(await baseDatos.membresia.count({ where: { barberiaId: body.datos.id } })).toBe(1);
  });

  it('no modifica las barberias existentes ni sus membresias', async () => {
    const barberiasAntes = await baseDatos.barberia.findMany({ orderBy: { id: 'asc' } });
    const membresiasAntes = await baseDatos.membresia.findMany({ orderBy: { id: 'asc' } });

    const respuesta = await registrarBarberia(datosValidos(), IDS_PRUEBA.propietarioOtra);

    expect(respuesta.status).toBe(201);
    expect(
      await baseDatos.barberia.findMany({
        where: { id: { not: respuesta.body.datos.id } },
        orderBy: { id: 'asc' },
      }),
    ).toEqual(barberiasAntes);
    expect(
      await baseDatos.membresia.findMany({
        where: { barberiaId: { not: respuesta.body.datos.id } },
        orderBy: { id: 'asc' },
      }),
    ).toEqual(membresiasAntes);
  });
});

describe('§10.7: documentacion de POST /barberias', () => {
  it('GET /api/v1/documentacion incluye POST /barberias con token de acceso', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    const registrar = body.paths['/barberias']?.post;
    expect(registrar).toBeDefined();
    expect(Object.keys(registrar.responses)).toEqual(expect.arrayContaining(['201', '401', '422']));
    expect(registrar.security).toEqual([{ bearer: [] }]);
  });
});
