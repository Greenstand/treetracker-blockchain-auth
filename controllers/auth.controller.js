const { loginUser, registerUser, config } = require('../services/auth/keycloak.service');
const axios = require('axios');

const register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        const result = await registerUser({
            username,
            email,
            password,
            firstName,
            lastName
        });

        res.status(201).json(result);

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        const tokens = await loginUser(username, password);
        
        res.json({ 
            success: true, 
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in
        });

    } catch (error) {
        console.error('Login error:', error.message);
        
        const status = error.response?.status || 500;
        const message = error.response?.data?.error_description || 'Login failed';
        
        res.status(status).json({ 
            success: false, 
            message 
        });
    }
};

 const getProfile = (req, res) => {
    try {
        res.json({ 
            success: true, 
            user: req.user 
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user profile' 
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'Refresh token is required' 
            });
        }

        const tokenUrl = `${config.baseURL}/realms/${config.realm}/protocol/openid-connect/token`;
        
        const body = new URLSearchParams();
        body.append('client_id', config.clientId);
        body.append('client_secret', config.clientSecret);
        body.append('grant_type', 'refresh_token');
        body.append('refresh_token', refreshToken);

        console.log('Sending refresh token request to:', tokenUrl);
        console.log('Request body:', {
            client_id: config.clientId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken.substring(0, 10) + '...'
        });

        const response = await axios.post(tokenUrl, body, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });

        console.log('Refresh token response status:', response.status);
        
        res.json({ 
            success: true, 
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in
        });

    } catch (error) {
        console.error('Refresh token error:', {
            message: error.message,
            response: {
                status: error.response?.status,
                data: error.response?.data
            },
            stack: error.stack
        });
        
        const status = error.response?.status || 500;
        const message = error.response?.data?.error_description || 'Failed to refresh token';
        
        res.status(status).json({ 
            success: false, 
            message,
            error: error.response?.data?.error
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    refreshToken
}