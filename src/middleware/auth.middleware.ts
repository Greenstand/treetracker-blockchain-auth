import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import keycloakService from '../services/keycloak.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    sub: string;
  };
}

/**
 * Verify JWT token middleware
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Keycloak
    const tokenData = await keycloakService.verifyToken(token);

    if (!tokenData.active) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Get user info
    const userInfo = await keycloakService.getUserInfo(token);

    // Attach user to request
    req.user = {
      id: tokenData.sub,
      username: userInfo.preferred_username,
      email: userInfo.email,
      roles: tokenData.realm_access?.roles || [],
      sub: tokenData.sub,
    };

    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const tokenData = await keycloakService.verifyToken(token);

    if (tokenData.active) {
      const userInfo = await keycloakService.getUserInfo(token);
      req.user = {
        id: tokenData.sub,
        username: userInfo.preferred_username,
        email: userInfo.email,
        roles: tokenData.realm_access?.roles || [],
        sub: tokenData.sub,
      };
    }

    next();
  } catch (error) {
    logger.error('Optional auth failed:', error);
    next();
  }
};

/**
 * Check if user is enrolled in Fabric
 */
export const requireFabricEnrollment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const fabricService = (await import('../services/fabric.service')).default;
    const enrolled = await fabricService.isUserEnrolled(req.user.id);

    if (!enrolled) {
      res.status(403).json({
        success: false,
        error: 'User not enrolled in Fabric network',
        message: 'Please enroll in the Fabric network first',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Fabric enrollment check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Fabric enrollment',
    });
  }
};