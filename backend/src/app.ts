/**
 * @fileoverview Main Express application setup
 * 
 * Sets up the Express server with middleware, routes, and error handling
 * for the SurvAI MVP backend API.
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import type { ApiResponse, HealthCheckResponse } from '@survai/shared';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateEnv } from './utils/validateEnv';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import questionRoutes from './routes/questions';
import trackingRoutes from './routes/tracking';
import dashboardRoutes from './routes/dashboard';
import offerRoutes from './routes/offers';
import sessionRoutes from './routes/sessions';
import widgetAnalyticsRoutes from './routes/widgetAnalytics';

// Load environment variables first
dotenv.config();

// Validate environment variables on startup
validateEnv();

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Create Express application
const app = express();

// ==============================================
// Security Middleware
// ==============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || true, // Allow all origins for widget usage
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ==============================================
// General Middleware
// ==============================================

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Custom request logging
app.use(requestLogger);

// ==============================================
// Health Check Endpoint
// ==============================================

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthResponse: ApiResponse<HealthCheckResponse> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected',
        // TODO: Add Redis connection check when implemented
        // redis: 'connected',
        checks: {
          database: true,
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(healthResponse);
    logger.info('Health check successful');
  } catch (error) {
    logger.error('Health check failed:', error);
    
    const healthResponse: ApiResponse<HealthCheckResponse> = {
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'disconnected',
        checks: {
          database: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    };
    
    res.status(503).json(healthResponse);
  }
});

// ==============================================
// API Routes
// ==============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Session routes (for widget integration)
app.use('/api/sessions', sessionRoutes);

// Question and survey routes
app.use('/api/questions', questionRoutes);

// Tracking routes
app.use('/api/track', trackingRoutes);

// Widget analytics routes
app.use('/api/widget/analytics', widgetAnalyticsRoutes);

// Dashboard routes (admin protected)
app.use('/api/dashboard', dashboardRoutes);

// Offer routes (admin protected)
app.use('/api/offers', offerRoutes);

// TODO: Add other API routes here
// app.use('/api/users', userRoutes);
// app.use('/api/surveys', surveyRoutes);
// app.use('/api/responses', responseRoutes);

// Root endpoint
app.get('/', (req, res) => {
  const response: ApiResponse<{ message: string; version: string }> = {
    success: true,
    data: {
      message: 'SurvAI MVP Backend API',
      version: process.env.npm_package_version || '1.0.0',
    },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
});

// ==============================================
// Error Handling Middleware
// ==============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ==============================================
// Graceful Shutdown
// ==============================================

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;