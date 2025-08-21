const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config/config');
const logger = require('../config/logger');

// JWKS client for Keycloak public keys
const client = jwksClient({
  jwksUri: config.keycloak.jwksUri,
  requestHeaders: {},
  timeout: 30000, // Defaults to 30s
  cache: true,
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: 600000, // Default value (10 minutes)
});

// Get signing key from JWKS
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.keycloak.error('Failed to get signing key', { error: err.message });
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Middleware to authenticate JWT tokens from Keycloak
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.keycloak.warn('No authorization header provided', {
        ip: req.ip,
        url: req.originalUrl
      });
      return res.status(401).json({
        error: 'Authorization header required',
        message: 'Please provide a valid JWT token in the Authorization header'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.keycloak.warn('No token provided in authorization header', {
        ip: req.ip,
        url: req.originalUrl
      });
      return res.status(401).json({
        error: 'Token required',
        message: 'Please provide a valid JWT token'
      });
    }

    // Verify token
    jwt.verify(token, getKey, {
      audience: config.keycloak.clientId,
      issuer: config.keycloak.realmUrl,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        logger.keycloak.warn('Token verification failed', {
          error: err.message,
          ip: req.ip,
          url: req.originalUrl
        });
        
        let message = 'Invalid token';
        if (err.name === 'TokenExpiredError') {
          message = 'Token has expired';
        } else if (err.name === 'JsonWebTokenError') {
          message = 'Invalid token format';
        }
        
        return res.status(401).json({
          error: 'Authentication failed',
          message
        });
      }

      // Extract user information from token
      const user = {
        id: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        roles: decoded.realm_access?.roles || [],
        groups: decoded.groups || [],
        clientRoles: decoded.resource_access?.[config.keycloak.clientId]?.roles || []
      };

      logger.keycloak.debug('User authenticated successfully', {
        userId: user.id,
        username: user.username,
        roles: user.roles
      });

      // Add user info to request object
      req.user = user;
      req.token = token;
      
      next();
    });

  } catch (error) {
    logger.keycloak.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      url: req.originalUrl
    });
    
    res.status(500).json({
      error: 'Authentication service error',
      message: 'Unable to process authentication request'
    });
  }
};

/**
 * Middleware to check if user has required roles
 * @param {string[]} requiredRoles - Array of required roles
 */
const requireRoles = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const userRoles = [...req.user.roles, ...req.user.clientRoles];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (requiredRoles.length > 0 && !hasRequiredRole) {
      logger.keycloak.warn('Access denied - insufficient roles', {
        userId: req.user.id,
        userRoles,
        requiredRoles
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions to access this resource',
        requiredRoles
      });
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to required groups
 * @param {string[]} requiredGroups - Array of required groups
 */
const requireGroups = (requiredGroups = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const userGroups = req.user.groups || [];
    const hasRequiredGroup = requiredGroups.some(group => userGroups.includes(group));

    if (requiredGroups.length > 0 && !hasRequiredGroup) {
      logger.keycloak.warn('Access denied - user not in required group', {
        userId: req.user.id,
        userGroups,
        requiredGroups
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'User does not belong to required group',
        requiredGroups
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  // If token is provided, validate it
  return authenticateToken(req, res, next);
};

module.exports = {
  authenticateToken,
  requireRoles,
  requireGroups,
  optionalAuth
};
