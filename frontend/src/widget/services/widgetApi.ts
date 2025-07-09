/**
 * @fileoverview Widget API service for cross-domain requests
 * 
 * Handles API communication for the embeddable widget with proper
 * CORS handling, retry logic, and error management.
 */

import type {
  ApiResponse,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  NextQuestionRequest,
  NextQuestionResponse,
  TrackClickRequest,
  WidgetApiConfig,
  WidgetError
} from '@survai/shared';
import { WidgetErrorType } from '@survai/shared';
import type { BatchRequest } from '../utils/ClickQueue';

/**
 * Default API configuration
 */
const defaultConfig: Required<WidgetApiConfig> = {
  baseUrl: '',
  timeout: 10000, // 10 seconds
  retries: 3,
  headers: {
    'Content-Type': 'application/json'
  },
  partnerId: undefined
};

/**
 * Create a widget-specific error
 */
function createWidgetError(
  type: WidgetErrorType,
  message: string,
  context?: Record<string, unknown>,
  originalError?: Error
): WidgetError {
  const error = new Error(message) as WidgetError;
  error.type = type;
  error.context = context;
  error.originalError = originalError;
  return error;
}

/**
 * Perform HTTP request with retry logic
 */
async function makeRequest<T>(
  url: string,
  options: RequestInit,
  config: Required<WidgetApiConfig>
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...config.headers,
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw createWidgetError(
          WidgetErrorType.NETWORK_ERROR,
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status, body: errorText }
        );
      }

      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        throw createWidgetError(
          WidgetErrorType.NETWORK_ERROR,
          data.error || 'API request failed',
          { response: data }
        );
      }

      return data.data as T;

    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout) or widget errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw createWidgetError(
          WidgetErrorType.NETWORK_ERROR,
          'Request timeout',
          { timeout: config.timeout }
        );
      }

      if ((error as WidgetError).type) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < config.retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw createWidgetError(
    WidgetErrorType.NETWORK_ERROR,
    `Request failed after ${config.retries} attempts`,
    { retries: config.retries },
    lastError
  );
}

/**
 * Widget API client
 */
export class WidgetApi {
  private config: Required<WidgetApiConfig>;
  private partnerId?: string;

  constructor(config: WidgetApiConfig) {
    this.config = { ...defaultConfig, ...config };
    this.partnerId = config.partnerId;
  }

  /**
   * Bootstrap a new session
   */
  async bootstrapSession(surveyId: string): Promise<SessionBootstrapResponse> {
    const params = new URLSearchParams({ surveyId });
    if (this.partnerId) {
      params.append('partnerId', this.partnerId);
    }
    
    const url = `${this.config.baseUrl}/api/sessions?${params}`;
    const body: SessionBootstrapRequest = { surveyId };

    try {
      return await makeRequest<SessionBootstrapResponse>(
        url,
        {
          method: 'POST',
          body: JSON.stringify(body)
        },
        this.config
      );
    } catch (error) {
      if ((error as WidgetError).type === WidgetErrorType.NETWORK_ERROR) {
        throw createWidgetError(
          WidgetErrorType.SESSION_ERROR,
          'Failed to bootstrap session',
          { surveyId, partnerId: this.partnerId },
          error as Error
        );
      }
      throw error;
    }
  }

  /**
   * Get next question for survey
   */
  async getNextQuestion(
    surveyId: string,
    sessionId: string,
    previousQuestionId?: string
  ): Promise<NextQuestionResponse> {
    const params = new URLSearchParams();
    if (this.partnerId) {
      params.append('partnerId', this.partnerId);
    }
    
    const queryString = params.toString();
    const url = `${this.config.baseUrl}/api/questions/${surveyId}/next${queryString ? '?' + queryString : ''}`;
    const body: NextQuestionRequest = {
      sessionId,
      surveyId,
      previousQuestionId,
      userAgent: navigator.userAgent,
      ipAddress: undefined // Will be determined by server
    };

    try {
      return await makeRequest<NextQuestionResponse>(
        url,
        {
          method: 'POST',
          body: JSON.stringify(body)
        },
        this.config
      );
    } catch (error) {
      if ((error as WidgetError).type === WidgetErrorType.NETWORK_ERROR) {
        throw createWidgetError(
          WidgetErrorType.SURVEY_NOT_FOUND,
          'Failed to get next question',
          { surveyId, sessionId, previousQuestionId, partnerId: this.partnerId },
          error as Error
        );
      }
      throw error;
    }
  }

  /**
   * Track button click
   */
  async trackClick(
    sessionId: string,
    questionId: string,
    offerId: string,
    buttonVariantId: string
  ): Promise<void> {
    const params = new URLSearchParams();
    if (this.partnerId) {
      params.append('partnerId', this.partnerId);
    }
    
    const queryString = params.toString();
    const url = `${this.config.baseUrl}/api/track/click${queryString ? '?' + queryString : ''}`;
    const body: TrackClickRequest = {
      sessionId,
      questionId,
      offerId,
      buttonVariantId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ipAddress: undefined // Will be determined by server
    };

    try {
      await makeRequest<void>(
        url,
        {
          method: 'POST',
          body: JSON.stringify(body)
        },
        this.config
      );
    } catch (error) {
      // Don't throw tracking errors as they shouldn't break widget functionality
      console.warn('Failed to track click:', error);
    }
  }

  /**
   * Track multiple button clicks in a batch
   */
  async trackClickBatch(batch: BatchRequest): Promise<void> {
    const params = new URLSearchParams();
    if (this.partnerId) {
      params.append('partnerId', this.partnerId);
    }
    
    const queryString = params.toString();
    const url = `${this.config.baseUrl}/api/track/click/batch${queryString ? '?' + queryString : ''}`;
    
    // Transform batch events to individual track click requests
    const batchBody = {
      batchId: batch.batchId,
      timestamp: batch.timestamp,
      events: batch.events.map(event => ({
        sessionId: event.sessionId,
        questionId: event.questionId,
        offerId: event.offerId,
        buttonVariantId: event.buttonVariantId,
        timestamp: event.timestamp,
        userAgent: event.userAgent,
        ipAddress: undefined // Will be determined by server
      }))
    };

    try {
      await makeRequest<void>(
        url,
        {
          method: 'POST',
          body: JSON.stringify(batchBody)
        },
        this.config
      );
    } catch (error) {
      // Re-throw batch errors so the queue can handle retry logic
      throw error;
    }
  }

  /**
   * Update API configuration
   */
  updateConfig(config: Partial<WidgetApiConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.partnerId !== undefined) {
      this.partnerId = config.partnerId;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<WidgetApiConfig> {
    return { ...this.config };
  }

  /**
   * Get base URL for API requests
   */
  get baseURL(): string {
    return this.config.baseUrl;
  }
}

/**
 * Create widget API instance
 */
export function createWidgetApi(config: WidgetApiConfig): WidgetApi {
  return new WidgetApi(config);
}