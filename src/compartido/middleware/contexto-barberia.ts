import type { NextFunction, Request, Response } from 'express';

import { baseDatos } from '../base-datos';
import { esquemaUuid } from '../contrato';
import { ErrorNegocio } from '../errores';

const noEncontrado = () => new ErrorNegocio('NO_ENCONTRADO', 404, 'No encontramos ese recurso');

// SEG-04, D-18: la barberia sale del parametro :id de la ruta y se verifica contra una membresia
// ACTIVO del usuario en una barberia activa. Falla cerrado: cualquier otro caso responde 404, para
// no revelar que la barberia existe. Va despues de autenticar.
//
// Uso: solo en rutas /barberias/:id/... (con mergeParams si el router se monta en /barberias/:id)
// y sin otro :id hijo, que lo taparia. Un recurso que trae la barberia en su fila (por ejemplo
// PATCH /citas/:id) necesita su propia verificacion: buscar por id y barberia de la membresia.
export async function contextoBarberia(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const resultado = esquemaUuid.safeParse(req.params.id);
  if (!req.usuario || !resultado.success) throw noEncontrado();

  const membresia = await baseDatos.membresia.findFirst({
    where: {
      usuarioId: req.usuario.id,
      barberiaId: resultado.data.toLowerCase(),
      estado: 'ACTIVO',
      barberia: { activo: true },
    },
    select: { barberiaId: true, rol: true },
  });
  if (!membresia) throw noEncontrado();

  // El id de la base, no el texto de la URL: los servicios lo usan para filtrar y escribir.
  req.contextoBarberia = { barberiaId: membresia.barberiaId, rol: membresia.rol };
  next();
}
