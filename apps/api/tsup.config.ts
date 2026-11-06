import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/servidor.ts'],
  format: ['esm'],
  target: 'node26',
  clean: true,
  sourcemap: true,
  // Sin paso de compilacion propio: el paquete compartido entra en el bundle.
  noExternal: ['@barberly/compartido'],
});
