import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate([
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('region').trim().notEmpty().withMessage('Region is required'),
    body('projectCode').optional().trim(),
  ]),
  authController.register
);

/**
 * @route   POST /auth/admin/register
 * @desc    Register a new admin user
 * @access  Public (secret protected)
 */
router.post(
  '/admin/register',
  validate([
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('region').trim().notEmpty().withMessage('Region is required'),
    body('projectCode').optional().trim(),
    body('adminSecret').trim().notEmpty().withMessage('Admin secret is required'),
  ]),
  authController.registerAdmin
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate([
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

/**
 * @route   POST /auth/admin/login
 * @desc    Login admin user
 * @access  Public
 */
router.post(
  '/admin/login',
  validate([
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.loginAdmin
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.refresh
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post(
  '/logout',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.logout
);

/**
 * @route   GET /auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  verifyToken,
  validate([
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('phoneNumber').optional().trim(),
    body('region').optional().trim(),
  ]),
  authController.updateProfile
);

/**
 * @route   GET /auth/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/settings', verifyToken, authController.getSettings);

/**
 * @route   PUT /auth/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put(
  '/settings',
  verifyToken,
  validate([
    body('notification').optional().isObject(),
    body('notification.email').optional().isBoolean(),
    body('notification.sms').optional().isBoolean(),
    body('notification.weeklySummary').optional().isBoolean(),
    body('privacy').optional().isObject(),
    body('privacy.shareLocation').optional().isBoolean(),
    body('privacy.publicProfile').optional().isBoolean(),
    body('preferences').optional().isObject(),
    body('preferences.units').optional().isIn(['metric', 'imperial']),
    body('preferences.mapStyle').optional().isIn(['terrain', 'satellite']),
    body('preferences.language').optional().isString(),
    body('preferences.timezone').optional().isString(),
    body('preferences.darkMode').optional().isBoolean(),
  ]),
  authController.updateSettings
);

/**
 * @route   POST /auth/fabric/enroll
 * @desc    Enroll user in Fabric network
 * @access  Private
 */
router.post('/fabric/enroll', verifyToken, authController.enrollFabric);

/**
 * @route   GET /auth/fabric/identity
 * @desc    Get Fabric identity status
 * @access  Private
 */
router.get('/fabric/identity', verifyToken, authController.getFabricIdentity);

export default router;
