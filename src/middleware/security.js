const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Rate limiting middleware
 */
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimiting.windowMs,
    max: config.rateLimiting.maxRequests,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded, please try again later',
      retryAfter: Math.ceil(config.rateLimiting.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.security.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded, please try again later',
        retryAfter: Math.ceil(config.rateLimiting.windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.startsWith('/health');
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General rate limiting
 */
const generalRateLimit = createRateLimit();

/**
 * Strict rate limiting for sensitive endpoints
 */
const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: 'Too many sensitive requests',
    message: 'Strict rate limit exceeded for sensitive operations',
    retryAfter: 15 * 60 // 15 minutes
  }
});

/**
 * Authentication rate limiting
 */
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per window
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many failed authentication attempts, please try again later',
    retryAfter: 15 * 60 // 15 minutes
  }
});

/**
 * Helmet security middleware configuration
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API usage
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "no-referrer" }
});

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Remove potentially dangerous characters from query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  }

  // Sanitize request body if it's JSON
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

/**
 * Request size limiting middleware
 */
const limitRequestSize = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  
  if (req.get('content-length') > maxSize) {
    logger.security.warn('Request size limit exceeded', {
      ip: req.ip,
      contentLength: req.get('content-length'),
      maxSize,
      url: req.originalUrl
    });
    
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request size exceeds the maximum allowed limit',
      maxSize: `${maxSize / 1024 / 1024}MB`
    });
  }
  
  next();
};

/**
 * IP filtering middleware (if needed)
 */
const ipFilter = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.security.warn('IP access denied', {
        ip: clientIP,
        allowedIPs,
        url: req.originalUrl
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not allowed to access this resource'
      });
    }
    
    next();
  };
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Request-ID', req.id || 'unknown');
  
  next();
};

module.exports = {
  generalRateLimit,
  strictRateLimit,
  authRateLimit,
  helmetConfig,
  sanitizeRequest,
  limitRequestSize,
  ipFilter,
  securityHeaders,
  createRateLimit
};
