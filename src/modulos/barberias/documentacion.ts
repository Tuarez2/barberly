// Rutas de barberias para OpenAPI (§10.7).
import type { RegistrarDocumentacion } from '../../compartido/documentacion';
import { respuestaError, SEGURIDAD_BEARER } from '../../compartido/documentacion';
import {
  esquemaConsultaBarberias,
  esquemaRegistroBarberia,
  esquemaRespuestaBarberiaRegistrada,
  esquemaRespuestaListadoBarberiasDoc,
} from './esquemas';

export const registrarBarberias: RegistrarDocumentacion = (registro) => {
  registro.registerPath({
    method: 'get',
    path: '/barberias',
    tags: ['barberias'],
    summary: 'Listar y buscar barberías publicadas (BUS-01 a BUS-04)',
    description:
      'Solo barberías activas y publicadas (D-07), para cualquier usuario autenticado. `q` (nombre) y `servicio` (nombre de un servicio activo) buscan sin tildes ni mayúsculas, en cualquier parte del texto y con `%` y `_` literales. `abierta=true` deja solo las abiertas ahora según el horario general y los bloqueos de la barbería en su zona horaria (D-31). Orden por nombre y luego id; `pagina` y `limite` por defecto 1 y 10, máximo 50. Sin coincidencias: `datos` vacío y `total` 0.',
    security: SEGURIDAD_BEARER,
    request: { query: esquemaConsultaBarberias },
    responses: {
      200: {
        description: 'Página de barberías',
        content: { 'application/json': { schema: esquemaRespuestaListadoBarberiasDoc } },
      },
      401: respuestaError(
        'AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: sin token, token inválido o cuenta inactiva (D-05)',
      ),
      422: respuestaError(
        'DATOS_INVALIDOS: parámetro desconocido, `limite` fuera de 1 a 50, `pagina` menor de 1, `q` o `servicio` vacíos o de más de 80, `orden` distinto de nombre o `abierta` distinto de true y false',
      ),
    },
  });

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
