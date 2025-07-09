/**
 * @fileoverview Survey page component
 * 
 * CTA-based survey interface for end users with offer button interactions
 * and click tracking for affiliate monetization.
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { QuestionCard } from '../components/survey/QuestionCard';
import { useSurvey } from '../hooks/useSurvey';

/**
 * Survey page component
 */
export const SurveyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Always call hooks before any conditional returns
  const {
    currentQuestion,
    offerButtons,
    isLoading,
    error,
    isCompleted,
    handleButtonClick,
    handleSkip,
    resetSurvey,
    clearError
  } = useSurvey(id || '');

  if (!id) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Survey Not Found</h1>
          <p>Invalid survey ID</p>
        </div>
        <div className="page-content">
          <div style={{ textAlign: 'center' }}>
            <Link to="/" className="btn btn-primary">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Survey completed state
  if (isCompleted) {
    return (
      <div className="page">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1>Thank You!</h1>
          <p>Survey completed successfully</p>
        </div>
        <div className="page-content">
          <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-content">
              <h2 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '1rem',
                color: '#38a169'
              }}>
                🎉 Survey Complete
              </h2>
              <p style={{ 
                fontSize: '1.125rem', 
                marginBottom: '2rem',
                color: '#4a5568'
              }}>
                Thank you for your participation! Your responses help us provide better offers and experiences.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={resetSurvey}
                  className="btn btn-secondary"
                >
                  Take Again
                </button>
                <Link to="/" className="btn btn-primary">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !currentQuestion) {
    return (
      <div className="page">
        <div className="page-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.25rem', 
                marginBottom: '1rem',
                color: '#4a5568'
              }}>
                Loading your survey...
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #3182ce',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentQuestion) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Survey Error</h1>
          <p>Unable to load survey</p>
        </div>
        <div className="page-content">
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-content">
              <div style={{
                padding: '1rem',
                backgroundColor: '#fed7d7',
                color: '#c53030',
                borderRadius: '0.375rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={clearError}
                  className="btn btn-primary"
                  style={{ marginRight: '1rem' }}
                >
                  Try Again
                </button>
                <Link to="/" className="btn btn-secondary">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main survey interface
  return (
    <div className="page" data-testid="survey-page">
      <div className="page-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Survey Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '2rem 0'
          }} data-testid="survey-header">
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#1a202c'
            }}>
              Quick Survey
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#4a5568',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Help us understand your needs better. Each question shows relevant offers that might interest you.
            </p>
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div style={{ position: 'relative' }} data-testid="question-card">
              <QuestionCard
                question={currentQuestion}
                offerButtons={offerButtons}
                onButtonClick={handleButtonClick}
                onSkip={handleSkip}
                isLoading={isLoading}
                {...(error && { error })}
              />
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            padding: '1rem',
            fontSize: '0.875rem',
            color: '#718096'
          }}>
            <p>
              This survey is designed to show you relevant offers based on your interests.
            </p>
          </div>
        </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};