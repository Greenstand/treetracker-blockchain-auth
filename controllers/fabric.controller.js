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
        const { userId } = req.body;
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
        const { userId } = req.body;
        const exists = await walletService.userExists(userId);

        res.status(200).json(exists);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to check user existence',
        });
    }
};

module.exports = {
    register,
    getIdentity,
    checkUserExists
}