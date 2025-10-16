#!/bin/bash

# TreeTracker Authentication Service Kubernetes Deployment Script
# This script automates the deployment of the auth service to Kubernetes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="treetracker"
SERVICE_NAME="treetracker-auth-service"
IMAGE_TAG="1.0.0"
ENVIRONMENT="production"
DOMAIN="treetracker.your-domain.com"
KEYCLOAK_URL="https://keycloak.${DOMAIN}"
FABRIC_NETWORK="treetracker-network"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if we can create resources
    if ! kubectl auth can-i create deployments -n ${NAMESPACE} &> /dev/null; then
        log_error "Insufficient permissions to create resources in namespace ${NAMESPACE}"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_namespace() {
    log_info "Creating namespace ${NAMESPACE}..."
    
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Add pod security standards
    kubectl label namespace ${NAMESPACE} pod-security.kubernetes.io/enforce=restricted --overwrite
    kubectl label namespace ${NAMESPACE} pod-security.kubernetes.io/audit=restricted --overwrite
    kubectl label namespace ${NAMESPACE} pod-security.kubernetes.io/warn=restricted --overwrite
    
    log_success "Namespace ${NAMESPACE} created/updated"
}

generate_secrets() {
    log_info "Generating secrets..."
    
    # Generate JWT secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    
    # Create secrets manifest
    cat > k8s/generated-secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: treetracker-auth-secrets
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: secrets
type: Opaque
stringData:
  # JWT Configuration
  JWT_SECRET: "${JWT_SECRET}"
  JWT_REFRESH_SECRET: "${JWT_REFRESH_SECRET}"
  
  # Placeholder secrets - replace with actual values
  KEYCLOAK_CLIENT_SECRET: "REPLACE_WITH_KEYCLOAK_CLIENT_SECRET"
  KEYCLOAK_ADMIN_PASSWORD: "REPLACE_WITH_KEYCLOAK_ADMIN_PASSWORD"
  DB_PASSWORD: "REPLACE_WITH_DATABASE_PASSWORD"
  FABRIC_ADMIN_PASSWORD: "REPLACE_WITH_FABRIC_ADMIN_PASSWORD"
  FABRIC_CA_ADMIN_PASSWORD: "REPLACE_WITH_FABRIC_CA_ADMIN_PASSWORD"
---
apiVersion: v1
kind: Secret
metadata:
  name: treetracker-auth-tls
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: tls
type: kubernetes.io/tls
data:
  # Replace with actual TLS certificates
  tls.crt: ""
  tls.key: ""
EOF
    
    log_success "Secrets manifest generated at k8s/generated-secrets.yaml"
    log_warning "Please update the placeholder secrets in k8s/generated-secrets.yaml before deployment"
}

generate_configmap() {
    log_info "Generating ConfigMap..."
    
    cat > k8s/generated-configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: treetracker-auth-config
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: config
data:
  # Application Configuration
  NODE_ENV: "${ENVIRONMENT}"
  PORT: "3001"
  API_PREFIX: "/api/v1"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  
  # Keycloak Configuration
  KEYCLOAK_URL: "${KEYCLOAK_URL}"
  KEYCLOAK_REALM: "treetracker"
  KEYCLOAK_CLIENT_ID: "treetracker-auth"
  KEYCLOAK_ADMIN_USERNAME: "admin"
  
  # Hyperledger Fabric Configuration
  FABRIC_NETWORK_NAME: "${FABRIC_NETWORK}"
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
  CORS_ORIGIN: "https://${DOMAIN},https://app.${DOMAIN}"
  CORS_CREDENTIALS: "true"
  
  # Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  
  # Database Configuration
  DB_HOST: "postgres.${NAMESPACE}.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "treetracker_auth"
  DB_USERNAME: "treetracker_auth"
  
  # Wallet Configuration
  WALLET_PATH: "/opt/fabric/wallet"
  WALLET_TYPE: "FileSystemWallet"
  
  # Monitoring Configuration
  ENABLE_METRICS: "true"
  METRICS_PORT: "9090"
EOF
    
    log_success "ConfigMap generated at k8s/generated-configmap.yaml"
}

create_deployment() {
    log_info "Creating deployment..."
    
    cat > k8s/generated-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE_NAME}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: api
    app.kubernetes.io/version: "${IMAGE_TAG}"
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
        app.kubernetes.io/version: "${IMAGE_TAG}"
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
        image: treetracker-auth-service:${IMAGE_TAG}
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
EOF
    
    log_success "Deployment manifest generated at k8s/generated-deployment.yaml"
}

create_service() {
    log_info "Creating service..."
    
    cat > k8s/generated-service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: ${SERVICE_NAME}
  namespace: ${NAMESPACE}
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
  name: ${SERVICE_NAME}-headless
  namespace: ${NAMESPACE}
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
EOF
    
    log_success "Service manifest generated at k8s/generated-service.yaml"
}

create_ingress() {
    log_info "Creating ingress..."
    
    cat > k8s/generated-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${SERVICE_NAME}-ingress
  namespace: ${NAMESPACE}
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
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://${DOMAIN},https://app.${DOMAIN}"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - auth.${DOMAIN}
    secretName: treetracker-auth-tls
  rules:
  - host: auth.${DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${SERVICE_NAME}
            port:
              number: 3001
EOF
    
    log_success "Ingress manifest generated at k8s/generated-ingress.yaml"
}

create_rbac() {
    log_info "Creating RBAC configuration..."
    
    cat > k8s/generated-rbac.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: treetracker-auth-sa
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: rbac
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: treetracker-auth-role
  namespace: ${NAMESPACE}
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
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: rbac
subjects:
- kind: ServiceAccount
  name: treetracker-auth-sa
  namespace: ${NAMESPACE}
roleRef:
  kind: Role
  name: treetracker-auth-role
  apiGroup: rbac.authorization.k8s.io
EOF
    
    log_success "RBAC manifest generated at k8s/generated-rbac.yaml"
}

create_storage() {
    log_info "Creating storage configuration..."
    
    cat > k8s/generated-storage.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: treetracker-auth-wallet-pvc
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: storage
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: "standard"  # Replace with your storage class
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: treetracker-auth-logs-pvc
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: treetracker-auth
    app.kubernetes.io/component: storage
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: "standard"  # Replace with your storage class
EOF
    
    log_success "Storage manifest generated at k8s/generated-storage.yaml"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Apply all manifests
    kubectl apply -f k8s/generated-rbac.yaml
    kubectl apply -f k8s/generated-storage.yaml
    kubectl apply -f k8s/generated-configmap.yaml
    kubectl apply -f k8s/generated-secrets.yaml
    kubectl apply -f k8s/generated-deployment.yaml
    kubectl apply -f k8s/generated-service.yaml
    kubectl apply -f k8s/generated-ingress.yaml
    
    log_success "All manifests applied successfully"
}

wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s deployment/${SERVICE_NAME} -n ${NAMESPACE}
    
    log_success "Deployment is ready"
}

validate_deployment() {
    log_info "Validating deployment..."
    
    # Check pod status
    PODS_READY=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=treetracker-auth -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}' | wc -w)
    PODS_TOTAL=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=treetracker-auth -o jsonpath='{.items[*].metadata.name}' | wc -w)
    
    if [ ${PODS_READY} -eq ${PODS_TOTAL} ] && [ ${PODS_READY} -gt 0 ]; then
        log_success "All pods are running (${PODS_READY}/${PODS_TOTAL})"
    else
        log_error "Not all pods are running (${PODS_READY}/${PODS_TOTAL})"
        kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=treetracker-auth
        exit 1
    fi
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    
    # Port forward for testing
    kubectl port-forward svc/${SERVICE_NAME} 3001:3001 -n ${NAMESPACE} &
    PORT_FORWARD_PID=$!
    sleep 5
    
    if curl -s http://localhost:3001/api/v1/health | grep -q "success.*true"; then
        log_success "Health endpoint is responding correctly"
    else
        log_error "Health endpoint is not responding correctly"
        curl -v http://localhost:3001/api/v1/health
    fi
    
    # Kill port forward
    kill ${PORT_FORWARD_PID} 2>/dev/null || true
    
    log_success "Deployment validation completed"
}

show_summary() {
    log_info "=== DEPLOYMENT SUMMARY ==="
    echo ""
    echo "Service: ${SERVICE_NAME}"
    echo "Namespace: ${NAMESPACE}"
    echo "Environment: ${ENVIRONMENT}"
    echo ""
    echo "Access URLs:"
    echo "  - Local: http://localhost:3001"
    echo "  - Ingress: https://auth.${DOMAIN} (after DNS configuration)"
    echo ""
    echo "Important Files:"
    echo "  - Secrets: k8s/generated-secrets.yaml (UPDATE REQUIRED!)"
    echo "  - ConfigMap: k8s/generated-configmap.yaml"
    echo "  - Deployment: k8s/generated-deployment.yaml"
    echo "  - Service: k8s/generated-service.yaml"
    echo "  - Ingress: k8s/generated-ingress.yaml"
    echo ""
    echo "Next Steps:"
    echo "  1. Update the placeholder secrets in k8s/generated-secrets.yaml"
    echo "  2. Configure DNS for auth.${DOMAIN}"
    echo "  3. Set up TLS certificates"
    echo "  4. Configure Keycloak and Hyperledger Fabric connections"
    echo "  5. Set up monitoring and logging"
    echo ""
    echo "Useful Commands:"
    echo "  - Check pods: kubectl get pods -n ${NAMESPACE}"
    echo "  - Check logs: kubectl logs -f deployment/${SERVICE_NAME} -n ${NAMESPACE}"
    echo "  - Port forward: kubectl port-forward svc/${SERVICE_NAME} 3001:3001 -n ${NAMESPACE}"
    echo "  - Scale deployment: kubectl scale deployment/${SERVICE_NAME} -n ${NAMESPACE} --replicas=5"
    echo ""
    log_success "Deployment completed successfully! 🎉"
}

cleanup() {
    log_info "Cleaning up generated files..."
    
    # Keep the generated files for review, but offer cleanup option
    log_info "Generated files are kept in k8s/ directory for review"
    log_info "To clean up: rm -f k8s/generated-*.yaml"
}

# Main execution
main() {
    log_info "Starting TreeTracker Auth Service Kubernetes Deployment"
    log_info "======================================================"
    
    check_prerequisites
    create_namespace
    generate_secrets
    generate_configmap
    create_deployment
    create_service
    create_ingress
    create_rbac
    create_storage
    deploy_application
    wait_for_deployment
    validate_deployment
    show_summary
    
    log_info "======================================================"
    log_success "Deployment process completed!"
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --domain DOMAIN          Set the domain name (default: treetracker.your-domain.com)"
            echo "  --environment ENV        Set the environment (default: production)"
            echo "  --namespace NAMESPACE    Set the namespace (default: treetracker)"
            echo "  --image-tag TAG         Set the image tag (default: 1.0.0)"
            echo "  --help                  Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main

# Set up cleanup on exit
trap cleanup EXIT