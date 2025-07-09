/**
 * @fileoverview User-related types and interfaces
 * 
 * Types for user management, authentication, and admin functionality
 * in the SurvAI MVP system.
 */

/**
 * User entity from database
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User email address */
  email: string;
  /** User's full name */
  name?: string;
  /** User role in the system */
  role: UserRole;
  /** Account status */
  status: UserStatus;
  /** When the user was created */
  createdAt: Date;
  /** When the user was last updated */
  updatedAt: Date;
  /** When the user last logged in */
  lastLoginAt?: Date;
  /** Additional user metadata */
  metadata?: Record<string, unknown>;
}

/**
 * User roles in the system
 */
export enum UserRole {
  /** Admin with full system access */
  ADMIN = 'ADMIN'
}

/**
 * User account status
 */
export enum UserStatus {
  /** Active user account */
  ACTIVE = 'ACTIVE',
  /** Inactive/disabled account */
  INACTIVE = 'INACTIVE',
  /** Account pending email verification */
  PENDING = 'PENDING',
  /** Account suspended */
  SUSPENDED = 'SUSPENDED'
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  /** User email address */
  email: string;
  /** User's full name */
  name?: string;
  /** User role (defaults to ADMIN) */
  role?: UserRole;
  /** Initial password */
  password: string;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  /** User's full name */
  name?: string;
  /** User role */
  role?: UserRole;
  /** Account status */
  status?: UserStatus;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * User authentication credentials
 */
export interface UserCredentials {
  /** User email */
  email: string;
  /** User password */
  password: string;
}

/**
 * JWT token payload
 */
export interface JwtPayload {
  /** User ID */
  sub: string;
  /** User email */
  email: string;
  /** User role */
  role: UserRole;
  /** Token issued at timestamp */
  iat: number;
  /** Token expiration timestamp */
  exp: number;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken?: string;
  /** User information */
  user: Omit<User, 'metadata'>;
  /** Token expiration timestamp */
  expiresAt: number;
}

/**
 * Session information
 */
export interface UserSession {
  /** Session ID */
  id: string;
  /** User ID */
  userId: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Session last activity timestamp */
  lastActivityAt: Date;
  /** Session expiration timestamp */
  expiresAt: Date;
  /** IP address of the session */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Whether session is active */
  isActive: boolean;
}