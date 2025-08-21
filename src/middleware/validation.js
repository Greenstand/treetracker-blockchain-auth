const { body, param, query } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerUserValidation = [
  body('role')
    .optional()
    .isString()
    .isIn(['client', 'peer', 'admin', 'orderer'])
    .withMessage('Role must be one of: client, peer, admin, orderer'),
  
  body('affiliation')
    .optional()
    .isString()
    .isLength({ min: 0, max: 100 })
    .withMessage('Affiliation must be a string with maximum 100 characters'),
  
  body('attributes')
    .optional()
    .isArray()
    .withMessage('Attributes must be an array'),
  
  body('attributes.*.name')
    .if(body('attributes').exists())
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Attribute name must be a string between 1 and 50 characters'),
  
  body('attributes.*.value')
    .if(body('attributes').exists())
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Attribute value must be a string between 1 and 100 characters'),
  
  body('attributes.*.ecert')
    .if(body('attributes').exists())
    .optional()
    .isBoolean()
    .withMessage('Attribute ecert must be a boolean')
];

/**
 * Validation rules for user enrollment
 */
const enrollUserValidation = [
  body('enrollmentSecret')
    .isString()
    .isLength({ min: 8, max: 50 })
    .withMessage('Enrollment secret must be a string between 8 and 50 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Enrollment secret must contain only alphanumeric characters')
];

/**
 * Validation rules for user registration and enrollment in one step
 */
const registerAndEnrollValidation = [
  ...registerUserValidation
];

/**
 * Validation rules for identity revocation
 */
const revokeIdentityValidation = [
  body('reason')
    .optional()
    .isString()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be a string between 5 and 200 characters')
];

/**
 * Validation rules for username parameter
 */
const usernameParamValidation = [
  param('username')
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be a string between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain alphanumeric characters, underscores, and hyphens')
];

/**
 * Validation rules for pagination
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  
  query('sort')
    .optional()
    .isString()
    .isIn(['username', 'createdAt', 'updatedAt'])
    .withMessage('Sort field must be one of: username, createdAt, updatedAt'),
  
  query('order')
    .optional()
    .isString()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc')
];

/**
 * Common validation rules for search
 */
const searchValidation = [
  query('q')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be a string between 1 and 100 characters')
    .trim()
];

/**
 * Validation rules for health check parameters
 */
const healthCheckValidation = [
  query('detailed')
    .optional()
    .isBoolean()
    .withMessage('Detailed must be a boolean')
    .toBoolean()
];

module.exports = {
  registerUserValidation,
  enrollUserValidation,
  registerAndEnrollValidation,
  revokeIdentityValidation,
  usernameParamValidation,
  paginationValidation,
  searchValidation,
  healthCheckValidation
};
