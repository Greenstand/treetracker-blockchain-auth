const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');
const { optionalAuth } = require('../middleware/auth');
const { healthCheckValidation } = require('../middleware/validation');

/**
 * @route GET /health
 * @desc Basic health check endpoint
 * @access Public
 */
router.get('/', healthController.healthCheck);

/**
 * @route GET /health/detailed
 * @desc Detailed health check with service status
 * @access Public
 */
router.get('/detailed', 
  healthCheckValidation,
  healthController.detailedHealthCheck
);

/**
 * @route GET /health/ready
 * @desc Readiness probe for Kubernetes/container orchestration
 * @access Public
 */
router.get('/ready', healthController.readiness);

/**
 * @route GET /health/live
 * @desc Liveness probe for Kubernetes/container orchestration
 * @access Public
 */
router.get('/live', healthController.liveness);

/**
 * @route GET /health/metrics
 * @desc Get system metrics
 * @access Public (but could be restricted in production)
 */
router.get('/metrics', healthController.metrics);

/**
 * @route GET /health/version
 * @desc Get service version information
 * @access Public
 */
router.get('/version', healthController.version);

module.exports = router;
