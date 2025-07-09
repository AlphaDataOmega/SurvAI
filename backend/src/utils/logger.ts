/**
 * @fileoverview Winston logger configuration
 * 
 * Centralized logging configuration using Winston
 * with different transports for different environments.
 */

import winston from 'winston';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'gray',
};

// Add colors to winston
winston.addColors(logColors);

// Determine log level from environment
const getLogLevel = (): string => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level && Object.keys(logLevels).includes(level)) {
    return level;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

// Create logger format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += ` ${  JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    
    // Console for production (structured)
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test',
});

// Create a stream object for Morgan
export const loggerStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

// Log uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: 'logs/exceptions.log',
    format: logFormat,
  })
);

// Log unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: 'logs/rejections.log',
    format: logFormat,
  })
);

// Create logs directory if it doesn't exist
if (process.env.NODE_ENV === 'production') {
  import('fs').then(fs => {
    import('path').then(path => {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
    });
  });
}

export default logger;