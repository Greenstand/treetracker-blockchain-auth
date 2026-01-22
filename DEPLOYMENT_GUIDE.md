# TreeTracker Authentication Service - Deployment Guide

## 📋 Complete Guide to Deploying the Authentication Microservice

This guide provides step-by-step instructions for deploying the TreeTracker Authentication Service in various environments, from development to production.

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Deployment](#development-deployment)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Environment Configuration](#environment-configuration)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)
11. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 Overview

### Service Architecture
```
┌─────────────────────────────────────────────────────────┐
│              TreeTracker Auth Service                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Express    │  │  Keycloak    │  │   Fabric     │  │
│  │   API        │──│   Service    │──│   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                          │              │               │
│                          ▼              ▼               │
│                    ┌──────────┐    ┌──────────────┐    │
│                    │ Keycloak │    │  Hyperledger │    │
│                    │  Server  │    │    Fabric    │    │
│                    └──────────┘    └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- ✅ JWT-based authentication with refresh tokens
- ✅ Keycloak integration for enterprise identity management
- ✅ Hyperledger Fabric automatic user enrollment
- ✅ Role-based access control (planter, verifier, admin)
- ✅ Comprehensive API with 9 endpoints
- ✅ Production-ready with Docker and Kubernetes support
- ✅ Mock services for development
- ✅ Structured logging with Winston

---

## 📋 Prerequisites

### System Requirements
```bash
# Minimum Requirements
Node.js: 18.x or higher
npm: 9.x or higher
Docker: 20.x or higher (for containerized deployment)
Kubernetes: 1.24+ (for K8s deployment)

# Recommended Requirements
Node.js: 20.x LTS
npm: 10.x or higher
Docker: 24.x or higher
Kubernetes: 1.28+ with Helm 3.x
```

### Required Knowledge
- Node.js/Express.js development
- JWT authentication concepts
- Docker containerization
- Kubernetes basics (for K8s deployment)
- Keycloak administration (for production)
- Hyperledger Fabric concepts (for production)

---

## 🛠️ Development Deployment

### Quick Start (5 minutes)

```bash
# 1. Navigate to auth service directory
cd treetracker-auth-service

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start the service
npm start
```

### Development Configuration
The service will start with:
- **Port:** 3001
- **Environment:** Development
- **Mock Services:** Enabled (Keycloak & Fabric)
- **Database:** In-memory storage
- **JWT:** Real tokens with 1-hour expiration

### Verify Development Deployment
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Expected response:
{"success":true,"message":"TreeTracker Auth Service is running","timestamp":"..."}
```

---

## 🧪 Staging Deployment

### Staging Environment Setup

```bash
# 1. Create staging environment file
cp .env.example .env.staging

# 2. Update staging configuration
nano .env.staging
```

### Staging Configuration (.env.staging)
```bash
# Server Configuration
NODE_ENV=staging
PORT=3001
API_PREFIX=/api/v1

# Keycloak Configuration (Staging)
KEYCLOAK_URL=https://keycloak-staging.your-domain.com
KEYCLOAK_REALM=treetracker
KEYCLOAK_CLIENT_ID=treetracker-auth-staging
KEYCLOAK_CLIENT_SECRET=your-staging-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=your-staging-admin-password

# Hyperledger Fabric Configuration (Staging)
FABRIC_NETWORK_NAME=treetracker-network-staging
FABRIC_CHANNEL_NAME=treechannel-staging
FABRIC_CHAINCODE_NAME=treetracker-staging
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=peer0.org1.staging.com:7051
FABRIC_ORDERER_ENDPOINT=orderer.staging.com:7050
FABRIC_CA_URL=https://ca.org1.staging.com:7054
FABRIC_CA_NAME=ca-org1-staging
FABRIC_ADMIN_USER=admin
FABRIC_ADMIN_PASSWORD=adminpw-staging
FABRIC_TLS_ENABLED=true

# JWT Configuration
JWT_SECRET=your-staging-jwt-secret-min-32-chars-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration (Staging PostgreSQL)
DB_HOST=postgres.staging.svc.cluster.local
DB_PORT=5432
DB_NAME=treetracker_auth_staging
DB_USERNAME=treetracker_auth
DB_PASSWORD=your-staging-db-password

# CORS Configuration
CORS_ORIGIN=https://app-staging.your-domain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Deploy to Staging
```bash
# 1. Build the application
npm run build

# 2. Start with staging configuration
NODE_ENV=staging npm start
```

### Staging Verification
```bash
# Health check
curl https://auth-staging.your-domain.com/api/v1/health

# Registration test
curl -X POST https://auth-staging.your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staging-test",
    "email": "staging@test.com",
    "password": "Test123!",
    "phoneNumber": "+1234567890",
    "region": "Staging"
  }'
```

---

## 🚀 Production Deployment

### Production Prerequisites

1. **Keycloak Server** deployed and accessible
2. **Hyperledger Fabric Network** deployed and accessible
3. **PostgreSQL Database** for user storage
4. **TLS Certificates** for HTTPS
5. **Domain Names** configured
6. **Kubernetes Cluster** (for K8s deployment)

### Production Configuration

#### Step 1: Environment Configuration
```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

#### Production Configuration (.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=3001
API_PREFIX=/api/v1

# Keycloak Configuration (Production)
KEYCLOAK_URL=https://keycloak.your-domain.com
KEYCLOAK_REALM=treetracker
KEYCLOAK_CLIENT_ID=treetracker-auth
KEYCLOAK_CLIENT_SECRET=your-production-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=your-production-admin-password

# Hyperledger Fabric Configuration (Production)
FABRIC_NETWORK_NAME=treetracker-network
FABRIC_CHANNEL_NAME=treechannel
FABRIC_CHAINCODE_NAME=treetracker
FABRIC_CHAINCODE_VERSION=1.0
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=peer0.org1.treetracker.com:7051
FABRIC_ORDERER_ENDPOINT=orderer.treetracker.com:7050
FABRIC_CA_URL=https://ca.org1.treetracker.com:7054
FABRIC_CA_NAME=ca-org1
FABRIC_ADMIN_USER=admin
FABRIC_ADMIN_PASSWORD=your-production-fabric-password
FABRIC_TLS_ENABLED=true

# JWT Configuration (Strong Secrets!)
JWT_SECRET=your-production-jwt-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-production-refresh-secret-minimum-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration (Production PostgreSQL)
DB_HOST=postgres.treetracker.svc.cluster.local
DB_PORT=5432
DB_NAME=treetracker_auth
DB_USERNAME=treetracker_auth
DB_PASSWORD=your-production-db-password
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=10

# CORS Configuration (Restrict to your domains)
CORS_ORIGIN=https://app.treetracker.your-domain.com
CORS_CREDENTIALS=true

# Rate Limiting (Production values)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging (Production level)
LOG_LEVEL=warn
LOG_FORMAT=json

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

#### Step 2: Database Setup
```bash
# Create production database
createdb treetracker_auth

# Run migrations (if applicable)
npm run migrate:production

# Create database user
createuser treetracker_auth
psql -c "ALTER USER treetracker_auth WITH PASSWORD 'your-production-db-password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE treetracker_auth TO treetracker_auth;"
```

#### Step 3: Build Application
```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Verify build
ls -la dist/
```

#### Step 4: Production Deployment Options

Choose one of the deployment methods below:

---

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x (optional)
- Container registry access

### Step 1: Create Kubernetes Namespace
```bash
# Create namespace
kubectl create namespace treetracker

# Set as default namespace
kubectl config set-context --current --namespace=treetracker
```

### Step 2: Create Secrets
```bash
# Create secrets from production environment
kubectl create secret generic auth-secrets \
  --from-literal=KEYCLOAK_CLIENT_SECRET=your-production-client-secret \
  --from-literal=KEYCLOAK_ADMIN_PASSWORD=your-production-admin-password \
  --from-literal=FABRIC_ADMIN_PASSWORD=your-production-fabric-password \
  --from-literal=JWT_SECRET=your-production-jwt-secret \
  --from-literal=JWT_REFRESH_SECRET=your-production-refresh-secret \
  --from-literal=DB_PASSWORD=your-production-db-password \
  -n treetracker

# Create TLS secret (if using cert-manager)
kubectl create secret tls treetracker-auth-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n treetracker
```

### Step 3: Deploy Using Kubernetes Manifests

Use the provided Kubernetes manifests:

```bash
# Apply secrets first
kubectl apply -f k8s/secrets.yaml

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Apply service
kubectl apply -f k8s/service.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml
```

### Complete Kubernetes Manifests

#### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: treetracker-auth-service
  namespace: treetracker
  labels:
    app: treetracker-auth-service
    version: v1.0.0
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: treetracker-auth-service
  template:
    metadata:
      labels:
        app: treetracker-auth-service
        version: v1.0.0
    spec:
      serviceAccountName: treetracker-auth-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: auth-service
        image: your-registry/treetracker-auth-service:1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
          protocol: TCP
        - containerPort: 9090
          name: metrics
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: API_PREFIX
          value: "/api/v1"
        - name: KEYCLOAK_URL
          value: "https://keycloak.your-domain.com"
        - name: KEYCLOAK_REALM
          value: "treetracker"
        - name: KEYCLOAK_CLIENT_ID
          value: "treetracker-auth"
        - name: KEYCLOAK_ADMIN_USERNAME
          value: "admin"
        - name: FABRIC_NETWORK_NAME
          value: "treetracker-network"
        - name: FABRIC_CHANNEL_NAME
          value: "treechannel"
        - name: FABRIC_CHAINCODE_NAME
          value: "treetracker"
        - name: FABRIC_MSP_ID
          value: "Org1MSP"
        - name: FABRIC_PEER_ENDPOINT
          value: "peer0.org1.treetracker.com:7051"
        - name: FABRIC_ORDERER_ENDPOINT
          value: "orderer.treetracker.com:7050"
        - name: FABRIC_CA_URL
          value: "https://ca.org1.treetracker.com:7054"
        - name: FABRIC_CA_NAME
          value: "ca-org1"
        - name: FABRIC_ADMIN_USER
          value: "admin"
        - name: FABRIC_TLS_ENABLED
          value: "true"
        - name: JWT_EXPIRES_IN
          value: "1h"
        - name: JWT_REFRESH_EXPIRES_IN
          value: "7d"
        - name: CORS_ORIGIN
          value: "https://app.treetracker.your-domain.com"
        - name: CORS_CREDENTIALS
          value: "true"
        - name: RATE_LIMIT_WINDOW_MS
          value: "900000"
        - name: RATE_LIMIT_MAX_REQUESTS
          value: "100"
        - name: LOG_LEVEL
          value: "warn"
        - name: LOG_FORMAT
          value: "json"
        - name: ENABLE_METRICS
          value: "true"
        - name: METRICS_PORT
          value: "9090"
        - name: DB_HOST
          value: "postgres.treetracker.svc.cluster.local"
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: "treetracker_auth"
        - name: DB_USERNAME
          value: "treetracker_auth"
        - name: DB_SSL
          value: "true"
        - name: DB_POOL_MIN
          value: "2"
        - name: DB_POOL_MAX
          value: "10"
        # Secrets from environment variables
        - name: KEYCLOAK_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: KEYCLOAK_CLIENT_SECRET
        - name: KEYCLOAK_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: KEYCLOAK_ADMIN_PASSWORD
        - name: FABRIC_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: FABRIC_ADMIN_PASSWORD
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: JWT_SECRET
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: JWT_REFRESH_SECRET
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: DB_PASSWORD
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: wallet-storage
          mountPath: /opt/fabric/wallet
      volumes:
      - name: tmp
        emptyDir: {}
      - name: wallet-storage
        persistentVolumeClaim:
          claimName: fabric-wallet-pvc
      securityContext:
        fsGroup: 2000
```

#### service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: treetracker-auth-service
  namespace: treetracker
  labels:
    app: treetracker-auth-service
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: 3001
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics
  selector:
    app: treetracker-auth-service
```

#### ingress.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: treetracker-auth-ingress
  namespace: treetracker
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
spec:
  tls:
  - hosts:
    - auth.treetracker.your-domain.com
    secretName: treetracker-auth-tls
  rules:
  - host: auth.treetracker.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: treetracker-auth-service
            port:
              number: 3001
```

#### secrets.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
  namespace: treetracker
type: Opaque
stringData:
  KEYCLOAK_CLIENT_SECRET: "your-production-client-secret"
  KEYCLOAK_ADMIN_PASSWORD: "your-production-admin-password"
  FABRIC_ADMIN_PASSWORD: "your-production-fabric-password"
  JWT_SECRET: "your-production-jwt-secret-minimum-32-characters"
  JWT_REFRESH_SECRET: "your-production-refresh-secret-minimum-32-characters"
  DB_PASSWORD: "your-production-db-password"
---
apiVersion: v1
kind: Secret
metadata:
  name: treetracker-auth-tls
  namespace: treetracker
type: kubernetes.io/tls
data:
  tls.crt: # base64 encoded certificate
  tls.key: # base64 encoded private key
```

#### persistent-volume.yaml
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: fabric-wallet-pvc
  namespace: treetracker
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: your-storage-class
```

#### rbac.yaml
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: treetracker-auth-sa
  namespace: treetracker
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: treetracker-auth-role
  namespace: treetracker
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: treetracker-auth-rolebinding
  namespace: treetracker
subjects:
- kind: ServiceAccount
  name: treetracker-auth-sa
  namespace: treetracker
roleRef:
  kind: Role
  name: treetracker-auth-role
  apiGroup: rbac.authorization.k8s.io
```

### Step 4: Deploy with Helm (Alternative)

Create a Helm chart:

```bash
# Create Helm chart structure
helm create treetracker-auth-service

# Update values.yaml with your configuration
# Update templates with your manifests

# Deploy with Helm
helm install treetracker-auth-service ./treetracker-auth-service \
  --namespace treetracker \
  --set image.tag=1.0.0 \
  --set ingress.host=auth.treetracker.your-domain.com
```

### Step 5: Verify Kubernetes Deployment
```bash
# Check deployment status
kubectl get pods -n treetracker
kubectl get svc -n treetracker
kubectl get ingress -n treetracker

# Check logs
kubectl logs -f deployment/treetracker-auth-service -n treetracker

# Test health endpoint
curl https://auth.treetracker.your-domain.com/api/v1/health
```

---

## 🐳 Docker Deployment

### Step 1: Build Docker Image
```bash
# Build the Docker image
docker build -t treetracker-auth-service:1.0.0 .

# Tag for registry
docker tag treetracker-auth-service:1.0.0 your-registry/treetracker-auth-service:1.0.0

# Push to registry
docker push your-registry/treetracker-auth-service:1.0.0
```

### Step 2: Docker Compose Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  auth-service:
    image: your-registry/treetracker-auth-service:1.0.0
    container_name: treetracker-auth-service
    ports:
      - "3001:3001"
      - "9090:9090"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - API_PREFIX=/api/v1
      - KEYCLOAK_URL=https://keycloak.your-domain.com
      - KEYCLOAK_REALM=treetracker
      - KEYCLOAK_CLIENT_ID=treetracker-auth
      - KEYCLOAK_CLIENT_SECRET=your-production-client-secret
      - KEYCLOAK_ADMIN_USERNAME=admin
      - KEYCLOAK_ADMIN_PASSWORD=your-production-admin-password
      - FABRIC_NETWORK_NAME=treetracker-network
      - FABRIC_CHANNEL_NAME=treechannel
      - FABRIC_CHAINCODE_NAME=treetracker
      - FABRIC_MSP_ID=Org1MSP
      - FABRIC_PEER_ENDPOINT=peer0.org1.treetracker.com:7051
      - FABRIC_ORDERER_ENDPOINT=orderer.treetracker.com:7050
      - FABRIC_CA_URL=https://ca.org1.treetracker.com:7054
      - FABRIC_CA_NAME=ca-org1
      - FABRIC_ADMIN_USER=admin
      - FABRIC_ADMIN_PASSWORD=your-production-fabric-password
      - FABRIC_TLS_ENABLED=true
      - JWT_SECRET=your-production-jwt-secret
      - JWT_REFRESH_SECRET=your-production-refresh-secret
      - JWT_EXPIRES_IN=1h
      - JWT_REFRESH_EXPIRES_IN=7d
      - CORS_ORIGIN=https://app.treetracker.your-domain.com
      - CORS_CREDENTIALS=true
      - RATE_LIMIT_WINDOW_MS=900000
      - RATE_LIMIT_MAX_REQUESTS=100
      - LOG_LEVEL=warn
      - LOG_FORMAT=json
      - ENABLE_METRICS=true
      - METRICS_PORT=9090
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=treetracker_auth
      - DB_USERNAME=treetracker_auth
      - DB_PASSWORD=your-production-db-password
      - DB_SSL=true
      - DB_POOL_MIN=2
      - DB_POOL_MAX=10
    depends_on:
      - postgres
    networks:
      - treetracker-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: treetracker-postgres
    environment:
      - POSTGRES_DB=treetracker_auth
      - POSTGRES_USER=treetracker_auth
      - POSTGRES_PASSWORD=your-production-db-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - treetracker-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: treetracker-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - auth-service
    networks:
      - treetracker-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  treetracker-network:
    driver: bridge
```

### Step 3: Deploy with Docker Compose
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f auth-service

# Scale if needed
docker-compose up -d --scale auth-service=3
```

---

## ⚙️ Environment Configuration

### Environment Variables Reference

#### Core Application Settings
```bash
NODE_ENV=production|staging|development|test
PORT=3001
API_PREFIX=/api/v1
```

#### Keycloak Configuration
```bash
KEYCLOAK_URL=https://keycloak.your-domain.com
KEYCLOAK_REALM=treetracker
KEYCLOAK_CLIENT_ID=treetracker-auth
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=your-admin-password
```

#### Hyperledger Fabric Configuration
```bash
FABRIC_NETWORK_NAME=treetracker-network
FABRIC_CHANNEL_NAME=treechannel
FABRIC_CHAINCODE_NAME=treetracker
FABRIC_CHAINCODE_VERSION=1.0
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=peer0.org1.treetracker.com:7051
FABRIC_ORDERER_ENDPOINT=orderer.treetracker.com:7050
FABRIC_CA_URL=https://ca.org1.treetracker.com:7054
FABRIC_CA_NAME=ca-org1
FABRIC_ADMIN_USER=admin
FABRIC_ADMIN_PASSWORD=your-fabric-password
FABRIC_TLS_ENABLED=true
```

#### JWT Configuration
```bash
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

#### Database Configuration
```bash
DB_HOST=postgres.treetracker.svc.cluster.local
DB_PORT=5432
DB_NAME=treetracker_auth
DB_USERNAME=treetracker_auth
DB_PASSWORD=your-db-password
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=10
```

#### Security Configuration
```bash
CORS_ORIGIN=https://app.treetracker.your-domain.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Logging Configuration
```bash
LOG_LEVEL=info|warn|error|debug
LOG_FORMAT=json|pretty
ENABLE_METRICS=true|false
METRICS_PORT=9090
```

---

## ✅ Post-Deployment Verification

### Health Checks
```bash
# Basic health check
curl https://auth.treetracker.your-domain.com/api/v1/health

# Detailed health with dependencies
curl https://auth.treetracker.your-domain.com/api/v1/health/detailed
```

### Functional Tests
```bash
#!/bin/bash
# test-deployment.sh

BASE_URL="https://auth.treetracker.your-domain.com/api/v1"
TEST_USER="deployment-test-$(date +%s)"

echo "Testing TreeTracker Auth Service Deployment..."

# 1. Health Check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | grep -q '"success":true' && echo "✅ Health check passed" || echo "❌ Health check failed"

# 2. Registration
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    &quot;username&quot;: &quot;$TEST_USER&quot;,
    &quot;email&quot;: &quot;$TEST_USER@test.com&quot;,
    &quot;password&quot;: &quot;Test123!&quot;,
    &quot;phoneNumber&quot;: &quot;+1234567890&quot;,
    &quot;region&quot;: &quot;Test Region&quot;
  }")

echo "$REGISTER_RESPONSE" | grep -q '"success":true' && echo "✅ Registration passed" || echo "❌ Registration failed"

# 3. Login
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    &quot;username&quot;: &quot;$TEST_USER&quot;,
    &quot;password&quot;: &quot;Test123!&quot;
  }")

echo "$LOGIN_RESPONSE" | grep -q '"success":true' && echo "✅ Login passed" || echo "❌ Login failed"

# Extract token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 4. Protected endpoint
echo "4. Testing protected endpoint..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | grep -q '"success":true' && echo "✅ Protected endpoint passed" || echo "❌ Protected endpoint failed"

# 5. Fabric enrollment
echo "5. Testing Fabric enrollment..."
FABRIC_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/fabric/enroll" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$FABRIC_RESPONSE" | grep -q '"success":true' && echo "✅ Fabric enrollment passed" || echo "❌ Fabric enrollment failed"

echo "Deployment testing complete!"
```

### Performance Tests
```bash
# Load test with Apache Bench
ab -n 1000 -c 10 https://auth.treetracker.your-domain.com/api/v1/health

# Concurrent registration test
for i in {1..10}; do
  curl -X POST https://auth.treetracker.your-domain.com/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      &quot;username&quot;: &quot;perf-test-$i&quot;,
      &quot;email&quot;: &quot;perf-test-$i@test.com&quot;,
      &quot;password&quot;: &quot;Test123!&quot;,
      &quot;phoneNumber&quot;: &quot;+1234567890&quot;,
      &quot;region&quot;: &quot;Performance Test&quot;
    }" &
done
wait
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Service Won't Start
**Symptoms:** Service fails to start or crashes immediately

**Solutions:**
```bash
# Check logs
kubectl logs -f deployment/treetracker-auth-service -n treetracker

# Check environment variables
kubectl describe pod <pod-name> -n treetracker

# Verify secrets
kubectl get secrets -n treetracker

# Check resource limits
kubectl top pods -n treetracker
```

#### Issue 2: Database Connection Failed
**Symptoms:** "Database connection failed" errors

**Solutions:**
```bash
# Test database connectivity
kubectl exec -it <pod-name> -n treetracker -- nc -zv postgres.treetracker.svc.cluster.local 5432

# Check database credentials
kubectl get secret auth-secrets -n treetracker -o yaml

# Verify database is running
kubectl get pods -n treetracker | grep postgres
```

#### Issue 3: Keycloak Integration Issues
**Symptoms:** "Keycloak connection failed" or authentication errors

**Solutions:**
```bash
# Test Keycloak connectivity
kubectl exec -it <pod-name> -n treetracker -- nc -zv keycloak.your-domain.com 443

# Check Keycloak client configuration
# Login to Keycloak admin console and verify:
# - Client ID matches
# - Client secret is correct
# - Redirect URIs are configured
# - Realm exists
```

#### Issue 4: Fabric Integration Issues
**Symptoms:** "Fabric enrollment failed" or blockchain errors

**Solutions:**
```bash
# Test Fabric connectivity
kubectl exec -it <pod-name> -n treetracker -- nc -zv peer0.org1.treetracker.com 7051

# Check connection profile
kubectl get configmap fabric-connection-profile -n treetracker -o yaml

# Verify Fabric network is accessible
# Check peer logs, orderer logs, CA logs
```

#### Issue 5: JWT Token Issues
**Symptoms:** "Invalid token" or authentication failures

**Solutions:**
```bash
# Check JWT secret configuration
kubectl get secret auth-secrets -n treetracker -o yaml | grep JWT

# Verify token expiration settings
# Check if tokens are being refreshed properly
# Monitor token refresh logs
```

#### Issue 6: CORS Issues
**Symptoms:** "CORS policy blocked" errors in browser

**Solutions:**
```bash
# Check CORS configuration
kubectl describe deployment treetracker-auth-service -n treetracker | grep CORS

# Verify web app origin is allowed
# Check if credentials are properly configured
```

---

## 📊 Monitoring & Maintenance

### Monitoring Setup

#### Prometheus Metrics
The service exposes metrics at `/metrics` endpoint:
```bash
# Check metrics
curl https://auth.treetracker.your-domain.com/metrics

# Key metrics to monitor:
# - http_requests_total
# - http_request_duration_seconds
# - auth_registrations_total
# - auth_logins_total
# - auth_token_refreshes_total
# - fabric_enrollments_total
# - database_connections_active
# - keycloak_connections_active
# - fabric_connections_active
```

#### Grafana Dashboard
Create a Grafana dashboard with these panels:
- Request rate and latency
- Authentication success/failure rates
- Token refresh rates
- Database connection pool status
- External service health (Keycloak, Fabric)
- Error rates and types

#### Alerting Rules
Set up alerts for:
- High error rate (>5%)
- High latency (>1s)
- Service unavailable
- High memory usage (>80%)
- High CPU usage (>80%)
- Database connection failures
- External service failures

### Log Management

#### Structured Logging
```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2025-10-15T10:30:00.000Z",
  "service": "treetracker-auth-service",
  "environment": "production",
  "error": {
    "code": "ECONNREFUSED",
    "message": "Connection refused",
    "stack": "..."
  },
  "request": {
    "method": "POST",
    "url": "/api/v1/auth/register",
    "ip": "10.0.0.1"
  },
  "user": {
    "id": "user-123",
    "username": "testuser"
  }
}
```

#### Log Aggregation
Set up centralized logging with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd/Fluent Bit for log collection
- Loki + Grafana for log storage and visualization

### Backup and Recovery

#### Database Backup
```bash
# Daily PostgreSQL backup
kubectl create cronjob postgres-backup --schedule="0 2 * * *" \
  --image=postgres:15-alpine \
  --command -- pg_dump -h postgres.treetracker.svc.cluster.local \
  -U treetracker_auth -d treetracker_auth > /backup/backup.sql

# Wallet backup (if using persistent storage)
kubectl create cronjob wallet-backup --schedule="0 3 * * *" \
  --image=alpine:latest \
  --command -- tar -czf /backup/wallet-$(date +%Y%m%d).tar.gz /opt/fabric/wallet
```

#### Disaster Recovery
```bash
# Database restore
psql -h postgres.treetracker.svc.cluster.local \
  -U treetracker_auth -d treetracker_auth < backup.sql

# Wallet restore
tar -xzf wallet-backup.tar.gz -C /opt/fabric/
```

### Performance Optimization

#### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE username = 'testuser';

-- Update statistics
ANALYZE users;
```

#### Application Tuning
```bash
# Connection pool optimization
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=10000

# Memory optimization
NODE_OPTIONS="--max-old-space-size=512"

# CPU optimization
UV_THREADPOOL_SIZE=16
```

### Security Maintenance

#### Regular Security Updates
```bash
# Update base image
docker pull node:20-alpine

# Update dependencies
npm audit
npm audit fix

# Security scanning
docker scan your-registry/treetracker-auth-service:1.0.0
```

#### Certificate Management
```bash
# Certificate renewal (if using cert-manager)
kubectl get certificate -n treetracker

# Manual certificate renewal
kubectl create secret tls treetracker-auth-tls \
  --cert=new-cert.crt \
  --key=new-key.key \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## 📚 Additional Resources

### Documentation Files
- `README.md` - Service overview and quick start
- `DEPLOYMENT_GUIDE.md` - This comprehensive deployment guide
- `API_DOCUMENTATION.md` - Complete API reference
- `CONFIGURATION_REFERENCE.md` - Environment variables reference
- `TROUBLESHOOTING_GUIDE.md` - Common issues and solutions

### External Resources
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Community Support
- TreeTracker Discord Channel
- Hyperledger Fabric Community
- Keycloak User Forum
- Kubernetes Slack Channel

---

## 🎉 Deployment Complete!

Congratulations! You have successfully deployed the TreeTracker Authentication Service.

### What's Next?
1. **Test the deployment** using the verification scripts
2. **Set up monitoring** with Prometheus and Grafana
3. **Configure alerting** for critical issues
4. **Plan for scaling** based on expected traffic
5. **Document your specific configuration** for your team
6. **Set up CI/CD pipeline** for automated deployments

### Support
If you encounter any issues during deployment:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Verify all prerequisites are met
4. Consult the documentation files
5. Reach out to the community for help

**Happy deploying! 🚀**

---

*Document Version: 1.0*  
*Last Updated: 2025-10-15*  
*Status: Production Ready*