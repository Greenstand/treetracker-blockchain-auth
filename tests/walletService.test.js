require('dotenv').config();
const walletService = require('../services/fabric/wallet.service');
const path = require('path');

async function testWalletService() {
    try {
        
        await walletService.initialize();
        console.log('Wallet service initialized');
        
        const adminEnrollResult = await walletService.enrollAdmin({
            userId: 'admin',
            secret: 'adminpw',
            caUrl: 'http://localhost:7054'
        });
        console.log('Admin enrolled:', adminEnrollResult.userId);
        
        const testUser = 'testuser1';
        const testSecret = 'testuser1pw';
        
        const userResult = await walletService.registerAndEnrollUser({
            userId: testUser,
            secret: testSecret,
            caUrl: 'http://localhost:7054',
            affiliation: 'org1.department1'
        });
        console.log('User registered and enrolled:', userResult.userId);
        
        const userExists = await walletService.userExists(testUser);
        console.log(`User ${testUser} exists:`, userExists);
        
        const userIdentity = await walletService.getIdentity(testUser);
        console.log('User identity retrieved:', {
            userId: testUser,
            certificate: userIdentity.credentials.certificate.substring(0, 50) + '...'
        });
        
        console.log('\nAll tests passed successfully!');
        
    } catch (error) {
        console.error(' Test failed:', error);
        process.exit(1);
    }
}

testWalletService();