const express = require('express');
const router = express.Router();
const { extractToken, validateJwt, checkRole } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/profile', extractToken, validateJwt, authController.getProfile);
router.get('/admin', extractToken, validateJwt, checkRole(['admin']), (req, res) => {
    res.json({ 
        success: true, 
        message: 'Admin access granted' 
    });
});

module.exports = router;