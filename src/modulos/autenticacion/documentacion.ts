// Rutas de autenticacion para OpenAPI (§10.7).
import type { RegistrarDocumentacion } from '../../compartido/documentacion';
import { respuestaError, SEGURIDAD_BEARER } from '../../compartido/documentacion';
import {
  esquemaCambioClave,
  esquemaEdicionPerfil,
  esquemaInicioSesion,
  esquemaRegistro,
  esquemaRespuestaEdicionPerfil,
  esquemaRespuestaPerfil,
  esquemaRespuestaRenovacion,
  esquemaRespuestaSesion,
  esquemaTokenSesion,
} from './esquemas';

export const registrarAutenticacion: RegistrarDocumentacion = (registro) => {
  registro.registerPath({
    method: 'post',
    path: '/autenticacion/registro',
    tags: ['autenticacion'],
    summary: 'Registrar usuario y abrir su sesión (AUT-01)',
    description:
      'Rol cliente por defecto. Devuelve los mismos tokens que iniciar sesión (D-14). Límite por IP por hora: REGISTRO_LIMITE_POR_HORA, 5 por defecto (D-03).',
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
        description: 'Cuenta creada y sesión abierta',
        content: { 'application/json': { schema: esquemaRespuestaSesion } },
      },
      409: respuestaError('CORREO_REGISTRADO: ya existe una cuenta con ese correo'),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
      429: respuestaError('DEMASIADAS_SOLICITUDES: límite de registros por IP'),
    },
  });

  registro.registerPath({
    method: 'post',
    path: '/autenticacion/iniciar-sesion',
    tags: ['autenticacion'],
    summary: 'Iniciar sesión con correo y contraseña (AUT-02)',
    description:
      'Abre una sesión nueva por dispositivo (D-04). Tras INICIO_INTENTOS_MAXIMOS (5) fallos por IP o por cuenta, espera de INICIO_ESPERA_MINUTOS (15) (D-03, D-16).',
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
        description: 'Sesión abierta',
        content: { 'application/json': { schema: esquemaRespuestaSesion } },
      },
      401: respuestaError(
        'CREDENCIALES_INVALIDAS: correo o contraseña incorrectos, o cuenta inactiva',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
      429: respuestaError('DEMASIADAS_SOLICITUDES: demasiados inicios fallidos'),
    },
  });

  const cuerpoToken = {
    body: {
      required: true,
      content: {
        'application/json': { schema: esquemaTokenSesion.meta({ id: 'EntradaTokenSesion' }) },
      },
    },
  };

  registro.registerPath({
    method: 'post',
    path: '/autenticacion/renovar',
    tags: ['autenticacion'],
    summary: 'Renovar el token de acceso sin pedir la contraseña (AUT-04)',
    description:
      'Rota la sesión: el token enviado queda revocado y se devuelve otro con 30 días nuevos (D-03, D-17).',
    request: cuerpoToken,
    responses: {
      200: {
        description: 'Tokens nuevos',
        content: { 'application/json': { schema: esquemaRespuestaRenovacion } },
      },
      401: respuestaError(
        'AUTENTICACION_REQUERIDA: token vencido, revocado, inexistente o usuario inactivo (D-02, D-05)',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
    },
  });

  registro.registerPath({
    method: 'post',
    path: '/autenticacion/cerrar-sesion',
    tags: ['autenticacion'],
    summary: 'Cerrar la sesión de este dispositivo (AUT-03)',
    description:
      'Revoca solo ese token de renovación si es del usuario. Responde 204 también si ya estaba revocado, no existe o es de otro usuario (D-17).',
    security: SEGURIDAD_BEARER,
    request: cuerpoToken,
    responses: {
      204: { description: 'Sesión cerrada' },
      401: respuestaError(
        'AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: falta el token de acceso o no sirve',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
    },
  });

  registro.registerPath({
    method: 'get',
    path: '/usuarios/yo',
    tags: ['autenticacion'],
    summary: 'Ver mi perfil y mis membresías (AUT-08)',
    description:
      'La app y el panel eligen la interfaz con las membresías: un cliente recibe la lista vacía (D-10, D-18).',
    security: SEGURIDAD_BEARER,
    responses: {
      200: {
        description: 'Perfil del usuario autenticado',
        content: { 'application/json': { schema: esquemaRespuestaPerfil } },
      },
      401: respuestaError(
        'AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: sin token, token inválido o cuenta inactiva (D-05)',
      ),
    },
  });

  registro.registerPath({
    method: 'patch',
    path: '/usuarios/yo',
    tags: ['autenticacion'],
    summary: 'Editar mi nombre o mi teléfono (AUT-05)',
    description:
      'Al menos uno de los dos, con las reglas y la normalización del registro (D-14). El correo no cambia en el MVP: enviarlo responde DATOS_INVALIDOS.',
    security: SEGURIDAD_BEARER,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: esquemaEdicionPerfil.meta({ id: 'EntradaEdicionPerfil' }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Perfil editado',
        content: { 'application/json': { schema: esquemaRespuestaEdicionPerfil } },
      },
      401: respuestaError(
        'AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: sin token, token inválido o cuenta inactiva (D-05)',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
    },
  });

  registro.registerPath({
    method: 'patch',
    path: '/usuarios/yo/clave',
    tags: ['autenticacion'],
    summary: 'Cambiar mi contraseña con la actual (AUT-06)',
    description:
      'La nueva cumple las reglas del registro. No revoca las demás sesiones. Tras INICIO_INTENTOS_MAXIMOS (5) fallos de la actual por usuario, espera de INICIO_ESPERA_MINUTOS (15) desde el primer fallo (D-05, D-16).',
    security: SEGURIDAD_BEARER,
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: esquemaCambioClave.meta({ id: 'EntradaCambioClave' }) },
        },
      },
    },
    responses: {
      204: { description: 'Contraseña cambiada' },
      401: respuestaError(
        'CREDENCIALES_INVALIDAS: la actual no coincide (la app no cierra la sesión); AUTENTICACION_REQUERIDA o TOKEN_VENCIDO: falta el token de acceso o no sirve',
      ),
      422: respuestaError('DATOS_INVALIDOS: los detalles dicen qué campo falla'),
      429: respuestaError('DEMASIADAS_SOLICITUDES: demasiados fallos de la contraseña actual'),
    },
  });
};
