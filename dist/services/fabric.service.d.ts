export declare class FabricService {
    /**
     * Enroll user in Fabric network
     */
    enrollUser(userId: string, affiliation?: string): Promise<void>;
    /**
     * Check if user is enrolled in Fabric
     */
    isUserEnrolled(userId: string): Promise<boolean>;
    /**
     * Get user's Fabric identity status
     */
    getUserIdentityStatus(userId: string): Promise<{
        enrolled: boolean;
        mspId?: string;
    }>;
    /**
     * Submit transaction to chaincode
     */
    submitTransaction(userId: string, functionName: string, ...args: string[]): Promise<any>;
    /**
     * Evaluate transaction (query)
     */
    evaluateTransaction(userId: string, functionName: string, ...args: string[]): Promise<any>;
    /**
     * Create a tree capture on blockchain
     */
    createCapture(userId: string, captureData: {
        captureId: string;
        planterId: string;
        photoHash: string;
        latitude: string;
        longitude: string;
        timestamp: string;
        species?: string;
        notes?: string;
    }): Promise<any>;
    /**
     * Query capture by ID
     */
    queryCapture(userId: string, captureId: string): Promise<any>;
    /**
     * Query captures by planter
     */
    queryCapturesByPlanter(userId: string, planterId: string): Promise<any>;
    /**
     * Query token by ID
     */
    queryToken(userId: string, tokenId: string): Promise<any>;
    /**
     * Query tokens by owner
     */
    queryTokensByOwner(userId: string, planterId: string): Promise<any>;
    /**
     * Verify capture (admin only)
     */
    verifyCapture(userId: string, captureId: string, verifierId: string, approved: boolean, reason?: string): Promise<any>;
    /**
     * Update token state
     */
    updateTokenState(userId: string, tokenId: string, newState: string, additionalValue?: string): Promise<any>;
    /**
     * Transfer token
     */
    transferToken(userId: string, tokenId: string, fromUserId: string, toUserId: string, value: string): Promise<any>;
}
declare const _default: FabricService;
export default _default;
//# sourceMappingURL=fabric.service.d.ts.map