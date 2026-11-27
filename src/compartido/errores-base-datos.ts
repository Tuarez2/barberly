// Errores de PostgreSQL que los servicios traducen a errores de negocio (D-19).
import { Prisma } from '../generado/prisma/client';

const EXCLUSION_VIOLADA = '23P01';

function codigoPostgres(error: unknown): string | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  const meta = error.meta as
    { driverAdapterError?: { cause?: { originalCode?: unknown } } } | undefined;
  const codigo = meta?.driverAdapterError?.cause?.originalCode;
  return typeof codigo === 'string' ? codigo : undefined;
}

// RN-04: la restriccion ex_citas_barbero_sin_cruce rechazo una cita que se solapa con otra activa
// del mismo barbero. El servicio de reservas lo traduce a HORARIO_OCUPADO (409).
export function esCruceDeCitas(error: unknown): boolean {
  return codigoPostgres(error) === EXCLUSION_VIOLADA;
}

// Indice unico violado (correo repetido, clave de idempotencia...).
export function esDuplicado(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
