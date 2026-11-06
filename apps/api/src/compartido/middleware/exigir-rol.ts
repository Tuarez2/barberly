import type { RolMembresia } from '@barberly/compartido';
import type { NextFunction, Request, Response } from 'express';

import { ErrorNegocio } from '../errores';

export function exigirRol(...roles: RolMembresia[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const rol = req.contextoBarberia?.rol;
    if (!rol || !roles.includes(rol)) {
      throw new ErrorNegocio('ACCESO_DENEGADO', 403, 'No tienes permiso para esta acción');
    }
    next();
  };
}
