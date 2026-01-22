"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('region').trim().notEmpty().withMessage('Region is required'),
    (0, express_validator_1.body)('projectCode').optional().trim(),
]), auth_controller_1.default.register);
/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('username').trim().notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
]), auth_controller_1.default.login);
/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
]), auth_controller_1.default.refresh);
/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
]), auth_controller_1.default.logout);
/**
 * @route   GET /auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth_middleware_1.verifyToken, auth_controller_1.default.getProfile);
/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth_middleware_1.verifyToken, (0, validation_middleware_1.validate)([
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('phoneNumber').optional().trim(),
    (0, express_validator_1.body)('region').optional().trim(),
]), auth_controller_1.default.updateProfile);
/**
 * @route   POST /auth/fabric/enroll
 * @desc    Enroll user in Fabric network
 * @access  Private
 */
router.post('/fabric/enroll', auth_middleware_1.verifyToken, auth_controller_1.default.enrollFabric);
/**
 * @route   GET /auth/fabric/identity
 * @desc    Get Fabric identity status
 * @access  Private
 */
router.get('/fabric/identity', auth_middleware_1.verifyToken, auth_controller_1.default.getFabricIdentity);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map