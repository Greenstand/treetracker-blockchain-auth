"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FabricConfig = void 0;
const fabric_network_1 = require("fabric-network");
const fabric_ca_client_1 = __importDefault(require("fabric-ca-client"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("./index");
const logger_1 = require("../utils/logger");
class FabricConfig {
    /**
     * Build connection profile for Fabric network
     */
    static buildCCP() {
        const ccpPath = path.resolve(__dirname, '../../connection-profile.json');
        // If connection profile exists, use it
        if (fs.existsSync(ccpPath)) {
            const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
            return JSON.parse(ccpJSON);
        }
        // Otherwise, build it from environment variables
        return {
            name: index_1.config.fabric.networkName,
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
                [index_1.config.fabric.channelName]: {
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
                    mspid: index_1.config.fabric.mspId,
                    peers: ['peer0.greenstand.treetracker'],
                    certificateAuthorities: [index_1.config.fabric.caName],
                },
            },
            orderers: {
                'orderer.treetracker': {
                    url: `grpcs://${index_1.config.fabric.ordererEndpoint}`,
                    tlsCACerts: {
                        path: index_1.config.fabric.tlsCertPath,
                    },
                    grpcOptions: {
                        'ssl-target-name-override': 'orderer.treetracker',
                    },
                },
            },
            peers: {
                'peer0.greenstand.treetracker': {
                    url: `grpcs://${index_1.config.fabric.peerEndpoint}`,
                    tlsCACerts: {
                        path: index_1.config.fabric.tlsCertPath,
                    },
                    grpcOptions: {
                        'ssl-target-name-override': 'peer0.greenstand.treetracker',
                    },
                },
            },
            certificateAuthorities: {
                [index_1.config.fabric.caName]: {
                    url: index_1.config.fabric.caUrl,
                    caName: index_1.config.fabric.caName,
                    tlsCACerts: {
                        path: index_1.config.fabric.tlsCertPath,
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
    static buildCAClient() {
        if (this.caClient) {
            return this.caClient;
        }
        const ccp = this.buildCCP();
        const caInfo = ccp.certificateAuthorities[index_1.config.fabric.caName];
        let tlsCACerts;
        if (index_1.config.fabric.tlsEnabled && index_1.config.fabric.tlsCertPath) {
            tlsCACerts = fs.readFileSync(index_1.config.fabric.tlsCertPath);
        }
        this.caClient = new fabric_ca_client_1.default(caInfo.url, { trustedRoots: tlsCACerts || [], verify: false }, caInfo.caName);
        logger_1.logger.info('Built CA client successfully');
        return this.caClient;
    }
    /**
     * Enroll admin user
     */
    static async enrollAdmin() {
        try {
            const caClient = this.buildCAClient();
            const wallet = await fabric_network_1.Wallets.newFileSystemWallet(index_1.config.wallet.path);
            // Check if admin already enrolled
            const identity = await wallet.get(index_1.config.fabric.adminUser);
            if (identity) {
                logger_1.logger.info('Admin user already enrolled');
                return;
            }
            // Enroll admin
            const enrollment = await caClient.enroll({
                enrollmentID: index_1.config.fabric.adminUser,
                enrollmentSecret: index_1.config.fabric.adminPassword,
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: index_1.config.fabric.mspId,
                type: 'X.509',
            };
            await wallet.put(index_1.config.fabric.adminUser, x509Identity);
            logger_1.logger.info('Admin user enrolled successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to enroll admin user:', error);
            throw error;
        }
    }
    /**
     * Register and enroll a new user
     */
    static async registerUser(userId, affiliation = 'org1.department1') {
        try {
            const caClient = this.buildCAClient();
            const wallet = await fabric_network_1.Wallets.newFileSystemWallet(index_1.config.wallet.path);
            // Check if user already exists
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                logger_1.logger.info(`User ${userId} already registered`);
                return;
            }
            // Get admin identity
            const adminIdentity = await wallet.get(index_1.config.fabric.adminUser);
            if (!adminIdentity) {
                throw new Error('Admin user not enrolled. Run enrollAdmin first.');
            }
            // Build user object for authenticating with CA
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, index_1.config.fabric.adminUser);
            // Register the user
            const secret = await caClient.register({
                affiliation,
                enrollmentID: userId,
                role: 'client',
                attrs: [
                    { name: 'role', value: 'planter', ecert: true },
                ],
            }, adminUser);
            // Enroll the user
            const enrollment = await caClient.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret,
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: index_1.config.fabric.mspId,
                type: 'X.509',
            };
            await wallet.put(userId, x509Identity);
            logger_1.logger.info(`User ${userId} registered and enrolled successfully`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to register user ${userId}:`, error);
            throw error;
        }
    }
    /**
     * Get gateway connection
     */
    static async getGateway(userId) {
        try {
            const wallet = await fabric_network_1.Wallets.newFileSystemWallet(index_1.config.wallet.path);
            const identity = await wallet.get(userId);
            if (!identity) {
                throw new Error(`User ${userId} not found in wallet`);
            }
            const gateway = new fabric_network_1.Gateway();
            const ccp = this.buildCCP();
            await gateway.connect(ccp, {
                wallet,
                identity: userId,
                discovery: { enabled: true, asLocalhost: false },
            });
            logger_1.logger.info(`Gateway connected for user ${userId}`);
            return gateway;
        }
        catch (error) {
            logger_1.logger.error(`Failed to connect gateway for user ${userId}:`, error);
            throw error;
        }
    }
    /**
     * Check if user exists in wallet
     */
    static async userExists(userId) {
        try {
            const wallet = await fabric_network_1.Wallets.newFileSystemWallet(index_1.config.wallet.path);
            const identity = await wallet.get(userId);
            return !!identity;
        }
        catch (error) {
            logger_1.logger.error(`Error checking user existence:`, error);
            return false;
        }
    }
    /**
     * Initialize Fabric network
     */
    static async initialize() {
        try {
            logger_1.logger.info('Initializing Fabric network connection...');
            // Ensure wallet directory exists
            if (!fs.existsSync(index_1.config.wallet.path)) {
                fs.mkdirSync(index_1.config.wallet.path, { recursive: true });
            }
            // Enroll admin if not already enrolled
            await this.enrollAdmin();
            logger_1.logger.info('Fabric network initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Fabric network:', error);
            throw error;
        }
    }
}
exports.FabricConfig = FabricConfig;
FabricConfig.gateway = null;
FabricConfig.caClient = null;
exports.default = FabricConfig;
//# sourceMappingURL=fabric.config.js.map