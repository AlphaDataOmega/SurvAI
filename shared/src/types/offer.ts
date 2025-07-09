/**
 * @fileoverview Offer and affiliate tracking types
 * 
 * Types for managing affiliate offers, click tracking, and conversion
 * optimization in the SurvAI MVP system.
 */

import type { EPCMetrics } from './analytics';

/**
 * Affiliate offer entity
 */
export interface Offer {
  /** Unique offer identifier */
  id: string;
  /** Offer title/name */
  title: string;
  /** Offer description */
  description?: string;
  /** Offer category */
  category: OfferCategory;
  /** Offer status */
  status: OfferStatus;
  /** Destination URL template */
  destinationUrl: string;
  /** Pixel tracking URL template */
  pixelUrl?: string;
  /** Offer configuration */
  config: OfferConfig;
  /** Targeting rules */
  targeting?: OfferTargeting;
  /** Performance metrics */
  metrics: OfferMetrics;
  /** When the offer was created */
  createdAt: Date;
  /** When the offer was last updated */
  updatedAt: Date;
  /** Offer metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Offer categories
 */
export enum OfferCategory {
  /** Financial services */
  FINANCE = 'FINANCE',
  /** Insurance products */
  INSURANCE = 'INSURANCE',
  /** Health and wellness */
  HEALTH = 'HEALTH',
  /** Education and courses */
  EDUCATION = 'EDUCATION',
  /** Technology products */
  TECHNOLOGY = 'TECHNOLOGY',
  /** Travel and leisure */
  TRAVEL = 'TRAVEL',
  /** Shopping and retail */
  SHOPPING = 'SHOPPING',
  /** Other category */
  OTHER = 'OTHER'
}

/**
 * Offer status
 */
export enum OfferStatus {
  /** Offer is active */
  ACTIVE = 'ACTIVE',
  /** Offer is paused */
  PAUSED = 'PAUSED',
  /** Offer is expired */
  EXPIRED = 'EXPIRED',
  /** Offer is pending approval */
  PENDING = 'PENDING',
  /** Offer is archived */
  ARCHIVED = 'ARCHIVED'
}

/**
 * Offer configuration
 */
export interface OfferConfig {
  /** Payout amount per conversion */
  payout: number;
  /** Payout currency */
  currency: string;
  /** Maximum daily clicks */
  dailyClickCap?: number;
  /** Maximum total clicks */
  totalClickCap?: number;
  /** Offer expiration date */
  expiresAt?: Date;
  /** Minimum time between clicks from same IP */
  cooldownPeriod?: number;
  /** Custom URL parameters */
  urlParams?: Record<string, string>;
}

/**
 * Offer targeting rules
 */
export interface OfferTargeting {
  /** Allowed geographic regions */
  geoTargeting?: string[];
  /** Device targeting */
  deviceTargeting?: DeviceTarget[];
  /** Time-based targeting */
  timeTargeting?: TimeTarget;
  /** Custom targeting rules */
  customRules?: Record<string, unknown>;
}

/**
 * Device targeting options
 */
export enum DeviceTarget {
  /** Desktop devices */
  DESKTOP = 'DESKTOP',
  /** Mobile devices */
  MOBILE = 'MOBILE',
  /** Tablet devices */
  TABLET = 'TABLET'
}

/**
 * Time-based targeting
 */
export interface TimeTarget {
  /** Days of week (0 = Sunday) */
  daysOfWeek?: number[];
  /** Hour range (24-hour format) */
  hourRange?: {
    start: number;
    end: number;
  };
  /** Timezone for time targeting */
  timezone?: string;
}

/**
 * Offer performance metrics
 */
export interface OfferMetrics {
  /** Total number of clicks */
  totalClicks: number;
  /** Total number of conversions */
  totalConversions: number;
  /** Total revenue generated */
  totalRevenue: number;
  /** Conversion rate (conversions/clicks) */
  conversionRate: number;
  /** Earnings per click */
  epc: number;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Click tracking entity
 */
export interface ClickTrack {
  /** Unique click identifier */
  id: string;
  /** Associated offer ID */
  offerId: string;
  /** Associated survey response ID */
  responseId?: string;
  /** Click session data */
  session: ClickSession;
  /** Click status */
  status: ClickStatus;
  /** Whether this click converted */
  converted: boolean;
  /** Conversion timestamp */
  convertedAt?: Date;
  /** Revenue from this click */
  revenue?: number;
  /** When the click occurred */
  clickedAt: Date;
  /** Click metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Click session information
 */
export interface ClickSession {
  /** Session identifier */
  sessionId: string;
  /** Click ID for tracking */
  clickId: string;
  /** User's IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Referrer URL */
  referrer?: string;
  /** Geographic information */
  geoData?: GeoData;
  /** Device information */
  deviceInfo?: DeviceInfo;
}

/**
 * Geographic data
 */
export interface GeoData {
  /** Country code */
  country?: string;
  /** State/region */
  region?: string;
  /** City */
  city?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Timezone */
  timezone?: string;
}

/**
 * Device information
 */
export interface DeviceInfo {
  /** Device type */
  type: DeviceTarget;
  /** Operating system */
  os?: string;
  /** Browser name */
  browser?: string;
  /** Screen resolution */
  screenResolution?: string;
  /** Whether device is mobile */
  isMobile: boolean;
}

/**
 * Click status
 */
export enum ClickStatus {
  /** Valid click */
  VALID = 'VALID',
  /** Click is pending validation */
  PENDING = 'PENDING',
  /** Click was filtered/invalid */
  FILTERED = 'FILTERED',
  /** Duplicate click */
  DUPLICATE = 'DUPLICATE',
  /** Fraudulent click */
  FRAUD = 'FRAUD'
}

/**
 * Conversion tracking entity
 */
export interface ConversionTrack {
  /** Unique conversion identifier */
  id: string;
  /** Associated click ID */
  clickId: string;
  /** Associated offer ID */
  offerId: string;
  /** Conversion value */
  value: number;
  /** Conversion currency */
  currency: string;
  /** Conversion type */
  type: ConversionType;
  /** External transaction ID */
  externalId?: string;
  /** When the conversion occurred */
  convertedAt: Date;
  /** Conversion metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Conversion types
 */
export enum ConversionType {
  /** Lead generation */
  LEAD = 'LEAD',
  /** Sale completion */
  SALE = 'SALE',
  /** Sign-up completion */
  SIGNUP = 'SIGNUP',
  /** Download completion */
  DOWNLOAD = 'DOWNLOAD',
  /** Custom conversion */
  CUSTOM = 'CUSTOM'
}

/**
 * URL template variables
 */
export interface UrlVariables {
  /** Click tracking ID */
  clickId: string;
  /** Survey response ID */
  surveyId?: string;
  /** User session ID */
  sessionId?: string;
  /** Additional custom variables */
  [key: string]: string | undefined;
}

/**
 * Request interfaces for offer API operations
 */

/**
 * Create offer request
 */
export interface CreateOfferRequest {
  /** Offer title */
  title: string;
  /** Offer description */
  description?: string;
  /** Offer category */
  category: OfferCategory;
  /** Destination URL */
  destinationUrl: string;
  /** Offer configuration */
  config?: {
    payout?: number;
    currency?: string;
    dailyClickCap?: number;
    totalClickCap?: number;
    cooldownPeriod?: number;
    urlParams?: Record<string, string>;
  };
  /** Targeting rules */
  targeting?: {
    geoTargeting?: string[];
    deviceTargeting?: string[];
    timeTargeting?: {
      daysOfWeek?: number[];
      hourRange?: {
        start: number;
        end: number;
      };
      timezone?: string;
    };
  };
  /** Creator user ID */
  createdBy?: string;
}

/**
 * Update offer request
 */
export interface UpdateOfferRequest {
  /** Offer title */
  title?: string;
  /** Offer description */
  description?: string;
  /** Offer category */
  category?: OfferCategory;
  /** Offer status */
  status?: OfferStatus;
  /** Destination URL */
  destinationUrl?: string;
  /** Offer configuration */
  config?: {
    payout?: number;
    currency?: string;
    dailyClickCap?: number;
    totalClickCap?: number;
    cooldownPeriod?: number;
    urlParams?: Record<string, string>;
  };
  /** Targeting rules */
  targeting?: {
    geoTargeting?: string[];
    deviceTargeting?: string[];
    timeTargeting?: {
      daysOfWeek?: number[];
      hourRange?: {
        start: number;
        end: number;
      };
      timezone?: string;
    };
  };
  /** Updater user ID */
  updatedBy?: string;
}

/**
 * List offers request parameters
 */
export interface ListOffersRequest {
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by category */
  category?: OfferCategory;
  /** Filter by status */
  status?: OfferStatus;
  /** Search query */
  search?: string;
  /** Sort field */
  sortBy?: 'title' | 'category' | 'status' | 'createdAt' | 'updatedAt' | 'epc';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Minimum EPC filter */
  minEPC?: number;
}

/**
 * Offer with EPC metrics
 */
export interface OfferWithMetrics extends Offer {
  /** EPC metrics */
  epcMetrics?: EPCMetrics;
}

/**
 * Paginated offers response
 */
export interface PaginatedOffersResponse {
  /** Array of offers */
  offers: OfferWithMetrics[];
  /** Pagination information */
  pagination: {
    /** Current page */
    page: number;
    /** Items per page */
    limit: number;
    /** Total items */
    total: number;
    /** Total pages */
    totalPages: number;
    /** Whether there are more pages */
    hasMore: boolean;
  };
}

/**
 * Toggle offer status request
 */
export interface ToggleOfferStatusRequest {
  /** New status */
  status: 'ACTIVE' | 'PAUSED';
}

/**
 * Bulk update offer status request
 */
export interface BulkUpdateOfferStatusRequest {
  /** Array of offer IDs to update */
  offerIds: string[];
  /** New status */
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

/**
 * Re-export EPCMetrics from analytics to avoid circular imports
 */
export type { EPCMetrics } from './analytics';