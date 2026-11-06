// Esquemas Zod y tipos comunes entre apps/api y apps/movil. Sin logica de negocio.
import { z } from 'zod';

export const esquemaUuid = z.uuid();

// DERCAS §10.1: por defecto 1 y 10, maximo 50.
export const esquemaPaginacion = z
  .object({
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type Paginacion = z.infer<typeof esquemaPaginacion>;

export const ROLES_MEMBRESIA = ['PROPIETARIO', 'BARBERO'] as const;
export type RolMembresia = (typeof ROLES_MEMBRESIA)[number];

export interface MetaPaginacion {
  pagina: number;
  limite: number;
  total: number;
}

export interface RespuestaExito<T> {
  datos: T;
  meta?: MetaPaginacion;
}

export interface RespuestaError {
  error: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
}
