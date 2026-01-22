import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import keycloakService from '../services/keycloak.service';
import keycloakMockService from '../services/keycloak.mock.service';
import fabricService from '../services/fabric.service';
import { logger } from '../utils/logger';
import { config } from '../config';

type UserSettings = {
  notification: {
    email: boolean;
    sms: boolean;
    weeklySummary: boolean;
  };
  privacy: {
    shareLocation: boolean;
    publicProfile: boolean;
  };
  preferences: {
    units: 'metric' | 'imperial';
    mapStyle: 'terrain' | 'satellite';
    language: string;
    timezone: string;
    darkMode: boolean;
  };
};

const DEFAULT_SETTINGS: UserSettings = {
  notification: {
    email: true,
    sms: false,
    weeklySummary: true,
  },
  privacy: {
    shareLocation: true,
    publicProfile: false,
  },
  preferences: {
    units: 'metric',
    mapStyle: 'terrain',
    language: 'en',
    timezone: 'UTC',
    darkMode: false,
  },
};

const normalizeSettings = (input: Partial<UserSettings> | undefined): UserSettings => {
  const notification: Partial<UserSettings['notification']> = input?.notification ?? {};
  const privacy: Partial<UserSettings['privacy']> = input?.privacy ?? {};
  const preferences: Partial<UserSettings['preferences']> = input?.preferences ?? {};

  return {
    notification: {
      email: typeof notification.email === 'boolean' ? notification.email : DEFAULT_SETTINGS.notification.email,
      sms: typeof notification.sms === 'boolean' ? notification.sms : DEFAULT_SETTINGS.notification.sms,
      weeklySummary:
        typeof notification.weeklySummary === 'boolean'
          ? notification.weeklySummary
          : DEFAULT_SETTINGS.notification.weeklySummary,
    },
    privacy: {
      shareLocation:
        typeof privacy.shareLocation === 'boolean' ? privacy.shareLocation : DEFAULT_SETTINGS.privacy.shareLocation,
      publicProfile:
        typeof privacy.publicProfile === 'boolean' ? privacy.publicProfile : DEFAULT_SETTINGS.privacy.publicProfile,
    },
    preferences: {
      units: preferences.units === 'imperial' || preferences.units === 'metric'
        ? preferences.units
        : DEFAULT_SETTINGS.preferences.units,
      mapStyle: preferences.mapStyle === 'satellite' || preferences.mapStyle === 'terrain'
        ? preferences.mapStyle
        : DEFAULT_SETTINGS.preferences.mapStyle,
      language: typeof preferences.language === 'string' && preferences.language.trim()
        ? preferences.language
        : DEFAULT_SETTINGS.preferences.language,
      timezone: typeof preferences.timezone === 'string' && preferences.timezone.trim()
        ? preferences.timezone
        : DEFAULT_SETTINGS.preferences.timezone,
      darkMode: typeof preferences.darkMode === 'boolean'
        ? preferences.darkMode
        : DEFAULT_SETTINGS.preferences.darkMode,
    },
  };
};

const readSettingsAttribute = (raw?: string): UserSettings => {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return normalizeSettings(parsed);
  } catch (error) {
    logger.warn('Failed to parse settings attribute, using defaults', error);
    return DEFAULT_SETTINGS;
  }
};

// Use mock service in development mode
const authService = config.server.env === 'development' ? keycloakMockService : keycloakService;

const extractRoles = (tokenPayload: any): string[] => {
  const realmRoles = tokenPayload?.realm_access?.roles;
  if (Array.isArray(realmRoles)) {
    return realmRoles;
  }
  const clientRoles = tokenPayload?.resource_access?.[config.keycloak.clientId]?.roles;
  if (Array.isArray(clientRoles)) {
    return clientRoles;
  }
  return [];
};

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
   * Register new admin user
   */
  async registerAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName, phoneNumber, region, projectCode, adminSecret } = req.body;

      if (!config.admin.registrationSecret || adminSecret !== config.admin.registrationSecret) {
        res.status(403).json({
          success: false,
          error: 'Invalid admin registration secret',
        });
        return;
      }

      const existingUser = await authService.getUserByUsername(username);
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Username already exists',
        });
        return;
      }

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

      await authService.assignRole(userId, 'admin');

      try {
        await fabricService.enrollUser(userId, 'org1.department1', 'admin');
      } catch (fabricError) {
        logger.error('Failed to enroll admin in Fabric:', fabricError);
      }

      logger.info(`Admin registered successfully: ${username}`);

      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
          userId,
          username,
          email,
        },
      });
    } catch (error: any) {
      logger.error('Admin registration failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Admin registration failed',
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
      const roles = extractRoles(tokenPayload);
      const isAdmin = roles.includes('admin');
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
        if (isAdmin && !fabricEnrolled) {
          await fabricService.enrollUser(userInfo.sub, 'org1.department1', 'admin');
          fabricEnrolled = true;
        }
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
   * Login admin user
   */
  async loginAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const tokens = await authService.login(username, password);

      const tokenPayload = JSON.parse(Buffer.from(tokens.access_token.split('.')[1], 'base64').toString());
      const roles = extractRoles(tokenPayload);
      const isAdmin = roles.includes('admin');

      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin role required',
        });
        return;
      }

      const userInfo = {
        sub: tokenPayload.sub,
        preferred_username: tokenPayload.preferred_username,
        email: tokenPayload.email,
        given_name: tokenPayload.given_name,
        family_name: tokenPayload.family_name,
      };

      let fabricEnrolled = false;
      try {
        fabricEnrolled = await fabricService.isUserEnrolled(userInfo.sub);
        if (!fabricEnrolled) {
          await fabricService.enrollUser(userInfo.sub, 'org1.department1', 'admin');
          fabricEnrolled = true;
        }
      } catch (error) {
        logger.error('Failed to enroll admin in Fabric:', error);
      }

      logger.info(`Admin logged in successfully: ${username}`);

      res.json({
        success: true,
        message: 'Admin login successful',
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
      logger.error('Admin login failed:', error);
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
   * Get user settings
   */
  async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const settingsRaw = user.attributes?.settings?.[0];
      const settings = readSettingsAttribute(settingsRaw);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      logger.error('Failed to get settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get settings',
      });
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const existingSettings = readSettingsAttribute(user.attributes?.settings?.[0]);
      const incomingSettings = req.body as Partial<UserSettings>;
      const mergedSettings = normalizeSettings({
        notification: { ...existingSettings.notification, ...incomingSettings.notification },
        privacy: { ...existingSettings.privacy, ...incomingSettings.privacy },
        preferences: { ...existingSettings.preferences, ...incomingSettings.preferences },
      });

      const nextAttributes = {
        ...(user.attributes || {}),
        settings: [JSON.stringify(mergedSettings)],
      };

      await authService.updateUser(req.user.id, { attributes: nextAttributes });

      logger.info(`Settings updated successfully: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: mergedSettings,
      });
    } catch (error: any) {
      logger.error('Failed to update settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update settings',
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
