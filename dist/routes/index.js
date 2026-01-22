"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'TreeTracker Auth Service is running',
        timestamp: new Date().toISOString(),
    });
});
// Auth routes
router.use('/auth', auth_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map