"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const fabric_config_1 = require("./config/fabric.config");
const PORT = config_1.config.server.port;
/**
 * Start server
 */
async function startServer() {
    try {
        // Initialize Fabric network (skip in development if not available)
        if (config_1.config.server.env === 'production') {
            logger_1.logger.info('Initializing Hyperledger Fabric network...');
            await fabric_config_1.FabricConfig.initialize();
            logger_1.logger.info('Fabric network initialized successfully');
        }
        else {
            logger_1.logger.warn('Running in development mode - Fabric network initialization skipped');
            logger_1.logger.warn('Fabric endpoints will return mock data');
        }
        // Start Express server
        app_1.default.listen(PORT, () => {
            logger_1.logger.info(`TreeTracker Auth Service running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${config_1.config.server.env}`);
            logger_1.logger.info(`API Prefix: ${config_1.config.server.apiPrefix}`);
            logger_1.logger.info(`Keycloak URL: ${config_1.config.keycloak.url}`);
            logger_1.logger.info(`Fabric Network: ${config_1.config.fabric.networkName}`);
            logger_1.logger.info(`Server ready to accept connections`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
// Start the server
startServer();
//# sourceMappingURL=server.js.map