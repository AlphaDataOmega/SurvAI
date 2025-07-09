/**
 * @fileoverview Environment variable validation
 * 
 * Validates required environment variables on application startup
 * to ensure proper configuration.
 */

import Joi from 'joi';
import { logger } from './logger';

// Define environment variable schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // Server
  BACKEND_PORT: Joi.number().port().default(8000),
  
  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  
  // Optional: Redis (will be required later)
  REDIS_URL: Joi.string().optional(),
  
  // AI services configuration
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_MODEL: Joi.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: Joi.number().positive().default(1000),
  
  OLLAMA_BASE_URL: Joi.string().uri().default('http://localhost:11434'),
  OLLAMA_MODEL: Joi.string().default('llama2'),
  
  // Optional: Authentication (will be required later)
  JWT_SECRET: Joi.string().min(32).optional(),
  SESSION_SECRET: Joi.string().min(32).optional(),
  
  // Optional: Email (will be required later)
  SMTP_HOST: Joi.string().hostname().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  
  // Optional: Survey configuration
  DEFAULT_SURVEY_TIMEOUT: Joi.number().positive().default(30000),
  MAX_QUESTIONS_PER_SURVEY: Joi.number().positive().default(50),
  DEFAULT_CLICK_TIMEOUT: Joi.number().positive().default(5000),
  
  // Optional: Tracking
  CLICK_TRACKING_ENABLED: Joi.boolean().default(true),
  CONVERSION_TRACKING_ENABLED: Joi.boolean().default(true),
  
  // Optional: Development tools
  PGWEB_PORT: Joi.number().port().default(8085),
  REDIS_COMMANDER_PORT: Joi.number().port().default(8081),
  
  // Test database
  TEST_DATABASE_URL: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  TEST_REDIS_URL: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional(),
    otherwise: Joi.optional(),
  }),
}).unknown(); // Allow unknown environment variables

/**
 * Validate environment variables
 * Throws an error if validation fails
 */
export const validateEnv = (): void => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    
    logger.error('Environment validation failed:', {
      errors: error.details,
      message: errorMessage,
    });
    
    throw new Error(`Environment validation failed: ${errorMessage}`);
  }

  // Set validated values back to process.env
  Object.assign(process.env, value);

  // Log successful validation
  logger.info('Environment validation successful', {
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    backendPort: process.env.BACKEND_PORT,
    hasDatabase: !!process.env.DATABASE_URL,
    hasRedis: !!process.env.REDIS_URL,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasOllama: !!process.env.OLLAMA_BASE_URL,
    corsOrigins: process.env.CORS_ORIGINS?.split(',').length || 0,
  });
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';

/**
 * Check if running in test mode
 */
export const isTest = (): boolean => process.env.NODE_ENV === 'test';

/**
 * Get validated environment variable
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

/**
 * Get validated environment variable as number
 */
export const getEnvAsNumber = (key: string, defaultValue?: number): number => {
  const value = getEnv(key, defaultValue?.toString());
  const numValue = parseInt(value, 10);
  
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} is not a valid number: ${value}`);
  }
  
  return numValue;
};

/**
 * Get validated environment variable as boolean
 */
export const getEnvAsBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = getEnv(key, defaultValue?.toString());
  
  if (value.toLowerCase() === 'true' || value === '1') {
    return true;
  }
  
  if (value.toLowerCase() === 'false' || value === '0') {
    return false;
  }
  
  throw new Error(`Environment variable ${key} is not a valid boolean: ${value}`);
};