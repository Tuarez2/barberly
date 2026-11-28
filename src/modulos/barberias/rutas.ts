import { Router } from 'express';

import { autenticar, validar } from '../../compartido/middleware';
import * as controlador from './controlador';
import { esquemaConsultaBarberias, esquemaRegistroBarberia } from './esquemas';

export const rutasBarberias = Router();

// BUS-01 a BUS-04: listado publico para cualquier usuario autenticado (Pub).
// autenticar (401) → validar la consulta (422) → servicio. Sin contextoBarberia: no lee datos internos.
rutasBarberias.get('/', autenticar, validar(esquemaConsultaBarberias, 'query'), controlador.listar);

// AUT-10: cualquier usuario autenticado. autenticar (401) → validar (422) → servicio.
// Sin contextoBarberia: la barberia todavia no existe.
rutasBarberias.post('/', autenticar, validar(esquemaRegistroBarberia), controlador.registrar);
