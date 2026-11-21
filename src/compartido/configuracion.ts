import { z } from 'zod';

const esquemaConfiguracion = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().startsWith('mysql://'),
  JWT_SECRETO: z.string().min(32),
  ORIGENES_CORS: z
    .string()
    .default('')
    .transform((valor) =>
      valor
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean),
    ),
  ALMACEN_TIPO: z.enum(['local', 'memoria', 's3']),
});

export type Configuracion = z.infer<typeof esquemaConfiguracion>;

function cargarConfiguracion(): Configuracion {
  const resultado = esquemaConfiguracion.safeParse(process.env);
  if (!resultado.success) {
    // Solo los nombres: los valores pueden ser secretos.
    const variables = resultado.error.issues.map((problema) => problema.path.join('.'));
    throw new Error(`Variables de entorno invalidas: ${variables.join(', ')}`);
  }
  return resultado.data;
}

export const configuracion = cargarConfiguracion();
