// Middlewares compartidos (Fase 0; T1.8: autenticar con D-05 y contextoBarberia real, SEG-02 a SEG-04, D-18).
import express from 'express';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { baseDatos } from '../base-datos';
import {
  crearBarberiaDePrueba,
  escenarioBase,
  IDS_PRUEBA,
  idPrueba,
  limpiarBase,
} from '../../pruebas/fabricas';
import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';
import { autenticar, contextoBarberia, exigirRol, manejarErrores, validar } from './index';

function appDePrueba() {
  const app = express();
  app.use(express.json());
  app.get('/privada', autenticar, (req, res) => {
    res.status(200).json({ datos: req.usuario });
  });
  app.get('/barberias/:id/interna', autenticar, contextoBarberia, (req, res) => {
    res.status(200).json({ datos: req.contextoBarberia });
  });
  app.get(
    '/barberias/:id/administracion',
    autenticar,
    contextoBarberia,
    exigirRol('PROPIETARIO'),
    (_req, res) => {
      res.status(200).json({ datos: 'ok' });
    },
  );
  app.get('/propietario', autenticar, exigirRol('PROPIETARIO'), (_req, res) => {
    res.status(200).json({ datos: 'no debe llegar' });
  });
  app.post('/datos', validar(z.object({ nombre: z.string() }).strict()), (req, res) => {
    res.status(200).json({ datos: req.validado });
  });
  // Router montado en /barberias/:id: con mergeParams ve el :id; sin mergeParams no (D-18).
  const conParametros = express.Router({ mergeParams: true });
  conParametros.get('/sub', autenticar, contextoBarberia, (req, res) => {
    res.status(200).json({ datos: req.contextoBarberia });
  });
  const sinParametros = express.Router();
  sinParametros.get('/sub', autenticar, contextoBarberia, (_req, res) => {
    res.status(200).json({ datos: 'no debe llegar' });
  });
  app.use('/barberias/:id/con', conParametros);
  app.use('/barberias/:id/sin', sinParametros);
  app.use(manejarErrores);
  return app;
}

function pedir(ruta: string, usuarioId?: string) {
  const peticion = request(appDePrueba()).get(ruta);
  if (usuarioId) peticion.set(cabeceraDePrueba(tokenDePrueba(usuarioId)));
  return peticion;
}

function cambiarMembresia(usuarioId: string, barberiaId: string, estado: 'INVITADO' | 'INACTIVO') {
  return baseDatos.membresia.update({
    where: { usuarioId_barberiaId: { usuarioId, barberiaId } },
    data: { estado },
  });
}

beforeEach(async () => {
  await limpiarBase();
  await escenarioBase();
});

afterAll(async () => {
  await limpiarBase();
  await baseDatos.$disconnect();
});

describe('autenticar (SEG-02, D-05, D-18)', () => {
  it('sin token responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await pedir('/privada');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('token alterado responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(appDePrueba())
      .get('/privada')
      .set(cabeceraDePrueba(`${tokenDePrueba(IDS_PRUEBA.cliente)}x`));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('token vencido responde 401 TOKEN_VENCIDO', async () => {
    const respuesta = await request(appDePrueba())
      .get('/privada')
      .set(cabeceraDePrueba(tokenDePrueba(IDS_PRUEBA.cliente, -1)));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('TOKEN_VENCIDO');
  });

  it('token valido de un usuario activo entrega el usuario', async () => {
    const respuesta = await pedir('/privada', IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toEqual({ id: IDS_PRUEBA.cliente });
  });

  it('D-05: token valido de un usuario inactivo responde 401 AUTENTICACION_REQUERIDA', async () => {
    await baseDatos.usuario.update({ where: { id: IDS_PRUEBA.cliente }, data: { activo: false } });

    const respuesta = await pedir('/privada', IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('D-18: token valido de un usuario que no existe responde lo mismo que uno inactivo', async () => {
    await baseDatos.usuario.update({ where: { id: IDS_PRUEBA.cliente }, data: { activo: false } });

    const inactivo = await pedir('/privada', IDS_PRUEBA.cliente);
    const inexistente = await pedir('/privada', idPrueba(999));

    expect(inexistente.status).toBe(401);
    expect(inexistente.body).toEqual(inactivo.body);
  });
});

describe('contextoBarberia (SEG-04, D-18)', () => {
  it('propietario con membresia ACTIVO pasa con su barberia y su rol', async () => {
    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/interna`,
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toEqual({ barberiaId: IDS_PRUEBA.barberia, rol: 'PROPIETARIO' });
  });

  it('barbero con membresia ACTIVO pasa con el rol BARBERO', async () => {
    const respuesta = await pedir(`/barberias/${IDS_PRUEBA.barberia}/interna`, IDS_PRUEBA.barbero);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos).toEqual({ barberiaId: IDS_PRUEBA.barberia, rol: 'BARBERO' });
  });

  it('SEG-04: el propietario de otra barberia recibe 404 NO_ENCONTRADO', async () => {
    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/interna`,
      IDS_PRUEBA.propietarioOtra,
    );

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('un cliente sin membresia recibe 404', async () => {
    const respuesta = await pedir(`/barberias/${IDS_PRUEBA.barberia}/interna`, IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(404);
  });

  it.each(['INVITADO', 'INACTIVO'] as const)('una membresia %s recibe 404', async (estado) => {
    await cambiarMembresia(IDS_PRUEBA.barbero, IDS_PRUEBA.barberia, estado);

    const respuesta = await pedir(`/barberias/${IDS_PRUEBA.barberia}/interna`, IDS_PRUEBA.barbero);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('una barberia inactiva responde 404 aunque la membresia siga ACTIVO', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.barberia },
      data: { activo: false },
    });

    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/interna`,
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(404);
  });

  it('una barberia sin publicar sigue abierta para su personal', async () => {
    await baseDatos.barberia.update({
      where: { id: IDS_PRUEBA.barberia },
      data: { publicada: false },
    });

    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/interna`,
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(200);
  });

  it.each([
    ['una barberia que no existe', idPrueba(999)],
    ['un id que no es UUID', 'centro'],
    ['un id con inyeccion', "1' OR '1'='1"],
    ['un espacio delante', ` ${IDS_PRUEBA.barberia}`],
    ['un espacio detras', `${IDS_PRUEBA.barberia} `],
    ['un salto de linea al final', `${IDS_PRUEBA.barberia}\n`],
  ])('con %s responde 404', async (_caso, barberiaId) => {
    const respuesta = await pedir(
      `/barberias/${encodeURIComponent(barberiaId)}/interna`,
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('un parametro mal codificado responde 404, no 500', async () => {
    const respuesta = await pedir('/barberias/%E0%A4%A/interna', IDS_PRUEBA.propietario);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('con el UUID en mayusculas entrega el id de la base, en minusculas', async () => {
    // Los ids de IDS_PRUEBA solo tienen digitos: hace falta uno con letras.
    const barberiaId = 'abcdef00-0000-4000-8000-0000000000ab';
    await crearBarberiaDePrueba({ id: barberiaId, propietarioId: IDS_PRUEBA.propietario });

    const respuesta = await pedir(
      `/barberias/${barberiaId.toUpperCase()}/interna`,
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.barberiaId).toBe(barberiaId);
  });

  it('en un router con mergeParams funciona; sin mergeParams falla cerrado con 404', async () => {
    const con = await pedir(`/barberias/${IDS_PRUEBA.barberia}/con/sub`, IDS_PRUEBA.propietario);
    const sin = await pedir(`/barberias/${IDS_PRUEBA.barberia}/sin/sub`, IDS_PRUEBA.propietario);

    expect(con.status).toBe(200);
    expect(con.body.datos).toEqual({ barberiaId: IDS_PRUEBA.barberia, rol: 'PROPIETARIO' });
    expect(sin.status).toBe(404);
  });

  it('solo cuenta la membresia de esa barberia, no la de otra del mismo usuario', async () => {
    // El propietario de Centro abre su propia barberia, que luego se desactiva.
    const { barberia } = await crearBarberiaDePrueba({
      propietarioId: IDS_PRUEBA.propietario,
      nombre: 'Barberia Sur',
    });
    await baseDatos.barberia.update({ where: { id: barberia.id }, data: { activo: false } });

    const sur = await pedir(`/barberias/${barberia.id}/interna`, IDS_PRUEBA.propietario);
    const centro = await pedir(`/barberias/${IDS_PRUEBA.barberia}/interna`, IDS_PRUEBA.propietario);

    expect(sur.status).toBe(404);
    expect(centro.status).toBe(200);
  });
});

describe('exigirRol (SEG-03)', () => {
  it('sin contexto responde 403 ACCESO_DENEGADO', async () => {
    const respuesta = await pedir('/propietario', IDS_PRUEBA.cliente);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('el propietario pasa en su barberia', async () => {
    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/administracion`,
      IDS_PRUEBA.propietario,
    );

    expect(respuesta.status).toBe(200);
  });

  it('un barbero en una accion de propietario de su barberia recibe 403', async () => {
    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/administracion`,
      IDS_PRUEBA.barbero,
    );

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('SEG-04: un barbero de otra barberia recibe 404, no 403', async () => {
    const respuesta = await pedir(
      `/barberias/${IDS_PRUEBA.barberia}/administracion`,
      IDS_PRUEBA.barberoOtra,
    );

    expect(respuesta.status).toBe(404);
  });
});

describe('validar', () => {
  it('un campo extra responde 422 DATOS_INVALIDOS', async () => {
    const respuesta = await request(appDePrueba())
      .post('/datos')
      .send({ nombre: 'Ana', extra: true });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});
