import Keycloak from 'keycloak-connect';
import session from 'express-session';
import { config } from './index';

// Session configuration
export const sessionConfig = {
  secret: config.session.secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: config.server.env === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Keycloak configuration
export const keycloakConfig = {
  realm: config.keycloak.realm,
  'auth-server-url': config.keycloak.url,
  'ssl-required': 'external',
  resource: config.keycloak.clientId,
  credentials: {
    secret: config.keycloak.clientSecret,
  },
  'confidential-port': 0,
  'bearer-only': true,
  'verify-token-audience': true,
};

// Initialize Keycloak
let keycloakInstance: Keycloak.Keycloak | null = null;

export const initKeycloak = (memoryStore: session.MemoryStore): Keycloak.Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({ store: memoryStore }, keycloakConfig);
  }
  return keycloakInstance;
};

export const getKeycloak = (): Keycloak.Keycloak => {
  if (!keycloakInstance) {
    throw new Error('Keycloak not initialized. Call initKeycloak first.');
  }
  return keycloakInstance;
};