const express = require('express');
const router = express.Router();
const fabricController = require('../controllers/fabric.controller');
const { extractToken, validateJwt } = require('../middleware/auth.middleware');

router.get('/exists/:userId', fabricController.checkUserExists);
router.post('/register', extractToken, validateJwt, fabricController.register);
router.get('/identity/:userId', extractToken, validateJwt, fabricController.getIdentity);

module.exports = router;
