# Backend Bridge

A secure linking layer that connects a Keycloak Identity Provider with the Hyperledger Fabric blockchain identity system (Fabric CA & Wallet). It authenticates users via JWT tokens from Keycloak, manages their registration and enrollment with Fabric CA, and securely stores identities in a Fabric Wallet.

## Features

- **Keycloak Integration**: JWT token validation and user authentication
- **Fabric CA Management**: User registration and enrollment with Hyperledger Fabric CA
- **Secure Wallet Management**: Identity storage and retrieval using Fabric Wallet
- **RESTful API**: Comprehensive REST API for identity operations
- **Security**: Rate limiting, request validation, and security headers
- **Monitoring**: Health checks, metrics, and structured logging
- **Docker Support**: Containerized deployment with Docker Compose

## Architecture

```
┌─────────────┐    JWT Token    ┌─────────────────┐    Registration/    ┌──────────────┐
│   Keycloak  │ ──────────────► │ Backend Bridge  │ ──Enrollment────► │  Fabric CA   │
│ (Identity   │                 │                 │                   │              │
│ Provider)   │                 │                 │                   │              │
└─────────────┘                 └─────────────────┘                   └──────────────┘
                                          │                                    │
                                          ▼                                    │
                                ┌─────────────────┐                           │
                                │ Fabric Wallet   │ ◄─────────────────────────┘
                                │ (Identity       │   Store Certificates
                                │  Storage)       │
                                └─────────────────┘
```

## Prerequisites

- Node.js 16+ and npm
- Docker and Docker Compose (for containerized deployment)
- Access to a Keycloak server
- Access to a Hyperledger Fabric network with CA

## Installation

### Option 1: Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd backend-bridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application:**
   ```bash
   npm run dev  # Development mode with auto-reload
   # or
   npm start    # Production mode
   ```

### Option 2: Docker Deployment

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd backend-bridge
   ```

2. **Configure environment variables:**
   ```bash
   # Edit docker-compose.yml with your configuration
   # or create a .env file for Docker Compose
   ```

3. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |
| `PORT` | Server port | `3000` | No |
| `KEYCLOAK_REALM_URL` | Keycloak realm URL | - | Yes |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | - | Yes |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | - | Yes |
| `KEYCLOAK_JWKS_URI` | Keycloak JWKS endpoint | - | Yes |
| `FABRIC_CA_URL` | Fabric CA server URL | - | Yes |
| `FABRIC_CA_NAME` | Fabric CA name | - | Yes |
| `FABRIC_CA_ADMIN_USER` | Fabric CA admin username | - | Yes |
| `FABRIC_CA_ADMIN_PASSWORD` | Fabric CA admin password | - | Yes |
| `FABRIC_CA_TLS_CERT_PATH` | Path to CA TLS certificate | - | No |
| `FABRIC_NETWORK_CONFIG_PATH` | Path to Fabric connection profile | - | Yes |
| `FABRIC_WALLET_PATH` | Path to wallet directory | `./wallet` | No |
| `FABRIC_MSP_ID` | Fabric MSP ID | - | Yes |
| `JWT_SECRET` | JWT secret for internal tokens | - | Yes |
| `ENCRYPTION_KEY` | 32-character encryption key | - | Yes |
| `LOG_LEVEL` | Logging level | `info` | No |

### Keycloak Configuration

1. **Create a new client in Keycloak:**
   - Client ID: `backend-bridge` (or your preferred name)
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: Configure according to your needs

2. **Configure client settings:**
   - Enable "Service Accounts Enabled"
   - Configure the client secret
   - Set up proper roles and permissions

3. **Get the JWKS URI:**
   - Format: `http://your-keycloak-server:8080/realms/{realm-name}/protocol/openid_connect/certs`

### Fabric CA Configuration

Ensure your Fabric CA is properly configured and accessible. The service requires:

- CA server URL (typically on port 7054)
- Admin credentials for user registration
- TLS certificate (if TLS is enabled)
- Network connection profile

## API Endpoints

### Authentication

All API endpoints (except health checks) require a valid JWT token from Keycloak:

```
Authorization: Bearer <your-jwt-token>
```

### Identity Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/identity/register` | POST | Register user with Fabric CA |
| `/api/identity/enroll` | POST | Enroll registered user |
| `/api/identity/register-and-enroll` | POST | Register and enroll in one step |
| `/api/identity/me` | GET | Get current user's identity info |
| `/api/identity/exists` | GET | Check if user has blockchain identity |
| `/api/identity/validate` | GET | Validate user's identity certificate |
| `/api/identity/revoke` | POST | Revoke user's identity |
| `/api/identity/export` | GET | Export identity (without private key) |
| `/api/identity/ca-info` | GET | Get Fabric CA user information |

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/detailed` | GET | Detailed health with service status |
| `/health/ready` | GET | Readiness probe (K8s) |
| `/health/live` | GET | Liveness probe (K8s) |
| `/health/metrics` | GET | System metrics |
| `/health/version` | GET | Service version info |

### Example Usage

1. **Register and enroll a user:**
   ```bash
   curl -X POST http://localhost:3000/api/identity/register-and-enroll \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "role": "client",
       "affiliation": "",
       "attributes": [
         {"name": "department", "value": "engineering", "ecert": true}
       ]
     }'
   ```

2. **Check identity status:**
   ```bash
   curl -X GET http://localhost:3000/api/identity/exists \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Get identity information:**
   ```bash
   curl -X GET http://localhost:3000/api/identity/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Security Features

- **JWT Authentication**: Validates tokens from Keycloak
- **Rate Limiting**: Prevents abuse with configurable limits
- **Request Validation**: Input sanitization and validation
- **Security Headers**: HSTS, CSP, and other security headers
- **Logging**: Comprehensive security event logging
- **Non-root Container**: Runs with unprivileged user in Docker

## Monitoring & Logging

### Health Checks

- **Basic**: `/health` - Simple up/down status
- **Detailed**: `/health/detailed` - Service dependencies status
- **Kubernetes**: `/health/ready` and `/health/live` probes

### Logging

Structured JSON logging with multiple levels:
- Console output (development)
- File rotation (production)
- Component-specific loggers

Log files location:
- Main log: `./logs/backend-bridge.log`
- Error log: `./logs/error.log`
- Exceptions: `./logs/exceptions.log`

### Metrics

System metrics available at `/health/metrics` including:
- Process information (CPU, memory)
- System resources
- Service-specific metrics

## Development

### Project Structure

```
backend-bridge/
├── src/
│   ├── config/          # Configuration and logging
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   └── app.js          # Main application
├── wallet/             # Fabric wallet storage
├── crypto-config/      # Fabric network configuration
├── logs/              # Application logs
├── tests/             # Test files
└── docs/              # Documentation
```

### Scripts

```bash
npm start         # Start production server
npm run dev       # Start development server with auto-reload
npm test          # Run tests
npm run lint      # Run ESLint
npm run lint:fix  # Fix ESLint issues
```

### Adding New Features

1. Create service modules in `src/services/`
2. Add controllers in `src/controllers/`
3. Define routes in `src/routes/`
4. Add validation rules in `src/middleware/validation.js`
5. Update documentation

## Deployment

### Production Deployment

1. **Build Docker image:**
   ```bash
   docker build -t backend-bridge:latest .
   ```

2. **Run with proper environment:**
   ```bash
   docker run -d \
     --name backend-bridge \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e KEYCLOAK_REALM_URL=https://your-keycloak.com/realms/fabric \
     -v /path/to/wallet:/app/wallet \
     -v /path/to/crypto-config:/app/crypto-config \
     backend-bridge:latest
   ```

### Kubernetes Deployment

Example Kubernetes manifests:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-bridge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-bridge
  template:
    metadata:
      labels:
        app: backend-bridge
    spec:
      containers:
      - name: backend-bridge
        image: backend-bridge:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        # Add other environment variables
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Troubleshooting

### Common Issues

1. **JWT Token Validation Fails**
   - Check Keycloak JWKS URI configuration
   - Verify token is not expired
   - Ensure client configuration is correct

2. **Fabric CA Connection Issues**
   - Verify CA URL and credentials
   - Check TLS certificate configuration
   - Ensure network connectivity

3. **Wallet Permission Errors**
   - Check file system permissions
   - Ensure wallet directory exists
   - Verify Docker volume mounts

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

### Health Check Failures

Check individual services:
```bash
curl http://localhost:3000/health/detailed
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

---

**Note**: This is a secure system handling blockchain identities. Always follow security best practices and keep credentials secure.
