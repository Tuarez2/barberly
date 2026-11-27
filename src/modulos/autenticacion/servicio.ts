// Logica de autenticacion (AUT-01 a AUT-06, AUT-08, SEG-06, §11.4, D-02 a D-05, D-14, D-16 a D-18).
import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { baseDatos } from '../../compartido/base-datos';
import { configuracion } from '../../compartido/configuracion';
import { ErrorNegocio } from '../../compartido/errores';
import { esDuplicado } from '../../compartido/errores-base-datos';
import { ahora } from '../../compartido/reloj';
import { Prisma } from '../../generado/prisma/client';
import type {
  DatosRenovacion,
  DatosSesion,
  EntradaCambioClave,
  EntradaEdicionPerfil,
  EntradaInicioSesion,
  EntradaRegistro,
  EntradaTokenSesion,
  PerfilUsuario,
  UsuarioSesion,
} from './esquemas';

const DIA_MS = 24 * 60 * 60 * 1000;
const COSTO_BCRYPT = 12; // SEG-06, §14.3: fijo, no configurable

// RNF-17: nunca claveHash ni tokenHash.
const seleccionUsuario = { id: true, nombre: true, correo: true, telefono: true } as const;

const correoRegistrado = () =>
  new ErrorNegocio('CORREO_REGISTRADO', 409, 'Ya existe una cuenta con ese correo');

// §11.4 y D-05: el mismo error si falta el correo, la clave no coincide o la cuenta esta inactiva.
const credencialesInvalidas = () =>
  new ErrorNegocio('CREDENCIALES_INVALIDAS', 401, 'Correo o contraseña incorrectos');

// D-02 y D-05: el mismo error si el token vencio, se revoco, no existe o el usuario esta inactivo.
const sesionInvalida = () =>
  new ErrorNegocio('AUTENTICACION_REQUERIDA', 401, 'Debes iniciar sesión');

// AUT-06 y D-05: la app muestra el error junto al campo y no cierra la sesion.
const claveActualIncorrecta = () =>
  new ErrorNegocio('CREDENCIALES_INVALIDAS', 401, 'La contraseña actual no es correcta');

const esNoEncontrado = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

// D-16: con un correo inexistente se compara igual, para que el tiempo no revele que correos existen.
// Hash fijo de costo 12 de un texto aleatorio que se descarto: nada lo hace coincidir y no hay que
// calcularlo al arrancar (la primera solicitud tardaria el doble).
const HASH_RELLENO = '$2b$12$ebKAF8zjyb7xoBEN3CmsqeWv/By2vFRyHylmkAgUv/LFZwplVW1ie';

function firmarTokenAcceso(usuarioId: string): string {
  return jwt.sign({}, configuracion.JWT_SECRETO, {
    algorithm: 'HS256',
    subject: usuarioId,
    expiresIn: configuracion.TOKEN_ACCESO_MINUTOS * 60,
  });
}

// El token de renovacion es opaco; en la base solo queda su SHA-256 (64 caracteres hex).
function hashTokenRenovacion(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

type ClienteSesion = Pick<Prisma.TransactionClient, 'tokenRenovacion'>;

// D-04: cada registro o inicio abre su propia sesion (una fila de TokenRenovacion).
async function abrirSesion(
  cliente: ClienteSesion,
  usuarioId: string,
  dispositivo: string | undefined,
): Promise<string> {
  const tokenRenovacion = randomBytes(32).toString('base64url');
  await cliente.tokenRenovacion.create({
    data: {
      usuarioId,
      tokenHash: hashTokenRenovacion(tokenRenovacion),
      expiraEn: new Date(ahora().getTime() + configuracion.TOKEN_RENOVACION_DIAS * DIA_MS),
      dispositivo: dispositivo ?? null,
    },
  });
  return tokenRenovacion;
}

export async function registrar(entrada: EntradaRegistro): Promise<DatosSesion> {
  const existente = await baseDatos.usuario.findUnique({
    where: { correo: entrada.correo },
    select: { id: true },
  });
  if (existente) throw correoRegistrado();

  const claveHash = await bcrypt.hash(entrada.clave, COSTO_BCRYPT);

  try {
    const { usuario, tokenRenovacion } = await baseDatos.$transaction(async (tx) => {
      const creado = await tx.usuario.create({
        data: {
          nombre: entrada.nombre,
          correo: entrada.correo,
          telefono: entrada.telefono,
          claveHash,
        },
        select: seleccionUsuario,
      });
      const token = await abrirSesion(tx, creado.id, entrada.dispositivo);
      return { usuario: creado, tokenRenovacion: token };
    });
    return { usuario, tokenAcceso: firmarTokenAcceso(usuario.id), tokenRenovacion };
  } catch (error) {
    // Dos registros simultaneos con el mismo correo: el indice unico decide.
    if (esDuplicado(error)) throw correoRegistrado();
    throw error;
  }
}

export async function iniciarSesion(entrada: EntradaInicioSesion): Promise<DatosSesion> {
  const encontrado = await baseDatos.usuario.findUnique({
    where: { correo: entrada.correo },
    select: { ...seleccionUsuario, claveHash: true, activo: true },
  });
  const claveCorrecta = await bcrypt.compare(entrada.clave, encontrado?.claveHash ?? HASH_RELLENO);
  if (!encontrado || !encontrado.activo || !claveCorrecta) throw credencialesInvalidas();

  // RNF-17: solo los campos de seleccionUsuario, nunca claveHash.
  const usuario = {
    id: encontrado.id,
    nombre: encontrado.nombre,
    correo: encontrado.correo,
    telefono: encontrado.telefono,
  };
  const tokenRenovacion = await abrirSesion(baseDatos, usuario.id, entrada.dispositivo);
  return { usuario, tokenAcceso: firmarTokenAcceso(usuario.id), tokenRenovacion };
}

// D-03 y D-17: rota la sesion. La fila anterior se revoca solo si sigue vigente: de dos
// renovaciones simultaneas, la segunda espera el bloqueo de la fila y ya no la encuentra vigente.
export async function renovar(entrada: EntradaTokenSesion): Promise<DatosRenovacion> {
  const tokenHash = hashTokenRenovacion(entrada.tokenRenovacion);
  const momento = ahora();

  const renovada = await baseDatos.$transaction(async (tx) => {
    const sesion = await tx.tokenRenovacion.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        usuarioId: true,
        dispositivo: true,
        expiraEn: true,
        revocadoEn: true,
        usuario: { select: { activo: true } },
      },
    });
    if (!sesion || sesion.revocadoEn || sesion.expiraEn <= momento || !sesion.usuario.activo) {
      return null;
    }

    const { count } = await tx.tokenRenovacion.updateMany({
      where: { id: sesion.id, revocadoEn: null, expiraEn: { gt: momento } },
      data: { revocadoEn: momento },
    });
    if (count !== 1) return null;

    const tokenRenovacion = await abrirSesion(
      tx,
      sesion.usuarioId,
      sesion.dispositivo ?? undefined,
    );
    return { usuarioId: sesion.usuarioId, tokenRenovacion };
  });

  if (!renovada) throw sesionInvalida();
  return {
    tokenAcceso: firmarTokenAcceso(renovada.usuarioId),
    tokenRenovacion: renovada.tokenRenovacion,
  };
}

// AUT-03 y D-17: revoca solo esa sesion y solo si es del usuario; si no, no hace nada.
export async function cerrarSesion(usuarioId: string, entrada: EntradaTokenSesion): Promise<void> {
  await baseDatos.tokenRenovacion.updateMany({
    where: {
      tokenHash: hashTokenRenovacion(entrada.tokenRenovacion),
      usuarioId,
      revocadoEn: null,
    },
    data: { revocadoEn: ahora() },
  });
}

// AUT-08 y D-18: perfil y membresias ACTIVO de barberias activas. autenticar ya verifico que el
// usuario existe y esta activo; si se borro justo despues, responde como una sesion invalida.
export async function consultarPerfil(usuarioId: string): Promise<PerfilUsuario> {
  const usuario = await baseDatos.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      ...seleccionUsuario,
      consentimientoIaEn: true,
      membresias: {
        where: { estado: 'ACTIVO', barberia: { activo: true } },
        orderBy: [{ barberia: { nombre: 'asc' } }, { id: 'asc' }],
        select: {
          id: true,
          rol: true,
          perfilBarbero: { select: { id: true } },
          barberia: { select: { id: true, nombre: true } },
        },
      },
    },
  });
  if (!usuario) throw sesionInvalida();

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    consentimientoIaEn: usuario.consentimientoIaEn?.toISOString() ?? null,
    membresias: usuario.membresias.map((membresia) => ({
      id: membresia.id,
      rol: membresia.rol,
      barberoId: membresia.rol === 'BARBERO' ? (membresia.perfilBarbero?.id ?? null) : null,
      barberia: { id: membresia.barberia.id, nombre: membresia.barberia.nombre },
    })),
  };
}

// AUT-05: solo nombre y telefono del usuario autenticado; el correo no cambia en el MVP.
// autenticar ya verifico la cuenta; si se borro o desactivo justo despues, responde como sesion invalida.
export async function editarPerfil(
  usuarioId: string,
  entrada: EntradaEdicionPerfil,
): Promise<UsuarioSesion> {
  try {
    return await baseDatos.usuario.update({
      where: { id: usuarioId, activo: true },
      data: { nombre: entrada.nombre, telefono: entrada.telefono },
      select: seleccionUsuario,
    });
  } catch (error) {
    if (esNoEncontrado(error)) throw sesionInvalida();
    throw error;
  }
}

// AUT-06, D-05: exige la actual; no revoca las demas sesiones. Los fallos (401) los cuenta
// limitarCambioClave por usuario (D-16).
export async function cambiarClave(usuarioId: string, entrada: EntradaCambioClave): Promise<void> {
  const usuario = await baseDatos.usuario.findUnique({
    where: { id: usuarioId },
    select: { claveHash: true, activo: true },
  });
  if (!usuario || !usuario.activo) throw sesionInvalida();
  if (!(await bcrypt.compare(entrada.claveActual, usuario.claveHash))) {
    throw claveActualIncorrecta();
  }

  const claveHash = await bcrypt.hash(entrada.claveNueva, COSTO_BCRYPT);
  try {
    await baseDatos.usuario.update({
      where: { id: usuarioId, activo: true },
      data: { claveHash },
      select: { id: true },
    });
  } catch (error) {
    if (esNoEncontrado(error)) throw sesionInvalida();
    throw error;
  }
}
