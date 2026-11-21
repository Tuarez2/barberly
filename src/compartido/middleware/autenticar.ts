import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { configuracion } from '../configuracion';
import { ErrorNegocio } from '../errores';

const tokenInvalido = () =>
  new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');

export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) throw tokenInvalido();

  try {
    const contenido = jwt.verify(token, configuracion.JWT_SECRETO, { algorithms: ['HS256'] });
    if (typeof contenido === 'string' || !contenido.sub) throw tokenInvalido();
    req.usuario = { id: contenido.sub };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorNegocio('TOKEN_VENCIDO', 401, 'Tu sesión venció');
    }
    throw tokenInvalido();
  }
}
