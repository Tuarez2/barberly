import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generado/prisma/client';
import { configuracion } from './configuracion';

export const baseDatos = new PrismaClient({
  adapter: new PrismaMariaDb(configuracion.DATABASE_URL),
});
