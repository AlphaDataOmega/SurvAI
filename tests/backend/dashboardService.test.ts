/**
 * @fileoverview Unit tests for DashboardService
 * 
 * Tests for dashboard metrics aggregation, offer performance calculations,
 * and time range filtering with Prisma mocking.
 */

import { DashboardService } from '../../backend/src/services/dashboardService';
import type { DashboardFilters, OfferPerformance } from '@survai/shared';

// Mock Prisma
jest.mock('@prisma/client');

// Mock EPC service to avoid circular dependency
jest.mock('../../backend/src/services/epcService', () => ({
  epcService: {
    getQuestionEPC: jest.fn().mockResolvedValue(2.5)
  }
}));

// Mock time utilities
jest.mock('../../backend/src/utils/time', () => ({
  getDateDaysAgo: jest.fn().mockImplementation((days: number) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(Date.now() - (days * msPerDay));
  })
}));

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockPrisma: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Prisma instance
    mockPrisma = {
      $transaction: jest.fn(),
      offer: {
        findMany: jest.fn()
      },
      question: {
        findMany: jest.fn()
      }
    };
    
    // Mock Prisma client constructor
    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => mockPrisma)
    }));
    
    dashboardService = new DashboardService();
  });

  describe('getDashboardMetrics', () => {
    const mockFilters: DashboardFilters = {
      timeRange: 'last7d'
    };

    it('should return comprehensive dashboard metrics', async () => {
      // Mock transaction that returns both offer and question metrics

      // Mock the transaction to call the callback with a mock transaction client
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        const mockTx = {
          offer: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'offer-1',
                title: 'Test Offer 1',
                category: 'FINANCE',
                status: 'ACTIVE',
                clicks: [
                  { converted: true, revenue: 25.0, clickedAt: new Date() },
                  { converted: true, revenue: 30.0, clickedAt: new Date() },
                  { converted: false, revenue: null, clickedAt: new Date() }
                ]
              }
            ])
          },
          question: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'question-1',
                text: 'Test Question',
                order: 1,
                answers: [
                  {
                    response: {
                      clicks: [{ id: 'click-1' }, { id: 'click-2' }]
                    }
                  }
                ]
              }
            ])
          }
        };
        
        return await callback(mockTx);
      });

      const result = await dashboardService.getDashboardMetrics(mockFilters);

      expect(result).toBeDefined();
      expect(result.offerMetrics).toBeDefined();
      expect(result.questionMetrics).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.timeRange).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle filters with offerIds', async () => {
      const filtersWithOfferIds: DashboardFilters = {
        timeRange: 'last24h',
        offerIds: ['offer-1', 'offer-2']
      };

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        const mockTx = {
          offer: {
            findMany: jest.fn().mockResolvedValue([])
          },
          question: {
            findMany: jest.fn().mockResolvedValue([])
          }
        };
        
        return await callback(mockTx);
      });

      const result = await dashboardService.getDashboardMetrics(filtersWithOfferIds);

      expect(result).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

      await expect(dashboardService.getDashboardMetrics(mockFilters))
        .rejects
        .toThrow('Failed to get dashboard metrics: Database connection failed');
    });
  });

  describe('aggregateOfferMetrics', () => {
    const mockFilters: DashboardFilters = {
      timeRange: 'last7d'
    };

    it('should aggregate offer metrics correctly with clicks and conversions', async () => {
      const mockTx = {
        offer: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'offer-1',
              title: 'High Performing Offer',
              category: 'FINANCE',
              status: 'ACTIVE',
              clicks: [
                { converted: true, revenue: 25.0, clickedAt: new Date() },
                { converted: true, revenue: 30.0, clickedAt: new Date() },
                { converted: false, revenue: null, clickedAt: new Date() },
                { converted: false, revenue: null, clickedAt: new Date() },
                { converted: false, revenue: null, clickedAt: new Date() }
              ]
            },
            {
              id: 'offer-2',
              title: 'Low Performing Offer',
              category: 'HEALTH',
              status: 'ACTIVE',
              clicks: [
                { converted: false, revenue: null, clickedAt: new Date() },
                { converted: false, revenue: null, clickedAt: new Date() }
              ]
            }
          ])
        }
      };

      const result = await dashboardService.aggregateOfferMetrics(mockFilters, mockTx);

      expect(result).toHaveLength(2);
      
      // Check first offer (should be ranked higher due to higher EPC)
      const highPerformingOffer = result.find(o => o.offerId === 'offer-1');
      expect(highPerformingOffer).toBeDefined();
      expect(highPerformingOffer!.totalClicks).toBe(5);
      expect(highPerformingOffer!.totalConversions).toBe(2);
      expect(highPerformingOffer!.totalRevenue).toBe(55.0);
      expect(highPerformingOffer!.epc).toBe(11.0); // 55 / 5
      expect(highPerformingOffer!.rank).toBe(1);

      // Check second offer
      const lowPerformingOffer = result.find(o => o.offerId === 'offer-2');
      expect(lowPerformingOffer).toBeDefined();
      expect(lowPerformingOffer!.totalClicks).toBe(2);
      expect(lowPerformingOffer!.totalConversions).toBe(0);
      expect(lowPerformingOffer!.totalRevenue).toBe(0);
      expect(lowPerformingOffer!.epc).toBe(0);
      expect(lowPerformingOffer!.rank).toBe(2);
    });

    it('should filter offers by minimum EPC when specified', async () => {
      const filtersWithMinEPC: DashboardFilters = {
        timeRange: 'last7d',
        minEPC: 5.0
      };

      const mockTx = {
        offer: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'offer-1',
              title: 'High EPC Offer',
              category: 'FINANCE',
              status: 'ACTIVE',
              clicks: [
                { converted: true, revenue: 50.0, clickedAt: new Date() },
                { converted: false, revenue: null, clickedAt: new Date() }
              ]
            },
            {
              id: 'offer-2',
              title: 'Low EPC Offer',
              category: 'HEALTH',
              status: 'ACTIVE',
              clicks: [
                { converted: true, revenue: 1.0, clickedAt: new Date() },
                { converted: false, revenue: null, clickedAt: new Date() }
              ]
            }
          ])
        }
      };

      const result = await dashboardService.aggregateOfferMetrics(filtersWithMinEPC, mockTx);

      // Should only return offers with EPC >= 5.0
      expect(result).toHaveLength(1);
      expect(result[0].offerId).toBe('offer-1');
      expect(result[0].epc).toBe(25.0); // 50 / 2
    });

    it('should handle empty offer results', async () => {
      const mockTx = {
        offer: {
          findMany: jest.fn().mockResolvedValue([])
        }
      };

      const result = await dashboardService.aggregateOfferMetrics(mockFilters, mockTx);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors in aggregation', async () => {
      const mockTx = {
        offer: {
          findMany: jest.fn().mockRejectedValue(new Error('Database query failed'))
        }
      };

      await expect(dashboardService.aggregateOfferMetrics(mockFilters, mockTx))
        .rejects
        .toThrow('Failed to aggregate offer metrics: Database query failed');
    });
  });

  describe('calculateDashboardSummary', () => {
    it('should calculate summary statistics correctly', async () => {
      const mockOfferMetrics: OfferPerformance[] = [
        {
          offerId: 'offer-1',
          title: 'Offer 1',
          rank: 1,
          totalClicks: 100,
          totalConversions: 15,
          totalRevenue: 300.0,
          epc: 3.0,
          conversionRate: 15.0,
          lastUpdated: new Date()
        },
        {
          offerId: 'offer-2',
          title: 'Offer 2',
          rank: 2,
          totalClicks: 50,
          totalConversions: 5,
          totalRevenue: 125.0,
          epc: 2.5,
          conversionRate: 10.0,
          lastUpdated: new Date()
        }
      ];

      const result = dashboardService.calculateDashboardSummary(mockOfferMetrics);

      expect(result.totalOffers).toBe(2);
      expect(result.totalClicks).toBe(150);
      expect(result.totalConversions).toBe(20);
      expect(result.totalRevenue).toBe(425.0);
      expect(result.averageEPC).toBe(2.75); // (3.0 + 2.5) / 2
      expect(result.topPerformingOffer).toBe(mockOfferMetrics[0]);
    });

    it('should handle empty metrics gracefully', async () => {
      const result = dashboardService.calculateDashboardSummary([]);

      expect(result.totalOffers).toBe(0);
      expect(result.totalClicks).toBe(0);
      expect(result.totalConversions).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageEPC).toBe(0);
      expect(result.topPerformingOffer).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid filter parameters', async () => {
      const invalidFilters = {
        timeRange: 'invalid' as any
      };

      // Should default to 7 days for invalid time range
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        const mockTx = {
          offer: { findMany: jest.fn().mockResolvedValue([]) },
          question: { findMany: jest.fn().mockResolvedValue([]) }
        };
        return await callback(mockTx);
      });

      const result = await dashboardService.getDashboardMetrics(invalidFilters);
      expect(result).toBeDefined();
    });

    it('should handle zero clicks gracefully', async () => {
      const mockTx = {
        offer: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'offer-1',
              title: 'No Clicks Offer',
              category: 'FINANCE',
              status: 'ACTIVE',
              clicks: []
            }
          ])
        }
      };

      const result = await dashboardService.aggregateOfferMetrics(
        { timeRange: 'last7d' }, 
        mockTx
      );

      expect(result).toHaveLength(1);
      expect(result[0].totalClicks).toBe(0);
      expect(result[0].totalConversions).toBe(0);
      expect(result[0].epc).toBe(0);
      expect(result[0].conversionRate).toBe(0);
    });
  });
});