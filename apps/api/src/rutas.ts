import { Router } from 'express';

export const rutas = Router();

rutas.get('/salud', (_req, res) => {
  res.status(200).json({ datos: { estado: 'ok' } });
});

// Cada modulo se registra aqui: rutas.use('/autenticacion', rutasAutenticacion).
