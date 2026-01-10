const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/test/**/*.test.js',
    '**/test/**/*.test.ts',
    '**/test/**/*.test.tsx'
  ],
  transform: {
    '^.+\.js$': 'babel-jest',
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^/workers/DescriptiveStatistics/(.*)$': '<rootDir>/public/workers/DescriptiveStatistics/$1',
    '^d3$': '<rootDir>/__mocks__/d3.js',
    '^d3-(.*)$': '<rootDir>/__mocks__/d3-$1.js'
  },
  collectCoverageFrom: [
    'public/workers/DescriptiveStatistics/**/*.js',
    '!public/workers/DescriptiveStatistics/**/*.test.js',
    '!public/workers/DescriptiveStatistics/test/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 30000,
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  maxWorkers: process.env.CI ? "50%" : 2,
  testPathIgnorePatterns: [
    "<rootDir>/components/Modals/Edit/FindReplace/hooks/__test__/useFindReplaceForm.test.ts",
    "<rootDir>/components/Modals/Edit/GoTo/__tests__/GoToContent.test.tsx",
    "<rootDir>/components/Modals/Data/DefineVarProps/__tests__/VariablesToScan.test.tsx",
    "<rootDir>/components/Modals/Data/DefineVarProps/__tests__/PropertiesEditor.test.tsx",
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)