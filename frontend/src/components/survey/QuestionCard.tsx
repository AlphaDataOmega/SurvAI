/**
 * @fileoverview Question card component for CTA-based surveys
 * 
 * Displays CTA question with title, description, offer buttons, and skip option.
 * Handles button clicks and loading states.
 */

import React from 'react';
import type { Question, CTAButtonVariant } from '@survai/shared';
import { OfferButton } from './OfferButton';

export interface QuestionCardProps {
  /** The question to display */
  question: Question;
  /** Available offer buttons */
  offerButtons: CTAButtonVariant[];
  /** Handler for offer button clicks */
  onButtonClick: (buttonId: string, offerId: string) => Promise<void>;
  /** Handler for skip button click */
  onSkip: () => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
}

/**
 * Question card component for CTA surveys
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  offerButtons,
  onButtonClick,
  onSkip,
  isLoading = false,
  error
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#1a202c',
          lineHeight: '1.25'
        }}>
          {question.text}
        </h2>
        
        {question.description && (
          <p style={{
            fontSize: '1.125rem',
            color: '#4a5568',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            {question.description}
          </p>
        )}
      </div>
      
      <div className="card-content">
        {/* Offer Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: question.config.buttonLayout === 'horizontal' ? 'row' : 'column',
          gap: '1rem',
          marginBottom: '2rem'
        }} data-testid="offer-buttons">
          {offerButtons.map((button) => (
            <OfferButton
              key={button.id}
              variant={button}
              onClick={() => onButtonClick(button.id, button.offerId)}
              disabled={isLoading}
            />
          ))}
        </div>
        
        {/* Skip Button */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={onSkip}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#e2e8f0',
              color: '#4a5568',
              border: '1px solid #cbd5e0',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {isLoading ? 'Loading...' : 'No Thanks, Skip'}
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fed7d7',
            color: '#c53030',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.5rem',
            zIndex: 10
          }}>
            <div style={{
              fontSize: '1rem',
              color: '#4a5568',
              fontWeight: '500'
            }}>
              Loading...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};