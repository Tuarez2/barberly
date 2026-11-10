import { Router } from 'express';

import { configuracion } from './compartido/configuracion';
import { generarDocumentacion } from './compartido/documentacion';

export const rutas = Router();

rutas.get('/salud', (_req, res) => {
  res.status(200).json({ datos: { estado: 'ok' } });
});

// §10.7: solo fuera de produccion. Se revisa en cada peticion; en produccion sigue al 404 NO_ENCONTRADO.
let documentacion: ReturnType<typeof generarDocumentacion> | undefined;
rutas.get('/documentacion', (_req, res, next) => {
  if (configuracion.NODE_ENV === 'production') {
    next();
    return;
  }
  documentacion ??= generarDocumentacion();
  res.status(200).json(documentacion);
});

// Cada modulo se registra aqui: rutas.use('/autenticacion', rutasAutenticacion).
