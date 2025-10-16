import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

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

export class KeycloakService {
  private adminToken: string | null = null;
  private tokenExpiry: number = 0;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.keycloak.url,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get admin access token
   */
  private async getAdminToken(): Promise<string> {
    try {
      // Return cached token if still valid
      if (this.adminToken && Date.now() < this.tokenExpiry) {
        return this.adminToken;
      }

      const response = await axios.post(
        `${config.keycloak.url}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: config.keycloak.adminUsername,
          password: config.keycloak.adminPassword,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.adminToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      logger.info('Admin token obtained successfully');
      return this.adminToken || "";
    } catch (error) {
      logger.error('Failed to get admin token:', error);
      throw new Error('Failed to authenticate with Keycloak');
    }
  }

  /**
   * Create a new user in Keycloak
   */
  async createUser(user: KeycloakUser, password: string): Promise<string> {
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

      const response = await axios.post(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/users`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract user ID from Location header
      const location = response.headers.location;
      const userId = location.split('/').pop();

      logger.info(`User created successfully: ${userId}`);
      return userId!;
    } catch (error: any) {
      logger.error('Failed to create user:', error.response?.data || error.message);
      throw new Error('Failed to create user in Keycloak');
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<KeycloakUser | null> {
    try {
      const token = await this.getAdminToken();

      const response = await axios.get(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/users`,
        {
          params: { username, exact: true },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.length === 0) {
        return null;
      }

      return response.data[0];
    } catch (error) {
      logger.error('Failed to get user:', error);
      throw new Error('Failed to retrieve user from Keycloak');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<KeycloakUser | null> {
    try {
      const token = await this.getAdminToken();

      const response = await axios.get(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get user by ID:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<KeycloakUser>): Promise<void> {
    try {
      const token = await this.getAdminToken();

      await axios.put(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/users/${userId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`User updated successfully: ${userId}`);
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw new Error('Failed to update user in Keycloak');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const token = await this.getAdminToken();

      await axios.delete(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info(`User deleted successfully: ${userId}`);
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw new Error('Failed to delete user from Keycloak');
    }
  }

  /**
   * Authenticate user and get tokens
   */
  async login(username: string, password: string): Promise<KeycloakTokenResponse> {
    try {
      const response = await axios.post(
        `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: config.keycloak.clientId,
          client_secret: config.keycloak.clientSecret,
          username,
          password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info(`User logged in successfully: ${username}`);
      return response.data;
    } catch (error: any) {
      logger.error('Login failed:', error.response?.data || error.message);
      throw new Error('Invalid credentials');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<KeycloakTokenResponse> {
    try {
      const response = await axios.post(
        `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.keycloak.clientId,
          client_secret: config.keycloak.clientSecret,
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('Token refreshed successfully');
      return response.data;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await axios.post(
        `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/logout`,
        new URLSearchParams({
          client_id: config.keycloak.clientId,
          client_secret: config.keycloak.clientSecret,
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Verify token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token/introspect`,
        new URLSearchParams({
          client_id: config.keycloak.clientId,
          client_secret: config.keycloak.clientSecret,
          token,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Failed to verify token');
    }
  }

  /**
   * Get user info from token
   */
  async getUserInfo(token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get user info:', error);
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleName: string): Promise<void> {
    try {
      const token = await this.getAdminToken();

      // Get role
      const rolesResponse = await axios.get(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/roles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const role = rolesResponse.data.find((r: any) => r.name === roleName);
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      // Assign role
      await axios.post(
        `${config.keycloak.url}/admin/realms/${config.keycloak.realm}/users/${userId}/role-mappings/realm`,
        [role],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Role ${roleName} assigned to user ${userId}`);
    } catch (error) {
      logger.error('Failed to assign role:', error);
      throw new Error('Failed to assign role');
    }
  }
}

export default new KeycloakService();