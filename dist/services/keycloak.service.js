"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class KeycloakService {
    constructor() {
        this.adminToken = null;
        this.tokenExpiry = 0;
        this.axiosInstance = axios_1.default.create({
            baseURL: config_1.config.keycloak.url,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Get admin access token
     */
    async getAdminToken() {
        try {
            // Return cached token if still valid
            if (this.adminToken && Date.now() < this.tokenExpiry) {
                return this.adminToken;
            }
            const response = await axios_1.default.post(`${config_1.config.keycloak.url}/realms/master/protocol/openid-connect/token`, new URLSearchParams({
                grant_type: 'password',
                client_id: 'admin-cli',
                username: config_1.config.keycloak.adminUsername,
                password: config_1.config.keycloak.adminPassword,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            this.adminToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
            logger_1.logger.info('Admin token obtained successfully');
            return this.adminToken || "";
        }
        catch (error) {
            logger_1.logger.error('Failed to get admin token:', error);
            throw new Error('Failed to authenticate with Keycloak');
        }
    }
    /**
     * Create a new user in Keycloak
     */
    async createUser(user, password) {
        try {
            const token = await this.getAdminToken();
            const userData = {
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                enabled: true,
                emailVerified: false,
                credentials: [
                    {
                        type: 'password',
                        value: password,
                        temporary: false,
                    },
                ],
                attributes: user.attributes || {},
            };
            const response = await axios_1.default.post(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/users`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            // Extract user ID from Location header
            const location = response.headers.location;
            const userId = location.split('/').pop();
            logger_1.logger.info(`User created successfully: ${userId}`);
            return userId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create user:', error.response?.data || error.message);
            throw new Error('Failed to create user in Keycloak');
        }
    }
    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        try {
            const token = await this.getAdminToken();
            const response = await axios_1.default.get(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/users`, {
                params: { username, exact: true },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.data.length === 0) {
                return null;
            }
            return response.data[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to get user:', error);
            throw new Error('Failed to retrieve user from Keycloak');
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const token = await this.getAdminToken();
            const response = await axios_1.default.get(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID:', error);
            return null;
        }
    }
    /**
     * Update user
     */
    async updateUser(userId, updates) {
        try {
            const token = await this.getAdminToken();
            await axios_1.default.put(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/users/${userId}`, updates, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            logger_1.logger.info(`User updated successfully: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update user:', error);
            throw new Error('Failed to update user in Keycloak');
        }
    }
    /**
     * Delete user
     */
    async deleteUser(userId) {
        try {
            const token = await this.getAdminToken();
            await axios_1.default.delete(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logger_1.logger.info(`User deleted successfully: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user:', error);
            throw new Error('Failed to delete user from Keycloak');
        }
    }
    /**
     * Authenticate user and get tokens
     */
    async login(username, password) {
        try {
            const response = await axios_1.default.post(`${config_1.config.keycloak.url}/realms/${config_1.config.keycloak.realm}/protocol/openid-connect/token`, new URLSearchParams({
                grant_type: 'password',
                client_id: config_1.config.keycloak.clientId,
                client_secret: config_1.config.keycloak.clientSecret,
                username,
                password,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            logger_1.logger.info(`User logged in successfully: ${username}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Login failed:', error.response?.data || error.message);
            throw new Error('Invalid credentials');
        }
    }
    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const response = await axios_1.default.post(`${config_1.config.keycloak.url}/realms/${config_1.config.keycloak.realm}/protocol/openid-connect/token`, new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: config_1.config.keycloak.clientId,
                client_secret: config_1.config.keycloak.clientSecret,
                refresh_token: refreshToken,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            logger_1.logger.info('Token refreshed successfully');
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed:', error);
            throw new Error('Failed to refresh token');
        }
    }
    /**
     * Logout user
     */
    async logout(refreshToken) {
        try {
            await axios_1.default.post(`${config_1.config.keycloak.url}/realms/${config_1.config.keycloak.realm}/protocol/openid-connect/logout`, new URLSearchParams({
                client_id: config_1.config.keycloak.clientId,
                client_secret: config_1.config.keycloak.clientSecret,
                refresh_token: refreshToken,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            logger_1.logger.info('User logged out successfully');
        }
        catch (error) {
            logger_1.logger.error('Logout failed:', error);
            throw new Error('Failed to logout');
        }
    }
    /**
     * Verify token
     */
    async verifyToken(token) {
        try {
            const response = await axios_1.default.post(`${config_1.config.keycloak.url}/realms/${config_1.config.keycloak.realm}/protocol/openid-connect/token/introspect`, new URLSearchParams({
                client_id: config_1.config.keycloak.clientId,
                client_secret: config_1.config.keycloak.clientSecret,
                token,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Token verification failed:', error);
            throw new Error('Failed to verify token');
        }
    }
    /**
     * Get user info from token
     */
    async getUserInfo(token) {
        try {
            const response = await axios_1.default.get(`${config_1.config.keycloak.url}/realms/${config_1.config.keycloak.realm}/protocol/openid-connect/userinfo`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user info:', error);
            throw new Error('Failed to get user info');
        }
    }
    /**
     * Assign role to user
     */
    async assignRole(userId, roleName) {
        try {
            const token = await this.getAdminToken();
            // Get role
            const rolesResponse = await axios_1.default.get(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/roles`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const role = rolesResponse.data.find((r) => r.name === roleName);
            if (!role) {
                throw new Error(`Role ${roleName} not found`);
            }
            // Assign role
            await axios_1.default.post(`${config_1.config.keycloak.url}/admin/realms/${config_1.config.keycloak.realm}/users/${userId}/role-mappings/realm`, [role], {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            logger_1.logger.info(`Role ${roleName} assigned to user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to assign role:', error);
            throw new Error('Failed to assign role');
        }
    }
}
exports.KeycloakService = KeycloakService;
exports.default = new KeycloakService();
//# sourceMappingURL=keycloak.service.js.map