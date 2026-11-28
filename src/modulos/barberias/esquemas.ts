// Esquemas de entrada y salida de barberias (AUT-10, BUS-01 a BUS-08, D-07, D-13, D-32). La validacion vive en el contrato comun.
import { z } from 'zod';

import {
  ESTADOS_MEMBRESIA,
  esquemaConsultaBarberias,
  esquemaRegistroBarberia,
  esquemaRespuestaBarberosBarberia,
  esquemaRespuestaDetalleBarberia,
  esquemaRespuestaListadoBarberias,
  esquemaRespuestaServiciosBarberia,
  ROLES_MEMBRESIA,
} from '../../compartido/contrato';

export { esquemaConsultaBarberias, esquemaRegistroBarberia };
export type {
  BarberiaListada,
  BarberiaRegistrada,
  BarberoBarberia,
  CierreBarberia,
  ConsultaBarberias,
  DetalleBarberia,
  EntradaRegistroBarberia,
  HorarioBarberia,
  RespuestaBarberosBarberia,
  RespuestaDetalleBarberia,
  RespuestaListadoBarberias,
  RespuestaServiciosBarberia,
  ServicioBarberia,
} from '../../compartido/contrato';

// GET /barberias/:id y sus subrutas no reciben parametros de consulta: uno desconocido es
// DATOS_INVALIDOS, como en el listado.
export const esquemaConsultaSinParametros = z.strictObject(
  {},
  {
    error: (problema) =>
      problema.code === 'unrecognized_keys'
        ? `Parámetros no permitidos: ${problema.keys.join(', ')}`
        : 'Esta ruta no recibe parámetros',
  },
);

// Solo para la documentacion OpenAPI (BUS-01).
export const esquemaRespuestaListadoBarberiasDoc = esquemaRespuestaListadoBarberias.meta({
  id: 'RespuestaListadoBarberias',
});

// Solo para la documentacion OpenAPI (BUS-05 a BUS-08).
export const esquemaRespuestaDetalleBarberiaDoc = esquemaRespuestaDetalleBarberia.meta({
  id: 'RespuestaDetalleBarberia',
});
export const esquemaRespuestaServiciosBarberiaDoc = esquemaRespuestaServiciosBarberia.meta({
  id: 'RespuestaServiciosBarberia',
});
export const esquemaRespuestaBarberosBarberiaDoc = esquemaRespuestaBarberosBarberia.meta({
  id: 'RespuestaBarberosBarberia',
});

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
