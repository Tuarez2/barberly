module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.prueba.tsx'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
