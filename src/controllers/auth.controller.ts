import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import keycloakService from '../services/keycloak.service';
import keycloakMockService from '../services/keycloak.mock.service';
import fabricService from '../services/fabric.service';
import { logger } from '../utils/logger';
import { config } from '../config';

// Use mock service in development mode
const authService = config.server.env === 'development' ? keycloakMockService : keycloakService;

export class AuthController {
  /**
   * Register new user
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
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
      const userId = await authService.createUser(
        {
          username,
          email,
          firstName,
          lastName,
          attributes: {
            phoneNumber: [phoneNumber],
            region: [region],
            projectCode: [projectCode || ''],
          },
        },
        password
      );

      // Assign default role
      await authService.assignRole(userId, 'planter');

      // Enroll user in Fabric network
      try {
        await fabricService.enrollUser(userId);
      } catch (fabricError) {
        logger.error('Failed to enroll user in Fabric:', fabricError);
        // Continue even if Fabric enrollment fails
      }

      logger.info(`User registered successfully: ${username}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          userId,
          username,
          email,
        },
      });
    } catch (error: any) {
      logger.error('Registration failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Registration failed',
      });
    }
  }

  /**
   * Login user
   */
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Authenticate with Keycloak
      const tokens = await authService.login(username, password);

      // Extract user info from JWT token instead of making userinfo call
      // This avoids the openid scope requirement
      const tokenPayload = JSON.parse(Buffer.from(tokens.access_token.split('.')[1], 'base64').toString());
      const userInfo = {
        sub: tokenPayload.sub,
        preferred_username: tokenPayload.preferred_username,
        email: tokenPayload.email,
        given_name: tokenPayload.given_name,
        family_name: tokenPayload.family_name,
      };

      // Check Fabric enrollment status
      let fabricEnrolled = false;
      try {
        fabricEnrolled = await fabricService.isUserEnrolled(userInfo.sub);
      } catch (error) {
        logger.error('Failed to check Fabric enrollment:', error);
      }

      logger.info(`User logged in successfully: ${username}`);

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
    } catch (error: any) {
      logger.error('Login failed:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid credentials',
      });
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info('Token refreshed successfully');

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
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Failed to refresh token',
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
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

      logger.info('User logged out successfully');

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      logger.error('Logout failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Logout failed',
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
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
        fabricEnrolled = await fabricService.isUserEnrolled(req.user.id);
      } catch (error) {
        logger.error('Failed to check Fabric enrollment:', error);
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
    } catch (error: any) {
      logger.error('Failed to get profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profile',
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { firstName, lastName, phoneNumber, region } = req.body;

      const updates: any = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (phoneNumber || region) {
        updates.attributes = {};
        if (phoneNumber) updates.attributes.phoneNumber = [phoneNumber];
        if (region) updates.attributes.region = [region];
      }

      // Update user in Keycloak
      await authService.updateUser(req.user.id, updates);

      logger.info(`Profile updated successfully: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      logger.error('Failed to update profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * Enroll user in Fabric network
   */
  async enrollFabric(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Check if already enrolled
      const enrolled = await fabricService.isUserEnrolled(req.user.id);
      if (enrolled) {
        res.status(400).json({
          success: false,
          error: 'User already enrolled in Fabric network',
        });
        return;
      }

      // Enroll user
      await fabricService.enrollUser(req.user.id);

      logger.info(`User enrolled in Fabric: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Successfully enrolled in Fabric network',
      });
    } catch (error: any) {
      logger.error('Fabric enrollment failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to enroll in Fabric network',
      });
    }
  }

  /**
   * Get Fabric identity status
   */
  async getFabricIdentity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const status = await fabricService.getUserIdentityStatus(req.user.id);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Failed to get Fabric identity:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get Fabric identity',
      });
    }
  }
}

export default new AuthController();