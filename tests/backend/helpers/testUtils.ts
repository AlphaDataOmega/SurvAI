/**
 * @fileoverview Common test utilities for backend testing
 * 
 * Provides helper functions for common test operations including
 * HTTP status checking, error handling, and test data validation.
 */

import { Response } from 'supertest';
import type { ApiResponse } from '@survai/shared';

/**
 * HTTP status code utilities for testing
 */
export const httpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Validates a successful API response structure
 * 
 * @param response - Supertest response object
 * @param expectedStatus - Expected HTTP status code
 * @returns Response - The response object for chaining
 */
export const expectSuccessResponse = (
  response: Response,
  expectedStatus: number = httpStatus.OK
): Response => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
  expect(response.body.error).toBeUndefined();
  return response;
};

/**
 * Validates an error API response structure
 * 
 * @param response - Supertest response object
 * @param expectedStatus - Expected HTTP status code
 * @param expectedErrorMessage - Expected error message (optional)
 * @returns Response - The response object for chaining
 */
export const expectErrorResponse = (
  response: Response,
  expectedStatus: number,
  expectedErrorMessage?: string
): Response => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBeDefined();
  expect(response.body.data).toBeUndefined();
  
  if (expectedErrorMessage) {
    expect(response.body.error).toContain(expectedErrorMessage);
  }
  
  return response;
};

/**
 * Validates a validation error response structure
 * 
 * @param response - Supertest response object
 * @param expectedFields - Expected fields that should have validation errors
 * @returns Response - The response object for chaining
 */
export const expectValidationError = (
  response: Response,
  expectedFields?: string[]
): Response => {
  expectErrorResponse(response, httpStatus.BAD_REQUEST);
  
  if (expectedFields) {
    for (const field of expectedFields) {
      expect(response.body.error).toContain(field);
    }
  }
  
  return response;
};

/**
 * Validates a 401 unauthorized response
 * 
 * @param response - Supertest response object
 * @returns Response - The response object for chaining
 */
export const expectUnauthorized = (response: Response): Response => {
  return expectErrorResponse(response, httpStatus.UNAUTHORIZED);
};

/**
 * Validates a 403 forbidden response
 * 
 * @param response - Supertest response object
 * @returns Response - The response object for chaining
 */
export const expectForbidden = (response: Response): Response => {
  return expectErrorResponse(response, httpStatus.FORBIDDEN);
};

/**
 * Validates a 404 not found response
 * 
 * @param response - Supertest response object
 * @returns Response - The response object for chaining
 */
export const expectNotFound = (response: Response): Response => {
  return expectErrorResponse(response, httpStatus.NOT_FOUND);
};

/**
 * Validates a 409 conflict response
 * 
 * @param response - Supertest response object
 * @returns Response - The response object for chaining
 */
export const expectConflict = (response: Response): Response => {
  return expectErrorResponse(response, httpStatus.CONFLICT);
};

/**
 * Validates a 429 too many requests response
 * 
 * @param response - Supertest response object
 * @returns Response - The response object for chaining
 */
export const expectTooManyRequests = (response: Response): Response => {
  return expectErrorResponse(response, httpStatus.TOO_MANY_REQUESTS);
};

/**
 * Validates a 500 internal server error response
 * 
 * @param response - Supertest response object
 * @returns Response - The response object for chaining
 */
export const expectInternalServerError = (response: Response): Response => {
  return expectErrorResponse(response, httpStatus.INTERNAL_SERVER_ERROR);
};

/**
 * Validates pagination metadata in API responses
 * 
 * @param response - Supertest response object
 * @param expectedTotal - Expected total count (optional)
 * @param expectedPage - Expected current page (optional)
 * @param expectedLimit - Expected page limit (optional)
 * @returns Response - The response object for chaining
 */
export const expectPaginationMetadata = (
  response: Response,
  expectedTotal?: number,
  expectedPage?: number,
  expectedLimit?: number
): Response => {
  expectSuccessResponse(response);
  
  expect(response.body.meta).toBeDefined();
  expect(response.body.meta.total).toBeDefined();
  expect(response.body.meta.page).toBeDefined();
  expect(response.body.meta.limit).toBeDefined();
  expect(response.body.meta.totalPages).toBeDefined();
  
  if (expectedTotal !== undefined) {
    expect(response.body.meta.total).toBe(expectedTotal);
  }
  
  if (expectedPage !== undefined) {
    expect(response.body.meta.page).toBe(expectedPage);
  }
  
  if (expectedLimit !== undefined) {
    expect(response.body.meta.limit).toBe(expectedLimit);
  }
  
  return response;
};

/**
 * Validates that response contains specific fields
 * 
 * @param response - Supertest response object
 * @param fields - Array of field names to check
 * @returns Response - The response object for chaining
 */
export const expectResponseFields = (
  response: Response,
  fields: string[]
): Response => {
  expectSuccessResponse(response);
  
  for (const field of fields) {
    expect(response.body.data).toHaveProperty(field);
  }
  
  return response;
};

/**
 * Validates that response data is an array with expected length
 * 
 * @param response - Supertest response object
 * @param expectedLength - Expected array length (optional)
 * @returns Response - The response object for chaining
 */
export const expectArrayResponse = (
  response: Response,
  expectedLength?: number
): Response => {
  expectSuccessResponse(response);
  expect(Array.isArray(response.body.data)).toBe(true);
  
  if (expectedLength !== undefined) {
    expect(response.body.data).toHaveLength(expectedLength);
  }
  
  return response;
};

/**
 * Validates that response contains correct timestamp formatting
 * 
 * @param response - Supertest response object
 * @param timestampFields - Array of timestamp field names
 * @returns Response - The response object for chaining
 */
export const expectTimestampFields = (
  response: Response,
  timestampFields: string[]
): Response => {
  expectSuccessResponse(response);
  
  for (const field of timestampFields) {
    if (response.body.data[field]) {
      expect(new Date(response.body.data[field])).toBeInstanceOf(Date);
      expect(new Date(response.body.data[field]).getTime()).not.toBeNaN();
    }
  }
  
  return response;
};

/**
 * Validates that response cookies are set correctly
 * 
 * @param response - Supertest response object
 * @param cookieName - Name of the cookie to check
 * @param shouldExist - Whether the cookie should exist
 * @returns Response - The response object for chaining
 */
export const expectCookie = (
  response: Response,
  cookieName: string,
  shouldExist: boolean = true
): Response => {
  const cookies = response.headers['set-cookie'];
  
  if (shouldExist) {
    expect(cookies).toBeDefined();
    expect(cookies.some((cookie: string) => cookie.includes(cookieName))).toBe(true);
  } else {
    if (cookies) {
      expect(cookies.some((cookie: string) => cookie.includes(cookieName))).toBe(false);
    }
  }
  
  return response;
};

/**
 * Validates that response headers contain expected values
 * 
 * @param response - Supertest response object
 * @param headers - Object containing expected header values
 * @returns Response - The response object for chaining
 */
export const expectHeaders = (
  response: Response,
  headers: Record<string, string>
): Response => {
  for (const [headerName, expectedValue] of Object.entries(headers)) {
    expect(response.headers[headerName.toLowerCase()]).toBe(expectedValue);
  }
  
  return response;
};

/**
 * Wait for a specified duration (for testing async operations)
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise<void>
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generates random test data
 */
export const generateRandomData = {
  /**
   * Generates a random email address
   * 
   * @param domain - Email domain (defaults to example.com)
   * @returns string - Random email address
   */
  email: (domain: string = 'example.com'): string => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `test-${randomString}@${domain}`;
  },

  /**
   * Generates a random string of specified length
   * 
   * @param length - Length of the string
   * @returns string - Random string
   */
  string: (length: number = 10): string => {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  /**
   * Generates a random number within a range
   * 
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns number - Random number
   */
  number: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generates a random boolean
   * 
   * @returns boolean - Random boolean
   */
  boolean: (): boolean => {
    return Math.random() > 0.5;
  },

  /**
   * Generates a random URL
   * 
   * @param protocol - URL protocol (defaults to https)
   * @param domain - URL domain (defaults to example.com)
   * @returns string - Random URL
   */
  url: (protocol: string = 'https', domain: string = 'example.com'): string => {
    const path = generateRandomData.string(8);
    return `${protocol}://${domain}/${path}`;
  },

  /**
   * Generates a random UUID-like string
   * 
   * @returns string - Random UUID-like string
   */
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Generates a random IP address
   * 
   * @returns string - Random IP address
   */
  ipAddress: (): string => {
    return [1, 2, 3, 4].map(() => generateRandomData.number(1, 255)).join('.');
  },

  /**
   * Generates a random user agent string
   * 
   * @returns string - Random user agent
   */
  userAgent: (): string => {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    ];
    return browsers[Math.floor(Math.random() * browsers.length)];
  },
};

/**
 * Test data validation helpers
 */
export const validateTestData = {
  /**
   * Validates email format
   * 
   * @param email - Email to validate
   * @returns boolean - True if valid email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validates URL format
   * 
   * @param url - URL to validate
   * @returns boolean - True if valid URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validates UUID format
   * 
   * @param uuid - UUID to validate
   * @returns boolean - True if valid UUID format
   */
  isValidUuid: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validates IP address format
   * 
   * @param ip - IP address to validate
   * @returns boolean - True if valid IP format
   */
  isValidIpAddress: (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  },
};

/**
 * Error testing helpers
 */
export const errorTestHelpers = {
  /**
   * Tests that an async function throws a specific error
   * 
   * @param fn - Async function to test
   * @param expectedErrorMessage - Expected error message
   * @returns Promise<void>
   */
  expectAsyncError: async (
    fn: () => Promise<any>,
    expectedErrorMessage?: string
  ): Promise<void> => {
    await expect(fn()).rejects.toThrow(expectedErrorMessage);
  },

  /**
   * Tests that a function throws a specific error
   * 
   * @param fn - Function to test
   * @param expectedErrorMessage - Expected error message
   * @returns void
   */
  expectError: (
    fn: () => any,
    expectedErrorMessage?: string
  ): void => {
    expect(fn).toThrow(expectedErrorMessage);
  },
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Measures execution time of a function
   * 
   * @param fn - Function to measure
   * @returns Promise<{result: T, duration: number}>
   */
  measureExecutionTime: async <T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();
    
    return {
      result,
      duration: endTime - startTime,
    };
  },

  /**
   * Asserts that a function executes within a time limit
   * 
   * @param fn - Function to test
   * @param maxDuration - Maximum allowed duration in milliseconds
   * @returns Promise<T>
   */
  expectExecutionTime: async <T>(
    fn: () => Promise<T>,
    maxDuration: number
  ): Promise<T> => {
    const { result, duration } = await performanceHelpers.measureExecutionTime(fn);
    expect(duration).toBeLessThan(maxDuration);
    return result;
  },
};