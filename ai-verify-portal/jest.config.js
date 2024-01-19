/* eslint-disable @typescript-eslint/no-var-requires */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  reporters: ['default', ['jest-html-reporter', { pageTitle: 'Test Report' }]],
  testResultsProcessor: './node_modules/jest-json-reporter',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageProvider: 'v8',
  coverageReporters: ['html', 'json-summary', 'text'],
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    'server/(.*)': '<rootDir>/server/$1',
  },
  watchPathIgnorePatterns: [
    '<rootDir>/test-report.html',
    '<rootDir>/test-results.json',
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!uuid)",
    "/node_modules/(?!(@rjsf/core|nanoid)).+\\.js$"
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
