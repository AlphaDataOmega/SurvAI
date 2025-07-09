/**
 * @fileoverview Integration tests for pixel simulation
 * 
 * Tests for pixel firing simulation functionality with database integration
 * and performance testing to ensure sub-200ms response times.
 */

import { PrismaClient } from '@prisma/client';
import { runPixelSimulation, SimulationConfig } from '../../backend/src/scripts/pixelSimulation';
import { trackingService } from '../../backend/src/services/trackingService';
import { calculateEPC } from '../../backend/src/utils/epcCalculator';

const prisma = new PrismaClient();

describe('Pixel Simulation Integration', () => {
  let testSurveyId: string;
  let testQuestionId: string;
  let testOfferId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Set up test data
    testSessionId = 'test-simulation-session-123';

    const testSurvey = await prisma.survey.create({
      data: {
        title: 'Test Simulation Survey',
        description: 'Integration test survey for pixel simulation',
        status: 'ACTIVE',
        config: {},
      },
    });
    testSurveyId = testSurvey.id;

    const testQuestion = await prisma.question.create({
      data: {
        surveyId: testSurveyId,
        type: 'CTA_OFFER',
        text: 'Which service interests you most?',
        description: 'Select your preferred service type',
        config: { maxButtons: 3 },
        options: [],
        order: 1,
        required: false,
      },
    });
    testQuestionId = testQuestion.id;

    const testOffer = await prisma.offer.create({
      data: {
        title: 'Test Simulation Offer',
        description: 'Test offer for pixel simulation',
        category: 'TECHNOLOGY',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/test?click_id={click_id}&survey_id={survey_id}&ref=test',
        pixelUrl: 'https://tracking.example.com/conversion',
        config: {
          payout: 30.00,
          currency: 'USD',
          dailyClickCap: 1000,
        },
        metrics: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: 0,
        },
      },
    });
    testOfferId = testOffer.id;

    // Create a survey response for testing
    await prisma.surveyResponse.create({
      data: {
        surveyId: testSurveyId,
        sessionData: {
          sessionId: testSessionId,
          clickId: 'test-click-123',
          ipAddress: '127.0.0.1',
          userAgent: 'Integration Test Browser',
        },
        status: 'IN_PROGRESS',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.clickTrack.deleteMany({
      where: { offerId: testOfferId },
    });
    await prisma.surveyResponse.deleteMany({
      where: { surveyId: testSurveyId },
    });
    await prisma.question.deleteMany({
      where: { surveyId: testSurveyId },
    });
    await prisma.offer.deleteMany({
      where: { id: testOfferId },
    });
    await prisma.survey.deleteMany({
      where: { id: testSurveyId },
    });
    await prisma.$disconnect();
  });

  describe('Pixel Simulation Core Functionality', () => {
    it('should run basic pixel simulation successfully', async () => {
      const config: SimulationConfig = {
        clicksCount: 5,
        conversionRate: 40,
        revenueMin: 10.00,
        revenueMax: 30.00,
        simulateDoubleConversions: true,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(5);
      expect(results.successfulClicks).toBe(5);
      expect(results.failedClicks).toBe(0);
      expect(results.totalConversions).toBe(2); // 40% of 5 clicks
      expect(results.doubleConversionAttempts).toBeGreaterThan(0);
      expect(results.blockedDoubleConversions).toBe(results.doubleConversionAttempts);
      expect(results.totalRevenue).toBeGreaterThan(0);
      expect(results.calculatedEPC).toBeGreaterThan(0);
      expect(results.executionTime).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(0);
    }, 30000); // 30 second timeout

    it('should handle zero conversion rate', async () => {
      const config: SimulationConfig = {
        clicksCount: 3,
        conversionRate: 0,
        revenueMin: 10.00,
        revenueMax: 30.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(3);
      expect(results.successfulClicks).toBe(3);
      expect(results.totalConversions).toBe(0);
      expect(results.totalRevenue).toBe(0);
      expect(results.calculatedEPC).toBe(0);
      expect(results.doubleConversionAttempts).toBe(0);
      expect(results.errors).toHaveLength(0);
    }, 15000);

    it('should handle 100% conversion rate', async () => {
      const config: SimulationConfig = {
        clicksCount: 3,
        conversionRate: 100,
        revenueMin: 15.00,
        revenueMax: 25.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(3);
      expect(results.successfulClicks).toBe(3);
      expect(results.totalConversions).toBe(3);
      expect(results.totalRevenue).toBeGreaterThan(0);
      expect(results.calculatedEPC).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(0);
    }, 15000);

    it('should verify EPC calculation accuracy', async () => {
      const config: SimulationConfig = {
        clicksCount: 4,
        conversionRate: 50,
        revenueMin: 20.00,
        revenueMax: 20.00, // Fixed revenue for predictable testing
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(4);
      expect(results.totalConversions).toBe(2);
      expect(results.totalRevenue).toBe(40.00); // 2 conversions * $20.00
      expect(results.calculatedEPC).toBe(10.00); // $40.00 / 4 clicks

      // Verify using EPC calculator utility
      const epcMetrics = calculateEPC(
        results.successfulClicks,
        results.totalConversions,
        results.totalRevenue
      );
      expect(epcMetrics.epc).toBe(results.calculatedEPC);
      expect(epcMetrics.conversionRate).toBe(50.00);
    }, 15000);
  });

  describe('Performance Testing', () => {
    it('should complete simulation within reasonable time', async () => {
      const config: SimulationConfig = {
        clicksCount: 10,
        conversionRate: 30,
        revenueMin: 10.00,
        revenueMax: 50.00,
        simulateDoubleConversions: true,
        delayBetweenOperations: 50
      };

      const startTime = Date.now();
      const results = await runPixelSimulation(config);
      const totalTime = Date.now() - startTime;

      expect(results).toBeDefined();
      expect(results.executionTime).toBeLessThan(15000); // Should complete in under 15 seconds
      expect(totalTime).toBeLessThan(20000); // Total test time under 20 seconds
    }, 25000);

    it('should maintain sub-200ms response times for individual operations', async () => {
      const config: SimulationConfig = {
        clicksCount: 5,
        conversionRate: 50,
        revenueMin: 10.00,
        revenueMax: 30.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 0 // No artificial delay
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.successfulClicks).toBe(5);
      
      // Calculate average time per operation
      const totalOperations = results.totalClicks + results.totalConversions;
      const avgTimePerOperation = results.executionTime / totalOperations;
      
      // Should be well under 200ms per operation
      expect(avgTimePerOperation).toBeLessThan(200);
    }, 15000);

    it('should handle concurrent operations efficiently', async () => {
      const config: SimulationConfig = {
        clicksCount: 8,
        conversionRate: 25,
        revenueMin: 15.00,
        revenueMax: 35.00,
        simulateDoubleConversions: true,
        delayBetweenOperations: 0
      };

      const startTime = Date.now();
      const results = await runPixelSimulation(config);
      const endTime = Date.now();

      expect(results).toBeDefined();
      expect(results.successfulClicks).toBe(8);
      expect(results.totalConversions).toBe(2);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete quickly without delays
    }, 15000);
  });

  describe('Database Integration and Cleanup', () => {
    it('should properly clean up test data', async () => {
      const config: SimulationConfig = {
        clicksCount: 3,
        conversionRate: 33,
        revenueMin: 10.00,
        revenueMax: 30.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      // Count records before simulation
      const clicksBefore = await prisma.clickTrack.count();
      const surveysBefore = await prisma.survey.count();
      const offersBefore = await prisma.offer.count();

      const results = await runPixelSimulation(config);

      // Count records after simulation (should be same as before due to cleanup)
      const clicksAfter = await prisma.clickTrack.count();
      const surveysAfter = await prisma.survey.count();
      const offersAfter = await prisma.offer.count();

      expect(results).toBeDefined();
      expect(results.errors).toHaveLength(0);
      expect(clicksAfter).toBe(clicksBefore);
      expect(surveysAfter).toBe(surveysBefore);
      expect(offersAfter).toBe(offersBefore);
    }, 15000);

    it('should handle database transaction rollbacks', async () => {
      const config: SimulationConfig = {
        clicksCount: 2,
        conversionRate: 50,
        revenueMin: 10.00,
        revenueMax: 30.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.successfulClicks).toBe(2);
      expect(results.totalConversions).toBe(1);
      expect(results.errors).toHaveLength(0);

      // Verify no test data remains
      const simulationClicks = await prisma.clickTrack.count({
        where: {
          offer: {
            title: 'Test Offer for Pixel Simulation'
          }
        }
      });
      expect(simulationClicks).toBe(0);
    }, 15000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig: SimulationConfig = {
        clicksCount: -1,
        conversionRate: 150, // Invalid percentage
        revenueMin: -10.00,
        revenueMax: 5.00, // Max less than min
        simulateDoubleConversions: true,
        delayBetweenOperations: -100
      };

      // Should not throw, but may have errors in results
      const results = await runPixelSimulation(invalidConfig);

      expect(results).toBeDefined();
      expect(results.executionTime).toBeGreaterThan(0);
      // May have errors due to invalid configuration, but should not crash
    }, 15000);

    it('should handle empty simulation', async () => {
      const emptyConfig: SimulationConfig = {
        clicksCount: 0,
        conversionRate: 0,
        revenueMin: 10.00,
        revenueMax: 30.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(emptyConfig);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(0);
      expect(results.successfulClicks).toBe(0);
      expect(results.totalConversions).toBe(0);
      expect(results.totalRevenue).toBe(0);
      expect(results.calculatedEPC).toBe(0);
      expect(results.doubleConversionAttempts).toBe(0);
      expect(results.executionTime).toBeGreaterThan(0);
    }, 15000);

    it('should handle revenue range edge cases', async () => {
      const edgeConfig: SimulationConfig = {
        clicksCount: 2,
        conversionRate: 100,
        revenueMin: 0.01, // Minimum revenue
        revenueMax: 0.01, // Same as min
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(edgeConfig);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(2);
      expect(results.totalConversions).toBe(2);
      expect(results.totalRevenue).toBe(0.02); // 2 conversions * $0.01
      expect(results.calculatedEPC).toBe(0.01); // $0.02 / 2 clicks
    }, 15000);
  });

  describe('Idempotent Conversion Testing', () => {
    it('should verify double conversion prevention', async () => {
      const config: SimulationConfig = {
        clicksCount: 3,
        conversionRate: 100,
        revenueMin: 20.00,
        revenueMax: 20.00,
        simulateDoubleConversions: true,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(3);
      expect(results.totalConversions).toBe(3);
      expect(results.doubleConversionAttempts).toBeGreaterThan(0);
      expect(results.blockedDoubleConversions).toBe(results.doubleConversionAttempts);
      expect(results.totalRevenue).toBe(60.00); // Should not be doubled
      expect(results.errors).toHaveLength(0);
    }, 15000);

    it('should test individual idempotent conversion', async () => {
      // Create a test click manually
      const clickTrack = await trackingService.trackClick({
        sessionId: testSessionId,
        questionId: testQuestionId,
        offerId: testOfferId,
        buttonVariantId: 'test-button-123',
        timestamp: Date.now()
      });

      // First conversion
      const firstConversion = await trackingService.markConversion(
        clickTrack.session.clickId,
        25.00
      );
      
      expect(firstConversion.converted).toBe(true);
      expect(firstConversion.revenue).toBe(25.00);

      // Second conversion attempt (should be idempotent)
      const secondConversion = await trackingService.markConversion(
        clickTrack.session.clickId,
        50.00 // Different revenue amount
      );
      
      expect(secondConversion.converted).toBe(true);
      expect(secondConversion.revenue).toBe(25.00); // Should retain original revenue
      expect(secondConversion.convertedAt).toEqual(firstConversion.convertedAt);

      // Clean up
      await prisma.clickTrack.delete({
        where: { id: clickTrack.id }
      });
    }, 15000);
  });

  describe('Analytics Integration', () => {
    it('should integrate with analytics calculation', async () => {
      const config: SimulationConfig = {
        clicksCount: 5,
        conversionRate: 40,
        revenueMin: 25.00,
        revenueMax: 25.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 50
      };

      const results = await runPixelSimulation(config);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(5);
      expect(results.totalConversions).toBe(2);
      expect(results.totalRevenue).toBe(50.00);
      expect(results.calculatedEPC).toBe(10.00);

      // Verify analytics utility matches simulation results
      const analyticsResults = calculateEPC(
        results.successfulClicks,
        results.totalConversions,
        results.totalRevenue
      );

      expect(analyticsResults.epc).toBe(results.calculatedEPC);
      expect(analyticsResults.conversionRate).toBe(40.00);
      expect(analyticsResults.totalClicks).toBe(results.successfulClicks);
      expect(analyticsResults.totalConversions).toBe(results.totalConversions);
      expect(analyticsResults.totalRevenue).toBe(results.totalRevenue);
    }, 15000);
  });

  describe('Memory and Resource Management', () => {
    it('should handle larger simulations without memory issues', async () => {
      const largeConfig: SimulationConfig = {
        clicksCount: 50,
        conversionRate: 20,
        revenueMin: 5.00,
        revenueMax: 100.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 10
      };

      const results = await runPixelSimulation(largeConfig);

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(50);
      expect(results.successfulClicks).toBe(50);
      expect(results.totalConversions).toBe(10); // 20% of 50
      expect(results.totalRevenue).toBeGreaterThan(0);
      expect(results.calculatedEPC).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(0);
    }, 45000); // Longer timeout for larger simulation

    it('should complete quickly with no delays', async () => {
      const quickConfig: SimulationConfig = {
        clicksCount: 10,
        conversionRate: 30,
        revenueMin: 10.00,
        revenueMax: 50.00,
        simulateDoubleConversions: false,
        delayBetweenOperations: 0
      };

      const startTime = Date.now();
      const results = await runPixelSimulation(quickConfig);
      const endTime = Date.now();

      expect(results).toBeDefined();
      expect(results.totalClicks).toBe(10);
      expect(results.totalConversions).toBe(3);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in under 3 seconds
    }, 10000);
  });
});