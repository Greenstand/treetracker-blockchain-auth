"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakMockService = void 0;
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
// In-memory user store for development
const mockUsers = new Map();
const mockUsersByUsername = new Map();
class KeycloakMockService {
    /**
     * Create a new user (mocked)
     */
    async createUser(user, password) {
        try {
            logger_1.logger.info(`[MOCK] Creating user: ${user.username}`);
            // Check if user already exists
            if (mockUsersByUsername.has(user.username)) {
                throw new Error('User already exists');
            }
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const userData = {
                id: userId,
                username: user.username,
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                enabled: true,
                emailVerified: false,
                attributes: user.attributes || {},
                password: password, // In real implementation, this would be hashed
                roles: [],
                createdAt: new Date().toISOString(),
            };
            mockUsers.set(userId, userData);
            mockUsersByUsername.set(user.username, userData);
            logger_1.logger.info(`[MOCK] User created successfully: ${userId}`);
            return userId;
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Failed to create user:', error);
            throw error;
        }
    }
    /**
     * Get user by username (mocked)
     */
    async getUserByUsername(username) {
        try {
            logger_1.logger.info(`[MOCK] Getting user by username: ${username}`);
            const user = mockUsersByUsername.get(username);
            return user || null;
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Failed to get user:', error);
            return null;
        }
    }
    /**
     * Get user by ID (mocked)
     */
    async getUserById(userId) {
        try {
            logger_1.logger.info(`[MOCK] Getting user by ID: ${userId}`);
            const user = mockUsers.get(userId);
            return user || null;
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Failed to get user:', error);
            return null;
        }
    }
    /**
     * Authenticate user (mocked)
     */
    async authenticateUser(username, password) {
        try {
            logger_1.logger.info(`[MOCK] Authenticating user: ${username}`);
            const user = mockUsersByUsername.get(username);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.password !== password) {
                throw new Error('Invalid credentials');
            }
            // Generate JWT tokens
            const accessToken = jsonwebtoken_1.default.sign({
                sub: user.id,
                username: user.username,
                email: user.email,
                roles: user.roles,
            }, config_1.config.jwt.secret, { expiresIn: "1h" });
            const refreshToken = jsonwebtoken_1.default.sign({
                sub: user.id,
                type: 'refresh',
            }, config_1.config.jwt.secret, { expiresIn: "7d" });
            logger_1.logger.info(`[MOCK] User authenticated successfully: ${username}`);
            return {
                access_token: accessToken,
                expires_in: 3600,
                refresh_expires_in: 604800,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                session_state: `session-${Date.now()}`,
                scope: 'openid profile email',
            };
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Authentication failed:', error);
            throw error;
        }
    }
    /**
     * Refresh token (mocked)
     */
    async refreshToken(refreshToken) {
        try {
            logger_1.logger.info('[MOCK] Refreshing token');
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.secret);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }
            const user = mockUsers.get(decoded.sub);
            if (!user) {
                throw new Error('User not found');
            }
            // Generate new tokens
            const accessToken = jsonwebtoken_1.default.sign({
                sub: user.id,
                username: user.username,
                email: user.email,
                roles: user.roles,
            }, config_1.config.jwt.secret, { expiresIn: "1h" });
            const newRefreshToken = jsonwebtoken_1.default.sign({
                sub: user.id,
                type: 'refresh',
            }, config_1.config.jwt.secret, { expiresIn: "7d" });
            logger_1.logger.info('[MOCK] Token refreshed successfully');
            return {
                access_token: accessToken,
                expires_in: 3600,
                refresh_expires_in: 604800,
                refresh_token: newRefreshToken,
                token_type: 'Bearer',
                session_state: `session-${Date.now()}`,
                scope: 'openid profile email',
            };
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Token refresh failed:', error);
            throw error;
        }
    }
    /**
     * Assign role to user (mocked)
     */
    async assignRole(userId, roleName) {
        try {
            logger_1.logger.info(`[MOCK] Assigning role ${roleName} to user ${userId}`);
            const user = mockUsers.get(userId);
            if (!user) {
                throw new Error('User not found');
            }
            if (!user.roles.includes(roleName)) {
                user.roles.push(roleName);
            }
            logger_1.logger.info(`[MOCK] Role assigned successfully`);
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Failed to assign role:', error);
            throw error;
        }
    }
    /**
     * Update user (mocked)
     */
    async updateUser(userId, updates) {
        try {
            logger_1.logger.info(`[MOCK] Updating user: ${userId}`);
            const user = mockUsers.get(userId);
            if (!user) {
                throw new Error('User not found');
            }
            Object.assign(user, updates);
            logger_1.logger.info(`[MOCK] User updated successfully`);
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Failed to update user:', error);
            throw error;
        }
    }
    /**
     * Logout user (mocked)
     */
    async logoutUser(refreshToken) {
        try {
            logger_1.logger.info('[MOCK] Logging out user');
            // In a real implementation, we would invalidate the token
            // For mock, we just log it
            logger_1.logger.info('[MOCK] User logged out successfully');
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Logout failed:', error);
            throw error;
        }
    }
    /**
     * Login user (alias for authenticateUser)
     */
    async login(username, password) {
        return this.authenticateUser(username, password);
    }
    /**
     * Get user info from token
     */
    async getUserInfo(accessToken) {
        try {
            logger_1.logger.info('[MOCK] Getting user info from token');
            const decoded = jsonwebtoken_1.default.verify(accessToken, config_1.config.jwt.secret);
            const user = mockUsers.get(decoded.sub);
            if (!user) {
                throw new Error('User not found');
            }
            return {
                sub: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.roles,
            };
        }
        catch (error) {
            logger_1.logger.error('[MOCK] Failed to get user info:', error);
            throw error;
        }
    }
    /**
     * Logout (alias for logoutUser)
     */
    async logout(refreshToken) {
        return this.logoutUser(refreshToken);
    }
}
exports.KeycloakMockService = KeycloakMockService;
exports.default = new KeycloakMockService();
//# sourceMappingURL=keycloak.mock.service.js.map