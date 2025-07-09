/**
 * @fileoverview Footer component
 * 
 * Application footer with project information and links
 * for the SurvAI MVP frontend.
 */

import type React from 'react'

/**
 * Footer component
 */
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p>
          © {currentYear} SurvAI MVP - AI-enhanced survey engine with dynamic monetization optimization
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 }}>
          Built with React + TypeScript + Vite | Backend: Node.js + Express + Prisma | Database: PostgreSQL
        </p>
      </div>
    </footer>
  )
}