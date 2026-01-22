# TreeTracker Authentication Microservice

A comprehensive authentication microservice for the TreeTracker system that integrates with Keycloak for identity management and Hyperledger Fabric for blockchain-based user enrollment.

## 🌟 Features

- **Keycloak Integration**: Complete user authentication and authorization
- **Hyperledger Fabric Integration**: Automatic user enrollment in blockchain network
- **JWT Token Management**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Fine-grained permission management
- **RESTful API**: Clean and well-documented API endpoints
- **Kubernetes Ready**: Production-ready deployment manifests
- **Security**: Rate limiting, CORS, helmet, and input validation
- **Logging**: Structured logging with Winston
- **Health Checks**: Built-in health check endpoints

## 📋 Prerequisites

- Node.js 20.x or higher
- Keycloak instance running
- Hyperledger Fabric network deployed
- Kubernetes cluster (for production deployment)

## 🚀 Quick Start

### 1. Installation

```bash
cd treetracker-auth-service
npm install
```

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Keycloak Configuration
KEYCLOAK_URL=http://your-keycloak-url:8080
KEYCLOAK_REALM=treetracker
KEYCLOAK_CLIENT_ID=treetracker-auth
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Fabric Configuration
FABRIC_PEER_ENDPOINT=peer0.greenstand.treetracker.svc.cluster.local:7051
FABRIC_CA_URL=https://ca.greenstand.treetracker.svc.cluster.local:7054
# ... other Fabric settings
```

### 3. Development

```bash
npm run dev
```

The service will start on `http://localhost:3000`

### 4. Build

```bash
npm run build
```

### 5. Production

```bash
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints

#### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "TreeTracker Auth Service is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### 2. Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "region": "North America",
  "projectCode": "NA-2025-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### 3. Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid-here",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fabricEnrolled": true
    }
  }
}
```

#### 4. Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

#### 5. Logout

```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 6. Get Profile

```http
GET /auth/profile
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "region": "North America",
    "projectCode": "NA-2025-001",
    "fabricEnrolled": true,
    "emailVerified": false,
    "enabled": true
  }
}
```

#### 7. Update Profile

```http
PUT /auth/profile
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "region": "North America"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### 8. Enroll in Fabric Network

```http
POST /auth/fabric/enroll
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in Fabric network"
}
```

#### 9. Get Fabric Identity Status

```http
GET /auth/fabric/identity
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enrolled": true,
    "mspId": "GreenstandMSP"
  }
}
```

## 🔒 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {access_token}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  TreeTracker Web App                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Authentication Microservice                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Express    │  │  Keycloak    │  │   Fabric     │ │
│  │   Server     │──│   Service    │──│   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
           │                    │                │
           ▼                    ▼                ▼
    ┌──────────┐        ┌──────────┐    ┌──────────┐
    │   API    │        │ Keycloak │    │  Fabric  │
    │ Gateway  │        │  Server  │    │ Network  │
    └──────────┘        └──────────┘    └──────────┘
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t treetracker/auth-service:latest .
```

### Run Container

```bash
docker run -d \
  --name treetracker-auth \
  -p 3000:3000 \
  --env-file .env \
  treetracker/auth-service:latest
```

## ☸️ Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace treetracker
```

### 2. Apply Secrets

```bash
# Edit secrets.yaml with your actual credentials
kubectl apply -f k8s/secrets.yaml
```

### 3. Deploy Service

```bash
kubectl apply -f k8s/deployment.yaml
```

### 4. Configure Ingress

```bash
# Edit ingress.yaml with your domain
kubectl apply -f k8s/ingress.yaml
```

### 5. Verify Deployment

```bash
kubectl get pods -n treetracker
kubectl logs -f deployment/treetracker-auth-service -n treetracker
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `KEYCLOAK_URL` | Keycloak server URL | http://localhost:8080 |
| `KEYCLOAK_REALM` | Keycloak realm name | treetracker |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | treetracker-auth |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | - |
| `FABRIC_PEER_ENDPOINT` | Fabric peer endpoint | localhost:7051 |
| `FABRIC_CA_URL` | Fabric CA URL | https://localhost:7054 |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3001 |

### Keycloak Setup

1. **Create Realm**: Create a realm named `treetracker`
2. **Create Client**: Create a client with ID `treetracker-auth`
3. **Configure Client**:
   - Access Type: confidential
   - Service Accounts Enabled: ON
   - Authorization Enabled: ON
4. **Create Roles**: Create roles like `planter`, `verifier`, `admin`
5. **Get Client Secret**: Copy from Credentials tab

### Fabric Network Setup

Ensure your Fabric network has:
- CA server running
- Peer nodes accessible
- Channel created
- Chaincode deployed
- Admin user enrolled

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

```bash
npm run test:coverage
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

### Logs

```bash
# Development
npm run dev

# Production
tail -f logs/combined.log
tail -f logs/error.log
```

### Kubernetes Logs

```bash
kubectl logs -f deployment/treetracker-auth-service -n treetracker
```

## 🔐 Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers enabled
- **CORS**: Configurable origin whitelist
- **Input Validation**: Express-validator for all inputs
- **JWT**: Secure token-based authentication
- **HTTPS**: Enforced in production
- **Secrets**: Stored in Kubernetes secrets

## 🚨 Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [] // Optional validation details
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Logging

Logs are structured JSON format:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User logged in successfully",
  "username": "johndoe"
}
```

## 🔄 Integration with TreeTracker Web App

### 1. Update API Configuration

In `treetracker-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://auth.treetracker.example.com/api/v1
```

### 2. Update API Service

The web app's API service (`lib/api.ts`) is already configured to work with this auth service.

### 3. Authentication Flow

1. User registers/logs in through web app
2. Web app receives JWT tokens
3. Tokens stored in localStorage
4. All API requests include Bearer token
5. Auth service validates token with Keycloak
6. Protected routes check Fabric enrollment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact the TreeTracker team
- Check documentation

## 🗺️ Roadmap

- [ ] Add OAuth2 providers (Google, GitHub)
- [ ] Implement 2FA
- [ ] Add email verification
- [ ] Password reset functionality
- [ ] User activity logging
- [ ] Advanced RBAC policies
- [ ] API rate limiting per user
- [ ] Metrics and monitoring dashboard

---

**Built with 🌳 for sustainable reforestation**

*TreeTracker Authentication Service - Securing the future of reforestation*
## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Author:** [imos64](https://github.com/imos64)  
**Maintainer:** [Imonikhe Aikoroje](https://www.linkedin.com/in/imosaikoroje/)
