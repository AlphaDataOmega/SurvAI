/**
 * @fileoverview Tests for widget analytics controller
 */

import { Request, Response, NextFunction } from 'express';
import { WidgetAnalyticsController } from '../../backend/src/controllers/widgetAnalyticsController';
import { WidgetAnalyticsService } from '../../backend/src/services/widgetAnalyticsService';

// Mock service
const mockService = {
  storeEvent: jest.fn(),
  getLast7DaysAggregation: jest.fn(),
  getSurveySummary: jest.fn()
};

jest.mock('../../backend/src/services/widgetAnalyticsService', () => ({
  WidgetAnalyticsService: jest.fn(() => mockService)
}));

describe('WidgetAnalyticsController', () => {
  let controller: WidgetAnalyticsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new WidgetAnalyticsController();
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('storeEvent', () => {
    it('should store loaded event successfully', async () => {
      const mockEvent = {
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'loaded' as const,
        timestamp: new Date(),
        metadata: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        surveyId: 'test-survey',
        event: 'loaded'
      };

      mockService.storeEvent.mockResolvedValue(mockEvent);

      await controller.storeEvent(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.storeEvent).toHaveBeenCalledWith({
        surveyId: 'test-survey',
        event: 'loaded'
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          event: mockEvent
        },
        timestamp: expect.any(String)
      });
    });

    it('should store dwell event with dwell time', async () => {
      const mockEvent = {
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'dwell' as const,
        dwellTimeMs: 5000,
        timestamp: new Date(),
        metadata: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        surveyId: 'test-survey',
        event: 'dwell',
        dwellTimeMs: 5000
      };

      mockService.storeEvent.mockResolvedValue(mockEvent);

      await controller.storeEvent(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.storeEvent).toHaveBeenCalledWith({
        surveyId: 'test-survey',
        event: 'dwell',
        dwellTimeMs: 5000
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          event: mockEvent
        },
        timestamp: expect.any(String)
      });
    });

    it('should store event with metadata', async () => {
      const mockEvent = {
        id: 'test-id',
        surveyId: 'test-survey',
        event: 'loaded' as const,
        timestamp: new Date(),
        metadata: { source: 'widget' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        surveyId: 'test-survey',
        event: 'loaded',
        metadata: { source: 'widget' }
      };

      mockService.storeEvent.mockResolvedValue(mockEvent);

      await controller.storeEvent(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.storeEvent).toHaveBeenCalledWith({
        surveyId: 'test-survey',
        event: 'loaded',
        metadata: { source: 'widget' }
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        surveyId: 'test-survey',
        event: 'loaded'
      };

      const error = new Error('Service error');
      mockService.storeEvent.mockRejectedValue(error);

      await controller.storeEvent(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAggregation', () => {
    it('should get aggregation data without filters', async () => {
      const mockAggregation = [
        {
          date: '2023-01-01',
          loadedCount: 10,
          averageDwellTime: 5000,
          totalDwellTime: 50000,
          dwellEventCount: 10
        }
      ];

      mockRequest.query = {};
      mockService.getLast7DaysAggregation.mockResolvedValue(mockAggregation);

      await controller.getAggregation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getLast7DaysAggregation).toHaveBeenCalledWith(undefined, 7);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          aggregation: mockAggregation
        },
        timestamp: expect.any(String)
      });
    });

    it('should get aggregation data with survey ID filter', async () => {
      const mockAggregation = [
        {
          date: '2023-01-01',
          loadedCount: 5,
          averageDwellTime: 3000,
          totalDwellTime: 15000,
          dwellEventCount: 5
        }
      ];

      mockRequest.query = {
        surveyId: 'test-survey'
      };
      mockService.getLast7DaysAggregation.mockResolvedValue(mockAggregation);

      await controller.getAggregation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getLast7DaysAggregation).toHaveBeenCalledWith('test-survey', 7);
    });

    it('should get aggregation data with custom days', async () => {
      const mockAggregation = [
        {
          date: '2023-01-01',
          loadedCount: 15,
          averageDwellTime: 4000,
          totalDwellTime: 60000,
          dwellEventCount: 15
        }
      ];

      mockRequest.query = {
        days: '30'
      };
      mockService.getLast7DaysAggregation.mockResolvedValue(mockAggregation);

      await controller.getAggregation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getLast7DaysAggregation).toHaveBeenCalledWith(undefined, 30);
    });

    it('should handle service errors', async () => {
      mockRequest.query = {};
      const error = new Error('Service error');
      mockService.getLast7DaysAggregation.mockRejectedValue(error);

      await controller.getAggregation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getSurveySummary', () => {
    it('should get survey summary successfully', async () => {
      const mockSummary = {
        totalLoaded: 100,
        totalDwellEvents: 85,
        averageDwellTime: 4500,
        totalDwellTime: 382500,
        lastLoaded: new Date('2023-01-01'),
        lastDwell: new Date('2023-01-01')
      };

      mockRequest.params = {
        surveyId: 'test-survey'
      };
      mockService.getSurveySummary.mockResolvedValue(mockSummary);

      await controller.getSurveySummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getSurveySummary).toHaveBeenCalledWith('test-survey');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          summary: mockSummary
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle missing survey ID', async () => {
      mockRequest.params = {};

      await controller.getSurveySummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Survey ID is required'));
    });

    it('should handle service errors', async () => {
      mockRequest.params = {
        surveyId: 'test-survey'
      };
      const error = new Error('Service error');
      mockService.getSurveySummary.mockRejectedValue(error);

      await controller.getSurveySummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockService.getLast7DaysAggregation.mockResolvedValue([]);

      await controller.healthCheck(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getLast7DaysAggregation).toHaveBeenCalledWith(undefined, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String)
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockService.getLast7DaysAggregation.mockRejectedValue(error);

      await controller.healthCheck(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});