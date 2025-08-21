const dotenv = require('dotenv');
const Joi = require('joi');
const path = require('path');

// Load environment variables
dotenv.config();

// Configuration validation schema
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
    PORT: Joi.number().default(3000),
    
    // Keycloak Configuration
    KEYCLOAK_REALM_URL: Joi.string().required().description('Keycloak realm URL'),
    KEYCLOAK_CLIENT_ID: Joi.string().required().description('Keycloak client ID'),
    KEYCLOAK_CLIENT_SECRET: Joi.string().required().description('Keycloak client secret'),
    KEYCLOAK_JWKS_URI: Joi.string().required().description('Keycloak JWKS URI'),
    
    // Fabric CA Configuration
    FABRIC_CA_URL: Joi.string().required().description('Fabric CA URL'),
    FABRIC_CA_NAME: Joi.string().required().description('Fabric CA name'),
    FABRIC_CA_ADMIN_USER: Joi.string().required().description('Fabric CA admin username'),
    FABRIC_CA_ADMIN_PASSWORD: Joi.string().required().description('Fabric CA admin password'),
    FABRIC_CA_TLS_CERT_PATH: Joi.string().description('Path to Fabric CA TLS certificate'),
    
    // Fabric Network Configuration
    FABRIC_NETWORK_CONFIG_PATH: Joi.string().required().description('Path to Fabric network configuration'),
    FABRIC_WALLET_PATH: Joi.string().default('./wallet').description('Path to Fabric wallet directory'),
    FABRIC_CHANNEL_NAME: Joi.string().default('mychannel').description('Fabric channel name'),
    FABRIC_CHAINCODE_NAME: Joi.string().default('basic').description('Fabric chaincode name'),
    FABRIC_MSP_ID: Joi.string().required().description('Fabric MSP ID'),
    
    // Security Configuration
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    ENCRYPTION_KEY: Joi.string().length(32).required().description('32-character encryption key'),
    BCRYPT_ROUNDS: Joi.number().default(12).description('BCrypt salt rounds'),
    
    // Logging Configuration
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE_PATH: Joi.string().default('./logs/backend-bridge.log'),
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100)
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  
  keycloak: {
    realmUrl: envVars.KEYCLOAK_REALM_URL,
    clientId: envVars.KEYCLOAK_CLIENT_ID,
    clientSecret: envVars.KEYCLOAK_CLIENT_SECRET,
    jwksUri: envVars.KEYCLOAK_JWKS_URI
  },
  
  fabricCA: {
    url: envVars.FABRIC_CA_URL,
    name: envVars.FABRIC_CA_NAME,
    adminUser: envVars.FABRIC_CA_ADMIN_USER,
    adminPassword: envVars.FABRIC_CA_ADMIN_PASSWORD,
    tlsCertPath: envVars.FABRIC_CA_TLS_CERT_PATH
  },
  
  fabric: {
    networkConfigPath: envVars.FABRIC_NETWORK_CONFIG_PATH,
    walletPath: path.resolve(envVars.FABRIC_WALLET_PATH),
    channelName: envVars.FABRIC_CHANNEL_NAME,
    chaincodeName: envVars.FABRIC_CHAINCODE_NAME,
    mspId: envVars.FABRIC_MSP_ID
  },
  
  security: {
    jwtSecret: envVars.JWT_SECRET,
    encryptionKey: envVars.ENCRYPTION_KEY,
    bcryptRounds: envVars.BCRYPT_ROUNDS
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    filePath: envVars.LOG_FILE_PATH
  },
  
  rateLimiting: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
  }
};
