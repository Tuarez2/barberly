// Limites de tasa por IP para autenticacion (SEG-09, D-03, D-14). Almacen en memoria: la API corre en una instancia.
import { MemoryStore, rateLimit } from 'express-rate-limit';

import { configuracion } from './configuracion';
import { ErrorNegocio } from './errores';

const UNA_HORA_MS = 60 * 60 * 1000;

const almacenRegistro = new MemoryStore();

// D-14: cuenta todas las solicitudes de la IP, tambien las rechazadas.
export const limitarRegistro = rateLimit({
  windowMs: UNA_HORA_MS,
  limit: configuracion.REGISTRO_LIMITE_POR_HORA,
  store: almacenRegistro,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new ErrorNegocio('DEMASIADAS_SOLICITUDES', 429, 'Demasiados intentos. Espera un momento.'),
    );
  },
});

// Solo para pruebas: cada caso empieza sin intentos acumulados.
export function reiniciarLimites(): void {
  almacenRegistro.resetAll();
}
