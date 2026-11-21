import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { cabeceraDePrueba, tokenDePrueba } from '../../pruebas/sesiones';
import { IDS_PRUEBA } from '../../pruebas/fabricas';
import { autenticar, contextoBarberia, exigirRol, manejarErrores, validar } from './index';

function appDePrueba() {
  const app = express();
  app.use(express.json());
  app.get('/privada', autenticar, (req, res) => {
    res.status(200).json({ datos: req.usuario });
  });
  app.get('/barberia', autenticar, contextoBarberia, (_req, res) => {
    res.status(200).json({ datos: 'no debe llegar' });
  });
  app.get('/propietario', autenticar, exigirRol('PROPIETARIO'), (_req, res) => {
    res.status(200).json({ datos: 'no debe llegar' });
  });
  app.post('/datos', validar(z.object({ nombre: z.string() }).strict()), (req, res) => {
    res.status(200).json({ datos: req.validado });
  });
  app.use(manejarErrores);
  return app;
}

describe('Fase 0: middlewares', () => {
  it('autenticar: sin token responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(appDePrueba()).get('/privada');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('autenticar: token alterado responde 401 AUTENTICACION_REQUERIDA', async () => {
    const respuesta = await request(appDePrueba())
      .get('/privada')
      .set(cabeceraDePrueba(`${tokenDePrueba()}x`));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('AUTENTICACION_REQUERIDA');
  });

  it('autenticar: token vencido responde 401 TOKEN_VENCIDO', async () => {
    const respuesta = await request(appDePrueba())
      .get('/privada')
      .set(cabeceraDePrueba(tokenDePrueba(IDS_PRUEBA.usuario, -1)));

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('TOKEN_VENCIDO');
  });

  it('autenticar: token valido entrega el usuario', async () => {
    const respuesta = await request(appDePrueba()).get('/privada').set(cabeceraDePrueba());

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.id).toBe(IDS_PRUEBA.usuario);
  });

  it('contextoBarberia: falla cerrado con 404 hasta tener Membresia', async () => {
    const respuesta = await request(appDePrueba()).get('/barberia').set(cabeceraDePrueba());

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('exigirRol: sin contexto responde 403 ACCESO_DENEGADO', async () => {
    const respuesta = await request(appDePrueba()).get('/propietario').set(cabeceraDePrueba());

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('validar: un campo extra responde 422 DATOS_INVALIDOS', async () => {
    const respuesta = await request(appDePrueba())
      .post('/datos')
      .send({ nombre: 'Ana', extra: true });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});
