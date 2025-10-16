export interface KeycloakUser {
    id?: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    emailVerified?: boolean;
    attributes?: Record<string, string[]>;
}
export interface KeycloakTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    session_state: string;
    scope: string;
}
export declare class KeycloakService {
    private adminToken;
    private tokenExpiry;
    private axiosInstance;
    constructor();
    /**
     * Get admin access token
     */
    private getAdminToken;
    /**
     * Create a new user in Keycloak
     */
    createUser(user: KeycloakUser, password: string): Promise<string>;
    /**
     * Get user by username
     */
    getUserByUsername(username: string): Promise<KeycloakUser | null>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<KeycloakUser | null>;
    /**
     * Update user
     */
    updateUser(userId: string, updates: Partial<KeycloakUser>): Promise<void>;
    /**
     * Delete user
     */
    deleteUser(userId: string): Promise<void>;
    /**
     * Authenticate user and get tokens
     */
    login(username: string, password: string): Promise<KeycloakTokenResponse>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<KeycloakTokenResponse>;
    /**
     * Logout user
     */
    logout(refreshToken: string): Promise<void>;
    /**
     * Verify token
     */
    verifyToken(token: string): Promise<any>;
    /**
     * Get user info from token
     */
    getUserInfo(token: string): Promise<any>;
    /**
     * Assign role to user
     */
    assignRole(userId: string, roleName: string): Promise<void>;
}
declare const _default: KeycloakService;
export default _default;
//# sourceMappingURL=keycloak.service.d.ts.map