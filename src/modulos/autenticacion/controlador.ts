import type { Request, Response } from 'express';

import type { RespuestaExito } from '../../compartido/contrato';
import { ErrorNegocio } from '../../compartido/errores';
import type {
  DatosRenovacion,
  DatosSesion,
  EntradaInicioSesion,
  EntradaRegistro,
  EntradaTokenSesion,
  PerfilUsuario,
} from './esquemas';
import * as servicio from './servicio';

export async function registrar(
  req: Request,
  res: Response<RespuestaExito<DatosSesion>>,
): Promise<void> {
  const datos = await servicio.registrar(req.validado as EntradaRegistro);
  res.status(201).json({ datos });
}

export async function iniciarSesion(
  req: Request,
  res: Response<RespuestaExito<DatosSesion>>,
): Promise<void> {
  const datos = await servicio.iniciarSesion(req.validado as EntradaInicioSesion);
  res.status(200).json({ datos });
}

export async function renovar(
  req: Request,
  res: Response<RespuestaExito<DatosRenovacion>>,
): Promise<void> {
  const datos = await servicio.renovar(req.validado as EntradaTokenSesion);
  res.status(200).json({ datos });
}

export async function cerrarSesion(req: Request, res: Response): Promise<void> {
  // autenticar va antes en la ruta; esto solo protege si alguien la quita.
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  await servicio.cerrarSesion(req.usuario.id, req.validado as EntradaTokenSesion);
  res.status(204).end();
}

export async function consultarPerfil(
  req: Request,
  res: Response<RespuestaExito<PerfilUsuario>>,
): Promise<void> {
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  const datos = await servicio.consultarPerfil(req.usuario.id);
  res.status(200).json({ datos });
}
