import Keycloak from 'keycloak-connect';
import session from 'express-session';
export declare const sessionConfig: {
    secret: string;
    resave: boolean;
    saveUninitialized: boolean;
    cookie: {
        secure: boolean;
        httpOnly: boolean;
        maxAge: number;
    };
};
export declare const keycloakConfig: {
    realm: string;
    'auth-server-url': string;
    'ssl-required': string;
    resource: string;
    credentials: {
        secret: string;
    };
    'confidential-port': number;
    'bearer-only': boolean;
    'verify-token-audience': boolean;
};
export declare const initKeycloak: (memoryStore: session.MemoryStore) => Keycloak.Keycloak;
export declare const getKeycloak: () => Keycloak.Keycloak;
//# sourceMappingURL=keycloak.config.d.ts.map