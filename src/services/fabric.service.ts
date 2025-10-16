import { Gateway, Contract, Network } from 'fabric-network';
import { FabricConfig } from '../config/fabric.config';
import { config } from '../config';
import { logger } from '../utils/logger';

export class FabricService {
  /**
   * Enroll user in Fabric network
   */
  async enrollUser(userId: string, affiliation: string = 'org1.department1'): Promise<void> {
    try {
      await FabricConfig.registerUser(userId, affiliation);
      logger.info(`User ${userId} enrolled in Fabric network`);
    } catch (error) {
      logger.error(`Failed to enroll user ${userId}:`, error);
      throw new Error('Failed to enroll user in Fabric network');
    }
  }

  /**
   * Check if user is enrolled in Fabric
   */
  async isUserEnrolled(userId: string): Promise<boolean> {
    try {
      return await FabricConfig.userExists(userId);
    } catch (error) {
      logger.error(`Error checking user enrollment:`, error);
      return false;
    }
  }

  /**
   * Get user's Fabric identity status
   */
  async getUserIdentityStatus(userId: string): Promise<{
    enrolled: boolean;
    mspId?: string;
  }> {
    try {
      const enrolled = await this.isUserEnrolled(userId);
      
      return {
        enrolled,
        mspId: enrolled ? config.fabric.mspId : undefined,
      };
    } catch (error) {
      logger.error(`Error getting identity status:`, error);
      throw new Error('Failed to get identity status');
    }
  }

  /**
   * Submit transaction to chaincode
   */
  async submitTransaction(
    userId: string,
    functionName: string,
    ...args: string[]
  ): Promise<any> {
    let gateway: Gateway | null = null;

    try {
      // Check if user is enrolled
      const enrolled = await this.isUserEnrolled(userId);
      if (!enrolled) {
        throw new Error('User not enrolled in Fabric network');
      }

      // Connect to gateway
      gateway = await FabricConfig.getGateway(userId);

      // Get network and contract
      const network: Network = await gateway.getNetwork(config.fabric.channelName);
      const contract: Contract = network.getContract(config.fabric.chaincodeName);

      // Submit transaction
      const result = await contract.submitTransaction(functionName, ...args);
      
      logger.info(`Transaction ${functionName} submitted successfully by ${userId}`);
      
      return result.toString() ? JSON.parse(result.toString()) : null;
    } catch (error) {
      logger.error(`Failed to submit transaction:`, error);
      throw new Error('Failed to submit transaction to Fabric network');
    } finally {
      if (gateway) {
        gateway.disconnect();
      }
    }
  }

  /**
   * Evaluate transaction (query)
   */
  async evaluateTransaction(
    userId: string,
    functionName: string,
    ...args: string[]
  ): Promise<any> {
    let gateway: Gateway | null = null;

    try {
      // Check if user is enrolled
      const enrolled = await this.isUserEnrolled(userId);
      if (!enrolled) {
        throw new Error('User not enrolled in Fabric network');
      }

      // Connect to gateway
      gateway = await FabricConfig.getGateway(userId);

      // Get network and contract
      const network: Network = await gateway.getNetwork(config.fabric.channelName);
      const contract: Contract = network.getContract(config.fabric.chaincodeName);

      // Evaluate transaction
      const result = await contract.evaluateTransaction(functionName, ...args);
      
      logger.info(`Transaction ${functionName} evaluated successfully by ${userId}`);
      
      return result.toString() ? JSON.parse(result.toString()) : null;
    } catch (error) {
      logger.error(`Failed to evaluate transaction:`, error);
      throw new Error('Failed to evaluate transaction on Fabric network');
    } finally {
      if (gateway) {
        gateway.disconnect();
      }
    }
  }

  /**
   * Create a tree capture on blockchain
   */
  async createCapture(
    userId: string,
    captureData: {
      captureId: string;
      planterId: string;
      photoHash: string;
      latitude: string;
      longitude: string;
      timestamp: string;
      species?: string;
      notes?: string;
    }
  ): Promise<any> {
    try {
      return await this.submitTransaction(
        userId,
        'createCapture',
        captureData.captureId,
        captureData.planterId,
        captureData.photoHash,
        captureData.latitude,
        captureData.longitude,
        captureData.timestamp,
        captureData.species || '',
        captureData.notes || ''
      );
    } catch (error) {
      logger.error('Failed to create capture on blockchain:', error);
      throw error;
    }
  }

  /**
   * Query capture by ID
   */
  async queryCapture(userId: string, captureId: string): Promise<any> {
    try {
      return await this.evaluateTransaction(userId, 'queryCapture', captureId);
    } catch (error) {
      logger.error('Failed to query capture:', error);
      throw error;
    }
  }

  /**
   * Query captures by planter
   */
  async queryCapturesByPlanter(userId: string, planterId: string): Promise<any> {
    try {
      return await this.evaluateTransaction(userId, 'queryCapturesByPlanter', planterId);
    } catch (error) {
      logger.error('Failed to query captures by planter:', error);
      throw error;
    }
  }

  /**
   * Query token by ID
   */
  async queryToken(userId: string, tokenId: string): Promise<any> {
    try {
      return await this.evaluateTransaction(userId, 'queryToken', tokenId);
    } catch (error) {
      logger.error('Failed to query token:', error);
      throw error;
    }
  }

  /**
   * Query tokens by owner
   */
  async queryTokensByOwner(userId: string, planterId: string): Promise<any> {
    try {
      return await this.evaluateTransaction(userId, 'queryTokensByOwner', planterId);
    } catch (error) {
      logger.error('Failed to query tokens by owner:', error);
      throw error;
    }
  }

  /**
   * Verify capture (admin only)
   */
  async verifyCapture(
    userId: string,
    captureId: string,
    verifierId: string,
    approved: boolean,
    reason?: string
  ): Promise<any> {
    try {
      return await this.submitTransaction(
        userId,
        'verifyCapture',
        captureId,
        verifierId,
        approved.toString(),
        reason || ''
      );
    } catch (error) {
      logger.error('Failed to verify capture:', error);
      throw error;
    }
  }

  /**
   * Update token state
   */
  async updateTokenState(
    userId: string,
    tokenId: string,
    newState: string,
    additionalValue?: string
  ): Promise<any> {
    try {
      return await this.submitTransaction(
        userId,
        'updateTokenState',
        tokenId,
        newState,
        additionalValue || '0'
      );
    } catch (error) {
      logger.error('Failed to update token state:', error);
      throw error;
    }
  }

  /**
   * Transfer token
   */
  async transferToken(
    userId: string,
    tokenId: string,
    fromUserId: string,
    toUserId: string,
    value: string
  ): Promise<any> {
    try {
      return await this.submitTransaction(
        userId,
        'transferToken',
        tokenId,
        fromUserId,
        toUserId,
        value
      );
    } catch (error) {
      logger.error('Failed to transfer token:', error);
      throw error;
    }
  }
}

export default new FabricService();