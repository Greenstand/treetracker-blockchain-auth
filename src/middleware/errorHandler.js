const logger = require('../config/logger');
const config = require('../config/config');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle different types of errors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Send error response in development environment
 */
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    });
  }

  // Generic error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send error response in production environment
 */
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.error('ERROR', {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  }

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error('ERROR', {
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (config.env === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  
  logger.warn('Route not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next(err);
};

/**
 * Async error wrapper to catch async errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection', {
    error: err.message,
    stack: err.stack,
    promise: promise
  });

  // Close server & exit process
  if (config.env === 'production') {
    process.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });

  // Exit process immediately
  process.exit(1);
});

/**
 * Handle SIGTERM signals
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  process.exit(0);
});

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync
};
