import type { RolMembresia } from './contrato';

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: { id: string };
    contextoBarberia?: { barberiaId: string; rol: RolMembresia };
    validado?: unknown;
  }
}
