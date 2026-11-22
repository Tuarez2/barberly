import type { Request, Response } from 'express';

import type { RespuestaExito } from '../../compartido/contrato';
import type { EntradaRegistro, DatosSesion } from './esquemas';
import * as servicio from './servicio';

export async function registrar(
  req: Request,
  res: Response<RespuestaExito<DatosSesion>>,
): Promise<void> {
  const datos = await servicio.registrar(req.validado as EntradaRegistro);
  res.status(201).json({ datos });
}
