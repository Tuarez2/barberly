// Logica de autenticacion (AUT-01, AUT-02, SEG-06, §11.4, D-03, D-05, D-14, D-16).
import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { baseDatos } from '../../compartido/base-datos';
import { configuracion } from '../../compartido/configuracion';
import { ErrorNegocio } from '../../compartido/errores';
import { ahora } from '../../compartido/reloj';
import { Prisma } from '../../generado/prisma/client';
import type { DatosSesion, EntradaInicioSesion, EntradaRegistro } from './esquemas';

const DIA_MS = 24 * 60 * 60 * 1000;
const COSTO_BCRYPT = 12; // SEG-06, §14.3: fijo, no configurable

// RNF-17: nunca claveHash ni tokenHash.
const seleccionUsuario = { id: true, nombre: true, correo: true, telefono: true } as const;

const correoRegistrado = () =>
  new ErrorNegocio('CORREO_REGISTRADO', 409, 'Ya existe una cuenta con ese correo');

// §11.4 y D-05: el mismo error si falta el correo, la clave no coincide o la cuenta esta inactiva.
const credencialesInvalidas = () =>
  new ErrorNegocio('CREDENCIALES_INVALIDAS', 401, 'Correo o contraseña incorrectos');

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

function esCorreoDuplicado(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
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
    if (esCorreoDuplicado(error)) throw correoRegistrado();
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
