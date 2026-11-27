// Esquemas de entrada y salida de autenticacion (§11.4, D-14, D-16, D-17, D-18). La validacion vive en el contrato comun.
import { z } from 'zod';

import {
  esquemaCambioClave,
  esquemaEdicionPerfil,
  esquemaInicioSesion,
  esquemaRegistro,
  esquemaTokenSesion,
  ROLES_MEMBRESIA,
} from '../../compartido/contrato';

export {
  esquemaCambioClave,
  esquemaEdicionPerfil,
  esquemaInicioSesion,
  esquemaRegistro,
  esquemaTokenSesion,
};
export type {
  DatosRenovacion,
  DatosSesion,
  EntradaCambioClave,
  EntradaEdicionPerfil,
  EntradaInicioSesion,
  EntradaRegistro,
  EntradaTokenSesion,
  PerfilUsuario,
  UsuarioSesion,
} from '../../compartido/contrato';

// Solo para la documentacion OpenAPI.
const esquemaUsuarioSesion = z.object({
  id: z.uuid(),
  nombre: z.string(),
  correo: z.email(),
  telefono: z.string().meta({ example: '+593991234567' }),
});

export const esquemaRespuestaSesion = z
  .object({
    datos: z.object({
      usuario: esquemaUsuarioSesion,
      tokenAcceso: z
        .string()
        .meta({ description: 'JWT; dura TOKEN_ACCESO_MINUTOS, 15 por defecto (D-03)' }),
      tokenRenovacion: z
        .string()
        .meta({ description: 'Token opaco; dura TOKEN_RENOVACION_DIAS, 30 por defecto (D-03)' }),
    }),
  })
  .meta({ id: 'RespuestaSesion' });

export const esquemaRespuestaRenovacion = z
  .object({
    datos: z.object({
      tokenAcceso: z.string().meta({ description: 'JWT nuevo (D-03)' }),
      tokenRenovacion: z
        .string()
        .meta({ description: 'Reemplaza al enviado, que queda revocado (D-03, D-17)' }),
    }),
  })
  .meta({ id: 'RespuestaRenovacion' });

export const esquemaRespuestaPerfil = z
  .object({
    datos: z.object({
      id: z.uuid(),
      nombre: z.string(),
      correo: z.email(),
      telefono: z.string(),
      consentimientoIaEn: z.iso
        .datetime()
        .nullable()
        .meta({ description: 'Consentimiento del asesor (RN-28)' }),
      membresias: z
        .array(
          z.object({
            id: z.uuid(),
            rol: z.enum(ROLES_MEMBRESIA),
            barberoId: z
              .uuid()
              .nullable()
              .meta({ description: 'PerfilBarbero; solo si rol es BARBERO' }),
            barberia: z.object({ id: z.uuid(), nombre: z.string() }),
          }),
        )
        .meta({ description: 'Solo ACTIVO de barberías activas, por nombre de barbería (D-18)' }),
    }),
  })
  .meta({ id: 'RespuestaPerfil' });

export const esquemaRespuestaEdicionPerfil = z
  .object({ datos: esquemaUsuarioSesion })
  .meta({ id: 'RespuestaEdicionPerfil' });
