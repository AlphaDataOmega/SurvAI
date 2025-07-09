/**
 * @fileoverview Frontend App component tests
 * 
 * Tests for the main React App component including
 * rendering, API integration, and shared types usage.
 */

import type React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import axios from 'axios'
import App from '../../frontend/src/App'
import type { ApiResponse, HealthCheckResponse } from '@survai/shared'

// Mock axios
const mockedAxios = axios as jest.Mocked<typeof axios>

// Create a wrapper component with required providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      // Mock successful health check
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should render header with logo
      expect(screen.getByText('SurvAI MVP')).toBeInTheDocument()
    })

    it('should render navigation links', async () => {
      // Mock successful health check
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should have navigation links
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Demo Survey')).toBeInTheDocument()
    })

    it('should render footer', async () => {
      // Mock successful health check
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should render footer
      expect(screen.getByText(/SurvAI MVP - AI-enhanced survey engine/)).toBeInTheDocument()
    })
  })

  describe('Health Check Integration', () => {
    it('should show healthy status when backend is healthy', async () => {
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Wait for health check to complete
      await waitFor(() => {
        expect(screen.getByText('Backend: healthy')).toBeInTheDocument()
      })
    })

    it('should show unhealthy status when backend fails', async () => {
      // Mock failed health check
      mockedAxios.create().get.mockRejectedValueOnce(new Error('Connection failed'))

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Wait for health check to complete
      await waitFor(() => {
        expect(screen.getByText('Backend: unhealthy')).toBeInTheDocument()
      })
    })

    it('should show loading status initially', () => {
      // Don't mock any response to simulate loading state
      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should show loading initially
      expect(screen.getByText('Backend: loading')).toBeInTheDocument()
    })

    it('should use shared types correctly', async () => {
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
          checks: {
            database: true,
            environment: 'test',
          },
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Wait for health check to complete
      await waitFor(() => {
        expect(screen.getByText('Backend: healthy')).toBeInTheDocument()
      })

      // Verify the API was called with correct endpoint
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/health')
    })
  })

  describe('Development Info', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should show development info in development mode', async () => {
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Wait for health check and then check for dev info
      await waitFor(() => {
        expect(screen.getByText('Development Info')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockedAxios.create().get.mockRejectedValueOnce(new Error('Network error'))

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should still render the app
      expect(screen.getByText('SurvAI MVP')).toBeInTheDocument()
      
      // Should show unhealthy status
      await waitFor(() => {
        expect(screen.getByText('Backend: unhealthy')).toBeInTheDocument()
      })
    })

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      mockedAxios.create().get.mockResolvedValueOnce({
        data: { invalid: 'response' },
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should still render the app
      expect(screen.getByText('SurvAI MVP')).toBeInTheDocument()
      
      // Should show unhealthy status
      await waitFor(() => {
        expect(screen.getByText('Backend: unhealthy')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should have proper heading structure
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should have navigation landmarks', async () => {
      const healthResponse: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'connected',
        },
        timestamp: new Date().toISOString(),
      }

      mockedAxios.create().get.mockResolvedValueOnce({
        data: healthResponse,
      })

      const Wrapper = createWrapper()
      render(<App />, { wrapper: Wrapper })

      // Should have navigation links
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })
})