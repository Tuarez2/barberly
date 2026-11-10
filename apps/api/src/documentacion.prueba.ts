// Documentacion OpenAPI base (T1.4, DERCAS §10.7).
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from './app';
import { configuracion } from './compartido/configuracion';

const entornoOriginal = configuracion.NODE_ENV;

describe('T1.4: GET /api/v1/documentacion', () => {
  afterEach(() => {
    configuracion.NODE_ENV = entornoOriginal;
  });

  it('responde 200 con un documento OpenAPI 3.1', async () => {
    const respuesta = await request(app).get('/api/v1/documentacion');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.openapi).toBe('3.1.0');
    expect(respuesta.body.info.title).toBe('API de Barberly');
    expect(respuesta.body.servers).toEqual([{ url: '/api/v1' }]);
  });

  it('documenta las rutas base', async () => {
    const respuesta = await request(app).get('/api/v1/documentacion');

    expect(Object.keys(respuesta.body.paths)).toEqual(
      expect.arrayContaining(['/salud', '/documentacion']),
    );
  });

  it('incluye el esquema Bearer y la forma de error de §10.1', async () => {
    const { body } = await request(app).get('/api/v1/documentacion');

    expect(body.components.securitySchemes.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(body.components.schemas.RespuestaError.properties.error.required).toEqual(
      expect.arrayContaining(['codigo', 'mensaje']),
    );
  });

  it('en produccion responde 404 NO_ENCONTRADO', async () => {
    configuracion.NODE_ENV = 'production';

    const respuesta = await request(app).get('/api/v1/documentacion');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('NO_ENCONTRADO');
  });
});
