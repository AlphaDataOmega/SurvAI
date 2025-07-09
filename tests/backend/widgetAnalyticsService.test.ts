/**
 * @fileoverview Tests for widget analytics service
 */

import { WidgetAnalyticsService } from '../../backend/src/services/widgetAnalyticsService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  widgetAnalytics: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  $transaction: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

describe('WidgetAnalyticsService', () => {
  let service: WidgetAnalyticsService;

  beforeEach(() => {
    service = new WidgetAnalyticsService();
    jest.clearAllMocks();
  });

  describe('storeEvent', () => {
    it('should store loaded event successfully', async () => {
      const mockEvent = {
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'loaded' as const,
        timestamp: new Date(),
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.$transaction.mockImplementation((callback) => {
        return callback({
          widgetAnalytics: {
            create: jest.fn().mockResolvedValue(mockEvent)
          }
        });
      });

      const result = await service.storeEvent({
        surveyId: 'test-survey',
        event: 'loaded'
      });

      expect(result).toEqual({
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'loaded',
        dwellTimeMs: undefined,
        timestamp: expect.any(Date),
        metadata: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should store dwell event with dwell time', async () => {
      const mockEvent = {
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'dwell',
        dwellTimeMs: 5000,
        timestamp: new Date(),
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.$transaction.mockImplementation((callback) => {
        return callback({
          widgetAnalytics: {
            create: jest.fn().mockResolvedValue(mockEvent)
          }
        });
      });

      const result = await service.storeEvent({
        surveyId: 'test-survey',
        event: 'dwell',
        dwellTimeMs: 5000
      });

      expect(result).toEqual({
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'dwell',
        dwellTimeMs: 5000,
        timestamp: expect.any(Date),
        metadata: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should validate required fields', async () => {
      await expect(service.storeEvent({
        surveyId: '',
        event: 'loaded'
      })).rejects.toThrow('Missing required parameters');

      await expect(service.storeEvent({
        surveyId: 'test-survey',
        event: '' as any
      })).rejects.toThrow('Missing required parameters');
    });

    it('should validate dwell event requirements', async () => {
      await expect(service.storeEvent({
        surveyId: 'test-survey',
        event: 'dwell'
      })).rejects.toThrow('Dwell time is required for dwell events');

      await expect(service.storeEvent({
        surveyId: 'test-survey',
        event: 'loaded',
        dwellTimeMs: 5000
      })).rejects.toThrow('Dwell time should not be provided for loaded events');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.storeEvent({
        surveyId: 'test-survey',
        event: 'loaded'
      })).rejects.toThrow('Failed to store widget analytics event: Database error');
    });
  });

  describe('getLast7DaysAggregation', () => {
    it('should aggregate analytics data correctly', async () => {
      const mockData = [
        {
          event: 'loaded',
          dwellTimeMs: null,
          timestamp: new Date('2023-01-01')
        },
        {
          event: 'loaded',
          dwellTimeMs: null,
          timestamp: new Date('2023-01-01')
        },
        {
          event: 'dwell',
          dwellTimeMs: 5000,
          timestamp: new Date('2023-01-01')
        },
        {
          event: 'dwell',
          dwellTimeMs: 3000,
          timestamp: new Date('2023-01-01')
        }
      ];

      mockPrisma.widgetAnalytics.findMany.mockResolvedValue(mockData);

      const result = await service.getLast7DaysAggregation();

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          date: '2023-01-01',
          loadedCount: 2,
          averageDwellTime: 4000,
          totalDwellTime: 8000,
          dwellEventCount: 2
        })
      ]));
    });

    it('should filter by survey ID when provided', async () => {
      mockPrisma.widgetAnalytics.findMany.mockResolvedValue([]);

      await service.getLast7DaysAggregation('test-survey');

      expect(mockPrisma.widgetAnalytics.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          surveyId: 'test-survey'
        }),
        orderBy: {
          timestamp: 'desc'
        }
      });
    });

    it('should handle empty data gracefully', async () => {
      mockPrisma.widgetAnalytics.findMany.mockResolvedValue([]);

      const result = await service.getLast7DaysAggregation();

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          loadedCount: 0,
          averageDwellTime: 0,
          totalDwellTime: 0,
          dwellEventCount: 0
        })
      ]));
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.widgetAnalytics.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getLast7DaysAggregation()).rejects.toThrow(
        'Failed to get widget analytics aggregation: Database error'
      );
    });
  });

  describe('getSurveySummary', () => {
    it('should calculate survey summary correctly', async () => {
      const mockData = [
        {
          event: 'loaded',
          dwellTimeMs: null,
          timestamp: new Date('2023-01-01')
        },
        {
          event: 'loaded',
          dwellTimeMs: null,
          timestamp: new Date('2023-01-02')
        },
        {
          event: 'dwell',
          dwellTimeMs: 5000,
          timestamp: new Date('2023-01-01')
        },
        {
          event: 'dwell',
          dwellTimeMs: 3000,
          timestamp: new Date('2023-01-03')
        }
      ];

      mockPrisma.widgetAnalytics.findMany.mockResolvedValue(mockData);

      const result = await service.getSurveySummary('test-survey');

      expect(result).toEqual({
        totalLoaded: 2,
        totalDwellEvents: 2,
        averageDwellTime: 4000,
        totalDwellTime: 8000,
        lastLoaded: new Date('2023-01-02'),
        lastDwell: new Date('2023-01-03')
      });
    });

    it('should handle empty data gracefully', async () => {
      mockPrisma.widgetAnalytics.findMany.mockResolvedValue([]);

      const result = await service.getSurveySummary('test-survey');

      expect(result).toEqual({
        totalLoaded: 0,
        totalDwellEvents: 0,
        averageDwellTime: 0,
        totalDwellTime: 0,
        lastLoaded: null,
        lastDwell: null
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.widgetAnalytics.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getSurveySummary('test-survey')).rejects.toThrow(
        'Failed to get survey summary: Database error'
      );
    });
  });

  describe('fillMissingDates', () => {
    it('should fill missing dates with zero values', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-03');
      
      const aggregation = [
        {
          date: '2023-01-02',
          loadedCount: 5,
          averageDwellTime: 1000,
          totalDwellTime: 5000,
          dwellEventCount: 5
        }
      ];

      const result = service['fillMissingDates'](aggregation, startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2023-01-03',
        loadedCount: 0,
        averageDwellTime: 0,
        totalDwellTime: 0,
        dwellEventCount: 0
      });
      expect(result[1]).toEqual({
        date: '2023-01-02',
        loadedCount: 5,
        averageDwellTime: 1000,
        totalDwellTime: 5000,
        dwellEventCount: 5
      });
      expect(result[2]).toEqual({
        date: '2023-01-01',
        loadedCount: 0,
        averageDwellTime: 0,
        totalDwellTime: 0,
        dwellEventCount: 0
      });
    });
  });
});