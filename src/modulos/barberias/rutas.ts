import { Router } from 'express';

import { autenticar, validar } from '../../compartido/middleware';
import * as controlador from './controlador';
import {
  esquemaConsultaBarberias,
  esquemaConsultaSinParametros,
  esquemaRegistroBarberia,
} from './esquemas';

export const rutasBarberias = Router();

// BUS-01 a BUS-04: listado publico para cualquier usuario autenticado (Pub).
// autenticar (401) → validar la consulta (422) → servicio. Sin contextoBarberia: no lee datos internos.
rutasBarberias.get('/', autenticar, validar(esquemaConsultaBarberias, 'query'), controlador.listar);

// AUT-10: cualquier usuario autenticado. autenticar (401) → validar (422) → servicio.
// Sin contextoBarberia: la barberia todavia no existe.
rutasBarberias.post('/', autenticar, validar(esquemaRegistroBarberia), controlador.registrar);

// BUS-05 a BUS-08, D-32: detalle, servicios y barberos para cualquier usuario autenticado (Pub).
// autenticar (401) → validar la consulta, sin parametros (422) → visibilidad en el servicio (404).
// Sin contextoBarberia: el publico tambien entra, y el miembro ACTIVO la ve aunque este inactiva.
const sinParametros = validar(esquemaConsultaSinParametros, 'query');
rutasBarberias.get('/:id', autenticar, sinParametros, controlador.detalle);
rutasBarberias.get('/:id/servicios', autenticar, sinParametros, controlador.listarServicios);
rutasBarberias.get('/:id/barberos', autenticar, sinParametros, controlador.listarBarberos);
