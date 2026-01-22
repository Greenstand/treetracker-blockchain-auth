"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../utils/logger");
/**
 * Validate request using express-validator
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));
        // Check for errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            logger_1.logger.warn('Validation failed:', errors.array());
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array(),
            });
            return;
        }
        next();
    };
};
exports.validate = validate;
/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=validation.middleware.js.map