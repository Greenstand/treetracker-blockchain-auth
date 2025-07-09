const walletService = require('../services/fabric/wallet.service');

const checkFabricWallet = async (req, res, next) => {
    try {
        // check user authenticated
        if (!req.user || !req.user.sub) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.sub;
        const userExists = await walletService.userExists(userId);
        
        if (!userExists) {
            res.status(404).json({
                success: false,
                code: 'WALLET_IDENTITY_NOT_FOUND',
                message: 'User not found in Fabric wallet'
            });
        }

        req.fabricIdentity = await walletService.getIdentity(userId);
        next();
    } catch (error) {
        console.error('Error checking fabric wallet:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check fabric wallet'
        });
    }
};

module.exports = checkFabricWallet;