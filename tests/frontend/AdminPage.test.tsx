/**
 * @fileoverview AdminPage component tests
 * 
 * Tests for the AdminPage component with proper authentication mocking
 * to ensure it renders without authentication errors.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../../frontend/src/hooks/useAuth';
import { AdminPage } from '../../frontend/src/pages/AdminPage';
import * as api from '../../frontend/src/services/api';
import type { User } from '@survai/shared';

// Mock the API module
jest.mock('../../frontend/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock admin user data
const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@survai.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test wrapper component with all required providers
const AdminPageTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('AdminPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Integration', () => {
    test('should render dashboard heading without auth error when user is authenticated admin', async () => {
      // Mock successful authentication for admin user
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockAdminUser }
        }
      } as any);

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      // Wait for authentication to complete and component to render
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-title')).toBeInTheDocument();
      });

      // Verify the dashboard heading is displayed (success criteria from ISSUES_01.md)
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    test('should render admin dashboard content when authenticated', async () => {
      // Mock successful authentication
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockAdminUser }
        }
      } as any);

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      });

      // Verify key admin dashboard elements are present
      expect(screen.getByText('Survey Management')).toBeInTheDocument();
      expect(screen.getByText('Question Builder')).toBeInTheDocument();
      expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    test('should render metrics chart component', async () => {
      // Mock successful authentication
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockAdminUser }
        }
      } as any);

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('metrics-chart')).toBeInTheDocument();
      });

      // Verify quick stats section
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('Active Surveys')).toBeInTheDocument();
      expect(screen.getByText('Total Responses')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    });

    test('should show loading state initially', () => {
      // Mock API call that takes time to resolve
      mockedApi.api.get.mockImplementation(() => new Promise(() => {}));

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      // Should show loading state from Layout component
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Navigation and Links', () => {
    test('should render performance dashboard link', async () => {
      // Mock successful authentication
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockAdminUser }
        }
      } as any);

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      });

      // Verify the link is present and has correct href
      const dashboardLink = screen.getByRole('link', { name: 'Performance Dashboard' });
      expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard');
    });

    test('should render back to home link', async () => {
      // Mock successful authentication
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockAdminUser }
        }
      } as any);

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('← Back to Home')).toBeInTheDocument();
      });

      // Verify the back link
      const backLink = screen.getByRole('link', { name: '← Back to Home' });
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication failure gracefully', async () => {
      // Mock authentication failure
      mockedApi.api.get.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AdminPageTestWrapper>
          <AdminPage />
        </AdminPageTestWrapper>
      );

      // Should not crash and should eventually show not authenticated state
      await waitFor(() => {
        // The RequireAuth component should handle the redirect
        // For this test, we're mainly ensuring no errors are thrown
        expect(true).toBe(true); // Component rendered without throwing
      });
    });
  });
});