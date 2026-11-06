import expo from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';

import { ignorados } from '../../eslint.config.mjs';

export default [
  ignorados,
  ...expo,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
];
