import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface KeycloakUser {
  id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  attributes?: Record<string, string[]>;
}

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  session_state: string;
  scope: string;
}

// In-memory user store for development
const mockUsers: Map<string, any> = new Map();
const mockUsersByUsername: Map<string, any> = new Map();

export class KeycloakMockService {
  /**
   * Create a new user (mocked)
   */
  async createUser(user: KeycloakUser, password: string): Promise<string> {
    try {
      logger.info(`[MOCK] Creating user: ${user.username}`);

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

      logger.info(`[MOCK] User created successfully: ${userId}`);
      return userId;
    } catch (error) {
      logger.error('[MOCK] Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Get user by username (mocked)
   */
  async getUserByUsername(username: string): Promise<any> {
    try {
      logger.info(`[MOCK] Getting user by username: ${username}`);
      const user = mockUsersByUsername.get(username);
      return user || null;
    } catch (error) {
      logger.error('[MOCK] Failed to get user:', error);
      return null;
    }
  }

  /**
   * Get user by ID (mocked)
   */
  async getUserById(userId: string): Promise<any> {
    try {
      logger.info(`[MOCK] Getting user by ID: ${userId}`);
      const user = mockUsers.get(userId);
      return user || null;
    } catch (error) {
      logger.error('[MOCK] Failed to get user:', error);
      return null;
    }
  }

  /**
   * Authenticate user (mocked)
   */
  async authenticateUser(username: string, password: string): Promise<KeycloakTokenResponse> {
    try {
      logger.info(`[MOCK] Authenticating user: ${username}`);

      const user = mockUsersByUsername.get(username);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.password !== password) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        {
          sub: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
        },
        config.jwt.secret as string,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        {
          sub: user.id,
          type: 'refresh',
        },
        config.jwt.secret as string,
        { expiresIn: "7d" }
      );

      logger.info(`[MOCK] User authenticated successfully: ${username}`);

      return {
        access_token: accessToken,
        expires_in: 3600,
        refresh_expires_in: 604800,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        session_state: `session-${Date.now()}`,
        scope: 'openid profile email',
      };
    } catch (error) {
      logger.error('[MOCK] Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Refresh token (mocked)
   */
  async refreshToken(refreshToken: string): Promise<KeycloakTokenResponse> {
    try {
      logger.info('[MOCK] Refreshing token');

      // Verify refresh token
      const decoded: any = jwt.verify(refreshToken, config.jwt.secret as string);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = mockUsers.get(decoded.sub);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const accessToken = jwt.sign(
        {
          sub: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
        },
        config.jwt.secret as string,
        { expiresIn: "1h" }
      );

      const newRefreshToken = jwt.sign(
        {
          sub: user.id,
          type: 'refresh',
        },
        config.jwt.secret as string,
        { expiresIn: "7d" }
      );

      logger.info('[MOCK] Token refreshed successfully');

      return {
        access_token: accessToken,
        expires_in: 3600,
        refresh_expires_in: 604800,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        session_state: `session-${Date.now()}`,
        scope: 'openid profile email',
      };
    } catch (error) {
      logger.error('[MOCK] Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Assign role to user (mocked)
   */
  async assignRole(userId: string, roleName: string): Promise<void> {
    try {
      logger.info(`[MOCK] Assigning role ${roleName} to user ${userId}`);
      
      const user = mockUsers.get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.roles.includes(roleName)) {
        user.roles.push(roleName);
      }

      logger.info(`[MOCK] Role assigned successfully`);
    } catch (error) {
      logger.error('[MOCK] Failed to assign role:', error);
      throw error;
    }
  }

  /**
   * Update user (mocked)
   */
  async updateUser(userId: string, updates: Partial<KeycloakUser>): Promise<void> {
    try {
      logger.info(`[MOCK] Updating user: ${userId}`);
      
      const user = mockUsers.get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      Object.assign(user, updates);
      
      logger.info(`[MOCK] User updated successfully`);
    } catch (error) {
      logger.error('[MOCK] Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Logout user (mocked)
   */
  async logoutUser(refreshToken: string): Promise<void> {
    try {
      logger.info('[MOCK] Logging out user');
      // In a real implementation, we would invalidate the token
      // For mock, we just log it
      logger.info('[MOCK] User logged out successfully');
    } catch (error) {
      logger.error('[MOCK] Logout failed:', error);
      throw error;
    }
  }

  /**
   * Login user (alias for authenticateUser)
   */
  async login(username: string, password: string): Promise<KeycloakTokenResponse> {
    return this.authenticateUser(username, password);
  }

  /**
   * Get user info from token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      logger.info('[MOCK] Getting user info from token');
      const decoded: any = jwt.verify(accessToken, config.jwt.secret as string);
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
    } catch (error) {
      logger.error('[MOCK] Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Logout (alias for logoutUser)
   */
  async logout(refreshToken: string): Promise<void> {
    return this.logoutUser(refreshToken);
  }
}

export default new KeycloakMockService();