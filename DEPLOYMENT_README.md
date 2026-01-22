# 🚀 TreeTracker Auth Service - Quick Deployment Guide

## Quick Start (5 minutes)

### 1. Run the Automated Deployment Script
```bash
cd /workspace/treetracker-auth-service

# Basic deployment
./deploy-to-kubernetes.sh

# Custom deployment with your domain
./deploy-to-kubernetes.sh --domain your-domain.com --environment production
```

### 2. Update Required Secrets
After deployment, update the generated secrets file:
```bash
# Edit the secrets file with your actual values
nano k8s/generated-secrets.yaml

# Apply the updated secrets
kubectl apply -f k8s/generated-secrets.yaml

# Restart the deployment to pick up new secrets
kubectl rollout restart deployment/treetracker-auth-service -n treetracker
```

### 3. Test the Deployment
```bash
# Port forward for testing
kubectl port-forward svc/treetracker-auth-service 3001:3001 -n treetracker

# Test health endpoint
curl http://localhost:3001/api/v1/health

# Test registration
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!","phoneNumber":"+1234567890","region":"Test"}'
```

---

## 📋 What Gets Deployed

### ✅ Core Components
- **Deployment**: 3 replicas with rolling updates
- **Service**: ClusterIP for internal communication
- **Ingress**: External access with TLS support
- **ConfigMap**: Application configuration
- **Secrets**: Sensitive data (JWT, passwords, etc.)
- **RBAC**: Service account and permissions
- **Storage**: Persistent volumes for wallet and logs

### ✅ Security Features
- Pod Security Standards (restricted)
- Network policies for traffic control
- Non-root container execution
- Read-only root filesystem
- Security contexts and capabilities dropping
- TLS encryption for external access

### ✅ High Availability
- Multiple replicas (3 by default)
- Pod anti-affinity rules
- Health checks (liveness, readiness, startup)
- Graceful shutdown handling
- Rolling updates with zero downtime

### ✅ Monitoring & Scaling
- Prometheus metrics endpoint
- Horizontal Pod Autoscaler (HPA)
- Vertical Pod Autoscaler (VPA)
- Pod Disruption Budget (PDB)
- Structured JSON logging

---

## 🔧 Configuration Options

### Script Arguments
```bash
./deploy-to-kubernetes.sh [OPTIONS]

Options:
  --domain DOMAIN          Set the domain name (default: treetracker.your-domain.com)
  --environment ENV        Set the environment (default: production)
  --namespace NAMESPACE    Set the namespace (default: treetracker)
  --image-tag TAG         Set the image tag (default: 1.0.0)
  --help                  Show help message
```

### Required Updates After Deployment

#### 1. Update Secrets
Edit `k8s/generated-secrets.yaml` and replace placeholders:
```yaml
KEYCLOAK_CLIENT_SECRET: "your-actual-keycloak-client-secret"
KEYCLOAK_ADMIN_PASSWORD: "your-actual-keycloak-admin-password"
DB_PASSWORD: "your-actual-database-password"
FABRIC_ADMIN_PASSWORD: "your-actual-fabric-admin-password"
FABRIC_CA_ADMIN_PASSWORD: "your-actual-fabric-ca-admin-password"
```

#### 2. Configure TLS Certificates
Update `k8s/generated-secrets.yaml` with your TLS certificates:
```yaml
tls.crt: "base64-encoded-certificate"
tls.key: "base64-encoded-private-key"
```

#### 3. Set Up DNS
Configure DNS records for your domain:
```
A     auth.your-domain.com     → [YOUR_LOAD_BALANCER_IP]
CNAME *.your-domain.com        → your-domain.com
```

#### 4. Configure External Services
- **Keycloak**: Update KEYCLOAK_URL in ConfigMap
- **Hyperledger Fabric**: Update Fabric endpoints in ConfigMap
- **Database**: Update database connection details

---

## 🎯 Deployment Verification

### Check Pod Status
```bash
kubectl get pods -n treetracker -l app.kubernetes.io/name=treetracker-auth
```

### Check Service Status
```bash
kubectl get svc -n treetracker -l app.kubernetes.io/name=treetracker-auth
```

### Check Ingress Status
```bash
kubectl get ingress -n treetracker treetracker-auth-service-ingress
```

### View Logs
```bash
kubectl logs -f deployment/treetracker-auth-service -n treetracker
```

### Test Health Endpoint
```bash
kubectl port-forward svc/treetracker-auth-service 3001:3001 -n treetracker
curl http://localhost:3001/api/v1/health
```

---

## 🔍 Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n treetracker

# Check node resources
kubectl top nodes
kubectl describe nodes
```

#### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints treetracker-auth-service -n treetracker

# Check ingress controller
kubectl get pods -n ingress-nginx
```

#### Authentication Issues
```bash
# Check Keycloak connectivity
kubectl exec -it <pod-name> -n treetracker -- curl -v $KEYCLOAK_URL/auth/realms/treetracker/.well-known/openid-configuration

# Check logs for errors
kubectl logs -n treetracker -l app.kubernetes.io/name=treetracker-auth | grep -i error
```

### Quick Fix Commands
```bash
# Restart deployment
kubectl rollout restart deployment/treetracker-auth-service -n treetracker

# Scale deployment
kubectl scale deployment/treetracker-auth-service -n treetracker --replicas=5

# Check rollout status
kubectl rollout status deployment/treetracker-auth-service -n treetracker
```

---

## 📚 Full Documentation

For complete deployment documentation, see:
- **[KUBERNETES_DEPLOYMENT_GUIDE.md](KUBERNETES_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[README.md](README.md)** - Service documentation
- **[PRODUCTION_TRANSITION_GUIDE.md](../PRODUCTION_TRANSITION_GUIDE.md)** - Production setup guide
- **[PRODUCTION_CONFIGURATION_CHECKLIST.md](../PRODUCTION_CONFIGURATION_CHECKLIST.md)** - Configuration checklist

---

## 🚀 Next Steps After Deployment

### 1. Production Setup
- Replace mock services with real Keycloak and Hyperledger Fabric
- Set up monitoring with Prometheus and Grafana
- Configure backup and disaster recovery
- Set up CI/CD pipeline

### 2. Security Hardening
- Enable Pod Security Standards
- Configure network policies
- Set up service mesh (Istio/Linkerd)
- Implement secrets management

### 3. Performance Optimization
- Configure auto-scaling based on metrics
- Optimize resource requests/limits
- Set up caching strategies
- Implement connection pooling

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the comprehensive deployment guide
3. Check Kubernetes events: `kubectl get events -n treetracker`
4. Review service logs: `kubectl logs -f deployment/treetracker-auth-service -n treetracker`

---

**🎉 Ready to deploy! Run the script and start using your TreeTracker authentication service!**