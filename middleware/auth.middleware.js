const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();


const client = jwksClient({
    jwksUri: process.env.KEYCLOAK_JWKS_URI
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {

        if (err) {
            return callback(err);
        }

        const signingKey = key.getPublicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, getKey, (err, decodedToken) => {

        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        //Attach user info to request
        req.user = decodedToken;
        next();
    });
};

const checkRole = (requiredRole) => {
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userRoles = req.user.realm_access?.roles || [];

        if(!userRoles.includes(requiredRole)){
            return res.status(403).json({ error: 'User not authorized' });
        }

        next();
    };
};

module.exports = {
    getKey,
    verifyToken,
    checkRole
};