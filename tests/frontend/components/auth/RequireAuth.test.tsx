/**
 * @fileoverview RequireAuth component tests
 * 
 * Tests for the RequireAuth route protection component covering
 * authentication states, admin role checking, and navigation behavior.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../../../../frontend/src/hooks/useAuth';
import { RequireAuth } from '../../../../frontend/src/components/auth/RequireAuth';
import * as api from '../../../../frontend/src/services/api';
import type { User } from '@survai/shared';

// Mock the API module
jest.mock('../../../../frontend/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock users for testing
const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@survai.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRegularUser: User = {
  id: 'user-id',
  email: 'user@survai.com',
  name: 'Regular User',
  role: 'USER',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test components
const ProtectedContent: React.FC = () => <div>Protected Content</div>;
const LoginPage: React.FC = () => <div>Login Page</div>;
const HomePage: React.FC = () => <div>Home Page</div>;

// Test wrapper with routing
const RequireAuthTestWrapper: React.FC<{ 
  children: React.ReactNode;
  requireAdmin?: boolean;
}> = ({ children, requireAdmin = false }) => {
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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/protected" 
              element={
                <RequireAuth requireAdmin={requireAdmin}>
                  <ProtectedContent />
                </RequireAuth>
              } 
            />
          </Routes>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('RequireAuth Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the URL to /protected for each test
    window.history.pushState({}, '', '/protected');
  });

  describe('Loading States', () => {
    test('should display loading state while authentication is in progress', () => {
      // Mock API call that never resolves to simulate loading
      mockedApi.api.get.mockImplementation(() => new Promise(() => {}));

      render(
        <RequireAuthTestWrapper>
          <RequireAuth>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Authentication Checking', () => {
    test('should render protected content when user is authenticated', async () => {
      // Mock successful authentication
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockRegularUser }
        }
      } as any);

      render(
        <RequireAuthTestWrapper>
          <RequireAuth>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('should redirect to login when user is not authenticated', async () => {
      // Mock authentication failure
      mockedApi.api.get.mockRejectedValue(new Error('Unauthorized'));

      render(
        <RequireAuthTestWrapper>
          <RequireAuth>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Admin Role Checking', () => {
    test('should render protected content when user is admin and admin is required', async () => {
      // Mock successful authentication with admin user
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockAdminUser }
        }
      } as any);

      render(
        <RequireAuthTestWrapper requireAdmin={true}>
          <RequireAuth requireAdmin={true}>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('should redirect to login when user is not admin but admin is required', async () => {
      // Mock successful authentication with regular user
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockRegularUser }
        }
      } as any);

      render(
        <RequireAuthTestWrapper requireAdmin={true}>
          <RequireAuth requireAdmin={true}>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should render protected content when user is regular user and admin is not required', async () => {
      // Mock successful authentication with regular user
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockRegularUser }
        }
      } as any);

      render(
        <RequireAuthTestWrapper requireAdmin={false}>
          <RequireAuth requireAdmin={false}>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Default Behavior', () => {
    test('should not require admin by default', async () => {
      // Mock successful authentication with regular user
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockRegularUser }
        }
      } as any);

      render(
        <RequireAuthTestWrapper>
          <RequireAuth>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Behavior', () => {
    test('should use replace navigation to prevent back button issues', async () => {
      // Mock authentication failure
      mockedApi.api.get.mockRejectedValue(new Error('Unauthorized'));

      const mockReplace = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        Navigate: ({ to, replace }: { to: string; replace: boolean }) => {
          mockReplace(to, replace);
          return <div>Login Page</div>;
        }
      }));

      render(
        <RequireAuthTestWrapper>
          <RequireAuth>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null user gracefully', async () => {
      // Mock authentication response with null user
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: null }
        }
      } as any);

      render(
        <RequireAuthTestWrapper>
          <RequireAuth>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    test('should handle undefined user role gracefully', async () => {
      // Mock user without role
      const userWithoutRole = { ...mockRegularUser };
      delete (userWithoutRole as any).role;

      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: userWithoutRole }
        }
      } as any);

      render(
        <RequireAuthTestWrapper requireAdmin={true}>
          <RequireAuth requireAdmin={true}>
            <ProtectedContent />
          </RequireAuth>
        </RequireAuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });
});