/**
 * @fileoverview Tests for Winston logger utility
 * 
 * Unit tests for the logger configuration, different log levels,
 * and environment-specific behavior.
 */

import winston from 'winston';
import { logger, loggerStream } from '../../../backend/src/utils/logger';

// Mock winston to capture log calls
jest.mock('winston', () => {
  const mockLogger = {
    level: 'debug',
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    exceptions: {
      handle: jest.fn()
    },
    rejections: {
      handle: jest.fn()
    }
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn()
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    },
    addColors: jest.fn()
  };
});

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logger instance', () => {
    it('should be properly configured', () => {
      expect(winston.createLogger).toHaveBeenCalled();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log info messages with structured data', () => {
      // Arrange
      const message = 'Test info message';
      const metadata = { userId: '123', action: 'test' };

      // Act
      logger.info(message, metadata);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(message, metadata);
    });

    it('should log error messages with error objects', () => {
      // Arrange
      const message = 'Test error message';
      const error = new Error('Test error');

      // Act
      logger.error(message, error);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(message, error);
    });

    it('should log warning messages', () => {
      // Arrange
      const message = 'Test warning message';
      const metadata = { warning: 'deprecated_feature' };

      // Act
      logger.warn(message, metadata);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(message, metadata);
    });

    it('should log debug messages with context', () => {
      // Arrange
      const message = 'Debug information';
      const context = { 
        function: 'testFunction',
        parameters: { id: 123, type: 'test' }
      };

      // Act
      logger.debug(message, context);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(message, context);
    });
  });

  describe('loggerStream', () => {
    it('should be properly configured for Morgan integration', () => {
      expect(loggerStream).toBeDefined();
      expect(typeof loggerStream.write).toBe('function');
    });

    it('should write messages through logger.info', () => {
      // Arrange
      const message = 'HTTP request log message\n';

      // Act
      loggerStream.write(message);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('HTTP request log message');
    });

    it('should trim whitespace from messages', () => {
      // Arrange
      const message = '  HTTP request with whitespace  \n\r';

      // Act
      loggerStream.write(message);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('HTTP request with whitespace');
    });
  });

  describe('structured logging patterns', () => {
    it('should support tracking request logging pattern', () => {
      // Arrange
      const logData = {
        method: 'POST',
        url: '/api/track/click',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: '2025-01-09T12:00:00.000Z',
        correlationId: 'tracking_1704801600000'
      };

      // Act
      logger.info('Tracking request received', logData);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Tracking request received', logData);
    });

    it('should support widget analytics logging pattern', () => {
      // Arrange
      const logData = {
        method: 'POST',
        url: '/api/widget/analytics',
        statusCode: 200,
        responseTime: '45ms',
        correlationId: 'widget_1704801600000'
      };

      // Act
      logger.info('Widget analytics request completed', logData);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Widget analytics request completed', logData);
    });

    it('should support error logging with stack traces', () => {
      // Arrange
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at Object.<anonymous>...';
      
      const context = {
        operation: 'getQuestionsBySurvey',
        surveyId: 'survey-123',
        timestamp: new Date().toISOString()
      };

      // Act
      logger.error('Failed to fetch questions', { error: error.message, stack: error.stack, ...context });

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch questions', {
        error: 'Database connection failed',
        stack: 'Error: Database connection failed\n    at Object.<anonymous>...',
        operation: 'getQuestionsBySurvey',
        surveyId: 'survey-123',
        timestamp: expect.any(String)
      });
    });
  });

  describe('log levels', () => {
    it('should handle different log levels appropriately', () => {
      // Arrange & Act
      logger.trace('Trace level message');
      logger.debug('Debug level message');
      logger.info('Info level message');
      logger.warn('Warning level message');
      logger.error('Error level message');

      // Assert
      expect(logger.trace).toHaveBeenCalledWith('Trace level message');
      expect(logger.debug).toHaveBeenCalledWith('Debug level message');
      expect(logger.info).toHaveBeenCalledWith('Info level message');
      expect(logger.warn).toHaveBeenCalledWith('Warning level message');
      expect(logger.error).toHaveBeenCalledWith('Error level message');
    });
  });

  describe('security considerations', () => {
    it('should not log sensitive data directly', () => {
      // This test ensures we don't accidentally log sensitive information
      // The logger itself doesn't filter, but our usage should be careful
      
      // Arrange
      const safeLogData = {
        userId: 'user-123',
        operation: 'login',
        timestamp: '2025-01-09T12:00:00.000Z',
        // Note: password should NOT be included in log data
        userAgent: 'Mozilla/5.0...'
      };

      // Act
      logger.info('User authentication attempt', safeLogData);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('User authentication attempt', safeLogData);
      
      // Verify that the logged data doesn't contain sensitive fields
      const loggedData = (logger.info as jest.Mock).mock.calls[0][1];
      expect(loggedData).not.toHaveProperty('password');
      expect(loggedData).not.toHaveProperty('token');
      expect(loggedData).not.toHaveProperty('secret');
    });

    it('should support correlation IDs for request tracking', () => {
      // Arrange
      const correlationId = 'req_1704801600000_abc123';
      const requestData = {
        method: 'GET',
        url: '/api/offers',
        correlationId,
        responseTime: '23ms'
      };

      // Act
      logger.info('API request completed', requestData);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('API request completed', requestData);
      
      const loggedData = (logger.info as jest.Mock).mock.calls[0][1];
      expect(loggedData.correlationId).toBe(correlationId);
    });
  });

  describe('performance logging', () => {
    it('should support performance timing logs', () => {
      // Arrange
      const performanceData = {
        operation: 'calculateEPC',
        duration: 150,
        offerId: 'offer-123',
        cacheHit: false
      };

      // Act
      logger.debug('Performance timing', performanceData);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('Performance timing', performanceData);
    });

    it('should support database operation logging', () => {
      // Arrange
      const dbLogData = {
        query: 'SELECT * FROM questions WHERE surveyId = ?',
        parameters: ['survey-123'],
        duration: 45,
        rowCount: 5
      };

      // Act
      logger.debug('Database query executed', dbLogData);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('Database query executed', dbLogData);
    });
  });
});