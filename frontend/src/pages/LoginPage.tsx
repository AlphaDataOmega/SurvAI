/**
 * @fileoverview Login page component
 * 
 * User authentication interface with email/password form
 * and integration with the auth hook for login functionality.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserCredentials } from '@survai/shared';

/**
 * Login page component
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState<UserCredentials>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<UserCredentials>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/admin');
    }
  }, [isAuthenticated, isLoading, navigate]);

  /**
   * Handle form input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name as keyof UserCredentials]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<UserCredentials> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await login(formData);
      navigate('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message from response
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Login</h1>
        <p>Sign in to access the admin dashboard</p>
      </div>
      
      <div className="page-content" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.email ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.password ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              {errors.password && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.password}
                </div>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div style={{ 
                color: '#dc2626', 
                fontSize: '0.875rem', 
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.375rem'
              }}>
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/" className="btn btn-secondary">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};