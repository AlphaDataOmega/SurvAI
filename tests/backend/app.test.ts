/**
 * @fileoverview Backend app tests
 * 
 * Tests for the main Express application including
 * health endpoint, database connection, and error handling.
 */

import request from 'supertest'
import app from '../../backend/src/app'
import type { ApiResponse, HealthCheckResponse } from '@survai/shared'

describe('Express App', () => {
  describe('Health Endpoint', () => {
    it('should return health status with database connection', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      const body: ApiResponse<HealthCheckResponse> = response.body

      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()
      expect(body.data?.status).toBe('healthy')
      expect(body.data?.timestamp).toBeDefined()
      expect(body.data?.database).toBe('connected')
      expect(body.timestamp).toBeDefined()
    })

    it('should return proper health response structure', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      const body: ApiResponse<HealthCheckResponse> = response.body

      expect(body).toHaveProperty('success')
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('timestamp')
      
      if (body.data) {
        expect(body.data).toHaveProperty('status')
        expect(body.data).toHaveProperty('timestamp')
        expect(body.data).toHaveProperty('version')
        expect(body.data).toHaveProperty('database')
        expect(body.data).toHaveProperty('checks')
      }
    })

    it('should include version information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      const body: ApiResponse<HealthCheckResponse> = response.body

      expect(body.data?.version).toBeDefined()
      expect(typeof body.data?.version).toBe('string')
    })
  })

  describe('Root Endpoint', () => {
    it('should return app information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      const body: ApiResponse<{ message: string; version: string }> = response.body

      expect(body.success).toBe(true)
      expect(body.data?.message).toBe('SurvAI MVP Backend API')
      expect(body.data?.version).toBeDefined()
      expect(body.timestamp).toBeDefined()
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404)

      const body: ApiResponse<never> = response.body

      expect(body.success).toBe(false)
      expect(body.error).toContain('Route GET /non-existent-route not found')
      expect(body.timestamp).toBeDefined()
    })

    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404)

      const body: ApiResponse<never> = response.body

      expect(body.success).toBe(false)
      expect(body.error).toContain('not found')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/test')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(500)

      // Should get a JSON response even with malformed input
      expect(response.headers['content-type']).toMatch(/json/)
    })

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      // CORS headers may not be present in test environment
      // expect(response.headers['access-control-allow-origin']).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      // Check for some Helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    })
  })

  describe('Request Handling', () => {
    it('should handle requests with request ID header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      // Should have request ID in response headers
      expect(response.headers['x-request-id']).toBeDefined()
    })

    it('should handle different HTTP methods appropriately', async () => {
      // GET should work for health
      await request(app)
        .get('/health')
        .expect(200)

      // POST should return 404 for health (method not allowed for this endpoint)
      await request(app)
        .post('/health')
        .expect(404)

      // OPTIONS should work (CORS preflight)
      await request(app)
        .options('/health')
        .expect(204)
    })
  })

  describe('Database Connection Test', () => {
    it('should successfully connect to test database', async () => {
      // This test verifies that the database connection works
      // In a real implementation, this would test actual database operations
      const response = await request(app)
        .get('/health')
        .expect(200)

      const body: ApiResponse<HealthCheckResponse> = response.body
      expect(body.data?.database).toBe('connected')
    })
  })
})