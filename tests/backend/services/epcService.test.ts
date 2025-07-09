/**
 * @fileoverview Unit tests for EPCService
 * 
 * Tests for EPC calculation, offer performance tracking, and database updates
 * in the EPC calculation system.
 */

import { EPCService } from '../../../backend/src/services/epcService';
import { calculateEPC } from '../../../backend/src/utils/epcCalculator';
import { getDateDaysAgo } from '../../../backend/src/utils/time';
import type { EPCMetrics } from '@survai/shared';

// Mock utilities
jest.mock('../../../backend/src/utils/epcCalculator');
jest.mock('../../../backend/src/utils/time');

const mockCalculateEPC = calculateEPC as jest.MockedFunction<typeof calculateEPC>;
const mockGetDateDaysAgo = getDateDaysAgo as jest.MockedFunction<typeof getDateDaysAgo>;

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaInstance = {
    offer: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    clickTrack: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaInstance),
    Prisma: {
      TransactionClient: jest.fn(),
    },
  };
});

// Import the mocked Prisma to access the instance
import { PrismaClient } from '@prisma/client';
const mockPrismaInstance = new (PrismaClient as jest.MockedClass<typeof PrismaClient>)();

describe('EPCService', () => {
  let epcService: EPCService;
  
  beforeEach(() => {
    epcService = new EPCService();
    jest.clearAllMocks();
    
    // Mock getDateDaysAgo to return a fixed date for testing
    const sevenDaysAgo = new Date('2023-01-01T00:00:00.000Z');
    mockGetDateDaysAgo.mockReturnValue(sevenDaysAgo);
  });

  describe('calculateEPC', () => {
    const offerId = 'offer-123';
    
    it('should calculate EPC correctly with valid data', async () => {
      // ARRANGE: Mock 100 clicks, 15 conversions, $375.00 revenue
      const mockClickData = [
        ...Array(85).fill({ converted: false, revenue: null }), // 85 non-converted clicks
        ...Array(15).fill({ converted: true, revenue: 25.00 }), // 15 converted clicks at $25.00 each
      ];
      
      const expectedEPCMetrics: EPCMetrics = {
        totalClicks: 100,
        totalConversions: 15,
        totalRevenue: 375.00,
        conversionRate: 15.0,
        epc: 3.75,
        lastUpdated: new Date()
      };
      
      mockPrismaInstance.offer.findUnique.mockResolvedValue({
        id: offerId,
        status: 'ACTIVE'
      });
      
      mockPrismaInstance.clickTrack.findMany.mockResolvedValue(mockClickData);
      mockCalculateEPC.mockReturnValue(expectedEPCMetrics);
      
      // ACT
      const result = await epcService.calculateEPC(offerId);
      
      // ASSERT
      expect(result).toBe(3.75);
      expect(mockPrismaInstance.offer.findUnique).toHaveBeenCalledWith({
        where: { id: offerId },
        select: { id: true, status: true }
      });
      expect(mockPrismaInstance.clickTrack.findMany).toHaveBeenCalledWith({
        where: {
          offerId,
          clickedAt: { gte: expect.any(Date) }
        },
        select: {
          converted: true,
          revenue: true
        }
      });
      expect(mockCalculateEPC).toHaveBeenCalledWith(100, 15, 375.00);
      expect(mockGetDateDaysAgo).toHaveBeenCalledWith(7);
    });

    it('should return 0 for zero clicks', async () => {
      // ARRANGE: No clicks in the time window
      const expectedEPCMetrics: EPCMetrics = {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0,
        lastUpdated: new Date()
      };
      
      mockPrismaInstance.offer.findUnique.mockResolvedValue({
        id: offerId,
        status: 'ACTIVE'
      });
      
      mockPrismaInstance.clickTrack.findMany.mockResolvedValue([]);
      mockCalculateEPC.mockReturnValue(expectedEPCMetrics);
      
      // ACT
      const result = await epcService.calculateEPC(offerId);
      
      // ASSERT
      expect(result).toBe(0);
      expect(mockCalculateEPC).toHaveBeenCalledWith(0, 0, 0);
    });

    it('should return 0 for clicks without conversions', async () => {
      // ARRANGE: 50 clicks, but no conversions
      const mockClickData = Array(50).fill({ converted: false, revenue: null });
      
      const expectedEPCMetrics: EPCMetrics = {
        totalClicks: 50,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0,
        lastUpdated: new Date()
      };
      
      mockPrismaInstance.offer.findUnique.mockResolvedValue({
        id: offerId,
        status: 'ACTIVE'
      });
      
      mockPrismaInstance.clickTrack.findMany.mockResolvedValue(mockClickData);
      mockCalculateEPC.mockReturnValue(expectedEPCMetrics);
      
      // ACT
      const result = await epcService.calculateEPC(offerId);
      
      // ASSERT
      expect(result).toBe(0);
      expect(mockCalculateEPC).toHaveBeenCalledWith(50, 0, 0);
    });

    it('should handle only 7-day window', async () => {
      // ARRANGE: Test that the date filter is applied correctly
      const sevenDaysAgo = new Date('2023-01-01T00:00:00.000Z');
      
      mockPrismaInstance.offer.findUnique.mockResolvedValue({
        id: offerId,
        status: 'ACTIVE'
      });
      
      mockPrismaInstance.clickTrack.findMany.mockResolvedValue([]);
      mockCalculateEPC.mockReturnValue({
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0,
        lastUpdated: new Date()
      });
      
      // ACT
      await epcService.calculateEPC(offerId);
      
      // ASSERT
      expect(mockGetDateDaysAgo).toHaveBeenCalledWith(7);
      expect(mockPrismaInstance.clickTrack.findMany).toHaveBeenCalledWith({
        where: {
          offerId,
          clickedAt: { gte: sevenDaysAgo }
        },
        select: {
          converted: true,
          revenue: true
        }
      });
    });

    it('should validate offer ID parameter', async () => {
      // Test empty string
      await expect(epcService.calculateEPC('')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test null
      await expect(epcService.calculateEPC(null as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test undefined
      await expect(epcService.calculateEPC(undefined as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test non-string
      await expect(epcService.calculateEPC(123 as any)).rejects.toThrow('Offer ID is required and must be a string');
    });

    it('should throw error when offer not found', async () => {
      // ARRANGE: Offer doesn't exist
      mockPrismaInstance.offer.findUnique.mockResolvedValue(null);
      
      // ACT & ASSERT
      await expect(epcService.calculateEPC('non-existent-offer')).rejects.toThrow('Offer non-existent-offer not found');
    });

    it('should handle database errors gracefully', async () => {
      // ARRANGE: Database error
      mockPrismaInstance.offer.findUnique.mockRejectedValue(new Error('Database connection failed'));
      
      // ACT & ASSERT
      await expect(epcService.calculateEPC(offerId)).rejects.toThrow('Failed to calculate EPC: Database connection failed');
    });

    it('should handle decimal revenue conversion correctly', async () => {
      // ARRANGE: Test Prisma Decimal handling
      const mockClickData = [
        { converted: true, revenue: 25.99 }, // Regular number (Prisma Decimal is converted to number in our service)
        { converted: true, revenue: 30.50 }, // Regular number
        { converted: false, revenue: null },
      ];
      
      mockPrismaInstance.offer.findUnique.mockResolvedValue({
        id: offerId,
        status: 'ACTIVE'
      });
      
      mockPrismaInstance.clickTrack.findMany.mockResolvedValue(mockClickData);
      mockCalculateEPC.mockReturnValue({
        totalClicks: 3,
        totalConversions: 2,
        totalRevenue: 56.49,
        conversionRate: 66.67,
        epc: 18.83,
        lastUpdated: new Date()
      });
      
      // ACT
      const result = await epcService.calculateEPC(offerId);
      
      // ASSERT
      expect(result).toBe(18.83);
      expect(mockCalculateEPC).toHaveBeenCalledWith(3, 2, expect.closeTo(56.49, 2));
    });
  });

  describe('updateEPC', () => {
    const offerId = 'offer-456';
    
    it('should update offer metrics atomically', async () => {
      // ARRANGE: Mock successful transaction
      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue({
            metrics: { existingData: 'value' }
          }),
          update: jest.fn().mockResolvedValue({})
        },
        clickTrack: {
          findMany: jest.fn().mockResolvedValue([
            { converted: true, revenue: 25.00 },
            { converted: false, revenue: null },
            { converted: true, revenue: 35.00 }
          ])
        }
      };
      
      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });
      
      const expectedEPCMetrics: EPCMetrics = {
        totalClicks: 3,
        totalConversions: 2,
        totalRevenue: 60.00,
        conversionRate: 66.67,
        epc: 20.00,
        lastUpdated: new Date()
      };
      
      mockCalculateEPC.mockReturnValue(expectedEPCMetrics);
      
      // ACT
      await epcService.updateEPC(offerId);
      
      // ASSERT
      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();
      expect(mockTx.offer.findUnique).toHaveBeenCalledWith({
        where: { id: offerId },
        select: { metrics: true }
      });
      expect(mockTx.offer.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          metrics: {
            existingData: 'value',
            ...expectedEPCMetrics,
            lastUpdated: expect.any(Date)
          }
        }
      });
    });

    it('should handle null existing metrics', async () => {
      // ARRANGE: Offer with no existing metrics
      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue({
            metrics: null
          }),
          update: jest.fn().mockResolvedValue({})
        },
        clickTrack: {
          findMany: jest.fn().mockResolvedValue([])
        }
      };
      
      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });
      
      const expectedEPCMetrics: EPCMetrics = {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0,
        lastUpdated: new Date()
      };
      
      mockCalculateEPC.mockReturnValue(expectedEPCMetrics);
      
      // ACT
      await epcService.updateEPC(offerId);
      
      // ASSERT
      expect(mockTx.offer.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          metrics: {
            ...expectedEPCMetrics,
            lastUpdated: expect.any(Date)
          }
        }
      });
    });

    it('should rollback on transaction failure', async () => {
      // ARRANGE: Transaction that fails
      mockPrismaInstance.$transaction.mockRejectedValue(new Error('Transaction failed'));
      
      // ACT & ASSERT
      await expect(epcService.updateEPC(offerId)).rejects.toThrow('Failed to update EPC: Transaction failed');
    });

    it('should throw error when offer not found in transaction', async () => {
      // ARRANGE: Offer doesn't exist in transaction
      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue(null),
        }
      };
      
      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });
      
      // ACT & ASSERT
      await expect(epcService.updateEPC(offerId)).rejects.toThrow('Failed to update EPC: Offer offer-456 not found');
    });

    it('should validate offer ID parameter', async () => {
      // Test empty string
      await expect(epcService.updateEPC('')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test null
      await expect(epcService.updateEPC(null as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test undefined
      await expect(epcService.updateEPC(undefined as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test non-string
      await expect(epcService.updateEPC(123 as any)).rejects.toThrow('Offer ID is required and must be a string');
    });

    it('should use 7-day window for EPC calculation in update', async () => {
      // ARRANGE: Test that updateEPC uses the same 7-day window
      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue({
            metrics: {}
          }),
          update: jest.fn().mockResolvedValue({})
        },
        clickTrack: {
          findMany: jest.fn().mockResolvedValue([])
        }
      };
      
      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });
      
      mockCalculateEPC.mockReturnValue({
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        epc: 0,
        lastUpdated: new Date()
      });
      
      // ACT
      await epcService.updateEPC(offerId);
      
      // ASSERT
      expect(mockGetDateDaysAgo).toHaveBeenCalledWith(7);
      expect(mockTx.clickTrack.findMany).toHaveBeenCalledWith({
        where: {
          offerId,
          clickedAt: { gte: expect.any(Date) }
        },
        select: {
          converted: true,
          revenue: true
        }
      });
    });
  });

  describe('Legacy methods (compatibility)', () => {
    it('should maintain getQuestionEPCScores compatibility', async () => {
      const questionIds = ['q1', 'q2', 'q3'];
      
      const result = await epcService.getQuestionEPCScores(questionIds);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('questionId', 'q1');
      expect(result[0]).toHaveProperty('epcScore');
      expect(result[0]).toHaveProperty('totalClicks');
      expect(result[0]).toHaveProperty('totalRevenue');
      expect(result[0]).toHaveProperty('lastUpdated');
    });

    it('should maintain orderQuestionsByEPC compatibility', async () => {
      const mockQuestions = [
        { id: 'q1', text: 'Question 1' },
        { id: 'q2', text: 'Question 2' },
        { id: 'q3', text: 'Question 3' }
      ] as any[];
      
      const result = await epcService.orderQuestionsByEPC(mockQuestions);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text');
    });

    it('should maintain calculateQuestionEPC compatibility', async () => {
      const result = await epcService.calculateQuestionEPC('question-123');
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    });
  });
});