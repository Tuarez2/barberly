import pino from 'pino';

export const registro = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'authorization',
      'clave',
      'token',
      'tokenHash',
      'claveHash',
      'tokenAcceso',
      'tokenRenovacion',
      'imagen',
      'codigo',
      'codigoHash',
      'claveNueva',
      'claveActual',
      '*.authorization',
      '*.clave',
      '*.token',
      '*.tokenHash',
      '*.claveHash',
      '*.tokenAcceso',
      '*.tokenRenovacion',
      '*.imagen',
      '*.codigo',
      '*.codigoHash',
      '*.claveNueva',
      '*.claveActual',
    ],
    censor: '[oculto]',
  },
});
