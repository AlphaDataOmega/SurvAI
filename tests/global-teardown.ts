/**
 * @fileoverview Global Jest teardown
 * 
 * Runs after all test suites to clean up the testing environment
 * for the SurvAI MVP monorepo.
 */

/**
 * Global teardown function
 */
export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up test environment...')

  // Clean up any global resources
  // Note: Individual test suites should handle their own cleanup
  
  // Force exit if needed
  if (process.env.FORCE_EXIT) {
    setTimeout(() => {
      console.log('⚠️  Forcing exit after timeout')
      process.exit(0)
    }, 5000)
  }

  console.log('✅ Test environment cleanup complete')
}