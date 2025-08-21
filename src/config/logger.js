const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');

// Ensure logs directory exists
const logDir = path.dirname(config.logging.filePath);
fs.ensureDirSync(logDir);

// Custom format for console logging
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Custom format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: config.env === 'development' ? 'debug' : config.logging.level,
    format: consoleFormat
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: config.logging.filePath,
    level: config.logging.level,
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    tailable: true
  }),
  
  // Error file transport
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat
    })
  ],
  exitOnError: false
});

// Create child loggers for different components
logger.keycloak = logger.child({ component: 'keycloak' });
logger.fabricCA = logger.child({ component: 'fabric-ca' });
logger.fabricWallet = logger.child({ component: 'fabric-wallet' });
logger.api = logger.child({ component: 'api' });
logger.security = logger.child({ component: 'security' });

// Helper methods
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP request completed with error', logData);
    } else {
      logger.info('HTTP request completed', logData);
    }
  });
  
  next();
};

logger.logError = (error, context = {}) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

module.exports = logger;
