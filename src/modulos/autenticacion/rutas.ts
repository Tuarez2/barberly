import { Router } from 'express';

import {
  limitarInicioPorCuenta,
  limitarInicioPorIp,
  limitarRegistro,
} from '../../compartido/limites';
import { validar } from '../../compartido/middleware';
import * as controlador from './controlador';
import { esquemaInicioSesion, esquemaRegistro } from './esquemas';

export const rutasAutenticacion = Router();

// Cadena: limite de tasa → validar (422) → servicio.
rutasAutenticacion.post(
  '/registro',
  limitarRegistro,
  validar(esquemaRegistro),
  controlador.registrar,
);

// D-16: limite por IP → validar (422) → limite por cuenta, con el correo ya validado.
rutasAutenticacion.post(
  '/iniciar-sesion',
  limitarInicioPorIp,
  validar(esquemaInicioSesion),
  limitarInicioPorCuenta,
  controlador.iniciarSesion,
);
