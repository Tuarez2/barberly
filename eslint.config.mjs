// Configuracion de ESLint de la API.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const ignorados = {
  ignores: [
    '**/node_modules/',
    '**/dist/',
    '.claude/',
    'espacio-trabajo/.claude/',
    'src/generado/',
    '**/coverage/',
  ],
};

const reglasComunes = {
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
