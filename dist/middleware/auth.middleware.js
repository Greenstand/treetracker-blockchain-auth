"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFabricEnrollment = exports.optionalAuth = exports.requireRole = exports.verifyToken = void 0;
const logger_1 = require("../utils/logger");
const keycloak_service_1 = __importDefault(require("../services/keycloak.service"));
/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
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
        const tokenData = await keycloak_service_1.default.verifyToken(token);
        if (!tokenData.active) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
            return;
        }
        // Get user info
        const userInfo = await keycloak_service_1.default.getUserInfo(token);
        // Attach user to request
        req.user = {
            id: tokenData.sub,
            username: userInfo.preferred_username,
            email: userInfo.email,
            roles: tokenData.realm_access?.roles || [],
            sub: tokenData.sub,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Token verification failed:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
};
exports.verifyToken = verifyToken;
/**
 * Check if user has required role
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
            return;
        }
        const hasRole = roles.some((role) => req.user.roles.includes(role));
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
exports.requireRole = requireRole;
/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        const tokenData = await keycloak_service_1.default.verifyToken(token);
        if (tokenData.active) {
            const userInfo = await keycloak_service_1.default.getUserInfo(token);
            req.user = {
                id: tokenData.sub,
                username: userInfo.preferred_username,
                email: userInfo.email,
                roles: tokenData.realm_access?.roles || [],
                sub: tokenData.sub,
            };
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional auth failed:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Check if user is enrolled in Fabric
 */
const requireFabricEnrollment = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
            return;
        }
        const fabricService = (await Promise.resolve().then(() => __importStar(require('../services/fabric.service')))).default;
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
    }
    catch (error) {
        logger_1.logger.error('Fabric enrollment check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check Fabric enrollment',
        });
    }
};
exports.requireFabricEnrollment = requireFabricEnrollment;
//# sourceMappingURL=auth.middleware.js.map