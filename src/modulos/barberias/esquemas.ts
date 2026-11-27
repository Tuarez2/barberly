// Esquemas de entrada y salida de barberias (AUT-10, D-07, D-13). La validacion vive en el contrato comun.
import { z } from 'zod';

import {
  ESTADOS_MEMBRESIA,
  esquemaRegistroBarberia,
  ROLES_MEMBRESIA,
} from '../../compartido/contrato';

export { esquemaRegistroBarberia };
export type { BarberiaRegistrada, EntradaRegistroBarberia } from '../../compartido/contrato';

// Solo para la documentacion OpenAPI.
export const esquemaRespuestaBarberiaRegistrada = z
  .object({
    datos: z.object({
      id: z.uuid(),
      nombre: z.string(),
      descripcion: z.string().nullable(),
      direccion: z.string(),
      telefono: z.string().meta({ example: '+593991234567' }),
      publicada: z.boolean().meta({ description: 'Siempre falso al registrar (D-07)' }),
      activo: z.boolean(),
      membresia: z
        .object({
          id: z.uuid(),
          rol: z.enum(ROLES_MEMBRESIA),
          estado: z.enum(ESTADOS_MEMBRESIA),
        })
        .meta({ description: 'Membresía PROPIETARIO ACTIVO del usuario autenticado (D-13)' }),
    }),
  })
  .meta({ id: 'RespuestaBarberiaRegistrada' });
