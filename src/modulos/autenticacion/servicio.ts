// Logica de autenticacion (AUT-01, SEG-06, §11.4, D-03, D-14).
import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { baseDatos } from '../../compartido/base-datos';
import { configuracion } from '../../compartido/configuracion';
import { ErrorNegocio } from '../../compartido/errores';
import { ahora } from '../../compartido/reloj';
import { Prisma } from '../../generado/prisma/client';
import type { EntradaRegistro, DatosSesion } from './esquemas';

const DIA_MS = 24 * 60 * 60 * 1000;
const COSTO_BCRYPT = 12; // SEG-06, §14.3: fijo, no configurable

// RNF-17: nunca claveHash ni tokenHash.
const seleccionUsuario = { id: true, nombre: true, correo: true, telefono: true } as const;

const correoRegistrado = () =>
  new ErrorNegocio('CORREO_REGISTRADO', 409, 'Ya existe una cuenta con ese correo');

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
  const tokenRenovacion = randomBytes(32).toString('base64url');
  const expiraEn = new Date(ahora().getTime() + configuracion.TOKEN_RENOVACION_DIAS * DIA_MS);

  try {
    const usuario = await baseDatos.$transaction(async (tx) => {
      const creado = await tx.usuario.create({
        data: {
          nombre: entrada.nombre,
          correo: entrada.correo,
          telefono: entrada.telefono,
          claveHash,
        },
        select: seleccionUsuario,
      });
      await tx.tokenRenovacion.create({
        data: {
          usuarioId: creado.id,
          tokenHash: hashTokenRenovacion(tokenRenovacion),
          expiraEn,
          dispositivo: entrada.dispositivo ?? null,
        },
      });
      return creado;
    });
    return { usuario, tokenAcceso: firmarTokenAcceso(usuario.id), tokenRenovacion };
  } catch (error) {
    // Dos registros simultaneos con el mismo correo: el indice unico decide.
    if (esCorreoDuplicado(error)) throw correoRegistrado();
    throw error;
  }
}
