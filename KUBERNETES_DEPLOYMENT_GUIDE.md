# TreeTracker Authentication Service
# Kubernetes Deployment Documentation Guide

## 📋 Complete Guide to Deploying TreeTracker Auth Service on Kubernetes

This comprehensive guide covers everything you need to deploy the TreeTracker Authentication Service to Kubernetes, from basic deployment to production-ready configuration with monitoring, scaling, and security.

---

## 🎯 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Deployment](#quick-start-deployment)
3. [Detailed Deployment Guide](#detailed-deployment-guide)
4. [Configuration Management](#configuration-management)
5. [Security Setup](#security-setup)
6. [Monitoring & Observability](#monitoring--observability)
7. [Scaling & Performance](#scaling--performance)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Production Checklist](#production-checklist)
11. [Advanced Configurations](#advanced-configurations)

---

## ✅ Prerequisites

### Required Knowledge
- Basic Kubernetes concepts (Pods, Services, Deployments)
- kubectl command-line tool
- Docker containerization
- YAML syntax
- Basic networking concepts

### Required Infrastructure
- Kubernetes cluster (v1.20+)
- kubectl configured with cluster access
- Container registry access (Docker Hub, ECR, GCR, etc.)
- Domain name and DNS access
- TLS/SSL certificates (Let's Encrypt or custom)

### Required Tools
```bash
# Install required tools
kubectl version --client
helm version  # Optional, for Helm deployments
docker --version
```

### Cluster Requirements
```yaml
# Minimum cluster specifications
nodes: 2+ (for high availability)
cpu: 2 cores per node minimum
memory: 4GB per node minimum
storage: 20GB+ available
networking: Load balancer support
```

---

## 🚀 Quick Start Deployment

### Step 1: Clone and Prepare
```bash
# Navigate to auth service directory
cd /workspace/treetracker-auth-service

# Verify Kubernetes manifests exist
ls -la k8s/
```

### Step 2: Basic Deployment (5 minutes)
```bash
# Create namespace
kubectl create namespace treetracker

# Apply basic configuration
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Verify deployment
kubectl get pods -n treetracker
kubectl get svc -n treetracker
```

### Step 3: Access the Service
```bash
# Port forward for testing
kubectl port-forward svc/treetracker-auth-service 3001:3001 -n treetracker

# Test health endpoint
curl http://localhost:3001/api/v1/health
```

---

## 📖 Detailed Deployment Guide

### 1. Namespace Configuration

Create a dedicated namespace for the TreeTracker services:

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: treetracker
  labels:
    name: treetracker
    environment: production
    app.kubernetes.io/name: treetracker
    app.kubernetes.io/component: authentication
```

Apply the namespace:
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Secrets Management

Create Kubernetes secrets for sensitive configuration:

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: treetracker-auth-secrets
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: secrets
type: Opaque
stringData:
  # Keycloak Configuration
  KEYCLOAK_CLIENT_SECRET: "your-keycloak-client-secret"
  KEYCLOAK_ADMIN_PASSWORD: "your-keycloak-admin-password"
  
  # JWT Configuration
  JWT_SECRET: "your-super-secret-jwt-key-min-32-characters"
  JWT_REFRESH_SECRET: "your-super-secret-refresh-key-min-32-characters"
  
  # Database Configuration
  DB_PASSWORD: "your-database-password"
  
  # Fabric Configuration
  FABRIC_ADMIN_PASSWORD: "your-fabric-admin-password"
  FABRIC_CA_ADMIN_PASSWORD: "your-fabric-ca-admin-password"
---
apiVersion: v1
kind: Secret
metadata:
  name: treetracker-auth-tls
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: tls
type: kubernetes.io/tls
data:
  tls.crt: # base64 encoded certificate
  tls.key: # base64 encoded private key
```

Create secrets:
```bash
# Generate strong secrets
openssl rand -base64 32 > jwt-secret.txt
openssl rand -base64 32 > jwt-refresh-secret.txt

# Apply secrets
kubectl apply -f k8s/secrets.yaml
```

### 3. ConfigMap Configuration

Create ConfigMap for non-sensitive configuration:

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-config
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: config
data:
  # Application Configuration
  NODE_ENV: "production"
  API_PREFIX: "/api/v1"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  
  # Keycloak Configuration
  KEYCLOAK_URL: "https://keycloak.your-domain.com"
  KEYCLOAK_REALM: "treetracker"
  KEYCLOAK_CLIENT_ID: "treetracker-auth"
  KEYCLOAK_ADMIN_USERNAME: "admin"
  
  # Hyperledger Fabric Configuration
  FABRIC_NETWORK_NAME: "treetracker-network"
  FABRIC_CHANNEL_NAME: "treechannel"
  FABRIC_CHAINCODE_NAME: "treetracker"
  FABRIC_CHAINCODE_VERSION: "1.0"
  FABRIC_MSP_ID: "Org1MSP"
  FABRIC_PEER_ENDPOINT: "peer0.org1.treetracker.com:7051"
  FABRIC_ORDERER_ENDPOINT: "orderer.treetracker.com:7050"
  FABRIC_CA_URL: "https://ca.org1.treetracker.com:7054"
  FABRIC_CA_NAME: "ca-org1"
  FABRIC_ADMIN_USER: "admin"
  FABRIC_TLS_ENABLED: "true"
  
  # JWT Configuration
  JWT_EXPIRES_IN: "1h"
  JWT_REFRESH_EXPIRES_IN: "7d"
  
  # CORS Configuration
  CORS_ORIGIN: "https://treetracker.your-domain.com,https://app.treetracker.your-domain.com"
  CORS_CREDENTIALS: "true"
  
  # Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  
  # Database Configuration
  DB_HOST: "postgres.treetracker.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "treetracker_auth"
  DB_USERNAME: "treetracker_auth"
  
  # Wallet Configuration
  WALLET_PATH: "/opt/fabric/wallet"
  WALLET_TYPE: "FileSystemWallet"
  
  # Monitoring Configuration
  ENABLE_METRICS: "true"
  METRICS_PORT: "9090"
```

Apply the ConfigMap:
```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Persistent Volume Configuration

Create persistent storage for Fabric wallet:

```yaml
# k8s/persistent-volume.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: treetracker-auth-wallet-pvc
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: storage
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: "your-storage-class"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: treetracker-auth-logs-pvc
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: logs
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: "your-storage-class"
```

### 5. Deployment Configuration

Create the main deployment with proper resource management:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: treetracker-auth-service
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
    app.kubernetes.io/version: "1.0.0"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: treetracker-auth
      app.kubernetes.io/component: api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: treetracker-auth
        app.kubernetes.io/component: api
        app.kubernetes.io/version: "1.0.0"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: treetracker-auth-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: treetracker-auth
        image: treetracker-auth-service:1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 3001
          protocol: TCP
        - name: metrics
          containerPort: 9090
          protocol: TCP
        env:
        - name: PORT
          value: "3001"
        - name: NODE_ENV
          value: "production"
        envFrom:
        - configMapRef:
            name: treetracker-auth-config
        - secretRef:
            name: treetracker-auth-secrets
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
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /api/v1/health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 10
        volumeMounts:
        - name: wallet-storage
          mountPath: /opt/fabric/wallet
          readOnly: false
        - name: logs-storage
          mountPath: /var/log/treetracker-auth
          readOnly: false
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
      volumes:
      - name: wallet-storage
        persistentVolumeClaim:
          claimName: treetracker-auth-wallet-pvc
      - name: logs-storage
        persistentVolumeClaim:
          claimName: treetracker-auth-logs-pvc
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app.kubernetes.io/name
                  operator: In
                  values:
                  - treetracker-auth
              topologyKey: kubernetes.io/hostname
      tolerations:
      - key: "node.kubernetes.io/not-ready"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 300
      - key: "node.kubernetes.io/unreachable"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 300
```

### 6. Service Configuration

Create Kubernetes service for internal communication:

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: treetracker-auth-service
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: http
    protocol: TCP
    name: http
  - port: 9090
    targetPort: metrics
    protocol: TCP
    name: metrics
  selector:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
---
apiVersion: v1
kind: Service
metadata:
  name: treetracker-auth-service-headless
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - port: 3001
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
```

### 7. Ingress Configuration

Create ingress for external access with TLS:

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: treetracker-auth-ingress
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/cors-enable: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://treetracker.your-domain.com,https://app.treetracker.your-domain.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
spec:
  ingressClassName: nginx
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

### 8. RBAC Configuration

Create service account and RBAC permissions:

```yaml
# k8s/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: treetracker-auth-sa
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: rbac
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: treetracker-auth-role
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: rbac
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: treetracker-auth-rolebinding
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: rbac
subjects:
- kind: ServiceAccount
  name: treetracker-auth-sa
  namespace: treetracker
roleRef:
  kind: Role
  name: treetracker-auth-role
  apiGroup: rbac.authorization.k8s.io
```

### 9. Network Policy Configuration

Create network policies for security:

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: treetracker-auth-network-policy
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: security
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: treetracker-auth
      app.kubernetes.io/component: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - namespaceSelector:
        matchLabels:
          name: treetracker
    - podSelector:
        matchLabels:
          app.kubernetes.io/name: treetracker-web
    ports:
    - protocol: TCP
      port: 3001
    - protocol: TCP
      port: 9090
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: keycloak
    ports:
    - protocol: TCP
      port: 8080
      port: 8443
  - to:
    - namespaceSelector:
        matchLabels:
          name: hyperledger-fabric
    ports:
    - protocol: TCP
      port: 7051
      port: 7050
      port: 7054
  - to:
    - namespaceSelector:
        matchLabels:
          name: default
    ports:
    - protocol: TCP
      port: 5432
```

---

## 🔐 Configuration Management

### Environment Variables Reference

```yaml
# Complete environment variables reference
env:
  # Server Configuration
  NODE_ENV: "production"
  PORT: "3001"
  API_PREFIX: "/api/v1"
  
  # Keycloak Configuration
  KEYCLOAK_URL: "https://keycloak.your-domain.com"
  KEYCLOAK_REALM: "treetracker"
  KEYCLOAK_CLIENT_ID: "treetracker-auth"
  KEYCLOAK_CLIENT_SECRET: # From secret
  KEYCLOAK_ADMIN_USERNAME: "admin"
  KEYCLOAK_ADMIN_PASSWORD: # From secret
  
  # Hyperledger Fabric Configuration
  FABRIC_NETWORK_NAME: "treetracker-network"
  FABRIC_CHANNEL_NAME: "treechannel"
  FABRIC_CHAINCODE_NAME: "treetracker"
  FABRIC_CHAINCODE_VERSION: "1.0"
  FABRIC_MSP_ID: "Org1MSP"
  FABRIC_PEER_ENDPOINT: "peer0.org1.treetracker.com:7051"
  FABRIC_ORDERER_ENDPOINT: "orderer.treetracker.com:7050"
  FABRIC_CA_URL: "https://ca.org1.treetracker.com:7054"
  FABRIC_CA_NAME: "ca-org1"
  FABRIC_ADMIN_USER: "admin"
  FABRIC_ADMIN_PASSWORD: # From secret
  FABRIC_TLS_ENABLED: "true"
  
  # JWT Configuration
  JWT_SECRET: # From secret
  JWT_EXPIRES_IN: "1h"
  JWT_REFRESH_EXPIRES_IN: "7d"
  
  # Database Configuration
  DB_HOST: "postgres.treetracker.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "treetracker_auth"
  DB_USERNAME: "treetracker_auth"
  DB_PASSWORD: # From secret
  
  # CORS Configuration
  CORS_ORIGIN: "https://treetracker.your-domain.com"
  CORS_CREDENTIALS: "true"
  
  # Rate Limiting
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  
  # Logging
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  
  # Monitoring
  ENABLE_METRICS: "true"
  METRICS_PORT: "9090"
```

### ConfigMap for Different Environments

```yaml
# k8s/configmap-production.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-config-production
  namespace: treetracker
data:
  NODE_ENV: "production"
  LOG_LEVEL: "warn"
  RATE_LIMIT_MAX_REQUESTS: "50"
  ENABLE_METRICS: "true"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-config-staging
  namespace: treetracker
data:
  NODE_ENV: "staging"
  LOG_LEVEL: "info"
  RATE_LIMIT_MAX_REQUESTS: "100"
  ENABLE_METRICS: "true"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-config-development
  namespace: treetracker
data:
  NODE_ENV: "development"
  LOG_LEVEL: "debug"
  RATE_LIMIT_MAX_REQUESTS: "200"
  ENABLE_METRICS: "false"
```

---

## 🔒 Security Setup

### 1. Pod Security Standards

Apply Pod Security Standards to the namespace:

```yaml
# k8s/pod-security.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: treetracker
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 2. Security Context Configuration

```yaml
# Enhanced security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 2000
  fsGroup: 2000
  seccompProfile:
    type: RuntimeDefault
```

### 3. Network Policies

Create comprehensive network policies:

```yaml
# k8s/network-policy-strict.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: treetracker-auth-strict-policy
  namespace: treetracker
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: treetracker-auth
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 3001
    - protocol: TCP
      port: 9090
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: keycloak
    ports:
    - protocol: TCP
      port: 8080
      port: 8443
  - to:
    - namespaceSelector:
        matchLabels:
          name: hyperledger-fabric
    ports:
    - protocol: TCP
      port: 7051
      port: 7050
      port: 7054
```

### 4. RBAC Best Practices

Create least-privilege RBAC configuration:

```yaml
# k8s/rbac-strict.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: treetracker-auth-metrics-reader
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: treetracker-auth-metrics-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: treetracker-auth-metrics-reader
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitoring
```

---

## 📊 Monitoring & Observability

### 1. Prometheus ServiceMonitor

```yaml
# k8s/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: treetracker-auth-service-monitor
  namespace: monitoring
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: monitoring
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: treetracker-auth
      app.kubernetes.io/component: api
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
    honorLabels: true
```

### 2. Prometheus Rules

```yaml
# k8s/prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: treetracker-auth-alerts
  namespace: monitoring
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: monitoring
spec:
  groups:
  - name: treetracker-auth
    interval: 30s
    rules:
    - alert: TreeTrackerAuthServiceDown
      expr: up{job="treetracker-auth-service"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "TreeTracker Auth Service is down"
        description: "TreeTracker Auth Service has been down for more than 5 minutes"
    
    - alert: TreeTrackerAuthHighErrorRate
      expr: rate(http_requests_total{job="treetracker-auth-service",status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate in TreeTracker Auth Service"
        description: "Error rate is {{ $value }} errors per second"
    
    - alert: TreeTrackerAuthHighLatency
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="treetracker-auth-service"}[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High latency in TreeTracker Auth Service"
        description: "95th percentile latency is {{ $value }} seconds"
    
    - alert: TreeTrackerAuthHighMemoryUsage
      expr: container_memory_usage_bytes{pod=~"treetracker-auth-service-.*"} / container_spec_memory_limit_bytes > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage in TreeTracker Auth Service"
        description: "Memory usage is {{ $value | humanizePercentage }}"
    
    - alert: TreeTrackerAuthHighCPUUsage
      expr: rate(container_cpu_usage_seconds_total{pod=~"treetracker-auth-service-.*"}[5m]) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage in TreeTracker Auth Service"
        description: "CPU usage is {{ $value | humanizePercentage }}"
```

### 3. Grafana Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "TreeTracker Auth Service",
    "tags": ["treetracker", "authentication"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=&quot;treetracker-auth-service&quot;}[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=&quot;treetracker-auth-service&quot;,status=~&quot;5..&quot;}[5m])",
            "legendFormat": "5xx Errors"
          }
        ]
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=&quot;treetracker-auth-service&quot;}[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{pod=~&quot;treetracker-auth-service-.*&quot;}",
            "legendFormat": "Memory Usage"
          }
        ]
      },
      {
        "id": 5,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{pod=~&quot;treetracker-auth-service-.*&quot;}[5m])",
            "legendFormat": "CPU Usage"
          }
        ]
      }
    ]
  }
}
```

### 4. Logging Configuration

```yaml
# k8s/logging.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-logging
  namespace: treetracker
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
    [INPUT]
        Name              tail
        Path              /var/log/treetracker-auth/*.log
        Parser            json
        Tag               treetracker.auth
        Refresh_Interval  5
    [FILTER]
        Name              kubernetes
        Match             treetracker.auth
        Kube_URL          https://kubernetes.default.svc:443
        Kube_CA_File      /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File   /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix   treetracker.auth
        Merge_Log         On
        Keep_Log          Off
    [OUTPUT]
        Name              elasticsearch
        Match             treetracker.auth
        Host              elasticsearch.logging.svc.cluster.local
        Port              9200
        Index             treetracker-auth
        Type              _doc
```

---

## 🚀 Scaling & Performance

### 1. Horizontal Pod Autoscaler (HPA)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: treetracker-auth-hpa
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: scaling
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: treetracker-auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### 2. Vertical Pod Autoscaler (VPA)

```yaml
# k8s/vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: treetracker-auth-vpa
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: scaling
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: treetracker-auth-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: treetracker-auth
      maxAllowed:
        cpu: 2
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
      controlledResources: ["cpu", "memory"]
```

### 3. Pod Disruption Budget (PDB)

```yaml
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: treetracker-auth-pdb
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: availability
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: treetracker-auth
      app.kubernetes.io/component: api
```

### 4. Performance Optimization

```yaml
# k8s/performance-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-performance
  namespace: treetracker
data:
  # Connection Pool Settings
  DB_POOL_MIN: "5"
  DB_POOL_MAX: "20"
  DB_POOL_ACQUIRE: "30000"
  DB_POOL_IDLE: "10000"
  
  # Cache Settings
  CACHE_TTL: "300"
  CACHE_MAX_SIZE: "1000"
  
  # Request Settings
  REQUEST_TIMEOUT: "30000"
  MAX_REQUEST_SIZE: "10mb"
  
  # Compression Settings
  COMPRESSION_ENABLED: "true"
  COMPRESSION_THRESHOLD: "1024"
```

---

## 💾 Backup & Disaster Recovery

### 1. Backup Strategy

```yaml
# k8s/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: treetracker-auth-backup
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app.kubernetes.io/name: treetracker-auth
            app.kubernetes.io/component: backup
        spec:
          serviceAccountName: treetracker-auth-backup-sa
          containers:
          - name: backup
            image: postgres:14-alpine
            command:
            - /bin/sh
            - -c
            - |
              DATE=$(date +%Y%m%d_%H%M%S)
              PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_NAME > /backup/treetracker-auth-$DATE.sql
              aws s3 cp /backup/treetracker-auth-$DATE.sql s3://your-backup-bucket/treetracker-auth/$DATE/
              tar -czf /backup/wallet-$DATE.tar.gz /wallet
              aws s3 cp /backup/wallet-$DATE.tar.gz s3://your-backup-bucket/treetracker-auth/$DATE/
            env:
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: treetracker-auth-config
                  key: DB_HOST
            - name: DB_USERNAME
              valueFrom:
                configMapKeyRef:
                  name: treetracker-auth-config
                  key: DB_USERNAME
            - name: DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: treetracker-auth-config
                  key: DB_NAME
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: treetracker-auth-secrets
                  key: DB_PASSWORD
            volumeMounts:
            - name: wallet-backup
              mountPath: /wallet
              readOnly: true
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: wallet-backup
            persistentVolumeClaim:
              claimName: treetracker-auth-wallet-pvc
          - name: backup-storage
            emptyDir: {}
          restartPolicy: OnFailure
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
```

### 2. Disaster Recovery Plan

```yaml
# k8s/disaster-recovery.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-disaster-recovery
  namespace: treetracker
data:
  recovery-plan.md: |
    # TreeTracker Auth Service Disaster Recovery Plan
    
    ## Recovery Time Objectives (RTO)
    - Critical Services: 1 hour
    - Full Recovery: 4 hours
    
    ## Recovery Point Objectives (RPO)
    - Database: 24 hours maximum
    - Wallet Data: 1 hour maximum
    
    ## Recovery Procedures
    
    ### 1. Database Recovery
    ```bash
    # Restore from backup
    DATE="20240115_020000"
    aws s3 cp s3://your-backup-bucket/treetracker-auth/$DATE/treetracker-auth-$DATE.sql /tmp/
    kubectl exec -it postgres-0 -n treetracker -- psql -U treetracker_auth -d treetracker_auth < /tmp/treetracker-auth-$DATE.sql
    ```
    
    ### 2. Wallet Recovery
    ```bash
    # Restore wallet data
    DATE="20240115_020000"
    aws s3 cp s3://your-backup-bucket/treetracker-auth/$DATE/wallet-$DATE.tar.gz /tmp/
    kubectl exec -it treetracker-auth-service-0 -n treetracker -- tar -xzf /tmp/wallet-$DATE.tar.gz -C /opt/fabric/
    ```
    
    ### 3. Configuration Recovery
    ```bash
    # Restore from Git repository
    git clone https://github.com/your-org/treetracker-auth-service.git
    cd treetracker-auth-service
    kubectl apply -f k8s/
    ```
    
    ### 4. Validation
    ```bash
    # Test service health
    kubectl exec -it treetracker-auth-service-0 -n treetracker -- curl http://localhost:3001/api/v1/health
    
    # Test authentication
    kubectl exec -it treetracker-auth-service-0 -n treetracker -- curl -X POST http://localhost:3001/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"test","password":"test"}'
    ```
```

### 3. Backup Validation

```yaml
# k8s/backup-validation.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: treetracker-auth-backup-validation
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: backup-validation
spec:
  schedule: "0 3 * * *"  # Daily at 3 AM
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app.kubernetes.io/name: treetracker-auth
            app.kubernetes.io/component: backup-validation
        spec:
          containers:
          - name: backup-validation
            image: postgres:14-alpine
            command:
            - /bin/sh
            - -c
            - |
              # Download latest backup
              LATEST_BACKUP=$(aws s3 ls s3://your-backup-bucket/treetracker-auth/ | tail -1 | awk '{print $2}')
              aws s3 cp s3://your-backup-bucket/treetracker-auth/$LATEST_BACKUP/treetracker-auth-*.sql /tmp/backup.sql
              
              # Validate backup
              pg_restore --list /tmp/backup.sql > /tmp/backup-contents.txt
              
              # Check if critical tables exist
              if grep -q "users" /tmp/backup-contents.txt; then
                echo "✅ Users table found in backup"
              else
                echo "❌ Users table missing from backup"
                exit 1
              fi
              
              # Send notification
              curl -X POST https://your-notification-service.com/backup-validation \
                -H "Content-Type: application/json" \
                -d "{&quot;status&quot;: &quot;success&quot;, &quot;backup&quot;: &quot;$LATEST_BACKUP&quot;}"
          restartPolicy: OnFailure
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Pod Not Starting

**Issue:** Pod stuck in `Pending` state
```bash
# Check pod events
kubectl describe pod <pod-name> -n treetracker

# Check node resources
kubectl top nodes
kubectl describe nodes

# Check PVC status
kubectl get pvc -n treetracker
```

**Solution:**
```bash
# Scale up cluster if needed
kubectl scale deployment cluster-autoscaler -n kube-system --replicas=1

# Check storage class
kubectl get storageclass

# Create PVC manually if needed
kubectl apply -f k8s/persistent-volume.yaml
```

#### 2. Service Not Accessible

**Issue:** Cannot reach the service
```bash
# Check service endpoints
kubectl get endpoints treetracker-auth-service -n treetracker

# Check ingress status
kubectl get ingress treetracker-auth-ingress -n treetracker

# Check DNS resolution
nslookup auth.treetracker.your-domain.com

# Check certificate status
kubectl get certificate -n treetracker
```

**Solution:**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check DNS records
dig auth.treetracker.your-domain.com

# Check certificate issuer
kubectl describe clusterissuer letsencrypt-prod
```

#### 3. Authentication Issues

**Issue:** Keycloak integration not working
```bash
# Check Keycloak connectivity
kubectl exec -it <pod-name> -n treetracker -- curl -v http://keycloak.your-domain.com/auth/realms/treetracker/.well-known/openid-configuration

# Check Keycloak client configuration
kubectl logs <pod-name> -n treetracker | grep -i keycloak

# Test JWT token generation
kubectl exec -it <pod-name> -n treetracker -- curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Solution:**
```bash
# Update Keycloak configuration
kubectl edit configmap treetracker-auth-config -n treetracker

# Restart pods to pick up new configuration
kubectl rollout restart deployment treetracker-auth-service -n treetracker

# Check Keycloak logs
kubectl logs -f deployment/keycloak -n keycloak
```

#### 4. Fabric Integration Issues

**Issue:** Hyperledger Fabric connection problems
```bash
# Check Fabric connectivity
kubectl exec -it <pod-name> -n treetracker -- curl -v http://ca.org1.treetracker.com:7054

# Check connection profile
kubectl get configmap fabric-connection-profile -n hyperledger-fabric -o yaml

# Check wallet storage
kubectl exec -it <pod-name> -n treetracker -- ls -la /opt/fabric/wallet/
```

**Solution:**
```bash
# Update connection profile
kubectl edit configmap fabric-connection-profile -n hyperledger-fabric

# Check Fabric CA status
kubectl get pods -n hyperledger-fabric

# Verify TLS certificates
kubectl exec -it <pod-name> -n treetracker -- openssl s_client -connect ca.org1.treetracker.com:7054
```

### Debugging Commands

```bash
# Comprehensive debugging script
#!/bin/bash

echo "=== TreeTracker Auth Service Debugging ==="

echo "1. Checking pod status..."
kubectl get pods -n treetracker -l app.kubernetes.io/name=treetracker-auth

echo "2. Checking service status..."
kubectl get svc -n treetracker -l app.kubernetes.io/name=treetracker-auth

echo "3. Checking ingress status..."
kubectl get ingress -n treetracker treetracker-auth-ingress

echo "4. Checking logs..."
kubectl logs -n treetracker -l app.kubernetes.io/name=treetracker-auth --tail=50

echo "5. Checking events..."
kubectl get events -n treetracker --sort-by='.lastTimestamp' | grep -i treetracker-auth

echo "6. Testing health endpoint..."
kubectl exec -n treetracker deployment/treetracker-auth-service -- curl -s http://localhost:3001/api/v1/health

echo "7. Checking resource usage..."
kubectl top pods -n treetracker -l app.kubernetes.io/name=treetracker-auth

echo "8. Checking network policies..."
kubectl get networkpolicy -n treetracker -l app.kubernetes.io/name=treetracker-auth

echo "9. Checking RBAC..."
kubectl get role,rolebinding -n treetracker -l app.kubernetes.io/name=treetracker-auth

echo "10. Checking secrets..."
kubectl get secrets -n treetracker -l app.kubernetes.io/name=treetracker-auth
```

---

## ✅ Production Checklist

### Pre-Deployment Checklist

#### Infrastructure
- [ ] Kubernetes cluster is running and healthy
- [ ] kubectl is configured with cluster access
- [ ] Container registry is accessible
- [ ] DNS is configured for domain names
- [ ] TLS certificates are available
- [ ] Load balancer is configured
- [ ] Storage class is available

#### Security
- [ ] Pod Security Standards are applied
- [ ] Network policies are configured
- [ ] RBAC is properly configured
- [ ] Secrets are created with strong passwords
- [ ] TLS is configured for all external communications
- [ ] Service mesh is configured (if applicable)

#### Configuration
- [ ] All ConfigMaps are created and validated
- [ ] Environment variables are correctly set
- [ ] Keycloak configuration is complete
- [ ] Hyperledger Fabric configuration is complete
- [ ] Database configuration is complete

#### Monitoring
- [ ] Prometheus is configured
- [ ] Grafana dashboards are created
- [ ] Alert rules are configured
- [ ] Logging is configured
- [ ] Health checks are working

#### Backup
- [ ] Backup strategy is defined
- [ ] Backup CronJob is configured
- [ ] Backup validation is configured
- [ ] Disaster recovery plan is documented

### Deployment Checklist

#### Step 1: Namespace and RBAC
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rbac.yaml
```

#### Step 2: Configuration
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
```

#### Step 3: Storage
```bash
kubectl apply -f k8s/persistent-volume.yaml
```

#### Step 4: Network Policies
```bash
kubectl apply -f k8s/network-policy.yaml
```

#### Step 5: Application Deployment
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

#### Step 6: Scaling and Monitoring
```bash
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/vpa.yaml
kubectl apply -f k8s/pdb.yaml
kubectl apply -f k8s/servicemonitor.yaml
kubectl apply -f k8s/prometheus-rules.yaml
```

#### Step 7: Backup and Recovery
```bash
kubectl apply -f k8s/backup-cronjob.yaml
kubectl apply -f k8s/backup-validation.yaml
```

### Post-Deployment Validation

#### Health Checks
```bash
# Test health endpoint
curl https://auth.treetracker.your-domain.com/api/v1/health

# Test authentication
curl -X POST https://auth.treetracker.your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!","phoneNumber":"+1234567890","region":"Test"}'

# Test login
curl -X POST https://auth.treetracker.your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!"}'
```

#### Performance Tests
```bash
# Load test with Apache Bench
ab -n 1000 -c 10 https://auth.treetracker.your-domain.com/api/v1/health

# Load test with hey
hey -n 1000 -c 10 https://auth.treetracker.your-domain.com/api/v1/health
```

#### Security Validation
```bash
# SSL certificate check
openssl s_client -connect auth.treetracker.your-domain.com:443 -servername auth.treetracker.your-domain.com

# Security headers check
curl -I https://auth.treetracker.your-domain.com/api/v1/health
```

---

## 🔧 Advanced Configurations

### 1. Multi-Region Deployment

```yaml
# k8s/multi-region-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: treetracker-auth-service-us-east
  namespace: treetracker
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
    app.kubernetes.io/region: us-east
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: treetracker-auth
      app.kubernetes.io/component: api
      app.kubernetes.io/region: us-east
  template:
    metadata:
      labels:
        app.kubernetes.io/name: treetracker-auth
        app.kubernetes.io/component: api
        app.kubernetes.io/region: us-east
    spec:
      nodeSelector:
        topology.kubernetes.io/zone: us-east-1a,us-east-1b,us-east-1c
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app.kubernetes.io/name: treetracker-auth
            app.kubernetes.io/component: api
```

### 2. Canary Deployment

```yaml
# k8s/canary-deployment.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: treetracker-auth-canary
  namespace: treetracker
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: treetracker-auth-service
  progressDeadlineSeconds: 600
  service:
    port: 3001
    targetPort: 3001
    gateways:
    - public-gateway.istio-system.svc.cluster.local
    hosts:
    - auth.treetracker.your-domain.com
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    webhooks:
    - name: load-test
      url: http://flagger-loadtester.treetracker/
      timeout: 5s
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://treetracker-auth-service.treetracker:3001/api/v1/health"
```

### 3. Service Mesh Integration

```yaml
# k8s/service-mesh.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: treetracker-auth-virtualservice
  namespace: treetracker
spec:
  hosts:
  - auth.treetracker.your-domain.com
  gateways:
  - treetracker-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1/auth
    route:
    - destination:
        host: treetracker-auth-service
        port:
          number: 3001
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
      abort:
        percentage:
          value: 0.1
        httpStatus: 500
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: treetracker-auth-destinationrule
  namespace: treetracker
spec:
  host: treetracker-auth-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 10
    loadBalancer:
      simple: LEAST_REQUEST
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
```

---

## 📚 Additional Resources

### Useful Commands Reference

```bash
# Deployment Commands
kubectl apply -f k8s/ --recursive
kubectl rollout status deployment/treetracker-auth-service -n treetracker
kubectl rollout restart deployment/treetracker-auth-service -n treetracker

# Debugging Commands
kubectl logs -f deployment/treetracker-auth-service -n treetracker
kubectl describe pod <pod-name> -n treetracker
kubectl exec -it <pod-name> -n treetracker -- /bin/sh

# Scaling Commands
kubectl scale deployment/treetracker-auth-service -n treetracker --replicas=5
kubectl autoscale deployment/treetracker-auth-service -n treetracker --min=3 --max=10 --cpu-percent=70

# Port Forwarding
kubectl port-forward svc/treetracker-auth-service 3001:3001 -n treetracker
kubectl port-forward pod/<pod-name> 3001:3001 -n treetracker

# Resource Management
kubectl top pods -n treetracker -l app.kubernetes.io/name=treetracker-auth
kubectl top nodes
kubectl describe resourcequota -n treetracker
```

### Configuration Templates

All configuration templates are available in the `k8s/` directory:
- `namespace.yaml` - Namespace configuration
- `rbac.yaml` - RBAC configuration
- `configmap.yaml` - Application configuration
- `secrets.yaml` - Sensitive data
- `persistent-volume.yaml` - Storage configuration
- `deployment.yaml` - Main application deployment
- `service.yaml` - Service configuration
- `ingress.yaml` - External access configuration
- `network-policy.yaml` - Network security
- `hpa.yaml` - Horizontal scaling
- `vpa.yaml` - Vertical scaling
- `pdb.yaml` - Pod disruption budget
- `servicemonitor.yaml` - Prometheus monitoring
- `prometheus-rules.yaml` - Alert rules
- `backup-cronjob.yaml` - Backup automation

---

## 🎉 Conclusion

This comprehensive Kubernetes deployment guide provides everything needed to deploy the TreeTracker Authentication Service in a production environment. The guide covers:

- ✅ Complete deployment from basic to production-ready
- ✅ Security best practices and hardening
- ✅ Monitoring and observability setup
- ✅ Scaling and performance optimization
- ✅ Backup and disaster recovery
- ✅ Troubleshooting and debugging
- ✅ Advanced configurations for enterprise environments

**Ready to deploy to production! 🚀**

---

## 📞 Support

For additional support:
- Check the troubleshooting section
- Review Kubernetes documentation
- Consult your cluster administrator
- Refer to the production transition guide

**Document Version:** 2.0  
**Last Updated:** 2025-10-15  
**Compatibility:** Kubernetes 1.20+  
**Status:** Production Ready ✅