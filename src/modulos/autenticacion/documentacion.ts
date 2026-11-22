// Rutas de autenticacion para OpenAPI (§10.7).
import type { RegistrarDocumentacion } from '../../compartido/documentacion';
import { respuestaError } from '../../compartido/documentacion';
import { esquemaRegistro, esquemaRespuestaSesion } from './esquemas';

export const registrarAutenticacion: RegistrarDocumentacion = (registro) => {
  registro.registerPath({
    method: 'post',
    path: '/autenticacion/registro',
    tags: ['autenticacion'],
    summary: 'Registrar usuario y abrir su sesion (AUT-01)',
    description:
      'Rol cliente por defecto. Devuelve los mismos tokens que iniciar sesion (D-14). Limite por IP por hora: REGISTRO_LIMITE_POR_HORA, 5 por defecto (D-03).',
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: esquemaRegistro.meta({ id: 'EntradaRegistro' }) },
        },
      },
    },
    responses: {
      201: {
        description: 'Cuenta creada y sesion abierta',
        content: { 'application/json': { schema: esquemaRespuestaSesion } },
      },
      409: respuestaError('CORREO_REGISTRADO: ya existe una cuenta con ese correo'),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen que campo falla'),
      429: respuestaError('DEMASIADAS_SOLICITUDES: limite de registros por IP'),
    },
  });
};
