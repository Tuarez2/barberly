// Rutas de autenticacion para OpenAPI (§10.7).
import type { RegistrarDocumentacion } from '../../compartido/documentacion';
import { respuestaError } from '../../compartido/documentacion';
import { esquemaInicioSesion, esquemaRegistro, esquemaRespuestaSesion } from './esquemas';

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

  registro.registerPath({
    method: 'post',
    path: '/autenticacion/iniciar-sesion',
    tags: ['autenticacion'],
    summary: 'Iniciar sesion con correo y contraseña (AUT-02)',
    description:
      'Abre una sesion nueva por dispositivo (D-04). Tras INICIO_INTENTOS_MAXIMOS (5) fallos por IP o por cuenta, espera de INICIO_ESPERA_MINUTOS (15) (D-03, D-16).',
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: esquemaInicioSesion.meta({ id: 'EntradaInicioSesion' }) },
        },
      },
    },
    responses: {
      200: {
        description: 'Sesion abierta',
        content: { 'application/json': { schema: esquemaRespuestaSesion } },
      },
      401: respuestaError(
        'CREDENCIALES_INVALIDAS: correo o contraseña incorrectos, o cuenta inactiva',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen que campo falla'),
      429: respuestaError('DEMASIADAS_SOLICITUDES: demasiados inicios fallidos'),
    },
  });
};
