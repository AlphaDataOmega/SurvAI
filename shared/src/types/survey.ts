/**
 * @fileoverview Survey and question-related types
 * 
 * Types for survey management, question handling, and response tracking
 * in the SurvAI MVP system.
 */

/**
 * Survey entity
 */
export interface Survey {
  /** Unique survey identifier */
  id: string;
  /** Survey title */
  title: string;
  /** Survey description */
  description?: string;
  /** Survey status */
  status: SurveyStatus;
  /** Survey configuration */
  config: SurveyConfig;
  /** Questions in this survey */
  questions: Question[];
  /** When the survey was created */
  createdAt: Date;
  /** When the survey was last updated */
  updatedAt: Date;
  /** Survey metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Survey status
 */
export enum SurveyStatus {
  /** Survey is in draft mode */
  DRAFT = 'DRAFT',
  /** Survey is active and accepting responses */
  ACTIVE = 'ACTIVE',
  /** Survey is paused */
  PAUSED = 'PAUSED',
  /** Survey is completed/archived */
  COMPLETED = 'COMPLETED'
}

/**
 * Survey configuration
 */
export interface SurveyConfig {
  /** Maximum time for survey completion (ms) */
  timeout?: number;
  /** Whether to shuffle questions */
  shuffleQuestions?: boolean;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Custom styling options */
  styling?: SurveyStyling;
  /** Redirect URL after completion */
  redirectUrl?: string;
  /** Whether to allow back navigation */
  allowBack?: boolean;
}

/**
 * Survey styling configuration
 */
export interface SurveyStyling {
  /** Primary color */
  primaryColor?: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Font family */
  fontFamily?: string;
  /** Background color */
  backgroundColor?: string;
  /** Custom CSS */
  customCss?: string;
}

/**
 * Question entity
 */
export interface Question {
  /** Unique question identifier */
  id: string;
  /** Survey ID this question belongs to */
  surveyId: string;
  /** Question type */
  type: QuestionType;
  /** Question text/prompt */
  text: string;
  /** Question description or help text */
  description?: string;
  /** Question configuration */
  config: QuestionConfig;
  /** CTA button options */
  options?: CTAButtonVariant[];
  /** Question ordering within survey */
  order: number;
  /** Question branching logic */
  logic?: QuestionLogic;
  /** AI-generated content versions */
  aiVersions?: AIQuestionVersion[];
  /** When the question was created */
  createdAt: Date;
  /** When the question was last updated */
  updatedAt: Date;
}

/**
 * Question types
 */
export enum QuestionType {
  /** CTA offer question with buttons */
  CTA_OFFER = 'CTA_OFFER'
}

/**
 * Question configuration for CTA questions
 */
export interface QuestionConfig {
  /** CTA-specific styling */
  ctaStyle?: CTAStyle;
  /** Button layout configuration */
  buttonLayout?: 'vertical' | 'horizontal' | 'grid';
  /** Maximum buttons to show */
  maxButtons?: number;
}

/**
 * CTA styling options
 */
export interface CTAStyle {
  /** Primary color for buttons */
  primaryColor?: string;
  /** Secondary color for buttons */
  secondaryColor?: string;
  /** Button size */
  buttonSize?: 'small' | 'medium' | 'large';
}

/**
 * CTA button variant for offer questions
 */
export interface CTAButtonVariant {
  /** Button identifier */
  id: string;
  /** Button text */
  text: string;
  /** Associated offer ID */
  offerId: string;
  /** Button style variant */
  style?: 'primary' | 'secondary' | 'accent';
  /** Button ordering */
  order: number;
}

/**
 * Question branching logic
 */
export interface QuestionLogic {
  /** Conditions for branching */
  conditions: LogicCondition[];
  /** Default next question if no conditions match */
  defaultNext?: string;
}

/**
 * Logic condition for question branching
 */
export interface LogicCondition {
  /** Question option that triggers this condition */
  optionId: string;
  /** Action to take */
  action: LogicAction;
  /** Target (question ID or offer ID) */
  target: string;
}

/**
 * Logic actions
 */
export enum LogicAction {
  /** Go to specific question */
  GOTO_QUESTION = 'GOTO_QUESTION',
  /** Show specific offer */
  SHOW_OFFER = 'SHOW_OFFER',
  /** End survey */
  END_SURVEY = 'END_SURVEY'
}

/**
 * AI-generated question version
 */
export interface AIQuestionVersion {
  /** Version identifier */
  id: string;
  /** AI-generated question text */
  text: string;
  /** AI-generated options (if applicable) */
  options?: CTAButtonVariant[];
  /** Performance metrics */
  metrics?: VersionMetrics;
  /** When this version was created */
  createdAt: Date;
  /** Whether this version is currently active */
  isActive: boolean;
}

/**
 * Performance metrics for AI versions
 */
export interface VersionMetrics {
  /** Number of times shown */
  impressions: number;
  /** Number of responses */
  responses: number;
  /** Conversion rate */
  conversionRate: number;
  /** Average completion time */
  avgCompletionTime: number;
}

/**
 * Survey response/session
 */
export interface SurveyResponse {
  /** Response session identifier */
  id: string;
  /** Survey ID */
  surveyId: string;
  /** Session tracking data */
  session: ResponseSession;
  /** Individual question answers */
  answers: QuestionAnswer[];
  /** Response status */
  status: ResponseStatus;
  /** When the response was started */
  startedAt: Date;
  /** When the response was completed */
  completedAt?: Date;
  /** Response metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Response session tracking
 */
export interface ResponseSession {
  /** Unique session ID */
  sessionId: string;
  /** Click ID for affiliate tracking */
  clickId?: string;
  /** User's IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Referrer URL */
  referrer?: string;
  /** UTM tracking parameters */
  utmParams?: Record<string, string>;
}

/**
 * Individual question answer
 */
export interface QuestionAnswer {
  /** Question ID */
  questionId: string;
  /** Answer value(s) */
  value: string | string[] | number;
  /** Time taken to answer (ms) */
  timeToAnswer?: number;
  /** When the answer was given */
  answeredAt: Date;
}

/**
 * Response status
 */
export enum ResponseStatus {
  /** Response in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Response completed */
  COMPLETED = 'COMPLETED',
  /** Response abandoned */
  ABANDONED = 'ABANDONED',
  /** Response timed out */
  TIMEOUT = 'TIMEOUT'
}

/**
 * Request for getting next CTA question
 */
export interface NextQuestionRequest {
  /** Session identifier */
  sessionId: string;
  /** Survey identifier */
  surveyId: string;
  /** Previous question ID for progression */
  previousQuestionId?: string;
  /** User agent string */
  userAgent?: string;
  /** IP address */
  ipAddress?: string;
}

/**
 * Response containing next CTA question
 */
export interface NextQuestionResponse {
  /** The question to display */
  question: Question;
  /** Available offer buttons */
  offerButtons: CTAButtonVariant[];
  /** Session data */
  sessionData: ResponseSession;
}

/**
 * Request for tracking CTA button clicks
 */
export interface TrackClickRequest {
  /** Session identifier */
  sessionId: string;
  /** Question identifier */
  questionId: string;
  /** Offer identifier */
  offerId: string;
  /** Button variant identifier */
  buttonVariantId: string;
  /** Click timestamp */
  timestamp: number;
  /** User agent string */
  userAgent?: string;
  /** IP address */
  ipAddress?: string;
}