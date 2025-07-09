/**
 * @fileoverview Home page component
 * 
 * Landing page for the SurvAI MVP application
 * with project overview and navigation links.
 */

import type React from 'react'
import { Link } from 'react-router-dom'

/**
 * Home page component
 */
export const HomePage: React.FC = () => (
    <div className="page">
      <div className="page-header">
        <h1>Welcome to SurvAI MVP</h1>
        <p>AI-enhanced survey engine with dynamic monetization optimization</p>
      </div>
      
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Project Overview</h3>
          </div>
          
          <p>
            SurvAI MVP is a comprehensive survey platform that combines artificial intelligence
            with affiliate marketing to create dynamic, optimized user experiences that maximize
            conversion rates and earnings per click (EPC).
          </p>
          
          <h4>Key Features:</h4>
          <ul style={{ marginBottom: '2rem', paddingLeft: '2rem' }}>
            <li>AI-powered question generation and optimization</li>
            <li>Dynamic survey flow with intelligent branching</li>
            <li>Real-time click and conversion tracking</li>
            <li>Advanced analytics and performance metrics</li>
            <li>Responsive design for all devices</li>
            <li>Admin dashboard for complete control</li>
          </ul>
          
          <h4>Tech Stack:</h4>
          <ul style={{ marginBottom: '2rem', paddingLeft: '2rem' }}>
            <li><strong>Frontend:</strong> React + TypeScript + Vite</li>
            <li><strong>Backend:</strong> Node.js + Express + TypeScript</li>
            <li><strong>Database:</strong> PostgreSQL with Prisma ORM</li>
            <li><strong>Cache:</strong> Redis</li>
            <li><strong>AI Integration:</strong> OpenAI + Ollama support</li>
            <li><strong>Development:</strong> Docker + Monorepo architecture</li>
          </ul>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/admin" className="btn btn-primary">
              Admin Dashboard
            </Link>
            <Link to="/survey/demo" className="btn btn-secondary">
              Demo Survey
            </Link>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Development Status</h3>
          </div>
          
          <p>
            This is the initial MVP setup with core infrastructure in place.
            The following components have been implemented:
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="card" style={{ margin: 0, backgroundColor: '#f7fafc' }}>
              <h5 style={{ color: '#48bb78', marginBottom: '0.5rem' }}>✅ Completed</h5>
              <ul style={{ fontSize: '0.875rem', paddingLeft: '1rem' }}>
                <li>Monorepo structure</li>
                <li>Backend API with Express</li>
                <li>Frontend with React + Vite</li>
                <li>Database schema with Prisma</li>
                <li>Docker development environment</li>
                <li>TypeScript configuration</li>
                <li>Shared types package</li>
                <li>Health check endpoints</li>
              </ul>
            </div>
            
            <div className="card" style={{ margin: 0, backgroundColor: '#fef5e7' }}>
              <h5 style={{ color: '#ed8936', marginBottom: '0.5rem' }}>🚧 In Progress</h5>
              <ul style={{ fontSize: '0.875rem', paddingLeft: '1rem' }}>
                <li>API routes implementation</li>
                <li>Authentication system</li>
                <li>Survey management UI</li>
                <li>Question builder</li>
                <li>Offer management</li>
                <li>Analytics dashboard</li>
                <li>AI integration</li>
                <li>Testing framework</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )