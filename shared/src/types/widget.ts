/**
 * @fileoverview Widget-specific types for embeddable SurvAI widget
 * 
 * Types for widget integration, theming, and session management
 * for external partner integration.
 */

/**
 * Widget mount options for external integration
 */
export interface WidgetMountOptions {
  /** Survey ID to display */
  surveyId: string;
  /** API base URL (optional, defaults to current domain) */
  apiUrl?: string;
  /** Widget theme customization */
  theme?: WidgetTheme;
  /** Container CSS styling */
  containerStyle?: React.CSSProperties;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Partner ID for attribution tracking */
  partnerId?: string;
  /** Remote configuration URL for loading options */
  configUrl?: string;
}

/**
 * Widget theme configuration
 */
export interface WidgetTheme {
  /** Primary color for buttons and accents */
  primaryColor?: string;
  /** Secondary color for secondary elements */
  secondaryColor?: string;
  /** Font family for text */
  fontFamily?: string;
  /** Background color */
  backgroundColor?: string;
  /** Border radius for elements */
  borderRadius?: string;
  /** Button size */
  buttonSize?: 'small' | 'medium' | 'large';
  /** Accent color for highlights and emphasis */
  accentColor?: string;
  /** Text color for content */
  textColor?: string;
  /** Spacing density */
  spacing?: 'compact' | 'normal' | 'spacious';
  /** Enable shadows */
  shadows?: boolean;
  /** Enable transitions and animations */
  transitions?: boolean;
}

/**
 * Theme configuration alias for external API
 */
export type ThemeConfig = WidgetTheme;

/**
 * Widget instance for cleanup and control
 */
export interface WidgetInstance {
  /** Unmount the widget */
  unmount: () => void;
  /** Get current widget status */
  getStatus: () => 'loading' | 'ready' | 'error';
}

/**
 * Session bootstrap response for widget initialization
 */
export interface SessionBootstrapResponse {
  /** Generated session ID */
  sessionId: string;
  /** Generated click ID for tracking */
  clickId: string;
  /** Survey ID */
  surveyId: string;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session bootstrap request
 */
export interface SessionBootstrapRequest {
  /** Survey ID to bootstrap session for */
  surveyId: string;
  /** Optional session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Widget error types
 */
export enum WidgetErrorType {
  /** Network/API error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Invalid configuration */
  CONFIG_ERROR = 'CONFIG_ERROR',
  /** Survey not found */
  SURVEY_NOT_FOUND = 'SURVEY_NOT_FOUND',
  /** Session creation failed */
  SESSION_ERROR = 'SESSION_ERROR',
  /** Widget mounting failed */
  MOUNT_ERROR = 'MOUNT_ERROR',
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Widget error with context
 */
export interface WidgetError extends Error {
  /** Error type */
  type: WidgetErrorType;
  /** Additional error context */
  context?: Record<string, unknown>;
  /** Original error if wrapped */
  originalError?: Error;
}

/**
 * Widget API client configuration
 */
export interface WidgetApiConfig {
  /** Base API URL */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Headers to include with requests */
  headers?: Record<string, string>;
  /** Partner ID for attribution tracking */
  partnerId?: string;
}

/**
 * Widget state
 */
export interface WidgetState {
  /** Current status */
  status: 'loading' | 'ready' | 'error';
  /** Session data */
  session?: SessionBootstrapResponse;
  /** Current question */
  currentQuestion?: import('./survey').Question;
  /** Available offer buttons */
  offerButtons?: import('./survey').CTAButtonVariant[];
  /** Error state */
  error?: WidgetError;
}

/**
 * Widget props for React component
 */
export interface WidgetProps {
  /** Survey ID to display */
  surveyId: string;
  /** API base URL */
  apiUrl: string;
  /** Widget theme */
  theme: WidgetTheme;
  /** Status change callback */
  onStatusChange: (status: 'loading' | 'ready' | 'error') => void;
  /** Error callback */
  onError: (error: Error) => void;
  /** Partner ID for attribution tracking */
  partnerId?: string;
}

/**
 * Widget size configuration
 */
export interface WidgetSize {
  /** Width in pixels or percentage */
  width?: string | number;
  /** Height in pixels or percentage */
  height?: string | number;
  /** Minimum width */
  minWidth?: string | number;
  /** Minimum height */
  minHeight?: string | number;
  /** Maximum width */
  maxWidth?: string | number;
  /** Maximum height */
  maxHeight?: string | number;
}

/**
 * Widget analytics event
 */
export interface WidgetAnalyticsEvent {
  /** Event type */
  type: 'mount' | 'question_view' | 'button_click' | 'error' | 'unmount';
  /** Event timestamp */
  timestamp: number;
  /** Session ID */
  sessionId?: string;
  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Widget performance metrics
 */
export interface WidgetPerformance {
  /** Time to mount (ms) */
  mountTime?: number;
  /** Time to first question (ms) */
  firstQuestionTime?: number;
  /** Bundle size (bytes) */
  bundleSize?: number;
  /** API response times */
  apiResponseTimes?: Record<string, number>;
}