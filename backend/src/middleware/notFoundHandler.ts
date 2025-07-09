/**
 * @fileoverview 404 Not Found handler middleware
 * 
 * Handles requests to routes that don't exist and returns
 * a standardized 404 response.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@survai/shared';
import { logger } from '../utils/logger';

/**
 * 404 Not Found handler middleware
 * Should be placed after all routes but before the error handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the 404 request
  logger.warn('404 Not Found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const response: ApiResponse<never> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};