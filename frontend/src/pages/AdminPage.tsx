/**
 * @fileoverview Admin page component
 * 
 * Administrative interface for managing surveys, offers,
 * and viewing analytics in the SurvAI MVP. Protected by authentication guard.
 */

import type React from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/common/Layout'
import { OfferManagement } from '../components/admin/OfferManagement'

/**
 * Admin page component with authentication protection
 */
export const AdminPage: React.FC = () => (
  <Layout requireAuth={true} requireAdmin={true}>
    <div className="page" data-testid="admin-dashboard">
      <div className="page-header">
        <h1 data-testid="dashboard-title">Admin Dashboard</h1>
        <p>Manage surveys, offers, and view performance analytics</p>
      </div>
      
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Survey Management */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Survey Management</h3>
            </div>
            
            <p>Create, edit, and manage your survey campaigns.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" disabled>
                Create New Survey
              </button>
              <button className="btn btn-secondary" disabled>
                View All Surveys
              </button>
              <button className="btn btn-secondary" disabled>
                Survey Templates
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '1rem' }}>
              <em>Coming soon - survey builder interface</em>
            </p>
          </div>
          
          {/* Question Management */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Question Builder</h3>
            </div>
            
            <p>Build and optimize questions with AI assistance.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" disabled>
                Create Question
              </button>
              <button className="btn btn-secondary" disabled>
                AI Question Generator
              </button>
              <button className="btn btn-secondary" disabled>
                Question Library
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '1rem' }}>
              <em>Coming soon - AI-powered question optimization</em>
            </p>
          </div>
          
          {/* Offer Management */}
          <div style={{ gridColumn: '1 / -1' }}>
            <OfferManagement />
          </div>
          
          {/* Analytics */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Analytics & Reports</h3>
            </div>
            
            <p>View performance metrics, conversion rates, and EPC data.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/admin/dashboard" className="btn btn-primary">
                Performance Dashboard
              </Link>
              <button className="btn btn-secondary" disabled>
                Conversion Reports
              </button>
              <button className="btn btn-secondary" disabled>
                A/B Test Results
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#38a169', marginTop: '1rem' }}>
              <em>✓ Real-time analytics dashboard available</em>
            </p>
          </div>
          
          {/* User Management */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Management</h3>
            </div>
            
            <p>Manage admin users and access permissions.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" disabled>
                Manage Users
              </button>
              <button className="btn btn-secondary" disabled>
                Role Permissions
              </button>
              <button className="btn btn-secondary" disabled>
                Access Logs
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '1rem' }}>
              <em>Coming soon - user management system</em>
            </p>
          </div>
          
          {/* Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Settings</h3>
            </div>
            
            <p>Configure system settings and integrations.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" disabled>
                AI Configuration
              </button>
              <button className="btn btn-secondary" disabled>
                API Settings
              </button>
              <button className="btn btn-secondary" disabled>
                System Health
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '1rem' }}>
              <em>Coming soon - configuration interface</em>
            </p>
          </div>
          
        </div>
        
        {/* Quick Stats */}
        <div className="card" style={{ marginTop: '2rem' }} data-testid="metrics-chart">
          <div className="card-header">
            <h3 className="card-title">Quick Stats</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2b6cb0' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Active Surveys</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2b6cb0' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total Responses</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2b6cb0' }}>$0.00</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total Revenue</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2b6cb0' }}>0%</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Conversion Rate</div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" className="btn btn-secondary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  </Layout>
)