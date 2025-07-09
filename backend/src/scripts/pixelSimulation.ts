/**
 * @fileoverview Pixel firing simulation script
 * 
 * Manual pixel firing simulation for testing click tracking,
 * conversion attribution, and EPC calculation verification.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { trackingService } from '../services/trackingService';
import { calculateEPC } from '../utils/epcCalculator';
import type { TrackClickRequest } from '@survai/shared';

const prisma = new PrismaClient();

/**
 * Simulation configuration
 */
interface SimulationConfig {
  clicksCount: number;
  conversionRate: number; // Percentage (0-100)
  revenueMin: number;
  revenueMax: number;
  simulateDoubleConversions: boolean;
  delayBetweenOperations: number; // milliseconds
}

/**
 * Default simulation configuration
 */
const DEFAULT_CONFIG: SimulationConfig = {
  clicksCount: 10,
  conversionRate: 30, // 30% conversion rate
  revenueMin: 10.00,
  revenueMax: 50.00,
  simulateDoubleConversions: true,
  delayBetweenOperations: 100 // 100ms delay
};

/**
 * Simulation results
 */
interface SimulationResults {
  totalClicks: number;
  successfulClicks: number;
  failedClicks: number;
  totalConversions: number;
  doubleConversionAttempts: number;
  blockedDoubleConversions: number;
  totalRevenue: number;
  calculatedEPC: number;
  executionTime: number;
  errors: string[];
}

/**
 * Create test data for simulation
 */
async function createTestData(): Promise<{
  surveyId: string;
  questionId: string;
  offerId: string;
  sessionId: string;
}> {
  console.log('📝 Creating test data...');
  
  // Create test survey
  const survey = await prisma.survey.create({
    data: {
      title: 'Pixel Simulation Test Survey',
      description: 'Test survey for pixel simulation',
      status: 'ACTIVE',
      config: {}
    }
  });

  // Create test question
  const question = await prisma.question.create({
    data: {
      surveyId: survey.id,
      type: 'CTA_OFFER',
      text: 'Test question for pixel simulation',
      description: 'Simulated question for testing',
      order: 1,
      required: false,
      config: {}
    }
  });

  // Create test offer
  const offer = await prisma.offer.create({
    data: {
      title: 'Test Offer for Pixel Simulation',
      description: 'Test offer for pixel tracking simulation',
      category: 'TECHNOLOGY',
      status: 'ACTIVE',
      destinationUrl: 'https://example.com/offer?click_id={click_id}&survey_id={survey_id}',
      pixelUrl: 'https://example.com/pixel',
      config: { payout: 25.00, currency: 'USD' },
      metrics: {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0
      }
    }
  });

  // Create test session
  const sessionId = `sim-session-${uuidv4()}`;
  await prisma.surveyResponse.create({
    data: {
      surveyId: survey.id,
      sessionData: {
        sessionId: sessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'Pixel Simulation Script'
      },
      status: 'IN_PROGRESS'
    }
  });

  console.log(`✅ Test data created:
  - Survey ID: ${survey.id}
  - Question ID: ${question.id}
  - Offer ID: ${offer.id}
  - Session ID: ${sessionId}`);

  return {
    surveyId: survey.id,
    questionId: question.id,
    offerId: offer.id,
    sessionId: sessionId
  };
}

/**
 * Simulate a click tracking request
 */
async function simulateClick(
  sessionId: string,
  questionId: string,
  offerId: string,
  clickIndex: number
): Promise<{ clickId: string; success: boolean; error?: string }> {
  try {
    const trackRequest: TrackClickRequest = {
      sessionId: sessionId,
      questionId: questionId,
      offerId: offerId,
      buttonVariantId: `button-variant-${clickIndex}`,
      timestamp: Date.now(),
      userAgent: 'Pixel Simulation Script',
      ipAddress: '127.0.0.1'
    };

    const clickTrack = await trackingService.trackClick(trackRequest);
    
    return {
      clickId: clickTrack.session.clickId,
      success: true
    };
  } catch (error) {
    return {
      clickId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simulate a conversion
 */
async function simulateConversion(
  clickId: string,
  revenue?: number
): Promise<{ success: boolean; isIdempotent?: boolean; error?: string }> {
  try {
    const result = await trackingService.markConversion(clickId, revenue);
    
    return {
      success: true,
      isIdempotent: result.converted && result.convertedAt !== undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate random revenue amount
 */
function generateRandomRevenue(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Add delay between operations
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run pixel simulation
 */
async function runPixelSimulation(config: SimulationConfig = DEFAULT_CONFIG): Promise<SimulationResults> {
  console.log('🚀 Starting pixel simulation...');
  console.log(`Configuration:
  - Clicks: ${config.clicksCount}
  - Conversion Rate: ${config.conversionRate}%
  - Revenue Range: $${config.revenueMin} - $${config.revenueMax}
  - Simulate Double Conversions: ${config.simulateDoubleConversions}
  - Delay Between Operations: ${config.delayBetweenOperations}ms`);

  const startTime = Date.now();
  const results: SimulationResults = {
    totalClicks: 0,
    successfulClicks: 0,
    failedClicks: 0,
    totalConversions: 0,
    doubleConversionAttempts: 0,
    blockedDoubleConversions: 0,
    totalRevenue: 0,
    calculatedEPC: 0,
    executionTime: 0,
    errors: []
  };

  try {
    // Create test data
    const testData = await createTestData();
    
    // Track clicks
    console.log('\n📊 Simulating click tracking...');
    const clickIds: string[] = [];
    
    for (let i = 0; i < config.clicksCount; i++) {
      const clickResult = await simulateClick(
        testData.sessionId,
        testData.questionId,
        testData.offerId,
        i + 1
      );
      
      results.totalClicks++;
      
      if (clickResult.success) {
        results.successfulClicks++;
        clickIds.push(clickResult.clickId);
        console.log(`✅ Click ${i + 1}: ${clickResult.clickId}`);
      } else {
        results.failedClicks++;
        results.errors.push(`Click ${i + 1}: ${clickResult.error}`);
        console.log(`❌ Click ${i + 1}: ${clickResult.error}`);
      }
      
      await delay(config.delayBetweenOperations);
    }

    // Simulate conversions
    console.log('\n🎯 Simulating conversions...');
    const conversionCount = Math.floor(clickIds.length * (config.conversionRate / 100));
    
    for (let i = 0; i < conversionCount; i++) {
      const clickId = clickIds[i]!;
      const revenue = generateRandomRevenue(config.revenueMin, config.revenueMax);
      
      const conversionResult = await simulateConversion(clickId, revenue);
      
      if (conversionResult.success) {
        results.totalConversions++;
        results.totalRevenue += revenue;
        console.log(`✅ Conversion ${i + 1}: ${clickId} - $${revenue}`);
      } else {
        results.errors.push(`Conversion ${i + 1}: ${conversionResult.error}`);
        console.log(`❌ Conversion ${i + 1}: ${conversionResult.error}`);
      }
      
      await delay(config.delayBetweenOperations);
    }

    // Simulate double conversions (idempotent testing)
    if (config.simulateDoubleConversions && clickIds.length > 0) {
      console.log('\n🔄 Testing idempotent double conversions...');
      
      for (let i = 0; i < Math.min(3, clickIds.length); i++) {
        const clickId = clickIds[i]!;
        const revenue = generateRandomRevenue(config.revenueMin, config.revenueMax);
        
        results.doubleConversionAttempts++;
        const doubleConversionResult = await simulateConversion(clickId, revenue);
        
        if (doubleConversionResult.success && doubleConversionResult.isIdempotent) {
          results.blockedDoubleConversions++;
          console.log(`✅ Double conversion blocked (idempotent): ${clickId}`);
        } else {
          console.log(`❌ Double conversion not blocked: ${clickId}`);
          results.errors.push(`Double conversion not blocked: ${clickId}`);
        }
        
        await delay(config.delayBetweenOperations);
      }
    }

    // Calculate EPC
    if (results.successfulClicks > 0) {
      results.calculatedEPC = results.totalRevenue / results.successfulClicks;
    }

    // Verify EPC calculation
    console.log('\n🧮 Verifying EPC calculation...');
    const epcMetrics = calculateEPC(
      results.successfulClicks,
      results.totalConversions,
      results.totalRevenue
    );
    
    console.log(`Calculated EPC: $${results.calculatedEPC.toFixed(2)}`);
    console.log(`Utils EPC: $${epcMetrics.epc.toFixed(2)}`);
    console.log(`Conversion Rate: ${epcMetrics.conversionRate.toFixed(2)}%`);

    results.executionTime = Date.now() - startTime;

    // Clean up test data
    await cleanupTestData(testData.surveyId);

    return results;
  } catch (error) {
    results.errors.push(`Simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.executionTime = Date.now() - startTime;
    return results;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(surveyId: string): Promise<void> {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in order due to foreign key constraints
    await prisma.clickTrack.deleteMany({
      where: {
        offer: {
          title: 'Test Offer for Pixel Simulation'
        }
      }
    });
    
    await prisma.surveyResponse.deleteMany({
      where: { surveyId }
    });
    
    await prisma.question.deleteMany({
      where: { surveyId }
    });
    
    await prisma.offer.deleteMany({
      where: {
        title: 'Test Offer for Pixel Simulation'
      }
    });
    
    await prisma.survey.delete({
      where: { id: surveyId }
    });
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

/**
 * Print simulation results
 */
function printResults(results: SimulationResults): void {
  console.log('\n📈 SIMULATION RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Clicks: ${results.totalClicks}`);
  console.log(`Successful Clicks: ${results.successfulClicks}`);
  console.log(`Failed Clicks: ${results.failedClicks}`);
  console.log(`Total Conversions: ${results.totalConversions}`);
  console.log(`Double Conversion Attempts: ${results.doubleConversionAttempts}`);
  console.log(`Blocked Double Conversions: ${results.blockedDoubleConversions}`);
  console.log(`Total Revenue: $${results.totalRevenue.toFixed(2)}`);
  console.log(`Calculated EPC: $${results.calculatedEPC.toFixed(2)}`);
  console.log(`Execution Time: ${results.executionTime}ms`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('='.repeat(50));
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const config = { ...DEFAULT_CONFIG };
    
    // Simple argument parsing
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];
      
      switch (arg) {
        case '--clicks':
          config.clicksCount = parseInt(nextArg || '0') || config.clicksCount;
          i++;
          break;
        case '--conversion-rate':
          config.conversionRate = parseFloat(nextArg || '0') || config.conversionRate;
          i++;
          break;
        case '--revenue-min':
          config.revenueMin = parseFloat(nextArg || '0') || config.revenueMin;
          i++;
          break;
        case '--revenue-max':
          config.revenueMax = parseFloat(nextArg || '0') || config.revenueMax;
          i++;
          break;
        case '--no-double-conversions':
          config.simulateDoubleConversions = false;
          break;
        case '--delay':
          config.delayBetweenOperations = parseInt(nextArg || '0') || config.delayBetweenOperations;
          i++;
          break;
        case '--help':
          console.log(`
Pixel Simulation Script Usage:
  npm run simulate-pixels [options]

Options:
  --clicks <number>              Number of clicks to simulate (default: 10)
  --conversion-rate <percentage> Conversion rate percentage (default: 30)
  --revenue-min <amount>         Minimum revenue amount (default: 10.00)
  --revenue-max <amount>         Maximum revenue amount (default: 50.00)
  --no-double-conversions        Disable double conversion testing
  --delay <ms>                   Delay between operations in ms (default: 100)
  --help                         Show this help message

Examples:
  npm run simulate-pixels
  npm run simulate-pixels -- --clicks 20 --conversion-rate 40
  npm run simulate-pixels -- --revenue-min 5 --revenue-max 100
          `);
          return;
      }
    }
    
    // Run simulation
    const results = await runPixelSimulation(config);
    
    // Print results
    printResults(results);
    
    // Exit with appropriate code
    process.exit(results.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('💥 Simulation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the simulation if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { runPixelSimulation };
export type { SimulationConfig, SimulationResults };