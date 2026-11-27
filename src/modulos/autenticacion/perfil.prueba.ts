// Perfil del usuario: editar nombre y telefono (T1.13, AUT-05, §11.4, D-14) y cambiar la
// contrasena exigiendo la actual (T1.13, AUT-06, D-05, con el limite de fallos de D-16).
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../app';
import { baseDatos } from '../../compartido/base-datos';
import { reiniciarLimites } from '../../compartido/limites';
import {
  CLAVE_PRUEBA,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../../pruebas/fabricas';
import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';

const RUTA_YO = '/api/v1/usuarios/yo';
const RUTA_CLAVE = '/api/v1/usuarios/yo/clave';
const RUTA_INICIO = '/api/v1/autenticacion/iniciar-sesion';
const RUTA_RENOVAR = '/api/v1/autenticacion/renovar';

const CLAVE_NUEVA = 'Navaja2027';
const CORREO_CLIENTE = 'cliente@barberly.test';

// El token se firma en cada llamada para que siga vigente cuando la prueba mueve la hora.
function editarPerfil(cuerpo: unknown, usuarioId: string | null = IDS_PRUEBA.cliente) {
  const peticion = request(app).patch(RUTA_YO);
  if (usuarioId) peticion.set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
  return peticion.send(cuerpo as object);
}

function cambiarClave(cuerpo: unknown, usuarioId: string | null = IDS_PRUEBA.cliente) {
  const peticion = request(app).patch(RUTA_CLAVE);
  if (usuarioId) peticion.set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
  return peticion.send(cuerpo as object);
}

function cambioValido(cambios: Record<string, unknown> = {}) {
  return { claveActual: CLAVE_PRUEBA, claveNueva: CLAVE_NUEVA, ...cambios };
}

function iniciarSesion(correo: string, clave: string) {
  return request(app).post(RUTA_INICIO).send({ correo, clave });
}

function usuario(id: string) {
  return baseDatos.usuario.findUniqueOrThrow({ where: { id } });
}

async function esperarInvalido(
  respuesta: request.Response,
  campo?: string,
): Promise<request.Response> {
  expect(respuesta.status).toBe(422);
  expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
  expect(respuesta.body.error.detalles).toEqual(expect.any(Array));
  if (campo) {
    expect(respuesta.body.error.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo })]),
    );
  }
  return respuesta;
}

// El perfil del cliente del escenario base no cambia.
async function esperarPerfilIntacto() {
  const cliente = await usuario(IDS_PRUEBA.cliente);
  expect(cliente.nombre).toBe('Cliente');
  expect(cliente.telefono).toBe('0991234567');
  expect(cliente.correo).toBe(CORREO_CLIENTE);
}

async function esperarClaveIntacta(usuarioId: string = IDS_PRUEBA.cliente) {
  const { claveHash } = await usuario(usuarioId);
  expect(await bcrypt.compare(CLAVE_PRUEBA, claveHash)).toBe(true);
}

beforeEach(async () => {
  await limpiarBase();
  reiniciarLimites();
  await escenarioBase();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('AUT-05: PATCH /api/v1/usuarios/yo', () => {
  it('AUT-05: con { telefono: "099 123 4567" } responde 200 con el telefono normalizado y el nombre intacto', async () => {
    const respuesta = await editarPerfil({ telefono: '099 123 4567' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      datos: {
        id: IDS_PRUEBA.cliente,
        nombre: 'Cliente',
        correo: CORREO_CLIENTE,
        telefono: '+593991234567',
      },
    });
    const cliente = await usuario(IDS_PRUEBA.cliente);
    expect(cliente.telefono).toBe('+593991234567');
    expect(cliente.nombre).toBe('Cliente');
  });

  it('AUT-05: con solo el nombre lo cambia y deja el telefono intacto', async () => {
    const respuesta = await editarPerfil({ nombre: 'Cliente Nuevo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toEqual({
      id: IDS_PRUEBA.cliente,
      nombre: 'Cliente Nuevo',
      correo: CORREO_CLIENTE,
      telefono: '0991234567',
    });
    const cliente = await usuario(IDS_PRUEBA.cliente);
    expect(cliente.nombre).toBe('Cliente Nuevo');
    expect(cliente.telefono).toBe('0991234567');
  });

  it('AUT-05: con nombre y telefono cambia ambos', async () => {
    const respuesta = await editarPerfil({ nombre: 'Ana Pérez', telefono: '+593987654321' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toMatchObject({ nombre: 'Ana Pérez', telefono: '+593987654321' });
    const cliente = await usuario(IDS_PRUEBA.cliente);
    expect(cliente.nombre).toBe('Ana Pérez');
    expect(cliente.telefono).toBe('+593987654321');
  });

  it('AUT-05: GET /usuarios/yo devuelve el perfil editado', async () => {
    await editarPerfil({ nombre: 'Cliente Nuevo', telefono: '0987654321' });

    const { body } = await request(app)
      .get(RUTA_YO)
      .set(cabeceraDePrueba(tokenDePrueba(IDS_PRUEBA.cliente)));

    expect(body.datos).toMatchObject({ nombre: 'Cliente Nuevo', telefono: '+593987654321' });
  });

  it('RNF-17: no expone la clave ni el estado de la cuenta', async () => {
    const { body } = await editarPerfil({ nombre: 'Cliente Nuevo' });

    expect(Object.keys(body.datos).sort()).toEqual(['correo', 'id', 'nombre', 'telefono']);
    expect(JSON.stringify(body)).not.toMatch(/claveHash|activo/);
  });

  it('AUT-05: con { correo: "otro@x.com" } responde 422 DATOS_INVALIDOS y el correo no cambia', async () => {
    await esperarInvalido(await editarPerfil({ correo: 'otro@x.com' }));

    await esperarPerfilIntacto();
  });

  it('AUT-05: el correo junto con un campo valido tambien se rechaza y no se aplica nada', async () => {
    await esperarInvalido(await editarPerfil({ nombre: 'Cliente Nuevo', correo: 'otro@x.com' }));

    await esperarPerfilIntacto();
  });

  it('AUT-05: con {} responde 422 DATOS_INVALIDOS', async () => {
    await esperarInvalido(await editarPerfil({}));

    await esperarPerfilIntacto();
  });

  it('§10.1: sin cuerpo responde 422 DATOS_INVALIDOS', async () => {
    await esperarInvalido(await editarPerfil(undefined));

    await esperarPerfilIntacto();
  });

  it.each([
    ['clave', { nombre: 'Cliente Nuevo', clave: 'OtraClave99' }],
    ['activo', { nombre: 'Cliente Nuevo', activo: false }],
    ['id', { nombre: 'Cliente Nuevo', id: IDS_PRUEBA.propietario }],
    ['consentimientoIaEn', { consentimientoIaEn: '2026-11-26T10:00:00Z' }],
  ])('§11.5: el campo no esperado %s responde 422 DATOS_INVALIDOS', async (_campo, cuerpo) => {
    await esperarInvalido(await editarPerfil(cuerpo));

    await esperarPerfilIntacto();
    const cliente = await usuario(IDS_PRUEBA.cliente);
    expect(cliente.activo).toBe(true);
    expect(cliente.consentimientoIaEn).toBeNull();
  });

  it('SEG-02: sin token responde 401 AUTENTICACION_REQUERIDA y no cambia nada', async () => {
    const respuesta = await editarPerfil({ nombre: 'Cliente Nuevo' }, null);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    await esperarPerfilIntacto();
  });

  it('D-05: un usuario inactivo con un token vigente responde 401 AUTENTICACION_REQUERIDA', async () => {
    await baseDatos.usuario.update({ where: { id: IDS_PRUEBA.cliente }, data: { activo: false } });

    const respuesta = await editarPerfil({ nombre: 'Cliente Nuevo' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    expect((await usuario(IDS_PRUEBA.cliente)).nombre).toBe('Cliente');
  });

  it('D-18: con el token de un usuario que no existe responde 401', async () => {
    const respuesta = await editarPerfil({ nombre: 'Cliente Nuevo' }, idPrueba(999));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('SEG-03: solo edita al usuario del token; los de esta y de otra barberia quedan intactos', async () => {
    const antes = await baseDatos.usuario.findMany({
      where: { id: { not: IDS_PRUEBA.propietario } },
      orderBy: { id: 'asc' },
    });

    const respuesta = await editarPerfil(
      { nombre: 'Propietario Nuevo', telefono: '0987654321' },
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.id).toBe(IDS_PRUEBA.propietario);
    const despues = await baseDatos.usuario.findMany({
      where: { id: { not: IDS_PRUEBA.propietario } },
      orderBy: { id: 'asc' },
    });
    expect(despues).toEqual(antes);
    const propietariaOtra = await usuario(IDS_PRUEBA.propietarioOtra);
    expect(propietariaOtra.nombre).toBe('Propietaria otra');
  });
});

describe('§11.4, D-14: validaciones de PATCH /usuarios/yo', () => {
  describe('nombre: 2 a 80 caracteres, sin caracteres de control', () => {
    it.each([
      ['2 caracteres', 'Al'],
      ['80 caracteres', 'A'.repeat(80)],
    ])('acepta %s', async (_caso, nombre) => {
      const respuesta = await editarPerfil({ nombre });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.datos.nombre).toBe(nombre);
      expect((await usuario(IDS_PRUEBA.cliente)).nombre).toBe(nombre);
    });

    it('quita los espacios de los extremos', async () => {
      const respuesta = await editarPerfil({ nombre: '  Ana Pérez  ' });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.datos.nombre).toBe('Ana Pérez');
      expect((await usuario(IDS_PRUEBA.cliente)).nombre).toBe('Ana Pérez');
    });

    it.each([
      ['vacio', ''],
      ['1 caracter', 'A'],
      ['1 caracter con espacios', '  A  '],
      ['81 caracteres', 'A'.repeat(81)],
      ['salto de linea', 'Ana\nPérez'],
      ['caracter nulo', 'Ana\u0000'],
      ['caracter de formato (U+202E)', 'Ana‮Pérez'],
      ['caracter de ancho cero', 'Ana​Pérez'],
      ['no es texto', 123],
      ['null', null],
    ])('rechaza %s', async (_caso, nombre) => {
      await esperarInvalido(await editarPerfil({ nombre }), 'nombre');

      await esperarPerfilIntacto();
    });

    it('un nombre invalido no deja pasar el telefono valido que lo acompana', async () => {
      await esperarInvalido(await editarPerfil({ nombre: 'A', telefono: '0987654321' }), 'nombre');

      await esperarPerfilIntacto();
    });
  });

  describe('telefono: 7 a 15 digitos, formato ecuatoriano normalizado', () => {
    it.each([
      ['09XXXXXXXX', '0987654321', '+593987654321'],
      ['+5939XXXXXXXX', '+593987654321', '+593987654321'],
      ['con espacios', '099 123 4567', '+593991234567'],
      ['con guiones, puntos y parentesis', '(099) 123-45.67', '+593991234567'],
      ['7 digitos', '2345678', '2345678'],
      ['15 digitos', '123456789012345', '123456789012345'],
      ['internacional con +', '+14155550123', '+14155550123'],
    ])('acepta %s', async (_caso, telefono, guardado) => {
      const respuesta = await editarPerfil({ telefono });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.datos.telefono).toBe(guardado);
      expect((await usuario(IDS_PRUEBA.cliente)).telefono).toBe(guardado);
    });

    it.each([
      ['vacio', ''],
      ['6 digitos', '234567'],
      ['16 digitos', '1234567890123456'],
      ['con letras', '09912345ab'],
      ['+ en medio', '099+1234567'],
      ['no es texto', 991234567],
      ['null', null],
    ])('rechaza %s', async (_caso, telefono) => {
      await esperarInvalido(await editarPerfil({ telefono }), 'telefono');

      await esperarPerfilIntacto();
    });
  });
});

describe('AUT-06, D-05: PATCH /api/v1/usuarios/yo/clave', () => {
  it('AUT-06: con la actual correcta y una nueva valida responde 204 sin cuerpo', async () => {
    const respuesta = await cambiarClave(cambioValido());

    expect(respuesta.status).toBe(204);
    expect(respuesta.text).toBe('');
  });

  it('AUT-06: despues se inicia sesion con la nueva y no con la anterior', async () => {
    await cambiarClave(cambioValido());

    const conNueva = await iniciarSesion(CORREO_CLIENTE, CLAVE_NUEVA);
    const conAnterior = await iniciarSesion(CORREO_CLIENTE, CLAVE_PRUEBA);

    expect(conNueva.status).toBe(200);
    expect(conNueva.body.datos.usuario.id).toBe(IDS_PRUEBA.cliente);
    expect(conAnterior.status).toBe(401);
    expect(conAnterior.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  it('SEG-06: guarda la nueva con bcrypt de costo 12', async () => {
    await cambiarClave(cambioValido());

    const { claveHash } = await usuario(IDS_PRUEBA.cliente);
    expect(claveHash).not.toContain(CLAVE_NUEVA);
    expect(bcrypt.getRounds(claveHash)).toBe(12);
    expect(await bcrypt.compare(CLAVE_NUEVA, claveHash)).toBe(true);
  });

  it('AUT-06: no revoca las demas sesiones del usuario y todas siguen sirviendo', async () => {
    const telefono = (await iniciarSesion(CORREO_CLIENTE, CLAVE_PRUEBA)).body.datos;
    const tableta = (await iniciarSesion(CORREO_CLIENTE, CLAVE_PRUEBA)).body.datos;

    const respuesta = await request(app)
      .patch(RUTA_CLAVE)
      .set(cabeceraDePrueba(telefono.tokenAcceso))
      .send(cambioValido());

    expect(respuesta.status).toBe(204);
    expect(
      await baseDatos.tokenRenovacion.count({
        where: { usuarioId: IDS_PRUEBA.cliente, revocadoEn: null },
      }),
    ).toBe(2);
    const yoConTableta = await request(app).get(RUTA_YO).set(cabeceraDePrueba(tableta.tokenAcceso));
    expect(yoConTableta.status).toBe(200);
    const renovada = await request(app)
      .post(RUTA_RENOVAR)
      .send({ tokenRenovacion: tableta.tokenRenovacion });
    expect(renovada.status).toBe(200);
  });

  it('D-05: con la actual incorrecta responde 401 CREDENCIALES_INVALIDAS y la clave no cambia', async () => {
    const respuesta = await cambiarClave(cambioValido({ claveActual: 'OtraClave99' }));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(respuesta.body.error.mensaje).toEqual(expect.any(String));
    await esperarClaveIntacta();
    expect((await iniciarSesion(CORREO_CLIENTE, CLAVE_NUEVA)).status).toBe(401);
  });

  it('D-05: tras la actual incorrecta la sesion sigue vigente (la app no la cierra)', async () => {
    const sesion = (await iniciarSesion(CORREO_CLIENTE, CLAVE_PRUEBA)).body.datos;

    const respuesta = await request(app)
      .patch(RUTA_CLAVE)
      .set(cabeceraDePrueba(sesion.tokenAcceso))
      .send(cambioValido({ claveActual: 'OtraClave99' }));

    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    const yo = await request(app).get(RUTA_YO).set(cabeceraDePrueba(sesion.tokenAcceso));
    expect(yo.status).toBe(200);
    expect(
      await baseDatos.tokenRenovacion.count({
        where: { usuarioId: IDS_PRUEBA.cliente, revocadoEn: null },
      }),
    ).toBe(1);
  });

  it('SEG-02: sin token responde 401 AUTENTICACION_REQUERIDA y la clave no cambia', async () => {
    const respuesta = await cambiarClave(cambioValido(), null);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    await esperarClaveIntacta();
  });

  it('D-05: un usuario inactivo responde 401 AUTENTICACION_REQUERIDA, no CREDENCIALES_INVALIDAS', async () => {
    await baseDatos.usuario.update({ where: { id: IDS_PRUEBA.cliente }, data: { activo: false } });

    const respuesta = await cambiarClave(cambioValido());

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
    await esperarClaveIntacta();
  });

  it('SEG-03: solo cambia la clave del usuario del token; los de esta y de otra barberia la conservan', async () => {
    const respuesta = await cambiarClave(cambioValido(), IDS_PRUEBA.propietario);

    expect(respuesta.status).toBe(204);
    expect((await iniciarSesion('propietario@barberly.test', CLAVE_NUEVA)).status).toBe(200);
    for (const id of [
      IDS_PRUEBA.cliente,
      IDS_PRUEBA.barbero,
      IDS_PRUEBA.propietarioOtra,
      IDS_PRUEBA.barberoOtra,
    ]) {
      await esperarClaveIntacta(id);
    }
  });

  it('§11.5: un campo no esperado responde 422 DATOS_INVALIDOS y la clave no cambia', async () => {
    await esperarInvalido(await cambiarClave(cambioValido({ usuarioId: IDS_PRUEBA.propietario })));

    await esperarClaveIntacta();
  });

  it.each([
    ['sin cuerpo', undefined],
    ['un cuerpo vacio', {}],
  ])('§10.1: con %s responde 422 DATOS_INVALIDOS', async (_caso, cuerpo) => {
    await esperarInvalido(await cambiarClave(cuerpo));

    await esperarClaveIntacta();
  });
});

describe('AUT-06, §11.4: validaciones de PATCH /usuarios/yo/clave', () => {
  describe('claveNueva: las reglas de Contrasena del registro', () => {
    it.each([
      ['8 caracteres con letra y numero', 'Barber12'],
      ['72 caracteres', `${'a'.repeat(71)}1`],
    ])('acepta %s', async (_caso, claveNueva) => {
      const respuesta = await cambiarClave(cambioValido({ claveNueva }));

      expect(respuesta.status).toBe(204);
      expect((await iniciarSesion(CORREO_CLIENTE, claveNueva)).status).toBe(200);
    });

    it.each([
      ['falta', undefined],
      ['7 caracteres', 'Barber1'],
      ['73 caracteres', `${'a'.repeat(72)}1`],
      ['sin numero', 'Barberlyy'],
      ['sin letra', '12345678'],
      ['72 caracteres que pasan de 72 bytes (D-14)', `${'ñ'.repeat(71)}1`],
      ['no es texto', 12345678],
    ])('rechaza %s con DATOS_INVALIDOS y la clave no cambia', async (_caso, claveNueva) => {
      await esperarInvalido(await cambiarClave(cambioValido({ claveNueva })), 'claveNueva');

      await esperarClaveIntacta();
    });
  });

  describe('claveActual: no vacia y de maximo 72 caracteres', () => {
    it.each([
      ['falta', undefined],
      ['vacia', ''],
      ['73 caracteres', `${'a'.repeat(72)}1`],
      ['no es texto', 12345678],
    ])(
      'rechaza %s con DATOS_INVALIDOS, no con CREDENCIALES_INVALIDAS',
      async (_caso, claveActual) => {
        await esperarInvalido(await cambiarClave(cambioValido({ claveActual })), 'claveActual');

        await esperarClaveIntacta();
      },
    );

    it('D-16: una actual que no cumple las reglas del registro se compara y responde 401, no 422', async () => {
      const respuesta = await cambiarClave(cambioValido({ claveActual: 'corta' }));

      expect(respuesta.status).toBe(401);
      expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    });
  });
});

describe('AUT-06, D-16: limite de fallos de la clave actual por usuario', () => {
  async function fallar(veces: number, usuarioId: string = IDS_PRUEBA.cliente) {
    for (let intento = 1; intento <= veces; intento += 1) {
      const respuesta = await cambiarClave(cambioValido({ claveActual: 'OtraClave99' }), usuarioId);
      expect(respuesta.status).toBe(401);
      expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    }
  }

  it('AUT-06: dados 5 fallos en 15 minutos, el siguiente intento responde 429 DEMASIADAS_SOLICITUDES aunque la actual sea correcta', async () => {
    await fallar(5);

    const respuesta = await cambiarClave(cambioValido());

    expect(respuesta.status).toBe(429);
    expect(respuesta.body.error.codigo).toBe('DEMASIADAS_SOLICITUDES');
    await esperarClaveIntacta();
  });

  it('4 fallos todavia permiten cambiarla con la actual correcta', async () => {
    await fallar(4);

    const respuesta = await cambiarClave(cambioValido());

    expect(respuesta.status).toBe(204);
  });

  it('D-16: los 422 no cuentan como fallos', async () => {
    for (let intento = 1; intento <= 6; intento += 1) {
      const respuesta = await cambiarClave(cambioValido({ claveActual: '' }));
      expect(respuesta.status).toBe(422);
    }

    const respuesta = await cambiarClave(cambioValido());

    expect(respuesta.status).toBe(204);
  });

  it('D-16: un cambio correcto no reinicia el contador', async () => {
    await fallar(4);
    expect((await cambiarClave(cambioValido())).status).toBe(204);
    const respuesta = await cambiarClave({ claveActual: 'OtraClave99', claveNueva: 'Tijera2028' });
    expect(respuesta.status).toBe(401);

    const bloqueada = await cambiarClave({ claveActual: CLAVE_NUEVA, claveNueva: 'Tijera2028' });

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.error.codigo).toBe('DEMASIADAS_SOLICITUDES');
  });

  it('el contador es por usuario: el bloqueo de uno no afecta a otro', async () => {
    await fallar(5, IDS_PRUEBA.cliente);

    const otro = await cambiarClave(cambioValido(), IDS_PRUEBA.propietarioOtra);

    expect(otro.status).toBe(204);
  });

  it('el contador es por usuario, no por token: con otra sesion del mismo usuario sigue bloqueado', async () => {
    await fallar(5);
    const sesion = (await iniciarSesion(CORREO_CLIENTE, CLAVE_PRUEBA)).body.datos;

    const respuesta = await request(app)
      .patch(RUTA_CLAVE)
      .set(cabeceraDePrueba(sesion.tokenAcceso))
      .send(cambioValido());

    expect(respuesta.status).toBe(429);
  });

  it('D-16: pasados 15 minutos desde el primer fallo se puede volver a cambiar', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-26T15:00:00Z'));
    await fallar(5);

    vi.setSystemTime(new Date('2026-11-26T15:14:59Z'));
    const antes = await cambiarClave(cambioValido());
    vi.setSystemTime(new Date('2026-11-26T15:15:01Z'));
    const despues = await cambiarClave(cambioValido());

    expect(antes.status).toBe(429);
    expect(despues.status).toBe(204);
  });

  it('D-16: la ventana empieza en el primer fallo, no en un 422 anterior', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-26T15:00:00Z'));
    expect((await cambiarClave(cambioValido({ claveActual: '' }))).status).toBe(422);

    vi.setSystemTime(new Date('2026-11-26T15:10:00Z'));
    await fallar(5);
    vi.setSystemTime(new Date('2026-11-26T15:15:01Z'));
    const respuesta = await cambiarClave(cambioValido());

    expect(respuesta.status).toBe(429);
  });
});

describe('§10.7: documentacion del perfil', () => {
  it('GET /api/v1/documentacion incluye PATCH /usuarios/yo y PATCH /usuarios/yo/clave con token de acceso', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    const editar = body.paths['/usuarios/yo']?.patch;
    const clave = body.paths['/usuarios/yo/clave']?.patch;
    expect(Object.keys(editar?.responses ?? {})).toEqual(
      expect.arrayContaining(['200', '401', '422']),
    );
    expect(editar.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(clave?.responses ?? {})).toEqual(
      expect.arrayContaining(['204', '401', '422', '429']),
    );
    expect(clave.security).toEqual([{ bearer: [] }]);
  });
});
