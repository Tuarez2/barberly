import { Router } from 'express';

import {
  limitarCambioClave,
  limitarInicioPorCuenta,
  limitarInicioPorIp,
  limitarRegistro,
} from '../../compartido/limites';
import { autenticar, validar } from '../../compartido/middleware';
import * as controlador from './controlador';
import {
  esquemaCambioClave,
  esquemaEdicionPerfil,
  esquemaInicioSesion,
  esquemaRegistro,
  esquemaTokenSesion,
} from './esquemas';

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

// D-17: el token de renovacion tiene 256 bits; basta el limite general de app.ts.
rutasAutenticacion.post('/renovar', validar(esquemaTokenSesion), controlador.renovar);

// AUT-03: autenticar (401) → validar (422) → servicio.
rutasAutenticacion.post(
  '/cerrar-sesion',
  autenticar,
  validar(esquemaTokenSesion),
  controlador.cerrarSesion,
);

// Montado en /usuarios (D-18).
export const rutasUsuarios = Router();

rutasUsuarios.get('/yo', autenticar, controlador.consultarPerfil);

// AUT-05: autenticar (401) → validar (422) → servicio.
rutasUsuarios.patch('/yo', autenticar, validar(esquemaEdicionPerfil), controlador.editarPerfil);

// AUT-06 y D-16: autenticar (401) → validar (422) → limite por usuario (429) → servicio.
rutasUsuarios.patch(
  '/yo/clave',
  autenticar,
  validar(esquemaCambioClave),
  limitarCambioClave,
  controlador.cambiarClave,
);
