/**
 * @fileoverview Authentication controller tests
 * 
 * Integration tests for the AuthController covering registration,
 * login, logout, and user profile endpoints.
 */

import request from 'supertest';
import app, { prisma } from '../../backend/src/app';
import { authService } from '../../backend/src/services/authService';
import type { UserRole } from '@survai/shared';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

describe('AuthController', () => {
  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User',
    role: 'ADMIN' as UserRole
  };

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user.role).toBe(testUser.role);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();

      // Check cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
    });

    test('should reject registration with missing email', async () => {
      const invalidUser = { ...testUser };
      delete (invalidUser as any).email;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email and password are required');
    });

    test('should reject registration with missing password', async () => {
      const invalidUser = { ...testUser };
      delete (invalidUser as any).password;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email and password are required');
    });

    test('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User with this email already exists');
    });

    test('should default role to ADMIN if not specified', async () => {
      const userWithoutRole = { ...testUser };
      delete (userWithoutRole as any).role;

      const response = await request(app)
        .post('/api/auth/register')
        .send(userWithoutRole)
        .expect(201);

      expect(response.body.data.user.role).toBe('ADMIN');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await authService.hashPassword(testUser.password);
      await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          passwordHash: hashedPassword,
          role: testUser.role,
          status: 'ACTIVE'
        }
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();

      // Check cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
    });

    test('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email and password are required');
    });

    test('should reject login for inactive user', async () => {
      // Update user status to inactive
      await prisma.user.update({
        where: { email: testUser.email },
        data: { status: 'INACTIVE' }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Account is not active');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Logged out successfully');

      // Check cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const accessTokenCookie = cookies.find((cookie: string) => cookie.includes('accessToken'));
        if (accessTokenCookie) {
          expect(accessTokenCookie).toContain('accessToken=;');
        }
      }
    });
  });

  describe('GET /api/auth/me', () => {
    let authCookie: string;

    beforeEach(async () => {
      // Create test user and login
      const hashedPassword = await authService.hashPassword(testUser.password);
      await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          passwordHash: hashedPassword,
          role: testUser.role,
          status: 'ACTIVE'
        }
      });

      // Login to get auth cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const cookies = loginResponse.headers['set-cookie'];
      authCookie = cookies.find((cookie: string) => cookie.includes('accessToken')) || '';
    });

    test('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [authCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user.role).toBe(testUser.role);
      expect(response.body.data.user.passwordHash).toBeUndefined(); // Should not include password
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No authentication token provided');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['accessToken=invalid.jwt.token'])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired authentication token');
    });
  });

  describe('Integration flow tests', () => {
    test('should complete full authentication flow', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const registerCookies = registerResponse.headers['set-cookie'];
      const registerCookie = registerCookies.find((cookie: string) => cookie.includes('accessToken'));

      // 2. Get profile with registration token
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [registerCookie])
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe(testUser.email);

      // 3. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [registerCookie])
        .expect(200);

      // 4. Try to access profile after logout (should fail)
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', [registerCookie])
        .expect(401);

      // 5. Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const loginCookies = loginResponse.headers['set-cookie'];
      const loginCookie = loginCookies.find((cookie: string) => cookie.includes('accessToken'));

      // 6. Access profile with new token
      const finalProfileResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [loginCookie])
        .expect(200);

      expect(finalProfileResponse.body.data.user.email).toBe(testUser.email);
    });
  });
});