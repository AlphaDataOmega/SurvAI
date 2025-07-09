/**
 * @fileoverview Shared package test setup
 * 
 * Setup configuration for shared types and utilities tests.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'

// Set test environment
process.env.NODE_ENV = 'test'

// Standard timeout for shared package tests
jest.setTimeout(5000)

/**
 * Global test setup
 */
beforeAll(() => {
  console.log('[TEST] Shared package test setup started')
  console.log('[TEST] Shared package test setup completed')
})

/**
 * Global test teardown
 */
afterAll(() => {
  console.log('[TEST] Shared package test teardown started')
  console.log('[TEST] Shared package test teardown completed')
})

/**
 * Test case setup
 */
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks()
})

/**
 * Test case teardown
 */
afterEach(() => {
  // Restore all mocks
  jest.restoreAllMocks()
})

export {}