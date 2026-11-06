import pino from 'pino';

export const registro = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'authorization',
      'clave',
      'token',
      'tokenHash',
      'imagen',
      '*.authorization',
      '*.clave',
      '*.token',
      '*.tokenHash',
      '*.imagen',
    ],
    censor: '[oculto]',
  },
});
