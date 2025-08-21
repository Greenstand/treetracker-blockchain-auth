const fabricCA = require('../services/fabricCA');
const fabricWallet = require('../services/fabricWallet');
const logger = require('../config/logger');
const config = require('../config/config');

class HealthController {
  /**
   * Basic health check endpoint
   */
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.env
      };

      res.status(200).json(health);

    } catch (error) {
      logger.api.error('Health check failed', { error: error.message });
      
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Detailed health check with service status
   */
  async detailedHealthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.env,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {}
      };

      // Check Fabric CA service
      try {
        const caHealth = await fabricCA.healthCheck();
        health.services.fabricCA = {
          status: caHealth.healthy ? 'healthy' : 'unhealthy',
          ...caHealth
        };
      } catch (error) {
        health.services.fabricCA = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Check Fabric Wallet service
      try {
        await fabricWallet.initialize();
        const walletStats = await fabricWallet.getWalletStats();
        health.services.fabricWallet = {
          status: 'healthy',
          ...walletStats
        };
      } catch (error) {
        health.services.fabricWallet = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Determine overall health
      const serviceStatuses = Object.values(health.services).map(service => service.status);
      const hasUnhealthyServices = serviceStatuses.includes('unhealthy');
      
      if (hasUnhealthyServices) {
        health.status = 'degraded';
      }

      health.responseTime = `${Date.now() - startTime}ms`;

      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 206 : 500;

      res.status(statusCode).json(health);

    } catch (error) {
      logger.api.error('Detailed health check failed', { 
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Readiness probe for Kubernetes/container orchestration
   */
  async readiness(req, res) {
    try {
      // Check if critical services are ready
      const checks = await Promise.allSettled([
        fabricCA.initialize(),
        fabricWallet.initialize()
      ]);

      const failedChecks = checks.filter(result => result.status === 'rejected');

      if (failedChecks.length > 0) {
        const errors = failedChecks.map(check => check.reason?.message || 'Unknown error');
        
        return res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          errors
        });
      }

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.api.error('Readiness check failed', { error: error.message });
      
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Liveness probe for Kubernetes/container orchestration
   */
  async liveness(req, res) {
    try {
      // Basic liveness check - just verify the process is running
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid
      });

    } catch (error) {
      logger.api.error('Liveness check failed', { error: error.message });
      
      res.status(500).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Get system metrics
   */
  async metrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          version: process.version,
          platform: process.platform,
          arch: process.arch
        },
        system: {
          loadAverage: require('os').loadavg(),
          totalMemory: require('os').totalmem(),
          freeMemory: require('os').freemem(),
          cpus: require('os').cpus().length
        }
      };

      // Add service-specific metrics
      try {
        const walletStats = await fabricWallet.getWalletStats();
        metrics.services = {
          fabricWallet: walletStats
        };
      } catch (error) {
        // Ignore wallet metrics errors
      }

      res.status(200).json(metrics);

    } catch (error) {
      logger.api.error('Metrics collection failed', { error: error.message });
      
      res.status(500).json({
        error: 'Failed to collect metrics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get service version information
   */
  async version(req, res) {
    try {
      const packageJson = require('../../package.json');
      
      const versionInfo = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        license: packageJson.license,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        environment: config.env
      };

      res.status(200).json(versionInfo);

    } catch (error) {
      logger.api.error('Version info collection failed', { error: error.message });
      
      res.status(500).json({
        error: 'Failed to get version information',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new HealthController();
