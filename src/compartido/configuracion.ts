import { z } from 'zod';

const esquemaConfiguracion = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().min(1).max(65535).default(3000),
  // D-19: PostgreSQL. Se aceptan los dos esquemas que usan los proveedores.
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//),
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
  // Sesiones y limites de autenticacion (D-03).
  TOKEN_ACCESO_MINUTOS: z.coerce.number().int().min(1).max(60).default(15),
  TOKEN_RENOVACION_DIAS: z.coerce.number().int().min(1).max(90).default(30),
  REGISTRO_LIMITE_POR_HORA: z.coerce.number().int().min(1).default(5),
  INICIO_INTENTOS_MAXIMOS: z.coerce.number().int().min(1).default(5),
  INICIO_ESPERA_MINUTOS: z.coerce.number().int().min(1).default(15),
  // AUT-07: pedidos de recuperar-clave por hora, contando todos (existan o no los correos).
  RECUPERACION_LIMITE_POR_CORREO: z.coerce.number().int().min(1).default(3),
  RECUPERACION_LIMITE_POR_IP: z.coerce.number().int().min(1).default(5),
  // AUT-07: solicitudes de restablecer-clave por IP por hora, tambien las rechazadas.
  RESTABLECIMIENTO_LIMITE_POR_IP: z.coerce.number().int().min(1).default(10),
  // D-15: proxies propios delante de la API (0 en desarrollo; 1 en Railway, Render o un VPS con Nginx).
  PROXIES_CONFIABLES: z.coerce.number().int().min(0).max(5).default(0),
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
