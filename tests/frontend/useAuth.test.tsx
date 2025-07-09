/**
 * @fileoverview Auth hook tests
 * 
 * Tests for the useAuth hook covering authentication state management,
 * login, logout, and auth context functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../frontend/src/hooks/useAuth';
import * as api from '../../frontend/src/services/api';
import type { User, UserCredentials, CreateUserRequest } from '@survai/shared';

// Mock the API module
jest.mock('../../frontend/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test component that uses the auth hook
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, checkAuth } = useAuth();

  const handleLogin = () => {
    const credentials: UserCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    login(credentials);
  };

  const handleRegister = () => {
    const userData: CreateUserRequest = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'ADMIN'
    };
    register(userData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div data-testid="user-email">{user.email}</div>
      )}
      <button onClick={handleLogin} data-testid="login-button">
        Login
      </button>
      <button onClick={handleRegister} data-testid="register-button">
        Register
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
      <button onClick={checkAuth} data-testid="check-auth-button">
        Check Auth
      </button>
    </div>
  );
};

// Wrapper component with AuthProvider
const AuthTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should show loading state initially', () => {
      // Mock checkAuth to never resolve
      mockedApi.api.get.mockImplementation(() => new Promise(() => {}));

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should show not authenticated when checkAuth fails', async () => {
      mockedApi.api.get.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });

    test('should show authenticated when checkAuth succeeds', async () => {
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser }
        }
      } as any);

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Login Function', () => {
    test('should login successfully', async () => {
      // Mock initial checkAuth to fail (not authenticated)
      mockedApi.api.get.mockRejectedValueOnce(new Error('Unauthorized'));
      
      // Mock successful login
      mockedApi.api.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'mock-token',
            user: mockUser,
            expiresAt: Date.now() + 900000
          }
        }
      } as any);

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });

      // Click login button
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });

      expect(mockedApi.api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should handle login error', async () => {
      // Mock initial checkAuth to fail
      mockedApi.api.get.mockRejectedValueOnce(new Error('Unauthorized'));
      
      // Mock login failure
      mockedApi.api.post.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });

      // Click login button
      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });
  });

  describe('Register Function', () => {
    test('should register successfully', async () => {
      // Mock initial checkAuth to fail
      mockedApi.api.get.mockRejectedValueOnce(new Error('Unauthorized'));
      
      // Mock successful registration
      mockedApi.api.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'mock-token',
            user: mockUser,
            expiresAt: Date.now() + 900000
          }
        }
      } as any);

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });

      // Click register button
      fireEvent.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });

      expect(mockedApi.api.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'ADMIN'
      });
    });
  });

  describe('Logout Function', () => {
    test('should logout successfully', async () => {
      // Mock initial checkAuth to succeed
      mockedApi.api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { user: mockUser }
        }
      } as any);

      // Mock successful logout
      mockedApi.api.post.mockResolvedValue({
        data: { success: true, data: { message: 'Logged out' } }
      } as any);

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      // Wait for initial authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Click logout button
      fireEvent.click(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });

      expect(mockedApi.api.post).toHaveBeenCalledWith('/api/auth/logout');
    });

    test('should logout even if API call fails', async () => {
      // Mock initial checkAuth to succeed
      mockedApi.api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { user: mockUser }
        }
      } as any);

      // Mock logout failure
      mockedApi.api.post.mockRejectedValue(new Error('Logout failed'));

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Click logout button
      fireEvent.click(screen.getByTestId('logout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });
  });

  describe('Check Auth Function', () => {
    test('should update auth state when checkAuth is called', async () => {
      // Mock initial checkAuth to fail
      mockedApi.api.get.mockRejectedValueOnce(new Error('Unauthorized'));

      render(
        <AuthTestWrapper>
          <TestComponent />
        </AuthTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });

      // Mock successful checkAuth for manual call
      mockedApi.api.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser }
        }
      } as any);

      // Click check auth button
      fireEvent.click(screen.getByTestId('check-auth-button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Error Handling', () => {
    test('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});