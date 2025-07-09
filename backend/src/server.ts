/**
 * @fileoverview Server entry point
 * 
 * Starts the Express server and handles graceful shutdown
 * for the SurvAI MVP backend API.
 */

import type { Server } from 'http';

import app, { prisma } from './app';
import { logger } from './utils/logger';
import { getEnvAsNumber } from './utils/validateEnv';

// Get port from environment
const PORT = getEnvAsNumber('BACKEND_PORT', 8000);

let server: Server;

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`SurvAI Backend API server started`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? `Pipe ${  PORT}` : `Port ${  PORT}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // Stop accepting new connections
    if (server) {
      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connections
        await prisma.$disconnect();
        logger.info('Database connections closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
    } else {
      // If server hasn't started yet, just disconnect from database
      await prisma.$disconnect();
      logger.info('Database connections closed');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});