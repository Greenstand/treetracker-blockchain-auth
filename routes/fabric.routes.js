const express = require('express');
const router = express.Router();
const fabricController = require('../controllers/fabric.controller');
const { extractToken, validateJwt } = require('../middleware/auth.middleware');

router.get('/exists/:userId', fabricController.checkUserExists);
router.post('/register', extractToken, validateJwt, fabricController.register);
router.get('/identity/:userId', fabricController.getIdentity);

router.post('/enroll-admin', fabricController.enrollAdmin);
router.post('/register-user', fabricController.registerUser);
router.post('/revoke-user', extractToken, validateJwt, fabricController.revokeUser);
router.get('/identities', extractToken, validateJwt, fabricController.listIdentities);
router.get('/export-identity/:userId', extractToken, validateJwt, fabricController.exportIdentity);
router.get('/health', fabricController.healthCheck);

module.exports = router;
