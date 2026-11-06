import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { defineConfig } from 'vitest/config';

const ARCHIVO_ENTORNO = '.env.prueba';

if (!existsSync(ARCHIVO_ENTORNO)) {
  throw new Error(`Falta apps/api/${ARCHIVO_ENTORNO}: copia ${ARCHIVO_ENTORNO}.example`);
}
// Sobrescribe el entorno del shell: las pruebas nunca deben tocar otra base.
Object.assign(process.env, parseEnv(readFileSync(ARCHIVO_ENTORNO, 'utf8')));

export default defineConfig({
  test: {
    include: ['src/**/*.prueba.ts', '../../pruebas/**/*.prueba.ts'],
    fileParallelism: false,
    globalSetup: ['src/pruebas/migrar-base.ts'],
  },
});
