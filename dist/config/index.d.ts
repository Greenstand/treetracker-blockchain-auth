export declare const config: {
    server: {
        env: string;
        port: number;
        apiPrefix: string;
    };
    keycloak: {
        url: string;
        realm: string;
        clientId: string;
        clientSecret: string;
        adminUsername: string;
        adminPassword: string;
    };
    fabric: {
        networkName: string;
        channelName: string;
        chaincodeName: string;
        mspId: string;
        peerEndpoint: string;
        ordererEndpoint: string;
        caUrl: string;
        caName: string;
        adminUser: string;
        adminPassword: string;
        tlsEnabled: boolean;
        tlsCertPath: string;
        tlsKeyPath: string;
    };
    wallet: {
        path: string;
        type: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string;
        format: string;
    };
    session: {
        secret: string;
        redisUrl: string;
    };
    monitoring: {
        enabled: boolean;
        port: number;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map