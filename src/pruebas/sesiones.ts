import jwt from 'jsonwebtoken';

import { configuracion } from '../compartido/configuracion';
import { IDS_PRUEBA } from './fabricas';

export function tokenDePrueba(usuarioId: string = IDS_PRUEBA.usuario, expiraEnSegundos = 900) {
  return jwt.sign({}, configuracion.JWT_SECRETO, {
    algorithm: 'HS256',
    subject: usuarioId,
    expiresIn: expiraEnSegundos,
  });
}

export function cabeceraDePrueba(token = tokenDePrueba()) {
  return { Authorization: `Bearer ${token}` };
}
