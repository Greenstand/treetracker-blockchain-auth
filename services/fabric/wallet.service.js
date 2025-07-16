const { Wallets, X509WalletMixin } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { error } = require('console');

class WalletService{
    constructor() {
        this.walletPath = process.env.FABRIC_WALLET_PATH;
        this.mspId = process.env.FABRIC_MSP_ID || 'Org1MSP';
        this.wallet = null;
        this.initialized = false;
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
                mspId: mspId || this.mspId,
                type: 'X.509'
            };

            await this.wallet.put(userId, identity);
            return { success: true, userId };
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async registerAndEnrollUser({ userId, secret, caUrl, affiliation = 'org1.department1' }) {
        await this.ensureInitialized();
        try {
            if (await this.userExists(userId)) {
                console.log(`User ${userId} already exists in wallet`);
                return { success: true, userId, message: 'User already exists' };
            }
            
            const ca = new FabricCAServices(caUrl, null, '', { 
                httpOptions: { 
                    verify: false  
                } 
            }, 'ca-org1');
            
            const adminExists = await this.userExists('admin');
            if (!adminExists) {
                throw new Error('Admin user not found. Please enroll admin first');
            }
            
            const adminIdentity = await this.wallet.get('admin');
            const provider = this.wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');
            
            const registerRequest = {
                enrollmentID: userId,
                enrollmentSecret: secret,
                affiliation: affiliation,
                role: 'client'
            };
            
            const enrollmentSecret = await ca.register(registerRequest, adminUser);
            console.log(`Successfully registered user ${userId}`);
            
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: enrollmentSecret
            });
            
            const identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };
            
            await this.wallet.put(userId, identity);
            console.log(`Successfully enrolled user ${userId} and imported into wallet`);
            
            return {
                success: true,
                userId,
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes()
            };
        } catch (error) {
            console.error(`Failed to register/enroll user ${userId}:`, error);
            throw error;
        }
    }

    async enrollAdmin({ userId = 'admin', secret, caUrl }) {
        await this.ensureInitialized();

        try {
            if (await this.userExists(userId)) {
                console.log(`Admin ${userId} already enrolled`);
                return { success: true, userId, message: 'Admin already enrolled' };
            }

            const ca = new FabricCAServices(caUrl, null, '', { 
                httpOptions: { 
                    verify: false
                } 
            }, 'ca-org1');

            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            const identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await this.wallet.put(userId, identity);
            console.log(`Successfully enrolled admin ${userId} and imported into wallet`);

            return {
                success: true,
                userId,
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes()
            };
        } catch (error) {
            console.error(`Failed to enroll admin ${userId}:`, error);
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
