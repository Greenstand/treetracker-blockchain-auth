const axios = require('axios');

const config = {
    baseURL: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
    adminPassowrd: process.env.KEYCLOAK_ADMIN_PASSOWRD
}

let adminToken = null;
let tokenExpiresAt = 0;

async function getAdminToken() {
    try {
        // return cached token if still valid
        if (adminToken && !isTokenExpired()) {
            return adminToken;
        }

        const tokenUrl = `${config.baseURL}/realms/${config.realm}/protocol/openid-connect/token`;

        const body = new URLSearchParams();
        body.append('client_id', config.clientId);
        body.append('client_secret', config.clientSecret);
        body.append('grant_type', 'client_credentials');

        const response = await axios.post(tokenUrl, body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        adminToken = response.data.access_token;
        // set token expiry
        tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

        return adminToken;

    } catch (error) {
        console.error('Failed to get admin token', error);
        throw new Error('Failed to authenticate with Keycloak');
    }
}

function isTokenExpired() {
    if (!tokenExpiresAt) return true;
    return Date.now() >= tokenExpiresAt;
}

async function makeAuthenticatedRequest(method, endpoint, data = null) {
    try {
        const token = await getAdminToken();
        const url = `${config.baseURL}/admin/realms/${config.realm}${endpoint}`;
        
        const response = await axios({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return response.data;

    } catch (error) {
        console.error('Failed to make authenticated request', error);
        // clear invalid token
        if (error.response?.status === 401) {
            adminToken = null;
            tokenExpiresAt = null;
        }

        throw new Error('Failed to make authenticated request');
    }
}

async function getUsers() {
    return makeAuthenticatedRequest('GET', '/users');
}

async function getUserById(userId) {
    return makeAuthenticatedRequest('GET', `/users/${userId}`);
}

async function createUser(userData) {
    return makeAuthenticatedRequest('POST', '/users', userData);
}

module.exports = {
    getAdminToken,
    getUsers,
    getUserById,
    createUser,
    makeAuthenticatedRequest
}