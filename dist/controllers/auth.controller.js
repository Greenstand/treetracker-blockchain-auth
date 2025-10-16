"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const keycloak_service_1 = __importDefault(require("../services/keycloak.service"));
const keycloak_mock_service_1 = __importDefault(require("../services/keycloak.mock.service"));
const fabric_service_1 = __importDefault(require("../services/fabric.service"));
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
// Use mock service in development mode
const authService = config_1.config.server.env === 'development' ? keycloak_mock_service_1.default : keycloak_service_1.default;
class AuthController {
    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const { username, email, password, firstName, lastName, phoneNumber, region, projectCode } = req.body;
            // Check if user already exists
            const existingUser = await authService.getUserByUsername(username);
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    error: 'Username already exists',
                });
                return;
            }
            // Create user in Keycloak
            const userId = await authService.createUser({
                username,
                email,
                firstName,
                lastName,
                attributes: {
                    phoneNumber: [phoneNumber],
                    region: [region],
                    projectCode: [projectCode || ''],
                },
            }, password);
            // Assign default role
            await authService.assignRole(userId, 'planter');
            // Enroll user in Fabric network
            try {
                await fabric_service_1.default.enrollUser(userId);
            }
            catch (fabricError) {
                logger_1.logger.error('Failed to enroll user in Fabric:', fabricError);
                // Continue even if Fabric enrollment fails
            }
            logger_1.logger.info(`User registered successfully: ${username}`);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    userId,
                    username,
                    email,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Registration failed:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Registration failed',
            });
        }
    }
    /**
     * Login user
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;
            // Authenticate with Keycloak
            const tokens = await authService.login(username, password);
            // Get user info
            const userInfo = await authService.getUserInfo(tokens.access_token);
            // Check Fabric enrollment status
            let fabricEnrolled = false;
            try {
                fabricEnrolled = await fabric_service_1.default.isUserEnrolled(userInfo.sub);
            }
            catch (error) {
                logger_1.logger.error('Failed to check Fabric enrollment:', error);
            }
            logger_1.logger.info(`User logged in successfully: ${username}`);
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresIn: tokens.expires_in,
                    tokenType: tokens.token_type,
                    user: {
                        id: userInfo.sub,
                        username: userInfo.preferred_username,
                        email: userInfo.email,
                        firstName: userInfo.given_name,
                        lastName: userInfo.family_name,
                        fabricEnrolled,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Login failed:', error);
            res.status(401).json({
                success: false,
                error: error.message || 'Invalid credentials',
            });
        }
    }
    /**
     * Refresh access token
     */
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: 'Refresh token is required',
                });
                return;
            }
            // Refresh token with Keycloak
            const tokens = await authService.refreshToken(refreshToken);
            logger_1.logger.info('Token refreshed successfully');
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresIn: tokens.expires_in,
                    tokenType: tokens.token_type,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed:', error);
            res.status(401).json({
                success: false,
                error: error.message || 'Failed to refresh token',
            });
        }
    }
    /**
     * Logout user
     */
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: 'Refresh token is required',
                });
                return;
            }
            // Logout from Keycloak
            await authService.logout(refreshToken);
            logger_1.logger.info('User logged out successfully');
            res.json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
            logger_1.logger.error('Logout failed:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Logout failed',
            });
        }
    }
    /**
     * Get user profile
     */
    async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Get user details from Keycloak
            const user = await authService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
                return;
            }
            // Check Fabric enrollment status
            let fabricEnrolled = false;
            try {
                fabricEnrolled = await fabric_service_1.default.isUserEnrolled(req.user.id);
            }
            catch (error) {
                logger_1.logger.error('Failed to check Fabric enrollment:', error);
            }
            res.json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.attributes?.phoneNumber?.[0],
                    region: user.attributes?.region?.[0],
                    projectCode: user.attributes?.projectCode?.[0],
                    fabricEnrolled,
                    emailVerified: user.emailVerified,
                    enabled: user.enabled,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get profile:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get profile',
            });
        }
    }
    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const { firstName, lastName, phoneNumber, region } = req.body;
            const updates = {};
            if (firstName)
                updates.firstName = firstName;
            if (lastName)
                updates.lastName = lastName;
            if (phoneNumber || region) {
                updates.attributes = {};
                if (phoneNumber)
                    updates.attributes.phoneNumber = [phoneNumber];
                if (region)
                    updates.attributes.region = [region];
            }
            // Update user in Keycloak
            await authService.updateUser(req.user.id, updates);
            logger_1.logger.info(`Profile updated successfully: ${req.user.username}`);
            res.json({
                success: true,
                message: 'Profile updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update profile:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update profile',
            });
        }
    }
    /**
     * Enroll user in Fabric network
     */
    async enrollFabric(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Check if already enrolled
            const enrolled = await fabric_service_1.default.isUserEnrolled(req.user.id);
            if (enrolled) {
                res.status(400).json({
                    success: false,
                    error: 'User already enrolled in Fabric network',
                });
                return;
            }
            // Enroll user
            await fabric_service_1.default.enrollUser(req.user.id);
            logger_1.logger.info(`User enrolled in Fabric: ${req.user.username}`);
            res.json({
                success: true,
                message: 'Successfully enrolled in Fabric network',
            });
        }
        catch (error) {
            logger_1.logger.error('Fabric enrollment failed:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to enroll in Fabric network',
            });
        }
    }
    /**
     * Get Fabric identity status
     */
    async getFabricIdentity(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const status = await fabric_service_1.default.getUserIdentityStatus(req.user.id);
            res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get Fabric identity:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get Fabric identity',
            });
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map