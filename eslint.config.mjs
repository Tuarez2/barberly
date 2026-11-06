// Configuracion compartida: apps/api y apps/movil la importan y agregan lo suyo.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export const ignorados = {
  ignores: [
    '**/node_modules/',
    '**/dist/',
    '**/.expo/',
    '**/coverage/',
    'apps/movil/android/',
    'apps/movil/ios/',
  ],
};

export const reglasComunes = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};

export default tseslint.config(
  ignorados,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reglasComunes,
  prettier,
);
