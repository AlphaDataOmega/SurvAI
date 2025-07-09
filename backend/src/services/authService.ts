/**
 * @fileoverview Authentication service
 * 
 * Service for handling password hashing, JWT token generation and verification
 * following security best practices with bcrypt and JWT.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, JwtPayload } from '@survai/shared';

/**
 * Authentication service class
 */
export class AuthService {
  /**
   * Hash a password using bcrypt
   * 
   * @param password - The plain text password to hash
   * @returns Promise<string> - The hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare a password with its hash
   * 
   * @param password - The plain text password
   * @param hash - The hashed password
   * @returns Promise<boolean> - Whether the password matches the hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   * 
   * @param user - The user object
   * @returns string - The JWT token
   */
  generateJWT(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.sign(payload, secret, { expiresIn: '15m' });
  }

  /**
   * Verify a JWT token
   * 
   * @param token - The JWT token to verify
   * @returns JwtPayload - The decoded payload
   * @throws Error if token is invalid
   */
  verifyJWT(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();