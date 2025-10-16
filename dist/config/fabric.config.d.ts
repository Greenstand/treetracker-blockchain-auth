import { Gateway } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
export declare class FabricConfig {
    private static gateway;
    private static caClient;
    /**
     * Build connection profile for Fabric network
     */
    static buildCCP(): any;
    /**
     * Build CA client
     */
    static buildCAClient(): FabricCAServices;
    /**
     * Enroll admin user
     */
    static enrollAdmin(): Promise<void>;
    /**
     * Register and enroll a new user
     */
    static registerUser(userId: string, affiliation?: string): Promise<void>;
    /**
     * Get gateway connection
     */
    static getGateway(userId: string): Promise<Gateway>;
    /**
     * Check if user exists in wallet
     */
    static userExists(userId: string): Promise<boolean>;
    /**
     * Initialize Fabric network
     */
    static initialize(): Promise<void>;
}
export default FabricConfig;
//# sourceMappingURL=fabric.config.d.ts.map