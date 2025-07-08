const axios = require('axios');
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const config = {
    baseURL: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD
};

let adminToken = null;
let tokenExpiresAt = 0;

const jwksUri = `${config.baseURL}/realms/${config.realm}/protocol/openid-connect/certs`;
const jwksClientInstance = jwksClient({
    jwksUri,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5
});

async function getAdminToken() {
    try {
        if (adminToken && Date.now() < tokenExpiresAt) {
            return adminToken;
        }

        const tokenUrl = `${config.baseURL}/realms/${config.realm}/protocol/openid-connect/token`;
        
        const body = new URLSearchParams();
        body.append('client_id', config.clientId);
        body.append('client_secret', config.clientSecret);
        body.append('grant_type', 'password');
        body.append('username', config.adminUsername);
        body.append('password', config.adminPassword);

        const response = await axios.post(tokenUrl, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        adminToken = response.data.access_token;
        tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
        return adminToken;
    } catch (error) {
        console.error('Error getting admin token:', error.response?.data || error.message);
        throw new Error('Failed to get admin token');
    }
}

async function registerUser(user) {
    try {
        const adminToken = await getAdminToken();
        const url = `${config.baseURL}/admin/realms/${config.realm}/users`;
        
        const response = await axios.post(url, {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: true,
            credentials: [{
                type: 'password',
                value: user.password,
                temporary: false
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        const userId = response.headers.location.split('/').pop();
        
        await setUserPassword(userId, user.password);
        
        return { 
            success: true, 
            userId,
            message: 'User registered successfully' 
        };
    } catch (error) {
        console.error('User registration error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.errorMessage || 'Failed to register user');
    }
}

async function setUserPassword(userId, password) {
    try {
        const adminToken = await getAdminToken();
        const url = `${config.baseURL}/admin/realms/${config.realm}/users/${userId}/reset-password`;
        
        await axios.put(url, {
            type: 'password',
            value: password,
            temporary: false
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Set password error:', error.response?.data || error.message);
        throw new Error('Failed to set user password');
    }
}

async function loginUser(username, password) {
    try {
        const tokenUrl = `${config.baseURL}/realms/${config.realm}/protocol/openid-connect/token`;
        
        const body = new URLSearchParams();
        body.append('client_id', config.clientId);
        body.append('client_secret', config.clientSecret);
        body.append('grant_type', 'password');
        body.append('username', username);
        body.append('password', password);

        const response = await axios.post(tokenUrl, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error;
    }
}

async function getKey(header, callback) {
    try {
        const key = await jwksClientInstance.getSigningKey(header.kid);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    } catch (error) {
        console.error('Error getting signing key:', error);
        callback(error);
    }
}

async function validateToken(token) {
    try {
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, 
                (header, callback) => {
                    getKey(header, (err, key) => {
                        if (err) return callback(err);
                        callback(null, key);
                    });
                },
                {
                    algorithms: ['RS256'],
                    issuer: `${config.baseURL}/realms/${config.realm}`,
                    audience: ['account', config.clientId],
                    ignoreExpiration: false
                },
                (err, decoded) => {
                    if (err) return reject(err);
                    resolve(decoded);
                }
            );
        });
        return decoded;
    } catch (error) {
        console.error('Token validation error:', error.message);
        throw error;
    }
}

module.exports = {
    config,
    getAdminToken,
    registerUser,
    loginUser,
    validateToken
};