/**
 * @fileoverview Authentication middleware tests
 * 
 * Comprehensive tests for JWT authentication and role-based authorization
 * middleware including valid tokens, invalid tokens, and role checking.
 */

import type { Request, Response, NextFunction } from 'express';
import { 
  authenticateUser, 
  requireAdmin, 
  optionalAuth,
  type AuthRequest 
} from '../../../backend/src/middleware/auth';
import { authService } from '../../../backend/src/services/authService';
import { createUnauthorizedError, createForbiddenError } from '../../../backend/src/middleware/errorHandler';
import { getTestToken, getExpiredTestToken, getInvalidTestToken } from '../helpers/getTestToken';
import { createTestUser } from '../helpers/dbSeed';

// Mock dependencies
jest.mock('../../../backend/src/services/authService');
jest.mock('../../../backend/src/middleware/errorHandler');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockCreateUnauthorizedError = createUnauthorizedError as jest.Mock;
const mockCreateForbiddenError = createForbiddenError as jest.Mock;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      cookies: {},
      user: undefined,
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next function
    mockNext = jest.fn();

    // Setup mock error creators
    mockCreateUnauthorizedError.mockImplementation((message: string) => new Error(message));
    mockCreateForbiddenError.mockImplementation((message: string) => new Error(message));
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const testUser = await createTestUser();
      const token = getTestToken(testUser);
      const payload = {
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockReturnValue(payload);

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when no token is provided', async () => {
      // Arrange
      mockRequest.cookies = {};
      const expectedError = new Error('No authentication token provided');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('No authentication token provided');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const invalidToken = getInvalidTestToken();
      mockRequest.cookies = { accessToken: invalidToken };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const expectedError = new Error('Invalid or expired authentication token');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(invalidToken);
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('Invalid or expired authentication token');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should return 401 when token is expired', async () => {
      // Arrange
      const testUser = await createTestUser();
      const expiredToken = getExpiredTestToken(testUser);
      mockRequest.cookies = { accessToken: expiredToken };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw new Error('Token expired');
      });
      const expectedError = new Error('Invalid or expired authentication token');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(expiredToken);
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('Invalid or expired authentication token');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should return 401 when accessToken cookie is empty', async () => {
      // Arrange
      mockRequest.cookies = { accessToken: '' };
      const expectedError = new Error('No authentication token provided');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('No authentication token provided');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should return 401 when accessToken cookie is null', async () => {
      // Arrange
      mockRequest.cookies = { accessToken: null };
      const expectedError = new Error('No authentication token provided');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('No authentication token provided');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should handle JWT verification throwing different error types', async () => {
      // Arrange
      const token = 'some-token';
      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });
      const expectedError = new Error('Invalid or expired authentication token');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('Invalid or expired authentication token');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin user', () => {
      // Arrange
      mockRequest.user = {
        sub: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Act
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockCreateUnauthorizedError).not.toHaveBeenCalled();
      expect(mockCreateForbiddenError).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;
      const expectedError = new Error('Authentication required');

      // Act
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('Authentication required');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
      expect(mockCreateForbiddenError).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      // Arrange
      mockRequest.user = {
        sub: 'user-id',
        email: 'user@example.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const expectedError = new Error('Admin access required');

      // Act
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockCreateForbiddenError).toHaveBeenCalledWith('Admin access required');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
      expect(mockCreateUnauthorizedError).not.toHaveBeenCalled();
    });

    it('should return 401 when user object is null', () => {
      // Arrange
      mockRequest.user = null;
      const expectedError = new Error('Authentication required');

      // Act
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('Authentication required');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
      expect(mockCreateForbiddenError).not.toHaveBeenCalled();
    });

    it('should handle user object with missing role property', () => {
      // Arrange
      mockRequest.user = {
        sub: 'user-id',
        email: 'user@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as any; // Missing role property
      const expectedError = new Error('Admin access required');

      // Act
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockCreateForbiddenError).toHaveBeenCalledWith('Admin access required');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });
  });

  describe('optionalAuth', () => {
    it('should attach user when valid token is provided', async () => {
      // Arrange
      const testUser = await createTestUser();
      const token = getTestToken(testUser);
      const payload = {
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockReturnValue(payload);

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should continue without user when no token is provided', async () => {
      // Arrange
      mockRequest.cookies = {};

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should continue without user when token is invalid', async () => {
      // Arrange
      const invalidToken = getInvalidTestToken();
      mockRequest.cookies = { accessToken: invalidToken };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(invalidToken);
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should continue without user when token is expired', async () => {
      // Arrange
      const testUser = await createTestUser();
      const expiredToken = getExpiredTestToken(testUser);
      mockRequest.cookies = { accessToken: expiredToken };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(expiredToken);
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should continue without user when accessToken cookie is empty', async () => {
      // Arrange
      mockRequest.cookies = { accessToken: '' };

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should continue without user when accessToken cookie is null', async () => {
      // Arrange
      mockRequest.cookies = { accessToken: null };

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle JWT verification throwing different error types gracefully', async () => {
      // Arrange
      const token = 'some-token';
      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      // Act
      await optionalAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing cookies object in request', async () => {
      // Arrange
      mockRequest.cookies = undefined;
      const expectedError = new Error('No authentication token provided');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('No authentication token provided');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should handle authService.verifyJWT throwing non-Error object', async () => {
      // Arrange
      const token = 'some-token';
      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });
      const expectedError = new Error('Invalid or expired authentication token');

      // Act
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toBeUndefined();
      expect(mockCreateUnauthorizedError).toHaveBeenCalledWith('Invalid or expired authentication token');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });

    it('should handle requireAdmin with malformed user object', () => {
      // Arrange
      mockRequest.user = {
        // Missing required properties
      } as any;
      const expectedError = new Error('Admin access required');

      // Act
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockCreateForbiddenError).toHaveBeenCalledWith('Admin access required');
      expect(mockNext).toHaveBeenCalledWith(expectedError);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with authenticateUser followed by requireAdmin for admin user', async () => {
      // Arrange
      const testUser = await createTestUser('ADMIN');
      const token = getTestToken(testUser);
      const payload = {
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockReturnValue(payload);

      // Act - First authenticate
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Act - Then check admin
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should work with authenticateUser followed by requireAdmin for non-admin user', async () => {
      // Arrange
      const testUser = await createTestUser('USER');
      const token = getTestToken(testUser);
      const payload = {
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.cookies = { accessToken: token };
      mockAuthService.verifyJWT.mockReturnValue(payload);

      // Act - First authenticate
      await authenticateUser(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Act - Then check admin
      const forbiddenError = new Error('Admin access required');
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.verifyJWT).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith(); // First call from authenticateUser
      expect(mockCreateForbiddenError).toHaveBeenCalledWith('Admin access required');
      expect(mockNext).toHaveBeenCalledWith(forbiddenError); // Second call from requireAdmin
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });
});