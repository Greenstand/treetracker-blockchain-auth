import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class AuthController {
    /**
     * Register new user
     */
    register(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Login user
     */
    login(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Refresh access token
     */
    refresh(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Logout user
     */
    logout(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user profile
     */
    getProfile(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Update user profile
     */
    updateProfile(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Enroll user in Fabric network
     */
    enrollFabric(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get Fabric identity status
     */
    getFabricIdentity(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map