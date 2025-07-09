/**
 * @fileoverview Header component
 * 
 * Application header with navigation and health status indicator
 * for the SurvAI MVP frontend.
 */

import type React from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { HealthCheckResponse } from '@survai/shared'

interface HealthStatus {
  status: 'loading' | 'healthy' | 'unhealthy'
  data?: HealthCheckResponse
  error?: string
}

interface HeaderProps {
  healthStatus: HealthStatus
}

/**
 * Header component
 */
export const Header: React.FC<HeaderProps> = ({ healthStatus }) => {
  const location = useLocation()

  const getHealthIndicator = () => {
    const { status } = healthStatus
    
    return (
      <div className="health-indicator">
        <span className={`health-dot ${status}`} />
        <span style={{ fontSize: '0.75rem' }}>
          Backend: {status === 'loading' ? 'Checking...' : status}
        </span>
      </div>
    )
  }

  const isActiveLink = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <Link to="/" className="logo">
          SurvAI MVP
        </Link>
        
        {/* Navigation */}
        <nav>
          <ul className="nav-links">
            <li>
              <Link 
                to="/" 
                style={{ 
                  color: isActiveLink('/') && location.pathname === '/' ? '#2b6cb0' : undefined 
                }}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/admin" 
                style={{ 
                  color: isActiveLink('/admin') ? '#2b6cb0' : undefined 
                }}
              >
                Admin
              </Link>
            </li>
            <li>
              <Link 
                to="/survey/demo" 
                style={{ 
                  color: isActiveLink('/survey') ? '#2b6cb0' : undefined 
                }}
              >
                Demo Survey
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Health Status */}
        {getHealthIndicator()}
      </div>
    </header>
  )
}