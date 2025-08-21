const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');
const logger = require('../config/logger');

class FabricCAService {
  constructor() {
    this.caClient = null;
    this.adminIdentity = null;
    this.initialized = false;
  }

  /**
   * Initialize the Fabric CA client and enroll admin user
   */
  async initialize() {
    try {
      logger.fabricCA.info('Initializing Fabric CA client');

      // Create CA client
      const caTLSCACerts = config.fabricCA.tlsCertPath 
        ? fs.readFileSync(config.fabricCA.tlsCertPath, 'utf8')
        : null;

      const caInfo = {
        url: config.fabricCA.url,
        caName: config.fabricCA.name
      };

      if (caTLSCACerts) {
        caInfo.tlsCACerts = caTLSCACerts;
      }

      this.caClient = new FabricCAServices(caInfo);

      // Initialize wallet
      const wallet = await Wallets.newFileSystemWallet(config.fabric.walletPath);

      // Check if admin already exists in wallet
      const adminIdentity = await wallet.get(config.fabricCA.adminUser);
      if (adminIdentity) {
        logger.fabricCA.info('Admin identity already exists in wallet');
        this.adminIdentity = adminIdentity;
        this.initialized = true;
        return;
      }

      // Enroll admin
      logger.fabricCA.info('Enrolling admin user');
      const enrollment = await this.caClient.enroll({
        enrollmentID: config.fabricCA.adminUser,
        enrollmentSecret: config.fabricCA.adminPassword
      });

      // Create admin identity object
      const adminUser = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes()
        },
        mspId: config.fabric.mspId,
        type: 'X.509'
      };

      // Store admin identity in wallet
      await wallet.put(config.fabricCA.adminUser, adminUser);
      this.adminIdentity = adminUser;

      logger.fabricCA.info('Admin enrolled and stored in wallet successfully');
      this.initialized = true;

    } catch (error) {
      logger.fabricCA.error('Failed to initialize Fabric CA client', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Register a new user with Fabric CA
   * @param {string} username - Username for registration
   * @param {string} role - User role (default: 'client')
   * @param {string} affiliation - User affiliation (default: '')
   * @param {Object} attributes - Additional user attributes
   */
  async registerUser(username, role = 'client', affiliation = '', attributes = []) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricCA.info('Registering new user', { username, role, affiliation });

      // Build admin user context
      const adminUserContext = {
        identity: this.adminIdentity,
        mspId: config.fabric.mspId
      };

      // Registration request
      const registerRequest = {
        enrollmentID: username,
        enrollmentSecret: this.generateSecret(),
        role: role,
        affiliation: affiliation,
        maxEnrollments: -1, // Allow unlimited enrollments
        attrs: [
          {
            name: 'role',
            value: role,
            ecert: true
          },
          ...attributes
        ]
      };

      // Register user
      const secret = await this.caClient.register(registerRequest, adminUserContext);

      logger.fabricCA.info('User registered successfully', { 
        username, 
        secret: secret ? 'generated' : 'provided'
      });

      return {
        username,
        secret: secret || registerRequest.enrollmentSecret,
        role,
        affiliation
      };

    } catch (error) {
      logger.fabricCA.error('Failed to register user', {
        username,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`User registration failed: ${error.message}`);
    }
  }

  /**
   * Enroll a registered user and create their identity
   * @param {string} username - Username for enrollment
   * @param {string} secret - Enrollment secret
   */
  async enrollUser(username, secret) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricCA.info('Enrolling user', { username });

      // Get wallet
      const wallet = await Wallets.newFileSystemWallet(config.fabric.walletPath);

      // Check if user already exists
      const userIdentity = await wallet.get(username);
      if (userIdentity) {
        logger.fabricCA.warn('User identity already exists', { username });
        return {
          success: false,
          message: 'User identity already exists in wallet'
        };
      }

      // Enroll user
      const enrollment = await this.caClient.enroll({
        enrollmentID: username,
        enrollmentSecret: secret
      });

      // Create user identity
      const userIdentityObj = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes()
        },
        mspId: config.fabric.mspId,
        type: 'X.509'
      };

      // Store user identity in wallet
      await wallet.put(username, userIdentityObj);

      logger.fabricCA.info('User enrolled successfully', { username });

      return {
        success: true,
        username,
        certificate: enrollment.certificate
      };

    } catch (error) {
      logger.fabricCA.error('Failed to enroll user', {
        username,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`User enrollment failed: ${error.message}`);
    }
  }

  /**
   * Register and enroll a user in one step
   * @param {string} username - Username
   * @param {string} role - User role
   * @param {string} affiliation - User affiliation
   * @param {Object} attributes - Additional attributes
   */
  async registerAndEnrollUser(username, role = 'client', affiliation = '', attributes = []) {
    try {
      // First register the user
      const registrationResult = await this.registerUser(username, role, affiliation, attributes);
      
      // Then enroll the user
      const enrollmentResult = await this.enrollUser(username, registrationResult.secret);

      return {
        registration: registrationResult,
        enrollment: enrollmentResult
      };

    } catch (error) {
      logger.fabricCA.error('Failed to register and enroll user', {
        username,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Revoke a user's certificate
   * @param {string} username - Username to revoke
   * @param {string} reason - Reason for revocation
   */
  async revokeUser(username, reason = 'User requested revocation') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricCA.info('Revoking user certificate', { username, reason });

      // Build admin user context
      const adminUserContext = {
        identity: this.adminIdentity,
        mspId: config.fabric.mspId
      };

      // Revoke user
      const revokeRequest = {
        enrollmentID: username,
        reason: reason
      };

      await this.caClient.revoke(revokeRequest, adminUserContext);

      logger.fabricCA.info('User certificate revoked successfully', { username });

      return {
        success: true,
        username,
        revokedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.fabricCA.error('Failed to revoke user certificate', {
        username,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Certificate revocation failed: ${error.message}`);
    }
  }

  /**
   * Get user information from CA
   * @param {string} username - Username to query
   */
  async getUserInfo(username) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Build admin user context
      const adminUserContext = {
        identity: this.adminIdentity,
        mspId: config.fabric.mspId
      };

      // Get user info
      const userInfo = await this.caClient.getIdentity(username, adminUserContext);

      return userInfo;

    } catch (error) {
      logger.fabricCA.error('Failed to get user info', {
        username,
        error: error.message
      });
      throw new Error(`Failed to get user information: ${error.message}`);
    }
  }

  /**
   * Generate a random enrollment secret
   * @returns {string} Random secret
   */
  generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if CA service is healthy
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return { healthy: false, error: 'CA client not initialized' };
      }

      // Try to get CA info
      const caInfo = await this.caClient.getCaInfo();
      
      return {
        healthy: true,
        caName: caInfo.caName,
        version: caInfo.version
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new FabricCAService();
