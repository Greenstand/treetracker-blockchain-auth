import { Gateway, Wallets, X509Identity } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './index';
import { logger } from '../utils/logger';

export class FabricConfig {
  private static gateway: Gateway | null = null;
  private static caClient: FabricCAServices | null = null;

  /**
   * Build connection profile for Fabric network
   */
  static buildCCP(): any {
    const ccpPath = path.resolve(__dirname, '../../connection-profile.json');
    
    // If connection profile exists, use it
    if (fs.existsSync(ccpPath)) {
      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      return JSON.parse(ccpJSON);
    }

    // Otherwise, build it from environment variables
    return {
      name: config.fabric.networkName,
      version: '1.0.0',
      client: {
        organization: 'Greenstand',
        connection: {
          timeout: {
            peer: {
              endorser: '300',
            },
            orderer: '300',
          },
        },
      },
      channels: {
        [config.fabric.channelName]: {
          orderers: ['orderer.treetracker'],
          peers: {
            'peer0.greenstand.treetracker': {
              endorsingPeer: true,
              chaincodeQuery: true,
              ledgerQuery: true,
              eventSource: true,
            },
          },
        },
      },
      organizations: {
        Greenstand: {
          mspid: config.fabric.mspId,
          peers: ['peer0.greenstand.treetracker'],
          certificateAuthorities: [config.fabric.caName],
        },
      },
      orderers: {
        'orderer.treetracker': {
          url: `grpcs://${config.fabric.ordererEndpoint}`,
          tlsCACerts: {
            path: config.fabric.tlsCertPath,
          },
          grpcOptions: {
            'ssl-target-name-override': 'orderer.treetracker',
          },
        },
      },
      peers: {
        'peer0.greenstand.treetracker': {
          url: `grpcs://${config.fabric.peerEndpoint}`,
          tlsCACerts: {
            path: config.fabric.tlsCertPath,
          },
          grpcOptions: {
            'ssl-target-name-override': 'peer0.greenstand.treetracker',
          },
        },
      },
      certificateAuthorities: {
        [config.fabric.caName]: {
          url: config.fabric.caUrl,
          caName: config.fabric.caName,
          tlsCACerts: {
            path: config.fabric.tlsCertPath,
          },
          httpOptions: {
            verify: false,
          },
        },
      },
    };
  }

  /**
   * Build CA client
   */
  static buildCAClient(): FabricCAServices {
    if (this.caClient) {
      return this.caClient;
    }

    const ccp = this.buildCCP();
    const caInfo = ccp.certificateAuthorities[config.fabric.caName];

    let tlsCACerts: Buffer | undefined;
    if (config.fabric.tlsEnabled && config.fabric.tlsCertPath) {
      tlsCACerts = fs.readFileSync(config.fabric.tlsCertPath);
    }

    this.caClient = new FabricCAServices(
      caInfo.url,
      { trustedRoots: tlsCACerts || [], verify: false },
      caInfo.caName
    );

    logger.info('Built CA client successfully');
    return this.caClient;
  }

  /**
   * Enroll admin user
   */
  static async enrollAdmin(): Promise<void> {
    try {
      const caClient = this.buildCAClient();
      const wallet = await Wallets.newFileSystemWallet(config.wallet.path);

      // Check if admin already enrolled
      const identity = await wallet.get(config.fabric.adminUser);
      if (identity) {
        logger.info('Admin user already enrolled');
        return;
      }

      // Enroll admin
      const enrollment = await caClient.enroll({
        enrollmentID: config.fabric.adminUser,
        enrollmentSecret: config.fabric.adminPassword,
      });

      const x509Identity: X509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: config.fabric.mspId,
        type: 'X.509',
      };

      await wallet.put(config.fabric.adminUser, x509Identity);
      logger.info('Admin user enrolled successfully');
    } catch (error) {
      logger.error('Failed to enroll admin user:', error);
      throw error;
    }
  }

  /**
   * Register and enroll a new user
   */
  static async registerUser(
    userId: string,
    affiliation: string = 'org1.department1',
    role: string = 'planter'
  ): Promise<void> {
    try {
      const caClient = this.buildCAClient();
      const wallet = await Wallets.newFileSystemWallet(config.wallet.path);

      // Check if user already exists
      const userIdentity = await wallet.get(userId);
      if (userIdentity) {
        logger.info(`User ${userId} already registered`);
        return;
      }

      // Get admin identity
      const adminIdentity = await wallet.get(config.fabric.adminUser);
      if (!adminIdentity) {
        throw new Error('Admin user not enrolled. Run enrollAdmin first.');
      }

      // Build user object for authenticating with CA
      const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
      const adminUser = await provider.getUserContext(adminIdentity, config.fabric.adminUser);

      // Register the user
      const secret = await caClient.register(
        {
          affiliation,
          enrollmentID: userId,
          role: 'client',
          attrs: [
            { name: 'role', value: role, ecert: true },
          ],
        },
        adminUser
      );

      // Enroll the user
      const enrollment = await caClient.enroll({
        enrollmentID: userId,
        enrollmentSecret: secret,
      });

      const x509Identity: X509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: config.fabric.mspId,
        type: 'X.509',
      };

      await wallet.put(userId, x509Identity);
      logger.info(`User ${userId} registered and enrolled successfully`);
    } catch (error) {
      logger.error(`Failed to register user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get gateway connection
   */
  static async getGateway(userId: string): Promise<Gateway> {
    try {
      const wallet = await Wallets.newFileSystemWallet(config.wallet.path);
      const identity = await wallet.get(userId);

      if (!identity) {
        throw new Error(`User ${userId} not found in wallet`);
      }

      const gateway = new Gateway();
      const ccp = this.buildCCP();

      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });

      logger.info(`Gateway connected for user ${userId}`);
      return gateway;
    } catch (error) {
      logger.error(`Failed to connect gateway for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user exists in wallet
   */
  static async userExists(userId: string): Promise<boolean> {
    try {
      const wallet = await Wallets.newFileSystemWallet(config.wallet.path);
      const identity = await wallet.get(userId);
      return !!identity;
    } catch (error) {
      logger.error(`Error checking user existence:`, error);
      return false;
    }
  }

  /**
   * Initialize Fabric network
   */
  static async initialize(): Promise<void> {
    try {
      logger.info('Initializing Fabric network connection...');
      
      // Ensure wallet directory exists
      if (!fs.existsSync(config.wallet.path)) {
        fs.mkdirSync(config.wallet.path, { recursive: true });
      }

      // Enroll admin if not already enrolled
      await this.enrollAdmin();

      logger.info('Fabric network initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Fabric network:', error);
      throw error;
    }
  }
}

export default FabricConfig;
