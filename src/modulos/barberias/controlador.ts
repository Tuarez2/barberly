import type { Request, Response } from 'express';

import type { RespuestaExito } from '../../compartido/contrato';
import { ErrorNegocio } from '../../compartido/errores';
import type {
  BarberiaRegistrada,
  ConsultaBarberias,
  EntradaRegistroBarberia,
  RespuestaListadoBarberias,
} from './esquemas';
import * as servicio from './servicio';

export async function listar(
  req: Request,
  res: Response<RespuestaListadoBarberias>,
): Promise<void> {
  // autenticar va antes en la ruta; esto solo protege si alguien la quita.
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  const { datos, meta } = await servicio.listar(req.validado as ConsultaBarberias);
  res.status(200).json({ datos, meta });
}

export async function registrar(
  req: Request,
  res: Response<RespuestaExito<BarberiaRegistrada>>,
): Promise<void> {
  // autenticar va antes en la ruta; esto solo protege si alguien la quita.
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  const datos = await servicio.registrar(req.usuario.id, req.validado as EntradaRegistroBarberia);
  res.status(201).json({ datos });
}
