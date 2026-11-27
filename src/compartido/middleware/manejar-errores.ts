import type { RespuestaError } from '../contrato';
import type { NextFunction, Request, Response } from 'express';

import { ErrorNegocio } from '../errores';
import { registro } from '../registro';

function esJsonMalFormado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  );
}

export function manejarErrores(
  error: unknown,
  req: Request,
  res: Response<RespuestaError>,
  _next: NextFunction,
): void {
  if (error instanceof ErrorNegocio) {
    res.status(error.http).json({
      error: { codigo: error.codigo, mensaje: error.message, detalles: error.detalles },
    });
    return;
  }
  // Express no puede decodificar un parametro de la ruta (%E0%A4%A): no nombra ningun recurso.
  // Es un error del cliente, asi que no va al log.
  if (error instanceof URIError) {
    res.status(404).json({
      error: { codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos ese recurso' },
    });
    return;
  }
  if (esJsonMalFormado(error)) {
    res.status(422).json({
      error: { codigo: 'DATOS_INVALIDOS', mensaje: 'El cuerpo no es JSON válido' },
    });
    return;
  }
  registro.error({ err: error, metodo: req.method, ruta: req.path }, 'Error inesperado');
  res.status(500).json({
    error: { codigo: 'INTERNO', mensaje: 'Ocurrió un error. Intenta de nuevo.' },
  });
}
