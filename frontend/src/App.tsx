/**
 * @fileoverview Main App component
 * 
 * Root component for the SurvAI MVP frontend application
 * with health check integration and shared types usage.
 */

import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { ApiResponse, HealthCheckResponse } from '@survai/shared'

import { apiClient } from './services/api'
import { HomePage } from './pages/HomePage'
import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/LoginPage'
import { SurveyPage } from './pages/SurveyPage'
import { Dashboard } from './components/admin/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { RequireAuth } from './components/auth/RequireAuth'

/**
 * Backend health status interface
 */
interface HealthStatus {
  status: 'loading' | 'healthy' | 'unhealthy'
  data?: HealthCheckResponse
  error?: string
}

/**
 * Main App component
 */
function App(): JSX.Element {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'loading'
  })

  // Check backend health on app load
  useEffect(() => {
    const checkHealth = async (): Promise<void> => {
      try {
        const response = await apiClient.get<ApiResponse<HealthCheckResponse>>('/health')
        
        if (response.data.success && response.data.data) {
          setHealthStatus({
            status: 'healthy',
            data: response.data.data
          })
        } else {
          setHealthStatus({
            status: 'unhealthy',
            error: response.data.error || 'Unknown error'
          })
        }
      } catch (error) {
        console.error('Health check failed:', error)
        setHealthStatus({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Backend connection failed'
        })
      }
    }

    checkHealth()

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ErrorBoundary>
      <div className="app">
        <Header healthStatus={healthStatus} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin" 
              element={
                <RequireAuth requireAdmin={true}>
                  <AdminPage />
                </RequireAuth>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <RequireAuth requireAdmin={true}>
                  <Dashboard />
                </RequireAuth>
              } 
            />
            <Route path="/survey/:id" element={<SurveyPage />} />
          </Routes>
        </main>
        
        <Footer />
        
        {/* Development info */}
        {import.meta.env.DEV && (
          <div className="dev-info">
            <h4>Development Info</h4>
            <p>Backend Status: {healthStatus.status}</p>
            {healthStatus.data && (
              <div>
                <p>Backend Version: {healthStatus.data.version}</p>
                <p>Database: {healthStatus.data.database}</p>
                <p>Timestamp: {healthStatus.data.timestamp}</p>
              </div>
            )}
            {healthStatus.error && (
              <p style={{ color: 'red' }}>Error: {healthStatus.error}</p>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App