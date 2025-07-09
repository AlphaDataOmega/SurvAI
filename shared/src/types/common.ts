/**
 * @fileoverview Common utility types and interfaces
 * 
 * Shared utility types, enums, and interfaces used across
 * multiple domains in the SurvAI MVP system.
 */

/**
 * Generic ID type
 */
export type ID = string;

/**
 * Timestamp type (ISO string or Date)
 */
export type Timestamp = string | Date;

/**
 * Generic key-value object
 */
export type KeyValuePair<T = unknown> = Record<string, T>;

/**
 * Optional fields utility type
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required fields utility type
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Create type utility
 */
export type CreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update type utility
 */
export type UpdateType<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Database entity base interface
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Soft delete entity interface
 */
export interface SoftDeleteEntity extends BaseEntity {
  /** Deletion timestamp */
  deletedAt?: Date | null;
  /** Whether entity is deleted */
  isDeleted: boolean;
}

/**
 * Auditable entity interface
 */
export interface AuditableEntity extends BaseEntity {
  /** User who created the entity */
  createdBy?: string;
  /** User who last updated the entity */
  updatedBy?: string;
}

/**
 * Environment types
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

/**
 * Sort direction
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Sort options
 */
export interface SortOptions {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Filter operators
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn'
}

/**
 * Filter condition
 */
export interface FilterCondition {
  /** Field to filter */
  field: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: unknown;
}

/**
 * Query options for database operations
 */
export interface QueryOptions {
  /** Pagination options */
  pagination?: {
    page: number;
    limit: number;
  };
  /** Sort options */
  sort?: SortOptions[];
  /** Filter conditions */
  filters?: FilterCondition[];
  /** Fields to include */
  include?: string[];
  /** Fields to exclude */
  exclude?: string[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Validation rule that failed */
  rule?: string;
  /** Invalid value */
  value?: unknown;
}

/**
 * File upload information
 */
export interface FileUpload {
  /** Original filename */
  originalName: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Storage path or URL */
  path: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** File hash/checksum */
  hash?: string;
}

/**
 * Geographic coordinates
 */
export interface Coordinates {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
}

/**
 * Address information
 */
export interface Address {
  /** Street address */
  street?: string;
  /** City */
  city?: string;
  /** State/province */
  state?: string;
  /** Postal/ZIP code */
  postalCode?: string;
  /** Country code */
  country?: string;
  /** Geographic coordinates */
  coordinates?: Coordinates;
}

/**
 * Contact information
 */
export interface ContactInfo {
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Physical address */
  address?: Address;
}

/**
 * Currency information
 */
export interface Currency {
  /** Currency code (ISO 4217) */
  code: string;
  /** Currency symbol */
  symbol: string;
  /** Decimal places */
  decimals: number;
}

/**
 * Money amount with currency
 */
export interface MoneyAmount {
  /** Amount value */
  amount: number;
  /** Currency information */
  currency: Currency;
}

/**
 * Date range
 */
export interface DateRange {
  /** Start date */
  start: Date;
  /** End date */
  end: Date;
}

/**
 * Time range
 */
export interface TimeRange {
  /** Start time (HH:mm format) */
  start: string;
  /** End time (HH:mm format) */
  end: string;
}

/**
 * Percentage value (0-100)
 */
export type Percentage = number;

/**
 * Email address type
 */
export type EmailAddress = string;

/**
 * URL type
 */
export type URL = string;

/**
 * Phone number type
 */
export type PhoneNumber = string;

/**
 * Color hex code type
 */
export type ColorHex = string;

/**
 * Base64 encoded string type
 */
export type Base64String = string;