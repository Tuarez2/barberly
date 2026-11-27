import { Router } from 'express';

import { autenticar, validar } from '../../compartido/middleware';
import * as controlador from './controlador';
import { esquemaRegistroBarberia } from './esquemas';

export const rutasBarberias = Router();

// AUT-10: cualquier usuario autenticado. autenticar (401) → validar (422) → servicio.
// Sin contextoBarberia: la barberia todavia no existe.
rutasBarberias.post('/', autenticar, validar(esquemaRegistroBarberia), controlador.registrar);
