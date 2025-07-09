/**
 * @fileoverview Global Jest setup
 * 
 * Runs before all test suites to set up the testing environment
 * for the SurvAI MVP monorepo.
 */

import dotenv from 'dotenv'

/**
 * Global setup function
 */
export default async function globalSetup(): Promise<void> {
  console.log('🚀 Setting up test environment...')

  // Load test environment variables
  dotenv.config({ path: '.env.test' })
  
  // Set test environment
  process.env.NODE_ENV = 'test'
  
  // Set test database URL if not already set
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = 'postgresql://survai_user:survai_password@localhost:5433/survai_test?schema=public'
  }
  
  // Set test Redis URL if not already set
  if (!process.env.TEST_REDIS_URL) {
    process.env.TEST_REDIS_URL = 'redis://localhost:6379/1'
  }

  // Disable console.log in tests unless DEBUG is set
  if (!process.env.DEBUG) {
    const originalLog = console.log
    console.log = (...args: any[]) => {
      if (args[0]?.includes?.('[TEST]')) {
        originalLog(...args)
      }
    }
  }

  console.log('✅ Test environment setup complete')
}