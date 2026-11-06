import type { NextFunction, Request, Response } from 'express';

import { ErrorNegocio } from '../errores';

// Falla cerrado: sin el modelo Membresia (Fase 1) nadie pertenece a una barberia.
// La Fase 1 verifica aqui la membresia ACTIVO y llena req.contextoBarberia.
export function contextoBarberia(_req: Request, _res: Response, _next: NextFunction): void {
  throw new ErrorNegocio('NO_ENCONTRADO', 404, 'No encontramos ese recurso');
}
