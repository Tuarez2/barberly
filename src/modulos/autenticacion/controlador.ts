import type { Request, Response } from 'express';

import type { RespuestaExito } from '../../compartido/contrato';
import type { DatosSesion, EntradaInicioSesion, EntradaRegistro } from './esquemas';
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
