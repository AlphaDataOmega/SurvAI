/**
 * Jest configuration for SurvAI MVP monorepo
 * 
 * Configures Jest to run tests across all packages
 * with proper TypeScript and React support.
 */

/** @type {import('jest').Config} */
const config = {
  // Enable projects configuration for monorepo
  projects: [
    // Backend tests
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/tests/backend/**/*.test.ts'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/backend/src/$1',
        '^@survai/shared$': '<rootDir>/shared/src',
      },
      collectCoverageFrom: [
        'backend/src/**/*.ts',
        '!backend/src/**/*.d.ts',
        '!backend/src/server.ts',
        '!backend/src/scripts/**',
      ],
      coverageDirectory: '<rootDir>/coverage/backend',
      roots: ['<rootDir>/tests/backend', '<rootDir>/backend'],
      moduleFileExtensions: ['ts', 'js', 'json'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
    },

    // Frontend tests
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '^@survai/shared$': '<rootDir>/shared/src',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      collectCoverageFrom: [
        'frontend/src/**/*.{ts,tsx}',
        '!frontend/src/**/*.d.ts',
        '!frontend/src/main.tsx',
        '!frontend/src/vite-env.d.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/frontend',
      roots: ['<rootDir>/tests/frontend', '<rootDir>/frontend'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
          },
        }],
      },
      globals: {
        'import.meta': {
          env: {
            DEV: true,
            VITE_API_URL: 'http://localhost:8000',
          },
        },
      },
    },

    // Shared package tests
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/tests/shared/**/*.test.ts'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/shared/setup.ts'],
      moduleNameMapper: {
        '^@survai/shared$': '<rootDir>/shared/src',
      },
      collectCoverageFrom: [
        'shared/src/**/*.ts',
        '!shared/src/**/*.d.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/shared',
      roots: ['<rootDir>/tests/shared', '<rootDir>/shared'],
      moduleFileExtensions: ['ts', 'js', 'json'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
    },
  ],

  // Global configuration
  collectCoverage: false, // Enable with --coverage flag
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Global thresholds
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // Watch mode configuration
  watchman: true,

  // Performance
  maxWorkers: '50%',
  
  // Error handling
  bail: false,
  verbose: true,
  
  // Global setup/teardown
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
}

module.exports = config