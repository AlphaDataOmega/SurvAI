/**
 * @fileoverview Layout component with authentication awareness
 * 
 * Common layout wrapper that provides navigation and auth status
 * for authenticated users with admin role checking.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useIsAdmin } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * Layout component with authentication awareness
 */
export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  requireAuth = false, 
  requireAdmin = false 
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const isAdmin = useIsAdmin();

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout request fails
      navigate('/login');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="page">
        <div className="page-content" style={{ textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Check admin requirements
  if (requireAdmin && !isAdmin) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Access Denied</h1>
          <p>You need admin privileges to access this page</p>
        </div>
        <div className="page-content" style={{ textAlign: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      {isAuthenticated && (
        <header style={{
          backgroundColor: '#2b6cb0',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* Logo/Brand */}
            <Link 
              to="/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontSize: '1.5rem', 
                fontWeight: 'bold' 
              }}
            >
              SurvAI
            </Link>

            {/* Navigation Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <Link 
                to="/" 
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Home
              </Link>
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  style={{ color: 'white', textDecoration: 'none' }}
                >
                  Admin Dashboard
                </Link>
              )}

              {/* User Menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem' }}>
                  Welcome, {user?.name || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#f7fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '2rem',
        textAlign: 'center',
        color: '#718096'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p>&copy; 2024 SurvAI. All rights reserved.</p>
          {isAuthenticated && (
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Logged in as: {user?.email} ({user?.role})
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};