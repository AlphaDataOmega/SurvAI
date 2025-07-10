/**
 * @fileoverview RequireAuth component for route protection
 * 
 * Higher-order component that protects routes requiring authentication
 * and optionally admin privileges. Handles loading states and redirects.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * RequireAuth component for protecting routes
 * 
 * @param children - Child components to render if authenticated
 * @param requireAdmin - Whether admin role is required
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state to prevent flash of incorrect content
  if (isLoading) {
    return (
      <div className="page">
        <div className="page-content" style={{ textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role if required
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Higher-order component version of RequireAuth
 * 
 * @param Component - Component to wrap with authentication
 * @param requireAdmin - Whether admin role is required
 */
export const withRequireAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requireAdmin: boolean = false
) => {
  const WrappedComponent = (props: P) => (
    <RequireAuth requireAdmin={requireAdmin}>
      <Component {...props} />
    </RequireAuth>
  );
  
  WrappedComponent.displayName = `withRequireAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};