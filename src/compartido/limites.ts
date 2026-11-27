// Limites de tasa de autenticacion (SEG-09, AUT-06, D-03, D-14, D-16).
// Almacen en memoria: la API corre en una instancia. La IP del cliente sale de PROXIES_CONFIABLES (D-15).
import type { Request } from 'express';
import { MemoryStore, rateLimit } from 'express-rate-limit';

import { configuracion } from './configuracion';
import { ErrorNegocio } from './errores';

const UNA_HORA_MS = 60 * 60 * 1000;
const UN_MINUTO_MS = 60 * 1000;

// D-16: la ventana empieza en el primer fallo. express-rate-limit la abre en el primer intento,
// sea cual sea la respuesta; si al descontar un intento que no cuenta el contador vuelve a cero,
// se borra, y el siguiente fallo abre una ventana nueva. Todo ocurre en el mismo bloque sincrono
// (MemoryStore no tiene await en decrement), asi que ninguna otra solicitud se cuela en medio.
class AlmacenDesdePrimerFallo extends MemoryStore {
  override decrement(clave: string): Promise<void> {
    const resultado = super.decrement(clave);
    const cliente = this.current.get(clave) ?? this.previous.get(clave);
    if (cliente && cliente.totalHits === 0) {
      this.current.delete(clave);
      this.previous.delete(clave);
    }
    return resultado;
  }
}

const almacenRegistro = new MemoryStore();
const almacenInicioPorIp = new AlmacenDesdePrimerFallo();
const almacenInicioPorCuenta = new AlmacenDesdePrimerFallo();
const almacenCambioClave = new AlmacenDesdePrimerFallo();

const demasiadasSolicitudes = () =>
  new ErrorNegocio('DEMASIADAS_SOLICITUDES', 429, 'Demasiados intentos. Espera un momento.');

// D-14: cuenta todas las solicitudes de la IP, tambien las rechazadas.
export const limitarRegistro = rateLimit({
  windowMs: UNA_HORA_MS,
  limit: configuracion.REGISTRO_LIMITE_POR_HORA,
  store: almacenRegistro,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'registro',
  handler: (_req, _res, next) => {
    next(demasiadasSolicitudes());
  },
});

// D-16: solo cuentan los CREDENCIALES_INVALIDAS; el resto de respuestas se descuenta al terminar.
const opcionesInicio = {
  windowMs: configuracion.INICIO_ESPERA_MINUTOS * UN_MINUTO_MS,
  limit: configuracion.INICIO_INTENTOS_MAXIMOS,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req: Request, res: { statusCode: number }) => res.statusCode !== 401,
  legacyHeaders: false,
  handler: (_req: Request, _res: unknown, next: (error: ErrorNegocio) => void) => {
    next(demasiadasSolicitudes());
  },
} as const;

export const limitarInicioPorIp = rateLimit({
  ...opcionesInicio,
  store: almacenInicioPorIp,
  standardHeaders: 'draft-8',
  identifier: 'inicio-ip',
});

// Corre despues de validar: la clave es el correo ya normalizado por esquemaCorreo (maximo 120),
// asi un cuerpo invalido no crea entradas en memoria.
function correoValidado(req: Request): string | undefined {
  const validado = req.validado;
  if (typeof validado !== 'object' || validado === null || !('correo' in validado))
    return undefined;
  return typeof validado.correo === 'string' ? validado.correo : undefined;
}

// Sin cabeceras: dirian cuantos fallos han hecho otros contra ese correo.
export const limitarInicioPorCuenta = rateLimit({
  ...opcionesInicio,
  store: almacenInicioPorCuenta,
  standardHeaders: false,
  skip: (req) => correoValidado(req) === undefined,
  keyGenerator: (req) => `correo:${correoValidado(req) ?? ''}`,
});

// AUT-06: mismo mecanismo y configuracion de D-16, con un contador por usuario autenticado (no por
// token ni IP). Corre despues de autenticar y validar: un 401 de sesion o un 422 no crean entradas.
export const limitarCambioClave = rateLimit({
  ...opcionesInicio,
  store: almacenCambioClave,
  standardHeaders: false,
  skip: (req) => req.usuario === undefined,
  keyGenerator: (req) => `usuario:${req.usuario?.id ?? ''}`,
});

// Solo para pruebas: cada caso empieza sin intentos acumulados.
export function reiniciarLimites(): void {
  void almacenRegistro.resetAll();
  void almacenInicioPorIp.resetAll();
  void almacenInicioPorCuenta.resetAll();
  void almacenCambioClave.resetAll();
}
