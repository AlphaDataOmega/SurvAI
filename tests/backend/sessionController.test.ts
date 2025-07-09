/**
 * @fileoverview Tests for session controller
 */

import { Request, Response } from 'express';
import { SessionController } from '../../backend/src/controllers/sessionController';

// Mock logger
jest.mock('../../backend/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

describe('SessionController', () => {
  let controller: SessionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new SessionController();
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('bootstrap', () => {
    it('should bootstrap session successfully', async () => {
      mockRequest.body = {
        surveyId: 'test-survey',
        metadata: { source: 'widget' }
      };

      await controller.bootstrap(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sessionId: 'mock-uuid',
          clickId: 'mock-uuid',
          surveyId: 'test-survey',
          metadata: { source: 'widget' }
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle missing surveyId', async () => {
      mockRequest.body = {};

      await controller.bootstrap(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Survey ID is required',
        timestamp: expect.any(String)
      });
    });

    it('should handle bootstrap without metadata', async () => {
      mockRequest.body = {
        surveyId: 'test-survey'
      };

      await controller.bootstrap(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sessionId: 'mock-uuid',
          clickId: 'mock-uuid',
          surveyId: 'test-survey',
          metadata: undefined
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle server errors', async () => {
      mockRequest.body = {
        surveyId: 'test-survey'
      };

      // Mock uuid to throw error
      const uuid = require('uuid') as { v4: jest.Mock };
      uuid.v4.mockImplementationOnce(() => {
        throw new Error('UUID generation failed');
      });

      await controller.bootstrap(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to bootstrap session',
        details: 'UUID generation failed',
        timestamp: expect.any(String)
      });
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors', async () => {
      mockRequest.body = {
        surveyId: 'test-survey'
      };

      // Mock uuid to throw non-Error object
      const uuid = require('uuid') as { v4: jest.Mock };
      uuid.v4.mockImplementationOnce(() => {
        throw 'String error';
      });

      await controller.bootstrap(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to bootstrap session',
        details: 'Unknown error',
        timestamp: expect.any(String)
      });
    });
  });
});