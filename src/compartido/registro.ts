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
      '*.authorization',
      '*.clave',
      '*.token',
      '*.tokenHash',
      '*.claveHash',
      '*.tokenAcceso',
      '*.tokenRenovacion',
      '*.imagen',
    ],
    censor: '[oculto]',
  },
});
