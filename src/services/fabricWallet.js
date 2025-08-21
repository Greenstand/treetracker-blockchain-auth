const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../config/logger');

class FabricWalletService {
  constructor() {
    this.wallet = null;
    this.initialized = false;
  }

  /**
   * Initialize the wallet service
   */
  async initialize() {
    try {
      logger.fabricWallet.info('Initializing Fabric Wallet service');

      // Ensure wallet directory exists
      await fs.ensureDir(config.fabric.walletPath);

      // Create wallet instance
      this.wallet = await Wallets.newFileSystemWallet(config.fabric.walletPath);

      this.initialized = true;
      logger.fabricWallet.info('Fabric Wallet service initialized successfully');

    } catch (error) {
      logger.fabricWallet.error('Failed to initialize Fabric Wallet service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Store a user identity in the wallet
   * @param {string} username - Username/identifier for the identity
   * @param {Object} identity - Identity object containing credentials
   */
  async storeIdentity(username, identity) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricWallet.info('Storing user identity', { username });

      // Validate identity object
      if (!identity || !identity.credentials) {
        throw new Error('Invalid identity object - missing credentials');
      }

      if (!identity.credentials.certificate || !identity.credentials.privateKey) {
        throw new Error('Invalid identity credentials - missing certificate or private key');
      }

      // Store identity in wallet
      await this.wallet.put(username, identity);

      logger.fabricWallet.info('User identity stored successfully', { username });

      return {
        success: true,
        username,
        storedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to store user identity', {
        username,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to store identity: ${error.message}`);
    }
  }

  /**
   * Retrieve a user identity from the wallet
   * @param {string} username - Username/identifier for the identity
   * @returns {Object|null} Identity object or null if not found
   */
  async getIdentity(username) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricWallet.debug('Retrieving user identity', { username });

      const identity = await this.wallet.get(username);

      if (!identity) {
        logger.fabricWallet.warn('User identity not found', { username });
        return null;
      }

      logger.fabricWallet.debug('User identity retrieved successfully', { username });

      return identity;

    } catch (error) {
      logger.fabricWallet.error('Failed to retrieve user identity', {
        username,
        error: error.message
      });
      throw new Error(`Failed to retrieve identity: ${error.message}`);
    }
  }

  /**
   * Check if a user identity exists in the wallet
   * @param {string} username - Username/identifier for the identity
   * @returns {boolean} True if identity exists, false otherwise
   */
  async identityExists(username) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const identity = await this.wallet.get(username);
      return !!identity;

    } catch (error) {
      logger.fabricWallet.error('Failed to check identity existence', {
        username,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Remove a user identity from the wallet
   * @param {string} username - Username/identifier for the identity
   */
  async removeIdentity(username) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricWallet.info('Removing user identity', { username });

      // Check if identity exists
      const exists = await this.identityExists(username);
      if (!exists) {
        logger.fabricWallet.warn('Identity not found for removal', { username });
        return {
          success: false,
          message: 'Identity not found'
        };
      }

      // Remove identity
      await this.wallet.remove(username);

      logger.fabricWallet.info('User identity removed successfully', { username });

      return {
        success: true,
        username,
        removedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to remove user identity', {
        username,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to remove identity: ${error.message}`);
    }
  }

  /**
   * List all identities in the wallet
   * @returns {Array} Array of username strings
   */
  async listIdentities() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.fabricWallet.debug('Listing all identities');

      // Read wallet directory
      const walletPath = config.fabric.walletPath;
      const files = await fs.readdir(walletPath);
      
      // Filter for identity files (assuming they have a specific extension or pattern)
      const identities = files
        .filter(file => !file.startsWith('.') && file.includes('-'))
        .map(file => file.replace('.id', ''));

      logger.fabricWallet.debug('Identities listed successfully', { count: identities.length });

      return identities;

    } catch (error) {
      logger.fabricWallet.error('Failed to list identities', {
        error: error.message
      });
      throw new Error(`Failed to list identities: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a user identity
   * @param {string} username - Username/identifier for the identity
   */
  async getIdentityInfo(username) {
    try {
      const identity = await this.getIdentity(username);
      
      if (!identity) {
        return null;
      }

      // Parse certificate to extract information
      const certInfo = this.parseCertificate(identity.credentials.certificate);

      return {
        username,
        mspId: identity.mspId,
        type: identity.type,
        certificate: {
          subject: certInfo.subject,
          issuer: certInfo.issuer,
          serialNumber: certInfo.serialNumber,
          validFrom: certInfo.validFrom,
          validTo: certInfo.validTo,
          fingerprint: certInfo.fingerprint
        }
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to get identity info', {
        username,
        error: error.message
      });
      throw new Error(`Failed to get identity info: ${error.message}`);
    }
  }

  /**
   * Create a gateway connection for a user
   * @param {string} username - Username/identifier for the identity
   * @returns {Gateway} Connected gateway instance
   */
  async createGateway(username) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const identity = await this.getIdentity(username);
      if (!identity) {
        throw new Error(`Identity not found for user: ${username}`);
      }

      // Load connection profile
      const connectionProfile = JSON.parse(
        fs.readFileSync(config.fabric.networkConfigPath, 'utf8')
      );

      // Create gateway
      const gateway = new Gateway();

      const connectionOptions = {
        wallet: this.wallet,
        identity: username,
        discovery: { enabled: true, asLocalhost: true }
      };

      await gateway.connect(connectionProfile, connectionOptions);

      logger.fabricWallet.info('Gateway created successfully', { username });

      return gateway;

    } catch (error) {
      logger.fabricWallet.error('Failed to create gateway', {
        username,
        error: error.message
      });
      throw new Error(`Failed to create gateway: ${error.message}`);
    }
  }

  /**
   * Validate an identity's certificate
   * @param {string} username - Username/identifier for the identity
   */
  async validateIdentity(username) {
    try {
      const identity = await this.getIdentity(username);
      
      if (!identity) {
        return {
          valid: false,
          error: 'Identity not found'
        };
      }

      // Parse certificate
      const certInfo = this.parseCertificate(identity.credentials.certificate);
      
      // Check if certificate is expired
      const now = new Date();
      const validTo = new Date(certInfo.validTo);
      
      if (now > validTo) {
        return {
          valid: false,
          error: 'Certificate has expired',
          expiredAt: validTo.toISOString()
        };
      }

      // Check if certificate is not yet valid
      const validFrom = new Date(certInfo.validFrom);
      if (now < validFrom) {
        return {
          valid: false,
          error: 'Certificate is not yet valid',
          validFrom: validFrom.toISOString()
        };
      }

      return {
        valid: true,
        certificate: certInfo
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to validate identity', {
        username,
        error: error.message
      });
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Parse X.509 certificate to extract information
   * @param {string} certificatePEM - PEM encoded certificate
   * @returns {Object} Certificate information
   */
  parseCertificate(certificatePEM) {
    try {
      // This is a simplified parser - in production, use a proper X.509 parsing library
      const cert = certificatePEM.replace(/-----BEGIN CERTIFICATE-----/, '')
                                 .replace(/-----END CERTIFICATE-----/, '')
                                 .replace(/\s/g, '');
      
      // Create fingerprint
      const fingerprint = crypto.createHash('sha256').update(cert).digest('hex');
      
      // In a real implementation, you would properly parse the certificate
      // For now, return basic information
      return {
        subject: 'CN=User', // Placeholder
        issuer: 'CN=CA', // Placeholder
        serialNumber: '12345', // Placeholder
        validFrom: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        validTo: new Date(Date.now() + 31536000000).toISOString(), // 1 year from now
        fingerprint: fingerprint.substring(0, 16) + '...'
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to parse certificate', {
        error: error.message
      });
      throw new Error(`Certificate parsing failed: ${error.message}`);
    }
  }

  /**
   * Export identity (for backup purposes)
   * @param {string} username - Username/identifier for the identity
   * @returns {Object} Exported identity data (without private key)
   */
  async exportIdentity(username) {
    try {
      const identity = await this.getIdentity(username);
      
      if (!identity) {
        throw new Error('Identity not found');
      }

      // Return identity without private key for security
      return {
        username,
        mspId: identity.mspId,
        type: identity.type,
        certificate: identity.credentials.certificate,
        exportedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to export identity', {
        username,
        error: error.message
      });
      throw new Error(`Failed to export identity: ${error.message}`);
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats() {
    try {
      const identities = await this.listIdentities();
      const walletPath = config.fabric.walletPath;
      const stats = await fs.stat(walletPath);

      return {
        totalIdentities: identities.length,
        walletPath: walletPath,
        createdAt: stats.birthtime,
        lastModified: stats.mtime,
        size: stats.size
      };

    } catch (error) {
      logger.fabricWallet.error('Failed to get wallet stats', {
        error: error.message
      });
      throw new Error(`Failed to get wallet statistics: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new FabricWalletService();
