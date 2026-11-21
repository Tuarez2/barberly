import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { configuracion } from './compartido/configuracion';
import { ErrorNegocio } from './compartido/errores';
import { manejarErrores } from './compartido/middleware';
import { registro } from './compartido/registro';
import { rutas } from './rutas';

export const app = express();

app.use(helmet());
app.use(cors({ origin: configuracion.ORIGENES_CORS }));
app.use(
  rateLimit({
    windowMs: 60_000,
    // Valor provisional: DERCAS solo fija limites de inicio de sesion y registro (SEG-09).
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new ErrorNegocio('DEMASIADAS_SOLICITUDES', 429, 'Demasiados intentos'));
    },
  }),
);
app.use((req, res, next) => {
  const inicio = performance.now();
  res.on('finish', () => {
    // req.path y no la URL completa: la consulta puede llevar datos sensibles.
    registro.info({
      metodo: req.method,
      ruta: req.path,
      estado: res.statusCode,
      duracionMs: Math.round(performance.now() - inicio),
    });
  });
  next();
});
app.use(express.json());

app.use('/api/v1', rutas);

app.use((_req, _res, next) => {
  next(new ErrorNegocio('NO_ENCONTRADO', 404, 'No encontramos ese recurso'));
});
app.use(manejarErrores);
