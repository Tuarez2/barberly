// Documentacion OpenAPI generada desde los esquemas Zod (DERCAS §10.7, skill arquitectura-api).
// Cada modulo exporta en su documentacion.ts una funcion (registro) => void y se agrega a MODULOS.
// Los nombres de los esquemas salen de .meta({ id }), sin extender Zod globalmente.
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

export type RegistrarDocumentacion = (registro: OpenAPIRegistry) => void;

export const SEGURIDAD_BEARER = [{ bearer: [] }];

// §10.1: forma unica de los errores; los codigos estan en docs/errores.md.
export const esquemaRespuestaError = z
  .object({
    error: z.object({
      codigo: z.string().meta({ example: 'DATOS_INVALIDOS' }),
      mensaje: z.string(),
      detalles: z.unknown().optional(),
    }),
  })
  .meta({ id: 'RespuestaError' });

export function respuestaError(descripcion: string) {
  return {
    description: descripcion,
    content: { 'application/json': { schema: esquemaRespuestaError } },
  };
}

const esquemaSalud = z
  .object({ datos: z.object({ estado: z.literal('ok') }) })
  .meta({ id: 'RespuestaSalud' });

function registrarBase(registro: OpenAPIRegistry): void {
  registro.registerComponent('securitySchemes', 'bearer', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Token de acceso de 15 minutos (D-03)',
  });

  registro.registerPath({
    method: 'get',
    path: '/salud',
    tags: ['sistema'],
    summary: 'Estado de la API',
    responses: {
      200: {
        description: 'La API responde',
        content: { 'application/json': { schema: esquemaSalud } },
      },
    },
  });
  registro.registerPath({
    method: 'get',
    path: '/documentacion',
    tags: ['sistema'],
    summary: 'Este documento OpenAPI (solo fuera de produccion)',
    responses: {
      200: {
        description: 'Documento OpenAPI 3.1',
        content: { 'application/json': { schema: z.object({}) } },
      },
      404: respuestaError('En produccion no se sirve'),
    },
  });
}

// Los modulos se agregan aqui a medida que existen, p. ej. registrarAutenticacion (T1.5).
const MODULOS: RegistrarDocumentacion[] = [];

export function generarDocumentacion() {
  const registro = new OpenAPIRegistry();
  registrarBase(registro);
  for (const registrar of MODULOS) {
    registrar(registro);
  }
  return new OpenApiGeneratorV31(registro.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'API de Barberly',
      version: '1.0.0',
      description:
        'Citas para barberias con asesor de estilo. Respuestas { datos, meta? } o { error } (§10.1).',
    },
    servers: [{ url: '/api/v1' }],
  });
}
