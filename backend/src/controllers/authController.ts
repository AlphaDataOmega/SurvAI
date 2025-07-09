/**
 * @fileoverview Authentication controller
 * 
 * Controller for handling authentication endpoints including login, register,
 * logout, and user profile management.
 */

import type { Request, Response, NextFunction } from 'express';
import { UserStatus, type ApiResponse, type AuthResponse, type CreateUserRequest, type UserCredentials, type User } from '@survai/shared';
import { prisma } from '../app';
import { authService } from '../services/authService';
import { 
  createUnauthorizedError, 
  createBadRequestError, 
  createConflictError,
  createNotFoundError
} from '../middleware/errorHandler';

/**
 * Extended request type with user
 */
export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication controller class
 */
export class AuthController {
  /**
   * Register a new user
   * 
   * @param req - Request object with user data
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role }: CreateUserRequest = req.body;

      // Validate required fields
      if (!email || !password) {
        return next(createBadRequestError('Email and password are required'));
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return next(createConflictError('User with this email already exists'));
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: role || 'ADMIN',
          status: UserStatus.ACTIVE
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true
        }
      });

      // Generate JWT token
      const token = authService.generateJWT(user as User);

      // Set HTTP-only cookie
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Return success response
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          accessToken: token,
          user: user as User,
          expiresAt: Date.now() + 15 * 60 * 1000
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * 
   * @param req - Request object with login credentials
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: UserCredentials = req.body;

      // Validate required fields
      if (!email || !password) {
        return next(createBadRequestError('Email and password are required'));
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return next(createUnauthorizedError('Invalid credentials'));
      }

      // Check if account is active
      if (user.status !== UserStatus.ACTIVE) {
        return next(createUnauthorizedError('Account is not active'));
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return next(createUnauthorizedError('Invalid credentials'));
      }

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = authService.generateJWT(user as User);

      // Set HTTP-only cookie
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Return success response (exclude password hash)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      };

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          accessToken: token,
          user: userResponse as User,
          expiresAt: Date.now() + 15 * 60 * 1000
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * 
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear the HTTP-only cookie
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * 
   * @param req - Request object with user attached
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(createUnauthorizedError('No user attached to request'));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true
        }
      });

      if (!user) {
        return next(createNotFoundError('User not found'));
      }

      const response: ApiResponse<{ user: User }> = {
        success: true,
        data: { user: user as User },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const authController = new AuthController();