/**
 * @fileoverview Authentication service tests
 * 
 * Unit tests for the AuthService class covering password hashing,
 * JWT generation, and token verification.
 */

import { AuthService } from '../../backend/src/services/authService';
import type { User, UserRole } from '@survai/shared';
import jwt from 'jsonwebtoken';

const authService = new AuthService();

// Mock user for testing
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN' as UserRole,
  status: 'ACTIVE' as any,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Set test JWT secret
process.env.JWT_SECRET = 'test-secret-key-for-testing';

describe('AuthService', () => {
  describe('hashPassword', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60+ chars
    });

    test('should create different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty password', async () => {
      const password = '';
      const hash = await authService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('comparePassword', () => {
    test('should validate correct password', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.comparePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    test('should handle empty password comparison', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.comparePassword('', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateJWT', () => {
    test('should generate valid JWT token', () => {
      const token = authService.generateJWT(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include user data in token payload', () => {
      const token = authService.generateJWT(mockUser);
      const payload = authService.verifyJWT(token);
      
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    test('should throw error without JWT_SECRET', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => authService.generateJWT(mockUser)).toThrow('JWT_SECRET environment variable is not set');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyJWT', () => {
    test('should verify valid JWT token', () => {
      const token = authService.generateJWT(mockUser);
      const payload = authService.verifyJWT(token);
      
      expect(payload).toBeDefined();
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => authService.verifyJWT(invalidToken)).toThrow('Invalid or expired token');
    });

    test('should throw error for expired token', () => {
      // Create token with past expiration
      const expiredPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800,  // 30 minutes ago
      };
      
      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET!);
      
      expect(() => authService.verifyJWT(expiredToken)).toThrow('Invalid or expired token');
    });

    test('should throw error without JWT_SECRET', () => {
      const token = authService.generateJWT(mockUser);
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => authService.verifyJWT(token)).toThrow('JWT_SECRET environment variable is not set');
      
      process.env.JWT_SECRET = originalSecret;
    });

    test('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => authService.verifyJWT(malformedToken)).toThrow('Invalid or expired token');
    });
  });

  describe('integration tests', () => {
    test('should complete full password cycle', async () => {
      const password = 'integration-test-password';
      
      // Hash password
      const hash = await authService.hashPassword(password);
      expect(hash).toBeDefined();
      
      // Verify correct password
      const isValidCorrect = await authService.comparePassword(password, hash);
      expect(isValidCorrect).toBe(true);
      
      // Verify incorrect password
      const isValidIncorrect = await authService.comparePassword('wrong-password', hash);
      expect(isValidIncorrect).toBe(false);
    });

    test('should complete full JWT cycle', () => {
      // Generate token
      const token = authService.generateJWT(mockUser);
      expect(token).toBeDefined();
      
      // Verify token
      const payload = authService.verifyJWT(token);
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});