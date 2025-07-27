const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/node_modules/**',
    '!app/**/*.config.{js,ts}',
    '!app/**/coverage/**',
    '!app/**/.next/**',
    '!app/**/dist/**',
    '!app/**/__test__/**',
    '!app/**/*.test.{js,jsx,ts,tsx}',
    '!app/**/*.spec.{js,jsx,ts,tsx}',
    '!app/**/__tests__/**',
    '!app/**/__mocks__/**',
    '!app/**/test/**',
    '!app/**/tests/**',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/**/stories/**',
    '!app/**/storybook/**',
    '!app/**/.storybook/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/app/**/__test__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  watchPathIgnorePatterns: ['<rootDir>/.next/'],
  transformIgnorePatterns: [
    'node_modules/(?!((@remixicon)/.*|@next|@babel))',
  ],
  // React 19 specific settings
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Ensure proper module resolution for React 19
  moduleDirectories: ['node_modules', '<rootDir>'],
  // Add React 19 specific globals
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // React 19 specific transform settings
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
  },
  // React 19 specific extensions
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 