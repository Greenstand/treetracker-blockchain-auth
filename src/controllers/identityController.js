const { validationResult } = require('express-validator');
const fabricCA = require('../services/fabricCA');
const fabricWallet = require('../services/fabricWallet');
const logger = require('../config/logger');

class IdentityController {
  /**
   * Register a new user identity with Fabric CA
   */
  async registerUser(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { role = 'client', affiliation = '', attributes = [] } = req.body;
      const username = req.user.username || req.user.id;

      logger.api.info('User registration requested', {
        userId: req.user.id,
        username,
        role,
        affiliation
      });

      // Check if user already exists in wallet
      const exists = await fabricWallet.identityExists(username);
      if (exists) {
        logger.api.warn('User identity already exists', { username });
        return res.status(409).json({
          error: 'Identity already exists',
          message: 'User already has a blockchain identity',
          username
        });
      }

      // Register user with Fabric CA
      const registrationResult = await fabricCA.registerUser(username, role, affiliation, attributes);

      logger.api.info('User registered successfully', {
        username,
        role
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          username: registrationResult.username,
          role: registrationResult.role,
          affiliation: registrationResult.affiliation,
          registeredAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.api.error('User registration failed', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  /**
   * Enroll a registered user and create their blockchain identity
   */
  async enrollUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { enrollmentSecret } = req.body;
      const username = req.user.username || req.user.id;

      logger.api.info('User enrollment requested', {
        userId: req.user.id,
        username
      });

      // Check if user already exists in wallet
      const exists = await fabricWallet.identityExists(username);
      if (exists) {
        return res.status(409).json({
          error: 'Identity already exists',
          message: 'User already has a blockchain identity',
          username
        });
      }

      // Enroll user with Fabric CA
      const enrollmentResult = await fabricCA.enrollUser(username, enrollmentSecret);

      if (!enrollmentResult.success) {
        return res.status(400).json({
          error: 'Enrollment failed',
          message: enrollmentResult.message
        });
      }

      logger.api.info('User enrolled successfully', { username });

      res.status(200).json({
        success: true,
        message: 'User enrolled successfully',
        data: {
          username: enrollmentResult.username,
          enrolledAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.api.error('User enrollment failed', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Enrollment failed',
        message: error.message
      });
    }
  }

  /**
   * Register and enroll user in one step
   */
  async registerAndEnroll(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { role = 'client', affiliation = '', attributes = [] } = req.body;
      const username = req.user.username || req.user.id;

      logger.api.info('User register and enroll requested', {
        userId: req.user.id,
        username,
        role,
        affiliation
      });

      // Check if user already exists
      const exists = await fabricWallet.identityExists(username);
      if (exists) {
        return res.status(409).json({
          error: 'Identity already exists',
          message: 'User already has a blockchain identity',
          username
        });
      }

      // Register and enroll user
      const result = await fabricCA.registerAndEnrollUser(username, role, affiliation, attributes);

      logger.api.info('User registered and enrolled successfully', { username });

      res.status(201).json({
        success: true,
        message: 'User registered and enrolled successfully',
        data: {
          username,
          role,
          affiliation,
          registeredAt: new Date().toISOString(),
          enrolledAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.api.error('User register and enroll failed', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Register and enroll failed',
        message: error.message
      });
    }
  }

  /**
   * Get user's blockchain identity information
   */
  async getIdentity(req, res) {
    try {
      const username = req.user.username || req.user.id;

      logger.api.debug('Identity info requested', {
        userId: req.user.id,
        username
      });

      // Get identity information from wallet
      const identityInfo = await fabricWallet.getIdentityInfo(username);

      if (!identityInfo) {
        return res.status(404).json({
          error: 'Identity not found',
          message: 'User does not have a blockchain identity'
        });
      }

      res.status(200).json({
        success: true,
        data: identityInfo
      });

    } catch (error) {
      logger.api.error('Failed to get identity info', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to get identity',
        message: error.message
      });
    }
  }

  /**
   * Check if user has a blockchain identity
   */
  async checkIdentityExists(req, res) {
    try {
      const username = req.user.username || req.user.id;

      const exists = await fabricWallet.identityExists(username);

      res.status(200).json({
        success: true,
        data: {
          username,
          exists,
          checkedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.api.error('Failed to check identity existence', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to check identity',
        message: error.message
      });
    }
  }

  /**
   * Validate user's blockchain identity
   */
  async validateIdentity(req, res) {
    try {
      const username = req.user.username || req.user.id;

      logger.api.debug('Identity validation requested', {
        userId: req.user.id,
        username
      });

      const validation = await fabricWallet.validateIdentity(username);

      res.status(200).json({
        success: true,
        data: validation
      });

    } catch (error) {
      logger.api.error('Failed to validate identity', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to validate identity',
        message: error.message
      });
    }
  }

  /**
   * Revoke user's blockchain identity
   */
  async revokeIdentity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { reason = 'User requested revocation' } = req.body;
      const username = req.user.username || req.user.id;

      logger.api.info('Identity revocation requested', {
        userId: req.user.id,
        username,
        reason
      });

      // Revoke certificate with CA
      const revokeResult = await fabricCA.revokeUser(username, reason);

      // Remove identity from wallet
      const removeResult = await fabricWallet.removeIdentity(username);

      logger.api.info('Identity revoked successfully', { username });

      res.status(200).json({
        success: true,
        message: 'Identity revoked successfully',
        data: {
          username,
          revokedAt: revokeResult.revokedAt,
          removedFromWallet: removeResult.success
        }
      });

    } catch (error) {
      logger.api.error('Failed to revoke identity', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to revoke identity',
        message: error.message
      });
    }
  }

  /**
   * Export user's identity (without private key)
   */
  async exportIdentity(req, res) {
    try {
      const username = req.user.username || req.user.id;

      logger.api.info('Identity export requested', {
        userId: req.user.id,
        username
      });

      const exportedIdentity = await fabricWallet.exportIdentity(username);

      res.status(200).json({
        success: true,
        message: 'Identity exported successfully',
        data: exportedIdentity
      });

    } catch (error) {
      logger.api.error('Failed to export identity', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to export identity',
        message: error.message
      });
    }
  }

  /**
   * Get user's Fabric CA information
   */
  async getCAUserInfo(req, res) {
    try {
      const username = req.user.username || req.user.id;

      logger.api.debug('CA user info requested', {
        userId: req.user.id,
        username
      });

      const caUserInfo = await fabricCA.getUserInfo(username);

      res.status(200).json({
        success: true,
        data: caUserInfo
      });

    } catch (error) {
      logger.api.error('Failed to get CA user info', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to get CA user information',
        message: error.message
      });
    }
  }
}

module.exports = new IdentityController();
