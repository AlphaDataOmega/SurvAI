/**
 * @fileoverview Authentication middleware
 * 
 * Middleware functions for JWT authentication and role-based authorization.
 * Extracts JWT from HTTP-only cookies and validates user permissions.
 */

import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@survai/shared';
import { authService } from '../services/authService';
import { createUnauthorizedError, createForbiddenError } from './errorHandler';

/**
 * Extended request type with user
 */
export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
  };
}

/**
 * Middleware to authenticate user from JWT token in HTTP-only cookie
 * 
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export const authenticateUser = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from HTTP-only cookie
    const token = req.cookies.accessToken;
    
    if (!token) {
      return next(createUnauthorizedError('No authentication token provided'));
    }

    // Verify JWT token
    const payload = authService.verifyJWT(token);
    
    // Attach user to request
    req.user = payload;
    
    next();
  } catch (error) {
    // Token verification failed
    return next(createUnauthorizedError('Invalid or expired authentication token'));
  }
};

/**
 * Middleware to require admin role
 * Must be used after authenticateUser middleware
 * 
 * @param req - Request object with user attached
 * @param res - Response object
 * @param next - Next function
 */
export const requireAdmin = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  // Check if user is authenticated
  if (!req.user) {
    return next(createUnauthorizedError('Authentication required'));
  }

  // Since we only have ADMIN role, just check if user has admin role
  if (req.user.role !== 'ADMIN') {
    return next(createForbiddenError('Admin access required'));
  }

  next();
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 * 
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export const optionalAuth = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from HTTP-only cookie
    const token = req.cookies.accessToken;
    
    if (token) {
      // Verify JWT token
      const payload = authService.verifyJWT(token);
      
      // Attach user to request
      req.user = payload;
    }
    
    // Continue regardless of authentication status
    next();
  } catch (error) {
    // Token verification failed - continue without user
    next();
  }
};