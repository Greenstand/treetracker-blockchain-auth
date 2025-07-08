const { config, validateToken } = require('../services/auth/keycloak.service');

const extractToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        req.token = authHeader.split(' ')[1];
    }
    next();
};

const validateJwt = async (req, res, next) => {
    try {
        const token = req.token;
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = await validateToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token validation error:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

const checkRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }

        if (roles.length && !roles.some(role => req.user.realm_access?.roles?.includes(role))) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }

        next();
    };
};

module.exports = {
    extractToken,
    validateJwt,
    checkRole
};