
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/apps/cash-out/src', '<rootDir>/apps/cash-out/test'],
};
