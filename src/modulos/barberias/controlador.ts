import type { Request, Response } from 'express';

import type { RespuestaExito } from '../../compartido/contrato';
import { ErrorNegocio } from '../../compartido/errores';
import type {
  BarberiaRegistrada,
  ConsultaBarberias,
  EntradaRegistroBarberia,
  RespuestaBarberosBarberia,
  RespuestaDetalleBarberia,
  RespuestaListadoBarberias,
  RespuestaServiciosBarberia,
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

// Express tipa :id como string; si faltara, el servicio responde NO_ENCONTRADO.
function idRuta(req: Request): string {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

export async function detalle(
  req: Request,
  res: Response<RespuestaDetalleBarberia>,
): Promise<void> {
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  const datos = await servicio.detalle(idRuta(req), req.usuario.id);
  res.status(200).json({ datos });
}

export async function listarServicios(
  req: Request,
  res: Response<RespuestaServiciosBarberia>,
): Promise<void> {
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  const { datos, meta } = await servicio.listarServicios(idRuta(req), req.usuario.id);
  res.status(200).json({ datos, meta });
}

export async function listarBarberos(
  req: Request,
  res: Response<RespuestaBarberosBarberia>,
): Promise<void> {
  if (!req.usuario) throw new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');
  const { datos, meta } = await servicio.listarBarberos(idRuta(req), req.usuario.id);
  res.status(200).json({ datos, meta });
}
