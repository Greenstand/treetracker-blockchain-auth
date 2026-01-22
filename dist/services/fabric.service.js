"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FabricService = void 0;
const fabric_config_1 = require("../config/fabric.config");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class FabricService {
    /**
     * Enroll user in Fabric network
     */
    async enrollUser(userId, affiliation = 'org1.department1') {
        try {
            await fabric_config_1.FabricConfig.registerUser(userId, affiliation);
            logger_1.logger.info(`User ${userId} enrolled in Fabric network`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to enroll user ${userId}:`, error);
            throw new Error('Failed to enroll user in Fabric network');
        }
    }
    /**
     * Check if user is enrolled in Fabric
     */
    async isUserEnrolled(userId) {
        try {
            return await fabric_config_1.FabricConfig.userExists(userId);
        }
        catch (error) {
            logger_1.logger.error(`Error checking user enrollment:`, error);
            return false;
        }
    }
    /**
     * Get user's Fabric identity status
     */
    async getUserIdentityStatus(userId) {
        try {
            const enrolled = await this.isUserEnrolled(userId);
            return {
                enrolled,
                mspId: enrolled ? config_1.config.fabric.mspId : undefined,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting identity status:`, error);
            throw new Error('Failed to get identity status');
        }
    }
    /**
     * Submit transaction to chaincode
     */
    async submitTransaction(userId, functionName, ...args) {
        let gateway = null;
        try {
            // Check if user is enrolled
            const enrolled = await this.isUserEnrolled(userId);
            if (!enrolled) {
                throw new Error('User not enrolled in Fabric network');
            }
            // Connect to gateway
            gateway = await fabric_config_1.FabricConfig.getGateway(userId);
            // Get network and contract
            const network = await gateway.getNetwork(config_1.config.fabric.channelName);
            const contract = network.getContract(config_1.config.fabric.chaincodeName);
            // Submit transaction
            const result = await contract.submitTransaction(functionName, ...args);
            logger_1.logger.info(`Transaction ${functionName} submitted successfully by ${userId}`);
            return result.toString() ? JSON.parse(result.toString()) : null;
        }
        catch (error) {
            logger_1.logger.error(`Failed to submit transaction:`, error);
            throw new Error('Failed to submit transaction to Fabric network');
        }
        finally {
            if (gateway) {
                gateway.disconnect();
            }
        }
    }
    /**
     * Evaluate transaction (query)
     */
    async evaluateTransaction(userId, functionName, ...args) {
        let gateway = null;
        try {
            // Check if user is enrolled
            const enrolled = await this.isUserEnrolled(userId);
            if (!enrolled) {
                throw new Error('User not enrolled in Fabric network');
            }
            // Connect to gateway
            gateway = await fabric_config_1.FabricConfig.getGateway(userId);
            // Get network and contract
            const network = await gateway.getNetwork(config_1.config.fabric.channelName);
            const contract = network.getContract(config_1.config.fabric.chaincodeName);
            // Evaluate transaction
            const result = await contract.evaluateTransaction(functionName, ...args);
            logger_1.logger.info(`Transaction ${functionName} evaluated successfully by ${userId}`);
            return result.toString() ? JSON.parse(result.toString()) : null;
        }
        catch (error) {
            logger_1.logger.error(`Failed to evaluate transaction:`, error);
            throw new Error('Failed to evaluate transaction on Fabric network');
        }
        finally {
            if (gateway) {
                gateway.disconnect();
            }
        }
    }
    /**
     * Create a tree capture on blockchain
     */
    async createCapture(userId, captureData) {
        try {
            return await this.submitTransaction(userId, 'createCapture', captureData.captureId, captureData.planterId, captureData.photoHash, captureData.latitude, captureData.longitude, captureData.timestamp, captureData.species || '', captureData.notes || '');
        }
        catch (error) {
            logger_1.logger.error('Failed to create capture on blockchain:', error);
            throw error;
        }
    }
    /**
     * Query capture by ID
     */
    async queryCapture(userId, captureId) {
        try {
            return await this.evaluateTransaction(userId, 'queryCapture', captureId);
        }
        catch (error) {
            logger_1.logger.error('Failed to query capture:', error);
            throw error;
        }
    }
    /**
     * Query captures by planter
     */
    async queryCapturesByPlanter(userId, planterId) {
        try {
            return await this.evaluateTransaction(userId, 'queryCapturesByPlanter', planterId);
        }
        catch (error) {
            logger_1.logger.error('Failed to query captures by planter:', error);
            throw error;
        }
    }
    /**
     * Query token by ID
     */
    async queryToken(userId, tokenId) {
        try {
            return await this.evaluateTransaction(userId, 'queryToken', tokenId);
        }
        catch (error) {
            logger_1.logger.error('Failed to query token:', error);
            throw error;
        }
    }
    /**
     * Query tokens by owner
     */
    async queryTokensByOwner(userId, planterId) {
        try {
            return await this.evaluateTransaction(userId, 'queryTokensByOwner', planterId);
        }
        catch (error) {
            logger_1.logger.error('Failed to query tokens by owner:', error);
            throw error;
        }
    }
    /**
     * Verify capture (admin only)
     */
    async verifyCapture(userId, captureId, verifierId, approved, reason) {
        try {
            return await this.submitTransaction(userId, 'verifyCapture', captureId, verifierId, approved.toString(), reason || '');
        }
        catch (error) {
            logger_1.logger.error('Failed to verify capture:', error);
            throw error;
        }
    }
    /**
     * Update token state
     */
    async updateTokenState(userId, tokenId, newState, additionalValue) {
        try {
            return await this.submitTransaction(userId, 'updateTokenState', tokenId, newState, additionalValue || '0');
        }
        catch (error) {
            logger_1.logger.error('Failed to update token state:', error);
            throw error;
        }
    }
    /**
     * Transfer token
     */
    async transferToken(userId, tokenId, fromUserId, toUserId, value) {
        try {
            return await this.submitTransaction(userId, 'transferToken', tokenId, fromUserId, toUserId, value);
        }
        catch (error) {
            logger_1.logger.error('Failed to transfer token:', error);
            throw error;
        }
    }
}
exports.FabricService = FabricService;
exports.default = new FabricService();
//# sourceMappingURL=fabric.service.js.map