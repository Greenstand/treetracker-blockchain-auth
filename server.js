require('dotenv').config();
const express = require('express');
const { config } = require('./services/auth/keycloak.service');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});

module.exports = app;