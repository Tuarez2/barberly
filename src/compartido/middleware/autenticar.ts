import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { baseDatos } from '../base-datos';
import { configuracion } from '../configuracion';
import { ErrorNegocio } from '../errores';

const tokenInvalido = () =>
  new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');

function leerUsuarioDelToken(req: Request): string {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) throw tokenInvalido();

  try {
    const contenido = jwt.verify(token, configuracion.JWT_SECRETO, { algorithms: ['HS256'] });
    if (typeof contenido === 'string' || !contenido.sub) throw tokenInvalido();
    return contenido.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorNegocio('TOKEN_VENCIDO', 401, 'Tu sesión venció');
    }
    throw tokenInvalido();
  }
}

// SEG-02, D-05, D-18: ademas del JWT, el usuario debe existir y estar activo, asi desactivar una
// cuenta corta el acceso de inmediato. Inexistente e inactivo responden igual.
export async function autenticar(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const usuarioId = leerUsuarioDelToken(req);
  const usuario = await baseDatos.usuario.findUnique({
    where: { id: usuarioId },
    select: { activo: true },
  });
  if (!usuario?.activo) throw tokenInvalido();

  req.usuario = { id: usuarioId };
  next();
}
