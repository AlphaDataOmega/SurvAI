/**
 * @fileoverview Frontend tracking service
 * 
 * Service for tracking CTA button clicks and handling offer URL generation
 * on the frontend side of the SurvAI system.
 */

import type { 
  ApiResponse, 
  TrackClickRequest, 
  ClickTrack,
  NextQuestionRequest,
  NextQuestionResponse
} from '@survai/shared';
import { api } from './api';

/**
 * Tracking service class
 */
export class TrackingService {
  /**
   * Track a CTA button click
   * 
   * @param request - Click tracking request
   * @returns Promise with click tracking response and redirect URL
   */
  async trackClick(request: TrackClickRequest): Promise<{ clickTrack: ClickTrack; redirectUrl: string }> {
    try {
      const response = await api.post<ApiResponse<{ clickTrack: ClickTrack; redirectUrl: string }>>(
        '/api/track/click',
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to track click');
      }

      return response.data.data!;
    } catch (error) {
      console.error('Failed to track click:', error);
      throw error;
    }
  }

  /**
   * Get next question for survey
   * 
   * @param request - Next question request
   * @returns Promise with next question response
   */
  async getNextQuestion(request: NextQuestionRequest): Promise<NextQuestionResponse> {
    try {
      const response = await api.post<ApiResponse<NextQuestionResponse>>(
        `/api/questions/${request.surveyId}/next`,
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get next question');
      }

      return response.data.data!;
    } catch (error) {
      console.error('Failed to get next question:', error);
      throw error;
    }
  }

  /**
   * Skip current question
   * 
   * @param surveyId - Survey identifier
   * @param sessionId - Session identifier
   * @param questionId - Current question identifier
   * @returns Promise with next question or completion status
   */
  async skipQuestion(surveyId: string, sessionId: string, questionId: string): Promise<NextQuestionResponse | { completed: boolean }> {
    try {
      const response = await api.post<ApiResponse<NextQuestionResponse | { completed: boolean }>>(
        `/api/questions/${surveyId}/skip`,
        {
          sessionId,
          questionId
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to skip question');
      }

      return response.data.data!;
    } catch (error) {
      console.error('Failed to skip question:', error);
      throw error;
    }
  }

  /**
   * Get tracking analytics
   * 
   * @param offerId - Optional offer ID to filter by
   * @returns Promise with analytics data
   */
  async getAnalytics(offerId?: string): Promise<any> {
    try {
      const params = offerId ? { offerId } : undefined;
      const response = await api.get<ApiResponse<any>>('/api/track/analytics', params);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get analytics');
      }

      return response.data.data!;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  /**
   * Open offer URL in new tab
   * 
   * @param redirectUrl - The URL to open
   */
  openOfferUrl(redirectUrl: string): void {
    try {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open offer URL:', error);
      // Fallback: redirect in current window
      window.location.href = redirectUrl;
    }
  }

  /**
   * Generate a unique session ID
   * 
   * @returns Unique session identifier
   */
  generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get or create session ID from localStorage
   * 
   * @param surveyId - Survey identifier for session scoping
   * @returns Session identifier
   */
  getOrCreateSessionId(surveyId: string): string {
    const storageKey = `survai_session_${surveyId}`;
    let sessionId = localStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Clear session data
   * 
   * @param surveyId - Survey identifier
   */
  clearSession(surveyId: string): void {
    const storageKey = `survai_session_${surveyId}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Track page view or impression
   * 
   * @param questionId - Question identifier
   * @param sessionId - Session identifier
   */
  async trackImpression(questionId: string, sessionId: string): Promise<void> {
    try {
      // This could be expanded to track impressions
      // For now, we'll just log it
      console.log(`Question impression: ${questionId} for session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  }
}

// Export singleton instance
export const trackingService = new TrackingService();