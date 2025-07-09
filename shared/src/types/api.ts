/**
 * @fileoverview API response types and interfaces
 * 
 * Standardized API response formats and HTTP-related types
 * used across frontend and backend for consistent communication.
 */

/**
 * Standard API response wrapper
 * 
 * @template T - The type of the data payload
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  /** The response data (only present on success) */
  data?: T;
  /** Error message (only present on failure) */
  error?: string;
  /** Additional error details for debugging */
  details?: unknown;
  /** Response timestamp */
  timestamp?: string;
}

/**
 * Paginated API response wrapper
 * 
 * @template T - The type of items in the data array
 */
export interface PaginatedResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  /** The paginated data */
  data?: {
    /** Array of items for current page */
    items: T[];
    /** Pagination metadata */
    pagination: PaginationMeta;
  };
  /** Error message (only present on failure) */
  error?: string;
  /** Response timestamp */
  timestamp?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrev: boolean;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Response timestamp */
  timestamp: string;
  /** Service version */
  version?: string;
  /** Database connection status */
  database?: 'connected' | 'disconnected';
  /** Redis connection status */
  redis?: 'connected' | 'disconnected';
  /** Additional service checks */
  checks?: Record<string, unknown>;
}

/**
 * HTTP status codes enum
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * API error types
 */
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

/**
 * Detailed API error response
 */
export interface ApiErrorResponse {
  /** Error type */
  type: ApiErrorType;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code?: string;
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>;
  /** Additional error context */
  context?: Record<string, unknown>;
  /** Request ID for debugging */
  requestId?: string;
}