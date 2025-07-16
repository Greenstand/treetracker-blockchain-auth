const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

class WalletService{
    constructor() {
        this.walletPath = process.env.FABRIC_WALLET_PATH;
        this.mspId = process.env.FABRIC_MSP_ID;
        this.wallet = null;
    }

    async initialize() {
        if(this.initialized) return;
        
        try {
            if (!fs.existsSync(this.walletPath)) {
                fs.mkdirSync(this.walletPath, { recursive: true });
            }

            this.wallet = await Wallets.newFileSystemWallet(this.walletPath);
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize wallet service', error);
            throw error;
        }
    }

    async userExists(userId) {
        await this.ensureInitialized();
        try {
            const identity = await this.wallet.get(userId);
            return !!identity;
        } catch (error) {
            console.error(`Error checking user ${userId}`, error);
            throw error;
        }
    }

    async getIdentity(userId) {
        await this.ensureInitialized();
        try {
            return await this.wallet.get(userId);
        } catch (error) {
            console.error(`Error getting identity for ${userId}:`, error);
            throw error;
        }
    }

    async registerUser(user) {
        await this.ensureInitialized();
        try {
            const { userId, certificate, privateKey, mspId } = user;

            const identity = {
                credentials: {
                    certificate,
                    privateKey
                },
                mspId: mspId || 'Org1MSP',
                type: 'X.509'
            };

            await this.wallet.put(userId, identity);
            return { success: true, userId };
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }
}

module.exports = new WalletService();
