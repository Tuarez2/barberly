// Contrato comun con barberly-movil y barberly-panel (D-11): cada uno guarda una copia de este archivo.
// Si cambia, se copia en la misma funcionalidad. Sin logica de negocio.
import { z } from 'zod';

export const esquemaUuid = z.uuid();

// DERCAS §10.1: por defecto 1 y 10, maximo 50.
export const esquemaPaginacion = z
  .object({
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type Paginacion = z.infer<typeof esquemaPaginacion>;

export const ROLES_MEMBRESIA = ['PROPIETARIO', 'BARBERO'] as const;
export type RolMembresia = (typeof ROLES_MEMBRESIA)[number];

// Autenticacion: registro (§11.4, D-14). Mensajes en español: la app los muestra junto al campo.
const BYTES_MAXIMOS_CLAVE = 72; // limite de bcrypt

export function normalizarTelefono(telefono: string): string {
  return /^09\d{8}$/.test(telefono) ? `+593${telefono.slice(1)}` : telefono;
}

export const esquemaNombre = z
  .string({ error: 'El nombre es obligatorio' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(80, 'El nombre debe tener como máximo 80 caracteres')
  .regex(/^[^\p{Cc}\p{Cf}]*$/u, 'El nombre no puede tener caracteres de control');

export const esquemaCorreo = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .max(120, 'El correo debe tener como máximo 120 caracteres')
  .pipe(z.email('Escribe un correo válido'));

export const esquemaTelefono = z
  .string({ error: 'El teléfono es obligatorio' })
  .transform((telefono) => telefono.replace(/[\s\-.()]/g, ''))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, 'El teléfono debe tener de 7 a 15 dígitos'))
  .transform(normalizarTelefono);

export const esquemaClave = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña debe tener como máximo 72 caracteres')
  .regex(/\p{L}/u, 'La contraseña debe tener al menos una letra')
  .regex(/\d/, 'La contraseña debe tener al menos un número')
  .refine(
    (clave) => new TextEncoder().encode(clave).length <= BYTES_MAXIMOS_CLAVE,
    'La contraseña es demasiado larga',
  );

export const esquemaDispositivo = z
  .string()
  .trim()
  .min(1, 'El dispositivo no puede estar vacío')
  .max(100, 'El dispositivo debe tener como máximo 100 caracteres')
  .regex(/^\P{Cc}*$/u, 'El dispositivo no puede tener caracteres de control');

export const esquemaRegistro = z.strictObject(
  {
    nombre: esquemaNombre,
    correo: esquemaCorreo,
    telefono: esquemaTelefono,
    clave: esquemaClave,
    dispositivo: esquemaDispositivo.optional(),
  },
  {
    error: (problema) =>
      problema.code === 'unrecognized_keys'
        ? `Campos no permitidos: ${problema.keys.join(', ')}`
        : 'Envía los datos del registro',
  },
);

export type EntradaRegistro = z.infer<typeof esquemaRegistro>;

// D-16: sin las reglas del registro; solo no vacia y de maximo 72 caracteres.
export const esquemaInicioSesion = z.strictObject(
  {
    correo: esquemaCorreo,
    clave: z
      .string({ error: 'La contraseña es obligatoria' })
      .min(1, 'Escribe tu contraseña')
      .max(72, 'La contraseña debe tener como máximo 72 caracteres'),
    dispositivo: esquemaDispositivo.optional(),
  },
  {
    error: (problema) =>
      problema.code === 'unrecognized_keys'
        ? `Campos no permitidos: ${problema.keys.join(', ')}`
        : 'Envía tu correo y tu contraseña',
  },
);

export type EntradaInicioSesion = z.infer<typeof esquemaInicioSesion>;

// D-17: renovar y cerrar sesion reciben solo el token de renovacion (43 caracteres en base64url).
export const esquemaTokenSesion = z.strictObject(
  {
    tokenRenovacion: z
      .string({ error: 'El token de renovación es obligatorio' })
      .min(1, 'El token de renovación es obligatorio')
      .max(128, 'El token de renovación no es válido'),
  },
  {
    error: (problema) =>
      problema.code === 'unrecognized_keys'
        ? `Campos no permitidos: ${problema.keys.join(', ')}`
        : 'Envía el token de renovación',
  },
);

export type EntradaTokenSesion = z.infer<typeof esquemaTokenSesion>;

export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
}

// D-14: lo devuelven el registro y el inicio de sesion (D-16).
export interface DatosSesion {
  usuario: UsuarioSesion;
  tokenAcceso: string;
  tokenRenovacion: string;
}

// D-18: lo devuelve GET /usuarios/yo. Fechas en ISO 8601 UTC.
export interface MembresiaUsuario {
  id: string;
  rol: RolMembresia;
  barberoId: string | null; // PerfilBarbero, solo si rol es BARBERO (§10.1)
  barberia: { id: string; nombre: string };
}

export interface PerfilUsuario extends UsuarioSesion {
  consentimientoIaEn: string | null;
  membresias: MembresiaUsuario[];
}

// D-17: lo devuelve renovar.
export interface DatosRenovacion {
  tokenAcceso: string;
  tokenRenovacion: string;
}

export interface MetaPaginacion {
  pagina: number;
  limite: number;
  total: number;
}

export interface RespuestaExito<T> {
  datos: T;
  meta?: MetaPaginacion;
}

export interface RespuestaError {
  error: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
}
