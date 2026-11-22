// Esquemas de entrada y salida de autenticacion (§11.4, D-14, D-16). La validacion vive en el contrato comun.
import { z } from 'zod';

import { esquemaInicioSesion, esquemaRegistro } from '../../compartido/contrato';

export { esquemaInicioSesion, esquemaRegistro };
export type { DatosSesion, EntradaInicioSesion, EntradaRegistro } from '../../compartido/contrato';

// Solo para la documentacion OpenAPI.
export const esquemaRespuestaSesion = z
  .object({
    datos: z.object({
      usuario: z.object({
        id: z.uuid(),
        nombre: z.string(),
        correo: z.email(),
        telefono: z.string().meta({ example: '+593991234567' }),
      }),
      tokenAcceso: z
        .string()
        .meta({ description: 'JWT; dura TOKEN_ACCESO_MINUTOS, 15 por defecto (D-03)' }),
      tokenRenovacion: z
        .string()
        .meta({ description: 'Token opaco; dura TOKEN_RENOVACION_DIAS, 30 por defecto (D-03)' }),
    }),
  })
  .meta({ id: 'RespuestaSesion' });
