/**
 * @fileoverview Survey hook for CTA-based survey management
 * 
 * Custom hook for managing survey state, question progression,
 * and CTA button interactions with tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import type { 
  Question, 
  CTAButtonVariant, 
  ResponseSession,
  NextQuestionResponse 
} from '@survai/shared';
import { trackingService } from '../services/tracking';

interface UseSurveyState {
  /** Current question being displayed */
  currentQuestion: Question | null;
  /** Available offer buttons for current question */
  offerButtons: CTAButtonVariant[];
  /** Session data */
  sessionData: ResponseSession | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Whether survey is completed */
  isCompleted: boolean;
  /** Session ID */
  sessionId: string;
}

interface UseSurveyActions {
  /** Load next question */
  loadNextQuestion: (previousQuestionId?: string) => Promise<void>;
  /** Handle CTA button click */
  handleButtonClick: (buttonId: string, offerId: string) => Promise<void>;
  /** Handle skip button click */
  handleSkip: () => Promise<void>;
  /** Reset survey state */
  resetSurvey: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Custom hook for survey management
 * 
 * @param surveyId - Survey identifier
 * @returns Survey state and actions
 */
export const useSurvey = (surveyId: string): UseSurveyState & UseSurveyActions => {
  const [state, setState] = useState<UseSurveyState>(() => ({
    currentQuestion: null,
    offerButtons: [],
    sessionData: null,
    isLoading: false,
    error: null,
    isCompleted: false,
    sessionId: trackingService.getOrCreateSessionId(surveyId)
  }));

  /**
   * Load next question from API
   */
  const loadNextQuestion = useCallback(async (previousQuestionId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const requestData = {
        sessionId: state.sessionId,
        surveyId,
        ...(previousQuestionId && { previousQuestionId }),
        userAgent: navigator.userAgent
      };
      
      const response: NextQuestionResponse = await trackingService.getNextQuestion(requestData);

      setState(prev => ({
        ...prev,
        currentQuestion: response.question,
        offerButtons: response.offerButtons,
        sessionData: response.sessionData,
        isLoading: false,
        error: null
      }));

      // Track impression
      if (response.question) {
        await trackingService.trackImpression(response.question.id, state.sessionId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load question';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [surveyId, state.sessionId]);

  /**
   * Handle CTA button click
   */
  const handleButtonClick = useCallback(async (buttonId: string, offerId: string) => {
    if (!state.currentQuestion) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Track the click
      const trackRequest = {
        sessionId: state.sessionId,
        questionId: state.currentQuestion!.id,
        offerId,
        buttonVariantId: buttonId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };
      
      const trackResponse = await trackingService.trackClick(trackRequest);

      // Open offer URL in new tab
      trackingService.openOfferUrl(trackResponse.redirectUrl);

      // Load next question
      await loadNextQuestion(state.currentQuestion.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to track click';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [state.currentQuestion, state.sessionId, loadNextQuestion]);

  /**
   * Handle skip button click
   */
  const handleSkip = useCallback(async () => {
    if (!state.currentQuestion) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await trackingService.skipQuestion(
        surveyId,
        state.sessionId,
        state.currentQuestion.id
      );

      // Check if survey is completed
      if ('completed' in response && response.completed) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isCompleted: true,
          currentQuestion: null,
          offerButtons: []
        }));
      } else {
        // Load next question
        const nextResponse = response as NextQuestionResponse;
        setState(prev => ({
          ...prev,
          currentQuestion: nextResponse.question,
          offerButtons: nextResponse.offerButtons,
          sessionData: nextResponse.sessionData,
          isLoading: false
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip question';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [surveyId, state.currentQuestion, state.sessionId]);

  /**
   * Reset survey state
   */
  const resetSurvey = useCallback(() => {
    trackingService.clearSession(surveyId);
    setState({
      currentQuestion: null,
      offerButtons: [],
      sessionData: null,
      isLoading: false,
      error: null,
      isCompleted: false,
      sessionId: trackingService.getOrCreateSessionId(surveyId)
    });
  }, [surveyId]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Load initial question on mount
   */
  useEffect(() => {
    if (surveyId && !state.currentQuestion && !state.isLoading && !state.isCompleted) {
      loadNextQuestion();
    }
  }, [surveyId, state.currentQuestion, state.isLoading, state.isCompleted, loadNextQuestion]);

  return {
    ...state,
    loadNextQuestion,
    handleButtonClick,
    handleSkip,
    resetSurvey,
    clearError
  };
};