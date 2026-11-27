import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generado/prisma/client';
import { configuracion } from './configuracion';

// D-19: PostgreSQL con el adaptador oficial de Prisma (node-postgres).
export const baseDatos = new PrismaClient({
  adapter: new PrismaPg({ connectionString: configuracion.DATABASE_URL }),
});
