/**
 * @fileoverview JWT token generation utilities for testing
 * 
 * Provides helper functions to generate JWT tokens for authenticated
 * API testing with proper role-based access control.
 */

import jwt from 'jsonwebtoken';
import type { User, UserRole } from '@survai/shared';

// Ensure JWT_SECRET is set for testing
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';

/**
 * Generates a JWT token for a user object
 * 
 * @param user - User object containing id, email, and role
 * @param options - Optional token generation options
 * @returns string - JWT token
 */
export const getTestToken = (
  user: Pick<User, 'id' | 'email' | 'role'>,
  options: {
    expiresIn?: string;
    includeExtra?: boolean;
  } = {}
): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    ...(options.includeExtra && {
      iat: Math.floor(Date.now() / 1000),
      isTest: true,
    }),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || '1h',
  });
};

/**
 * Generates a JWT token for a user with specified role
 * 
 * @param userId - User ID
 * @param role - User role
 * @param email - User email (optional)
 * @param options - Optional token generation options
 * @returns string - JWT token
 */
export const getTestTokenByRole = (
  userId: string,
  role: UserRole,
  email?: string,
  options: {
    expiresIn?: string;
    includeExtra?: boolean;
  } = {}
): string => {
  const user = {
    id: userId,
    email: email || `test-${role.toLowerCase()}@example.com`,
    role,
  };

  return getTestToken(user, options);
};

/**
 * Generates an admin JWT token for testing
 * 
 * @param userId - User ID (defaults to test admin ID)
 * @param options - Optional token generation options
 * @returns string - JWT token
 */
export const getAdminTestToken = (
  userId: string = 'test-admin-id',
  options: {
    expiresIn?: string;
    includeExtra?: boolean;
  } = {}
): string => {
  return getTestTokenByRole(userId, 'ADMIN', 'admin@example.com', options);
};

/**
 * Generates a user JWT token for testing
 * 
 * @param userId - User ID (defaults to test user ID)
 * @param options - Optional token generation options
 * @returns string - JWT token
 */
export const getUserTestToken = (
  userId: string = 'test-user-id',
  options: {
    expiresIn?: string;
    includeExtra?: boolean;
  } = {}
): string => {
  return getTestTokenByRole(userId, 'USER', 'user@example.com', options);
};

/**
 * Generates an expired JWT token for testing
 * 
 * @param user - User object containing id, email, and role
 * @returns string - Expired JWT token
 */
export const getExpiredTestToken = (
  user: Pick<User, 'id' | 'email' | 'role'>
): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
  };

  return jwt.sign(payload, JWT_SECRET, { noTimestamp: true });
};

/**
 * Generates an invalid JWT token for testing
 * 
 * @returns string - Invalid JWT token
 */
export const getInvalidTestToken = (): string => {
  return jwt.sign({ userId: 'invalid' }, 'wrong-secret');
};

/**
 * Generates a malformed JWT token for testing
 * 
 * @returns string - Malformed JWT token
 */
export const getMalformedTestToken = (): string => {
  return 'invalid.jwt.token';
};

/**
 * Verifies a JWT token and returns decoded payload
 * 
 * @param token - JWT token to verify
 * @returns object - Decoded token payload
 */
export const verifyTestToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error}`);
  }
};

/**
 * Generates multiple test tokens for different scenarios
 * 
 * @param user - User object containing id, email, and role
 * @returns object - Object containing various test tokens
 */
export const generateTestTokens = (
  user: Pick<User, 'id' | 'email' | 'role'>
) => {
  return {
    valid: getTestToken(user),
    expired: getExpiredTestToken(user),
    invalid: getInvalidTestToken(),
    malformed: getMalformedTestToken(),
    shortExpiry: getTestToken(user, { expiresIn: '1s' }),
    longExpiry: getTestToken(user, { expiresIn: '7d' }),
  };
};

/**
 * Creates authorization header for HTTP requests
 * 
 * @param token - JWT token
 * @returns object - Authorization header object
 */
export const createAuthHeader = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Creates cookie header for HTTP requests
 * 
 * @param token - JWT token
 * @returns object - Cookie header object
 */
export const createCookieHeader = (token: string) => {
  return {
    Cookie: `accessToken=${token}`,
  };
};

/**
 * Token validation helpers for testing
 */
export const tokenValidation = {
  /**
   * Checks if a token is properly formatted
   * 
   * @param token - JWT token to check
   * @returns boolean - True if token is properly formatted
   */
  isWellFormed: (token: string): boolean => {
    return token.split('.').length === 3;
  },

  /**
   * Checks if a token has expired
   * 
   * @param token - JWT token to check
   * @returns boolean - True if token has expired
   */
  isExpired: (token: string): boolean => {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded && decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  },

  /**
   * Extracts user ID from token
   * 
   * @param token - JWT token
   * @returns string - User ID from token
   */
  getUserId: (token: string): string => {
    const decoded = jwt.decode(token) as any;
    return decoded?.userId || '';
  },

  /**
   * Extracts user role from token
   * 
   * @param token - JWT token
   * @returns UserRole - User role from token
   */
  getUserRole: (token: string): UserRole => {
    const decoded = jwt.decode(token) as any;
    return decoded?.role || 'USER';
  },
};

/**
 * Test token scenarios for comprehensive testing
 */
export const testTokenScenarios = {
  // Valid tokens
  adminToken: () => getAdminTestToken(),
  userToken: () => getUserTestToken(),
  
  // Invalid tokens
  expiredToken: () => getExpiredTestToken({ id: 'test', email: 'test@example.com', role: 'USER' }),
  invalidSignature: () => getInvalidTestToken(),
  malformedToken: () => getMalformedTestToken(),
  emptyToken: () => '',
  nullToken: () => null,
  
  // Edge cases
  shortExpiryToken: () => getTestToken({ id: 'test', email: 'test@example.com', role: 'USER' }, { expiresIn: '1s' }),
  longExpiryToken: () => getTestToken({ id: 'test', email: 'test@example.com', role: 'USER' }, { expiresIn: '7d' }),
  
  // Headers
  validAuthHeader: () => createAuthHeader(getAdminTestToken()),
  invalidAuthHeader: () => createAuthHeader('invalid-token'),
  validCookieHeader: () => createCookieHeader(getAdminTestToken()),
  invalidCookieHeader: () => createCookieHeader('invalid-token'),
};