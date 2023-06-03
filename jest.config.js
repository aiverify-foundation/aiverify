const config = {
  "rootDir": "./",
  "testEnvironment": 'node',
  "moduleNameMapper": {
     "#lib/(.*)": "<rootDir>/lib/$1",
     "$models/(.*)": "<rootDir>/models/$1",
     "#models": "<rootDir>/models",
     "#graphql/(.*)": "<rootDir>/graphql/$1",
     "#routes/(.*)": "<rootDir>/routes/$1",
     "#testutil/(.*)": "<rootDir>/testutil/$1",
     "#mocks/(.*)": "<rootDir>/__mocks__/$1",
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "**/__tests__/**/*.mjs",
    "**/?(*.)+(spec|test).mjs",
  ],
  collectCoverageFrom: [
    '(lib|models|routes)/**/*.{js,mjs,ts}',
    'graphql/modules/**/*.{js,mjs,ts}',
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/testutil/",
    "/lib/apolloPubSub.mjs",
    "/lib/mongodb.mjs",
    "/lib/redisClient.mjs",
  ],
  "globalSetup": "<rootDir>/testutil/globalSetup.mjs",
  "globalTeardown": "<rootDir>/testutil/globalTeardown.mjs",
  "setupFilesAfterEnv": [
    "<rootDir>/testutil/setupJest.mjs"
  ],
  transform: {},
  reporters: [
    "default",
    [
      "jest-html-reporter", {"pageTitle": "Test Report"},
    ]
  ],
  testResultsProcessor: "./node_modules/jest-json-reporter",
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageProvider: "v8",
  coverageReporters: ["html", "json-summary", "text"],
  reporters: [
    "default",
    [
      "jest-html-reporter", {"pageTitle": "Test Report"},
    ]
  ],
  testResultsProcessor: "./node_modules/jest-json-reporter",
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageProvider: "v8",
  coverageReporters: ["html", "json-summary"],
 }

module.exports = config;