"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    // Server Configuration
    server: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        apiPrefix: process.env.API_PREFIX || '/api/v1',
    },
    // Keycloak Configuration
    keycloak: {
        url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.KEYCLOAK_REALM || 'treetracker',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'treetracker-auth',
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
        adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
    // Hyperledger Fabric Configuration
    fabric: {
        networkName: process.env.FABRIC_NETWORK_NAME || 'treetracker-network',
        channelName: process.env.FABRIC_CHANNEL_NAME || 'treetracker-channel',
        chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'treetracker',
        mspId: process.env.FABRIC_MSP_ID || 'GreenstandMSP',
        peerEndpoint: process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051',
        ordererEndpoint: process.env.FABRIC_ORDERER_ENDPOINT || 'localhost:7050',
        caUrl: process.env.FABRIC_CA_URL || 'https://localhost:7054',
        caName: process.env.FABRIC_CA_NAME || 'ca-greenstand',
        adminUser: process.env.FABRIC_ADMIN_USER || 'admin',
        adminPassword: process.env.FABRIC_ADMIN_PASSWORD || 'adminpw',
        tlsEnabled: process.env.FABRIC_TLS_ENABLED === 'true',
        tlsCertPath: process.env.FABRIC_TLS_CERT_PATH || '',
        tlsKeyPath: process.env.FABRIC_TLS_KEY_PATH || '',
    },
    // Wallet Configuration
    wallet: {
        path: process.env.WALLET_PATH || path_1.default.join(__dirname, '../../wallet'),
        type: process.env.WALLET_TYPE || 'FileSystemWallet',
    },
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
        credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
    // Session Configuration
    session: {
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    // Monitoring
    monitoring: {
        enabled: process.env.ENABLE_METRICS === 'true',
        port: parseInt(process.env.METRICS_PORT || '9090', 10),
    },
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map