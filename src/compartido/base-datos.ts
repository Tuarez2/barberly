import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generado/prisma/client';
import { configuracion } from './configuracion';

// D-19: PostgreSQL con el adaptador oficial de Prisma (node-postgres).
export const baseDatos = new PrismaClient({
  // La sesion va en UTC: el adaptador envia los Date como hora UTC sin desfase y PostgreSQL los
  // interpreta en la zona de la sesion (§8.6: todo se guarda en UTC).
  adapter: new PrismaPg({
    connectionString: configuracion.DATABASE_URL,
    options: '-c TimeZone=UTC',
  }),
});
