/**
 * @fileoverview Core Widget component for embeddable SurvAI widget
 * 
 * Main React component that handles session bootstrap, question fetching,
 * and click tracking for the embeddable widget.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type {
  WidgetProps,
  WidgetState,
  Question,
  CTAButtonVariant,
  WidgetError,
  WidgetErrorType
} from '@survai/shared';
import { createWidgetApi } from './services/widgetApi';
import { useWidget } from './hooks/useWidget';

/**
 * Widget-specific QuestionCard component
 * Simplified version of the main QuestionCard for widget use
 */
const WidgetQuestionCard: React.FC<{
  question: Question;
  offerButtons: CTAButtonVariant[];
  onButtonClick: (buttonId: string, offerId: string) => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
  theme: WidgetProps['theme'];
}> = ({ question, offerButtons, onButtonClick, onSkip, isLoading = false, error, theme }) => {
  return (
    <div style={{
      padding: 'var(--survai-spacing-padding)',
      fontFamily: 'var(--survai-font-family)',
      position: 'relative'
    }}>
      <div style={{
        marginBottom: 'var(--survai-spacing-margin)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: 'var(--survai-text)',
          lineHeight: '1.25'
        }}>
          {question.text}
        </h2>
        
        {question.description && (
          <p style={{
            fontSize: '1rem',
            color: 'var(--survai-text)',
            opacity: '0.8',
            lineHeight: '1.5',
            marginBottom: 'var(--survai-spacing-margin)'
          }}>
            {question.description}
          </p>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: question.config.buttonLayout === 'horizontal' ? 'row' : 'column',
        gap: 'var(--survai-spacing-gap)',
        marginBottom: 'var(--survai-spacing-margin)'
      }}>
        {offerButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => onButtonClick(button.id, button.offerId)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 'var(--survai-button-padding)',
              fontSize: 'var(--survai-button-font-size)',
              fontWeight: '600',
              borderRadius: 'var(--survai-border-radius)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'var(--survai-transition)',
              backgroundColor: button.style === 'primary' ? 'var(--survai-primary)' : 
                             button.style === 'accent' ? 'var(--survai-accent)' : 'white',
              color: button.style === 'secondary' ? 'var(--survai-primary)' : 'white',
              border: button.style === 'secondary' ? '2px solid var(--survai-primary)' : 'none',
              boxShadow: 'var(--survai-shadow)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--survai-shadow-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--survai-shadow)';
              }
            }}
          >
            {button.text}
          </button>
        ))}
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onSkip}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 'var(--survai-button-padding)',
            fontSize: '0.875rem',
            backgroundColor: 'var(--survai-secondary)',
            color: 'var(--survai-text)',
            opacity: '0.7',
            border: '1px solid var(--survai-secondary)',
            borderRadius: 'var(--survai-border-radius)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'var(--survai-transition)'
          }}
        >
          {isLoading ? 'Loading...' : 'No Thanks, Skip'}
        </button>
      </div>
      
      {error && (
        <div style={{
          marginTop: 'var(--survai-spacing-margin)',
          padding: 'var(--survai-spacing-padding)',
          backgroundColor: '#fed7d7',
          color: '#c53030',
          borderRadius: 'var(--survai-border-radius)',
          fontSize: '0.875rem',
          textAlign: 'center',
          boxShadow: 'var(--survai-shadow)'
        }}>
          {error}
        </div>
      )}
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--survai-border-radius)',
          zIndex: 10,
          transition: 'var(--survai-transition)'
        }}>
          <div style={{
            fontSize: '1rem',
            color: 'var(--survai-text)',
            fontWeight: '500',
            opacity: '0.8'
          }}>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Create a widget error
 */
function createWidgetError(
  type: WidgetErrorType,
  message: string,
  context?: Record<string, unknown>
): WidgetError {
  const error = new Error(message) as WidgetError;
  error.type = type;
  error.context = context;
  return error;
}

/**
 * Main Widget component
 */
export const Widget: React.FC<WidgetProps> = ({
  surveyId,
  apiUrl,
  theme,
  onStatusChange,
  onError,
  partnerId
}) => {
  const [state, setState] = useState<WidgetState>({
    status: 'loading'
  });
  const [api] = useState(() => createWidgetApi({ 
    baseUrl: apiUrl,
    partnerId: partnerId // Pass partnerId to API
  }));
  
  // Initialize widget hook for batched click tracking
  const { trackClick, isOnline, getQueueStatus } = useWidget({
    api,
    debug: process.env.NODE_ENV === 'development'
  });

  /**
   * Handle button click
   */
  const handleButtonClick = useCallback(async (buttonId: string, offerId: string) => {
    if (!state.session || !state.currentQuestion) {
      onError(createWidgetError(WidgetErrorType.CONFIG_ERROR, 'Session or question not available'));
      return;
    }

    try {
      // Track the click using batched queue
      await trackClick(
        state.session.sessionId,
        state.currentQuestion.id,
        offerId,
        buttonId
      );

      // Open offer in new tab
      // This would typically be an offer URL from the button configuration
      window.open(`/offer/${offerId}`, '_blank');
      
    } catch (error) {
      console.warn('Failed to track click:', error);
      // Still open the offer even if tracking fails
      window.open(`/offer/${offerId}`, '_blank');
    }
  }, [state.session, state.currentQuestion, trackClick, onError]);

  /**
   * Handle skip
   */
  const handleSkip = useCallback(async () => {
    // For now, just hide the widget or show a thank you message
    setState(prev => ({
      ...prev,
      currentQuestion: undefined,
      status: 'ready'
    }));
  }, []);

  /**
   * Initialize widget
   */
  useEffect(() => {
    let mounted = true;

    async function initializeWidget() {
      try {
        onStatusChange('loading');
        
        // Bootstrap session
        const sessionData = await api.bootstrapSession(surveyId);
        
        if (!mounted) return;

        // Get first question
        const questionData = await api.getNextQuestion(
          surveyId,
          sessionData.sessionId
        );
        
        if (!mounted) return;

        setState({
          status: 'ready',
          session: sessionData,
          currentQuestion: questionData.question,
          offerButtons: questionData.offerButtons
        });
        
        onStatusChange('ready');
        
      } catch (error) {
        if (!mounted) return;
        
        const widgetError = error as WidgetError;
        setState({
          status: 'error',
          error: widgetError
        });
        
        onStatusChange('error');
        onError(widgetError);
      }
    }

    initializeWidget();

    return () => {
      mounted = false;
    };
  }, [surveyId, api, onStatusChange, onError]);

  // Loading state
  if (state.status === 'loading') {
    return (
      <div style={{
        padding: 'calc(var(--survai-spacing-padding) * 1.5)',
        textAlign: 'center',
        fontFamily: 'var(--survai-font-family)',
        color: 'var(--survai-text)',
        opacity: '0.7'
      }}>
        <div style={{
          fontSize: '1rem',
          marginBottom: '0.5rem'
        }}>
          Loading survey...
        </div>
      </div>
    );
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div style={{
        padding: 'var(--survai-spacing-padding)',
        backgroundColor: '#fed7d7',
        color: '#c53030',
        borderRadius: 'var(--survai-border-radius)',
        fontFamily: 'var(--survai-font-family)',
        textAlign: 'center',
        boxShadow: 'var(--survai-shadow)'
      }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Unable to load survey
        </div>
        <div style={{
          fontSize: '0.875rem',
          opacity: 0.8
        }}>
          {state.error?.message || 'An unexpected error occurred'}
        </div>
      </div>
    );
  }

  // No question state (finished or skipped)
  if (!state.currentQuestion) {
    return (
      <div style={{
        padding: 'calc(var(--survai-spacing-padding) * 1.5)',
        textAlign: 'center',
        fontFamily: 'var(--survai-font-family)',
        color: 'var(--survai-text)'
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: 'var(--survai-primary)'
        }}>
          Thank you!
        </div>
        <div style={{
          fontSize: '0.875rem',
          opacity: 0.8
        }}>
          Your response has been recorded.
        </div>
      </div>
    );
  }

  // Main widget content
  return (
    <WidgetQuestionCard
      question={state.currentQuestion}
      offerButtons={state.offerButtons || []}
      onButtonClick={handleButtonClick}
      onSkip={handleSkip}
      isLoading={state.status === 'loading'}
      theme={theme}
    />
  );
};