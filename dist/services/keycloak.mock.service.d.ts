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
export declare class KeycloakMockService {
    /**
     * Create a new user (mocked)
     */
    createUser(user: KeycloakUser, password: string): Promise<string>;
    /**
     * Get user by username (mocked)
     */
    getUserByUsername(username: string): Promise<any>;
    /**
     * Get user by ID (mocked)
     */
    getUserById(userId: string): Promise<any>;
    /**
     * Authenticate user (mocked)
     */
    authenticateUser(username: string, password: string): Promise<KeycloakTokenResponse>;
    /**
     * Refresh token (mocked)
     */
    refreshToken(refreshToken: string): Promise<KeycloakTokenResponse>;
    /**
     * Assign role to user (mocked)
     */
    assignRole(userId: string, roleName: string): Promise<void>;
    /**
     * Update user (mocked)
     */
    updateUser(userId: string, updates: Partial<KeycloakUser>): Promise<void>;
    /**
     * Logout user (mocked)
     */
    logoutUser(refreshToken: string): Promise<void>;
    /**
     * Login user (alias for authenticateUser)
     */
    login(username: string, password: string): Promise<KeycloakTokenResponse>;
    /**
     * Get user info from token
     */
    getUserInfo(accessToken: string): Promise<any>;
    /**
     * Logout (alias for logoutUser)
     */
    logout(refreshToken: string): Promise<void>;
}
declare const _default: KeycloakMockService;
export default _default;
//# sourceMappingURL=keycloak.mock.service.d.ts.map