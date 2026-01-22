# TreeTracker Auth Service - Complete File Inventory & API Documentation

## 📋 Project Overview

**Project Name**: TreeTracker Authentication Microservice  
**Version**: 1.0.0  
**Description**: Authentication microservice for TreeTracker with Keycloak and Hyperledger Fabric integration  
**Main Entry**: `dist/server.js` (built from `src/server.ts`)  
**Technology Stack**: Node.js, TypeScript, Express.js, Keycloak, Hyperledger Fabric  

---

## 📂 Complete File Inventory

### 📁 **Root Directory Files**

| File | Type | Description | Purpose |
|------|------|-------------|---------|
| `package.json` | JSON | Project configuration and dependencies | NPM package definition, scripts, and dependencies |
| `tsconfig.json` | JSON | TypeScript compiler configuration | TypeScript build settings and options |
| `Dockerfile` | Docker | Multi-stage container build configuration | Container deployment with security best practices |
| `README.md` | Markdown | Comprehensive project documentation | User guide, API docs, deployment instructions |
| `INVENTORY.md` | Markdown | File inventory and API documentation | Complete project structure documentation |
| `INTEGRATION_DOCUMENTATION.md` | Markdown | Integration documentation | Keycloak and Fabric integration details |
| `.env` | Environment | Development environment variables | Local development configuration |
| `deploy-to-kubernetes.sh` | Shell | Kubernetes deployment automation script | Production deployment automation |

### 📁 **Source Code (`src/`)**

#### 🎯 **Core Application Files**
| File | Type | Description | Key Functions |
|------|------|-------------|---------------|
| `src/server.ts` | TypeScript | Main application entry point | Server startup, initialization, error handling |
| `src/app.ts` | TypeScript | Express application configuration | Middleware setup, route mounting, security |

#### 🛠️ **Configuration (`src/config/`)**
| File | Type | Description | Configuration For |
|------|------|-------------|-------------------|
| `src/config/index.ts` | TypeScript | Central configuration management | Environment variables, defaults, validation |
| `src/config/keycloak.config.ts` | TypeScript | Keycloak client configuration | Session management, Keycloak connection |
| `src/config/fabric.config.ts` | TypeScript | Hyperledger Fabric network configuration | CA client, gateway, wallet management |

#### 🎮 **Controllers (`src/controllers/`)**
| File | Type | Description | Endpoints Handled |
|------|------|-------------|-------------------|
| `src/controllers/auth.controller.ts` | TypeScript | Authentication business logic | All auth endpoints (register, login, profile, fabric) |

#### 🛣️ **Routes (`src/routes/`)**
| File | Type | Description | Route Definitions |
|------|------|-------------|-------------------|
| `src/routes/index.ts` | TypeScript | Main router configuration | Health check, route mounting |
| `src/routes/auth.routes.ts` | TypeScript | Authentication route definitions | All auth endpoints with validation |

#### 🔧 **Services (`src/services/`)**
| File | Type | Description | Service Functions |
|------|------|-------------|-------------------|
| `src/services/keycloak.service.ts` | TypeScript | Keycloak integration service | User management, token operations |
| `src/services/keycloak.mock.service.ts` | TypeScript | Keycloak mock for development | Development-only mock implementation |
| `src/services/fabric.service.ts` | TypeScript | Hyperledger Fabric service | User enrollment, blockchain operations |

#### 🛡️ **Middleware (`src/middleware/`)**
| File | Type | Description | Middleware Functions |
|------|------|-------------|----------------------|
| `src/middleware/auth.middleware.ts` | TypeScript | Authentication middleware | Token verification, role checking |
| `src/middleware/validation.middleware.ts` | TypeScript | Input validation middleware | Request validation, error handling |

#### 🔧 **Utilities (`src/utils/`)**
| File | Type | Description | Utility Functions |
|------|------|-------------|-------------------|
| `src/utils/logger.ts` | TypeScript | Winston logger configuration | Structured logging, different log levels |

---

## 🌐 Complete API Endpoint Documentation

### **Base Configuration**
- **Base URL**: `http://localhost:3000/api/v1` (development)
- **Production URL**: `https://auth.domain.com/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer token for protected routes

---

### 🏥 **1. Health Check Endpoints**

#### `GET /health`
**Purpose**: Service health check  
**Access**: Public  
**Location**: `src/routes/index.ts:7`

**Request**:
```http
GET /api/v1/health
```

**Response**:
```json
{
  "success": true,
  "message": "TreeTracker Auth Service is running",
  "timestamp": "2025-01-16T02:52:29.000Z"
}
```

---

### 👥 **2. Authentication Endpoints**

#### `POST /auth/register`
**Purpose**: Register new user in Keycloak and enroll in Fabric  
**Access**: Public  
**Location**: `src/routes/auth.routes.ts:14`, `src/controllers/auth.controller.ts:16`

**Validation Rules**:
- `username`: 3-50 characters, required
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required
- `firstName`: Optional, 1-50 characters
- `lastName`: Optional, 1-50 characters
- `phoneNumber`: Required, any format
- `region`: Required string
- `projectCode`: Optional string

**Request**:
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

**Success Response (201)**:
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

**Process Flow**:
1. Check if username exists
2. Create user in Keycloak `treetracker` realm
3. Assign `planter` role
4. Enroll in Hyperledger Fabric network
5. Return user details

#### `POST /auth/login`
**Purpose**: Authenticate user and return JWT tokens  
**Access**: Public  
**Location**: `src/routes/auth.routes.ts:34`, `src/controllers/auth.controller.ts:80`

**Validation Rules**:
- `username`: Required, non-empty
- `password`: Required, non-empty

**Request**:
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Success Response (200)**:
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

**Process Flow**:
1. Authenticate with Keycloak
2. Extract user info from JWT token payload
3. Check Hyperledger Fabric enrollment status
4. Return tokens and user information

#### `POST /auth/refresh`
**Purpose**: Refresh access token using refresh token  
**Access**: Public  
**Location**: `src/routes/auth.routes.ts:48`, `src/controllers/auth.controller.ts:138`

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200)**:
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

#### `POST /auth/logout`
**Purpose**: Logout user and invalidate tokens  
**Access**: Public  
**Location**: `src/routes/auth.routes.ts:61`, `src/controllers/auth.controller.ts:177`

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 👤 **3. Profile Management Endpoints**

#### `GET /auth/profile`
**Purpose**: Get authenticated user's profile  
**Access**: Private (Bearer token required)  
**Location**: `src/routes/auth.routes.ts:74`, `src/controllers/auth.controller.ts:210`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Success Response (200)**:
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

#### `PUT /auth/profile`
**Purpose**: Update user profile information  
**Access**: Private (Bearer token required)  
**Location**: `src/routes/auth.routes.ts:81`, `src/controllers/auth.controller.ts:267`

**Validation Rules**:
- `firstName`: Optional, 1-50 characters
- `lastName`: Optional, 1-50 characters
- `phoneNumber`: Optional, any format
- `region`: Optional string

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "region": "North America"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### ⛓️ **4. Hyperledger Fabric Integration Endpoints**

#### `POST /auth/fabric/enroll`
**Purpose**: Manually enroll user in Fabric network  
**Access**: Private (Bearer token required)  
**Location**: `src/routes/auth.routes.ts:98`, `src/controllers/auth.controller.ts:309`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Successfully enrolled in Fabric network"
}
```

**Error Response (400) - Already Enrolled**:
```json
{
  "success": false,
  "error": "User already enrolled in Fabric network"
}
```

#### `GET /auth/fabric/identity`
**Purpose**: Get user's Fabric identity status and enrollment info  
**Access**: Private (Bearer token required)  
**Location**: `src/routes/auth.routes.ts:105`, `src/controllers/auth.controller.ts:350`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "enrolled": true,
    "mspId": "GreenstandMSP"
  }
}
```

---

## 🔐 Authentication & Authorization

### **Token-Based Authentication**
- **Type**: JWT (JSON Web Tokens)
- **Header Format**: `Authorization: Bearer {access_token}`
- **Token Expiry**: 1 hour (configurable)
- **Refresh Token Expiry**: 7 days (configurable)

### **Middleware Chain**
1. **Rate Limiting**: 100 requests per 15 minutes per IP
2. **CORS**: Configurable origin whitelist
3. **Helmet**: Security headers
4. **Body Parsing**: JSON and URL-encoded
5. **Session Management**: Express session with Redis support
6. **Request Logging**: Winston structured logging
7. **Input Validation**: Express-validator for all inputs
8. **Auth Verification**: JWT token validation with Keycloak
9. **Role Checking**: RBAC support (optional middleware)

### **Security Features**
- **Input Validation**: All request bodies validated
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Helmet security headers
- **CSRF Protection**: Token-based verification
- **Rate Limiting**: Per-IP request throttling
- **Secure Headers**: HTTPS enforcement in production

---

## 📊 Service Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Auth Service  │    │   Keycloak      │
│   Application   │◄──►│   (Express.js)  │◄──►│   Identity      │
│                 │    │                 │    │   Provider      │
└─────────────────┘    │                 │    └─────────────────┘
                       │                 │    
                       │                 │    ┌─────────────────┐
                       │                 │◄──►│ Hyperledger     │
                       └─────────────────┘    │ Fabric Network  │
                                             └─────────────────┘
```

### **Data Flow**
1. **User Registration**:
   - Frontend → Auth Service → Keycloak (user creation)
   - Auth Service → Fabric Network (enrollment)
   - Response back through chain

2. **User Login**:
   - Frontend → Auth Service → Keycloak (authentication)
   - Auth Service checks Fabric enrollment status
   - JWT tokens returned to frontend

3. **Protected Operations**:
   - Frontend sends requests with Bearer token
   - Auth Service validates token with Keycloak
   - Business logic executed
   - Response returned

---

## 🔧 Configuration Management

### **Environment Variables**

#### **Server Configuration**
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `API_PREFIX` | `/api/v1` | API base path |

#### **Keycloak Configuration**
| Variable | Default | Description |
|----------|---------|-------------|
| `KEYCLOAK_URL` | `http://localhost:8080` | Keycloak server URL |
| `KEYCLOAK_REALM` | `treetracker` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | `treetracker-auth` | Client ID |
| `KEYCLOAK_CLIENT_SECRET` | - | Client secret (production) |
| `KEYCLOAK_ADMIN_USERNAME` | `admin` | Admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | - | Admin password |

#### **Fabric Configuration**
| Variable | Default | Description |
|----------|---------|-------------|
| `FABRIC_NETWORK_NAME` | `treetracker-network` | Network identifier |
| `FABRIC_CHANNEL_NAME` | `treetracker-channel` | Channel name |
| `FABRIC_CHAINCODE_NAME` | `treetracker` | Chaincode name |
| `FABRIC_MSP_ID` | `GreenstandMSP` | MSP identifier |
| `FABRIC_PEER_ENDPOINT` | `localhost:7051` | Peer endpoint |
| `FABRIC_CA_URL` | `https://localhost:7054` | CA URL |
| `FABRIC_CA_NAME` | `ca-greenstand` | CA name |

#### **Security Configuration**
| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | - | JWT signing secret |
| `JWT_EXPIRES_IN` | `1h` | Token expiry time |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `CORS_ORIGIN` | `http://localhost:3001` | Allowed origins |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Rate limit per window |

---

## 🐳 Deployment Configurations

### **Docker Configuration**
- **Base Image**: `node:20-alpine`
- **Multi-stage Build**: Builder + Production stages
- **Security**: Non-root user (nodejs:1001)
- **Health Check**: `/api/v1/health` endpoint
- **Volumes**: Wallet storage, log files
- **Ports**: 3000 (HTTP), 9090 (Metrics)

### **Kubernetes Deployment**
- **Namespace**: `treetracker-webapp-mvp`
- **Replicas**: 3 (production)
- **Service Types**: ClusterIP, NodePort
- **Ingress**: NGINX with TLS termination
- **Storage**: PersistentVolume for wallet files
- **Secrets**: Kubernetes secrets for sensitive data
- **ConfigMaps**: Environment configuration
- **Probes**: Liveness, readiness, startup probes

---

## 📝 Error Handling & Response Formats

### **Standard Success Response**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### **Standard Error Response**
```json
{
  "success": false,
  "error": "Error message here",
  "details": ["Validation error details"] // Optional
}
```

### **HTTP Status Codes**
- `200` - OK (Success)
- `201` - Created (Resource created)
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `429` - Too Many Requests (Rate limited)
- `500` - Internal Server Error (Server error)

---

## 📊 Monitoring & Observability

### **Logging**
- **Library**: Winston
- **Format**: JSON structured logs
- **Levels**: error, warn, info, debug
- **Outputs**: Console, file rotation
- **Request Logging**: All API requests logged

### **Health Checks**
- **Endpoint**: `/api/v1/health`
- **Kubernetes Probes**: Configured for all probe types
- **Response Time**: < 100ms typical
- **Dependencies**: Keycloak and Fabric connectivity

### **Metrics** (Future Enhancement)
- **Port**: 9090
- **Format**: Prometheus metrics
- **Metrics**: Request count, response time, error rates
- **Custom Metrics**: User registrations, Fabric enrollments

---

## 🔒 Security Implementation

### **Authentication Security**
- JWT tokens with RS256 algorithm
- Token expiration and refresh mechanism
- Secure token storage recommendations
- Password complexity validation

### **Authorization Security**
- Role-based access control (RBAC)
- Middleware-based permission checking
- Fabric enrollment verification
- Admin operation restrictions

### **Network Security**
- HTTPS enforcement in production
- CORS policy configuration
- Rate limiting per IP address
- Security headers via Helmet

### **Data Security**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Sensitive data encryption at rest

---

## 🛠️ Development & Testing

### **Development Setup**
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server
3. `npm run build` - Build TypeScript
4. `npm test` - Run test suite

### **Available Scripts**
- `npm run dev` - Development with hot reload
- `npm run build` - Production build
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Watch mode testing
- `npm run lint` - ESLint code checking
- `npm run format` - Prettier code formatting

### **Testing Strategy**
- Unit tests for services and utilities
- Integration tests for API endpoints
- Mock services for Keycloak and Fabric
- End-to-end testing with real services

---

This comprehensive inventory provides complete documentation of all files, endpoints, and configurations in the TreeTracker Authentication Service. Use this as a reference for development, deployment, and maintenance activities.