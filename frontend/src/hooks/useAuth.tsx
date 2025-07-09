/**
 * @fileoverview Authentication hook
 * 
 * React hook for managing authentication state and operations
 * including login, logout, and user profile management.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User, UserCredentials, CreateUserRequest, AuthResponse } from '@survai/shared';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  register: (userData: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /**
   * Check current authentication status
   */
  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: { user: User } }>('/api/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      // User is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: UserCredentials) => {
    try {
      const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/login', credentials);
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  /**
   * Register user
   */
  const register = useCallback(async (userData: CreateUserRequest) => {
    try {
      const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/register', userData);
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Use authentication hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component for protecting routes
 */
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="page">
          <div className="page-content" style={{ textAlign: 'center' }}>
            <div>Loading...</div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized message
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook to check if user has specific role
 */
export const useRole = (requiredRole: string): boolean => {
  const { user } = useAuth();
  return user?.role === requiredRole;
};

/**
 * Hook to check if user is admin
 */
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();
  return user?.role === 'ADMIN';
};