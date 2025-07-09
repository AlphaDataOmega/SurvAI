/**
 * @fileoverview Request logging middleware
 * 
 * Custom request logging middleware for tracking API requests
 * with additional context and request IDs.
 */

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Extend Request type to include requestId
declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    startTime: number;
  }
}

/**
 * Request logging middleware
 * Adds request ID and timing information to requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.set('X-Request-ID', req.requestId);

  // Log request start
  logger.info('Request started:', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    const duration = Date.now() - req.startTime;
    
    // Log response
    logger.info('Request completed:', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });

    // Call original end method with all arguments
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};