const express = require('express');
const cors = require('cors');
const path = require('path');

// Import configuration and logger
const config = require('./config/config');
const logger = require('./config/logger');

// Import middleware
const { 
  generalRateLimit, 
  helmetConfig, 
  sanitizeRequest, 
  limitRequestSize, 
  securityHeaders 
} = require('./middleware/security');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const identityRoutes = require('./routes/identity');
const healthRoutes = require('./routes/health');

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (config.env === 'development') {
      return callback(null, true);
    }
    
    // In production, you should configure allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-frontend-domain.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request processing middleware
app.use(limitRequestSize);
app.use(sanitizeRequest);
app.use(generalRateLimit);

// Request logging middleware
app.use(logger.logRequest);

// Health check routes (no authentication required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/identity', identityRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Backend Bridge',
    description: 'A secure linking layer between Keycloak and Hyperledger Fabric',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      identity: '/api/identity',
      documentation: '/docs' // Future implementation
    }
  });
});

// API documentation endpoint placeholder
app.get('/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    endpoints: {
      identity: {
        'POST /api/identity/register': 'Register a new user with Fabric CA',
        'POST /api/identity/enroll': 'Enroll a registered user',
        'POST /api/identity/register-and-enroll': 'Register and enroll user in one step',
        'GET /api/identity/me': 'Get current user\'s identity information',
        'GET /api/identity/exists': 'Check if user has a blockchain identity',
        'GET /api/identity/validate': 'Validate user\'s blockchain identity',
        'POST /api/identity/revoke': 'Revoke user\'s blockchain identity',
        'GET /api/identity/export': 'Export user\'s identity (without private key)',
        'GET /api/identity/ca-info': 'Get user\'s Fabric CA information'
      },
      health: {
        'GET /health': 'Basic health check',
        'GET /health/detailed': 'Detailed health check with service status',
        'GET /health/ready': 'Readiness probe',
        'GET /health/live': 'Liveness probe',
        'GET /health/metrics': 'System metrics',
        'GET /health/version': 'Service version information'
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <your-jwt-token>',
      description: 'Obtain JWT token from Keycloak authentication server'
    }
  });
});

// Handle undefined routes
app.all('*', notFoundHandler);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize services
    logger.info('Starting Backend Bridge application', {
      environment: config.env,
      port: config.port,
      nodeVersion: process.version
    });

    // Start server
    const server = app.listen(config.port, () => {
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.env,
        pid: process.pid
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = app;
