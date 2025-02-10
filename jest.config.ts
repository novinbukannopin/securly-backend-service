import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'development'
  },
  restoreMocks: true,
  coveragePathIgnorePatterns: ['node_modules', 'src/config', 'src/app.ts', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html']
};
