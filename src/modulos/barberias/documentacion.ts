// Rutas de barberias para OpenAPI (§10.7).
import { z } from 'zod';

import type { RegistrarDocumentacion } from '../../compartido/documentacion';
import { respuestaError, SEGURIDAD_BEARER } from '../../compartido/documentacion';
import {
  esquemaConsultaBarberias,
  esquemaRegistroBarberia,
  esquemaRespuestaBarberiaRegistrada,
  esquemaRespuestaBarberosBarberiaDoc,
  esquemaRespuestaDetalleBarberiaDoc,
  esquemaRespuestaListadoBarberiasDoc,
  esquemaRespuestaServiciosBarberiaDoc,
} from './esquemas';

const parametrosBarberia = z.object({
  id: z.string().meta({ description: 'Id de la barbería (UUID); otro texto responde 404' }),
});

const VISIBILIDAD =
  'Para cualquier usuario autenticado. Visible si está activa y publicada (D-07); un miembro ACTIVO de esa barbería también la ve inactiva o sin publicar (D-32). Si no, NO_ENCONTRADO.';

export const registrarBarberias: RegistrarDocumentacion = (registro) => {
  // Dentro de la funcion: compartido/documentacion importa este modulo (ciclo de importacion).
  const ERROR_SESION = respuestaError(
    'AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: sin token, token inválido o cuenta inactiva (D-05)',
  );
  const ERROR_CONSULTA = respuestaError(
    'DATOS_INVALIDOS: la ruta no recibe parámetros de consulta',
  );
  const ERROR_NO_ENCONTRADA = respuestaError(
    'NO_ENCONTRADO: id inexistente o que no es UUID, o barbería inactiva o no publicada para quien no es su miembro ACTIVO (D-07, D-32)',
  );

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

  registro.registerPath({
    method: 'get',
    path: '/barberias/{id}',
    tags: ['barberias'],
    summary: 'Detalle de una barbería con horario y cierres (BUS-05, BUS-08)',
    description: `${VISIBILIDAD} \`horarios\`: horario general por día (0 = domingo), horas locales HH:mm; los días sin fila no atienden. \`cierres\`: bloqueos de toda la barbería que no terminaron y empiezan dentro de \`diasMaxAnticipacion\` (días locales, inclusive), por \`iniciaEn\`, sin motivo. \`abierta\` como en el listado (D-31). Solo los miembros ACTIVO reciben además \`publicada\` y \`activo\`. No incluye servicios ni barberos.`,
    security: SEGURIDAD_BEARER,
    request: { params: parametrosBarberia },
    responses: {
      200: {
        description: 'Detalle de la barbería',
        content: { 'application/json': { schema: esquemaRespuestaDetalleBarberiaDoc } },
      },
      401: ERROR_SESION,
      404: ERROR_NO_ENCONTRADA,
      422: ERROR_CONSULTA,
    },
  });

  registro.registerPath({
    method: 'get',
    path: '/barberias/{id}/servicios',
    tags: ['barberias'],
    summary: 'Servicios activos de una barbería (BUS-06, HU-BUS-02)',
    description: `${VISIBILIDAD} Solo servicios activos (RN-21), por nombre y sin paginar; \`precio\` como texto con 2 decimales y \`descripcion\` null si no hay.`,
    security: SEGURIDAD_BEARER,
    request: { params: parametrosBarberia },
    responses: {
      200: {
        description: 'Servicios activos',
        content: { 'application/json': { schema: esquemaRespuestaServiciosBarberiaDoc } },
      },
      401: ERROR_SESION,
      404: ERROR_NO_ENCONTRADA,
      422: ERROR_CONSULTA,
    },
  });

  registro.registerPath({
    method: 'get',
    path: '/barberias/{id}/barberos',
    tags: ['barberias'],
    summary: 'Barberos de una barbería con sus servicios (BUS-07)',
    description: `${VISIBILIDAD} \`id\` es el PerfilBarbero. Solo membresía ACTIVO con al menos un servicio activo; \`servicios\` trae solo ids de servicios activos, por nombre del servicio. Por \`nombreVisible\`, sin paginar, sin correo ni teléfono.`,
    security: SEGURIDAD_BEARER,
    request: { params: parametrosBarberia },
    responses: {
      200: {
        description: 'Barberos con sus servicios',
        content: { 'application/json': { schema: esquemaRespuestaBarberosBarberiaDoc } },
      },
      401: ERROR_SESION,
      404: ERROR_NO_ENCONTRADA,
      422: ERROR_CONSULTA,
    },
  });
};
