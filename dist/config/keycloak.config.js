"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeycloak = exports.initKeycloak = exports.keycloakConfig = exports.sessionConfig = void 0;
const keycloak_connect_1 = __importDefault(require("keycloak-connect"));
const index_1 = require("./index");
// Session configuration
exports.sessionConfig = {
    secret: index_1.config.session.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: index_1.config.server.env === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
};
// Keycloak configuration
exports.keycloakConfig = {
    realm: index_1.config.keycloak.realm,
    'auth-server-url': index_1.config.keycloak.url,
    'ssl-required': 'external',
    resource: index_1.config.keycloak.clientId,
    credentials: {
        secret: index_1.config.keycloak.clientSecret,
    },
    'confidential-port': 0,
    'bearer-only': true,
    'verify-token-audience': true,
};
// Initialize Keycloak
let keycloakInstance = null;
const initKeycloak = (memoryStore) => {
    if (!keycloakInstance) {
        keycloakInstance = new keycloak_connect_1.default({ store: memoryStore }, exports.keycloakConfig);
    }
    return keycloakInstance;
};
exports.initKeycloak = initKeycloak;
const getKeycloak = () => {
    if (!keycloakInstance) {
        throw new Error('Keycloak not initialized. Call initKeycloak first.');
    }
    return keycloakInstance;
};
exports.getKeycloak = getKeycloak;
//# sourceMappingURL=keycloak.config.js.map