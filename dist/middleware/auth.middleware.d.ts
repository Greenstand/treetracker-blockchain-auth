import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        roles: string[];
        sub: string;
    };
}
/**
 * Verify JWT token middleware
 */
export declare const verifyToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if user has required role
 */
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - doesn't fail if no token
 */
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if user is enrolled in Fabric
 */
export declare const requireFabricEnrollment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map