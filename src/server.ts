import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { FabricConfig } from './config/fabric.config';

const PORT = config.server.port;

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize Fabric network (skip in development if not available)
    if (config.server.env === 'production') {
      logger.info('Initializing Hyperledger Fabric network...');
      await FabricConfig.initialize();
      logger.info('Fabric network initialized successfully');
    } else {
      logger.warn('Running in development mode - Fabric network initialization skipped');
      logger.warn('Fabric endpoints will return mock data');
    }

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`TreeTracker Auth Service running on port ${PORT}`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`API Prefix: ${config.server.apiPrefix}`);
      logger.info(`Keycloak URL: ${config.keycloak.url}`);
      logger.info(`Fabric Network: ${config.fabric.networkName}`);
      logger.info(`Server ready to accept connections`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();