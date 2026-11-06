import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from './app';

describe('Fase 0: salud', () => {
  it('GET /api/v1/salud responde 200', async () => {
    const respuesta = await request(app).get('/api/v1/salud');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ datos: { estado: 'ok' } });
  });

  it('una ruta inexistente responde 404 NO_ENCONTRADO', async () => {
    const respuesta = await request(app).get('/api/v1/no-existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  it('un JSON mal formado responde 422 DATOS_INVALIDOS', async () => {
    const respuesta = await request(app)
      .post('/api/v1/salud')
      .set('Content-Type', 'application/json')
      .send('{mal');

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
  });
});
