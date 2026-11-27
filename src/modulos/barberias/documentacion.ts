// Rutas de barberias para OpenAPI (§10.7).
import type { RegistrarDocumentacion } from '../../compartido/documentacion';
import { respuestaError, SEGURIDAD_BEARER } from '../../compartido/documentacion';
import { esquemaRegistroBarberia, esquemaRespuestaBarberiaRegistrada } from './esquemas';

export const registrarBarberias: RegistrarDocumentacion = (registro) => {
  registro.registerPath({
    method: 'post',
    path: '/barberias',
    tags: ['barberias'],
    summary: 'Registrar una barbería y quedar como propietario (AUT-10)',
    description:
      'Crea la barbería sin publicar (D-07) y la membresía PROPIETARIO ACTIVO del usuario en una transacción (D-13). Reglas y zona horaria quedan por defecto. Vuelve a pedir GET /usuarios/yo para ver la membresía nueva.',
    security: SEGURIDAD_BEARER,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: esquemaRegistroBarberia.meta({ id: 'EntradaRegistroBarberia' }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Barbería registrada',
        content: { 'application/json': { schema: esquemaRespuestaBarberiaRegistrada } },
      },
      401: respuestaError(
        'AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: sin token, token inválido o cuenta inactiva (D-05)',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
    },
  });
};
