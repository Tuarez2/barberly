import { Router } from 'express';

import { limitarRegistro } from '../../compartido/limites';
import { validar } from '../../compartido/middleware';
import * as controlador from './controlador';
import { esquemaRegistro } from './esquemas';

export const rutasAutenticacion = Router();

// Cadena: limite de tasa → validar (422) → servicio.
rutasAutenticacion.post(
  '/registro',
  limitarRegistro,
  validar(esquemaRegistro),
  controlador.registrar,
);
