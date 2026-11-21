import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { ErrorNegocio } from '../errores';

type Fuente = 'body' | 'params' | 'query';

// El resultado queda en req.validado: en Express 5 req.query es de solo lectura.
export function validar(esquema: ZodType, fuente: Fuente = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(req[fuente]);
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((problema) => ({
        campo: problema.path.join('.'),
        mensaje: problema.message,
      }));
      throw new ErrorNegocio('DATOS_INVALIDOS', 422, 'Revisa los datos enviados', detalles);
    }
    req.validado = resultado.data;
    next();
  };
}
