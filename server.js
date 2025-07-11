require('dotenv').config();
const express = require('express');
const { config } = require('./services/auth/keycloak.service');
const authRoutes = require('./routes/auth.routes');
const fabricRoutes = require('./routes/fabric.routes');
const cors = require('cors');
const { createServer } = require('http');
const walletService = require('./services/fabric/wallet.service');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/fabric', fabricRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP',
        keycloak: {
            url: config.baseURL,
            realm: config.realm,
            clientId: config.clientId
        }
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

httpServer.listen(PORT, async () => {
    try {
        await walletService.initialize();
        console.log(`Server running on port ${PORT}`);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});

module.exports = app;