const walletService = require('../services/fabric/wallet.service');

const register = async (req, res) => {
    try {
        const { userId, certificate, privateKey, mspId } = req.body;

        if (!userId || !certificate || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, certificate and privateKey are required'
            });
        }

        const result = await walletService.registerUser({
            userId,
            certificate,
            privateKey,
            mspId
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register user'
        });
    }
};

const getIdentity = async (req, res) => {
    try {
        const { userId } = req.params;
        const identity = await walletService.getIdentity(userId);

        if (!identity) {
            return res.status(404).json({
                success: false,
                message: 'Identity not found'
            });
        }

        res.status(200).json(identity);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get identity'
        });
    }
};

const checkUserExists = async (req, res) => {
    try {
        const { userId } = req.params;
        const exists = await walletService.userExists(userId);

        res.status(200).json(exists);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to check user existence',
        });
    }
};

const enrollAdmin = async (req, res) => {
    try {
        const { userId, secret, caUrl } = req.body;
        const result = await walletService.enrollAdmin({ userId, secret, caUrl });
        res.status(201).json(result);
    } catch (error) {
        console.error('Enroll admin error:', error);
        res.status(500).json({ error: error.message });
    }
};

const registerUser = async (req, res) => {
    try {
        const { userId, secret, affiliation, role } = req.body;
        const result = await walletService.registerAndEnrollUser({
            userId,
            secret,
            caUrl: process.env.FABRIC_CA_URL,
            affiliation,
            role
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Register user error:', error);
        res.status(500).json({ error: error.message });
    }
};

const revokeUser = async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
};

const listIdentities = async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
};

const exportIdentity = async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
};

const healthCheck = async (req, res) => {
    res.json({ status: 'UP' });
};

module.exports = {
    register,
    getIdentity,
    checkUserExists,
    enrollAdmin,
    registerUser,
    revokeUser,
    listIdentities,
    exportIdentity,
    healthCheck
}