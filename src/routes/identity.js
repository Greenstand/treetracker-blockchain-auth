const express = require('express');
const router = express.Router();

const identityController = require('../controllers/identityController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const {
  registerUserValidation,
  enrollUserValidation,
  registerAndEnrollValidation,
  revokeIdentityValidation
} = require('../middleware/validation');

/**
 * @route POST /api/identity/register
 * @desc Register a new user with Fabric CA
 * @access Private (requires valid JWT token)
 */
router.post('/register', 
  authenticateToken,
  registerUserValidation,
  identityController.registerUser
);

/**
 * @route POST /api/identity/enroll
 * @desc Enroll a registered user and create blockchain identity
 * @access Private (requires valid JWT token)
 */
router.post('/enroll',
  authenticateToken,
  enrollUserValidation,
  identityController.enrollUser
);

/**
 * @route POST /api/identity/register-and-enroll
 * @desc Register and enroll user in one step
 * @access Private (requires valid JWT token)
 */
router.post('/register-and-enroll',
  authenticateToken,
  registerAndEnrollValidation,
  identityController.registerAndEnroll
);

/**
 * @route GET /api/identity/me
 * @desc Get current user's blockchain identity information
 * @access Private (requires valid JWT token)
 */
router.get('/me',
  authenticateToken,
  identityController.getIdentity
);

/**
 * @route GET /api/identity/exists
 * @desc Check if current user has a blockchain identity
 * @access Private (requires valid JWT token)
 */
router.get('/exists',
  authenticateToken,
  identityController.checkIdentityExists
);

/**
 * @route GET /api/identity/validate
 * @desc Validate current user's blockchain identity
 * @access Private (requires valid JWT token)
 */
router.get('/validate',
  authenticateToken,
  identityController.validateIdentity
);

/**
 * @route POST /api/identity/revoke
 * @desc Revoke current user's blockchain identity
 * @access Private (requires valid JWT token)
 */
router.post('/revoke',
  authenticateToken,
  revokeIdentityValidation,
  identityController.revokeIdentity
);

/**
 * @route GET /api/identity/export
 * @desc Export current user's identity (without private key)
 * @access Private (requires valid JWT token)
 */
router.get('/export',
  authenticateToken,
  identityController.exportIdentity
);

/**
 * @route GET /api/identity/ca-info
 * @desc Get current user's Fabric CA information
 * @access Private (requires valid JWT token)
 */
router.get('/ca-info',
  authenticateToken,
  identityController.getCAUserInfo
);

module.exports = router;
