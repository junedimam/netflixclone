#!/bin/bash
set -e

echo "================================================"
echo "  Netflix Clone - Kind Cluster Deployment"
echo "================================================"

# Step 1: Create Kind cluster
echo ""
echo "📦 Step 1: Creating Kind cluster..."
kind get clusters 2>/dev/null | grep -q netflixclone && echo "Cluster 'netflixclone' already exists" || \
  kind create cluster --name netflixclone --config kind-config.yaml

# Step 2: Build Docker images
echo ""
echo "🔨 Step 2: Building Docker images..."

echo "  → Building backend image..."
docker build -t netflixclone-backend:latest -f backend/Dockerfile backend/

echo "  → Building frontend image..."
docker build -t netflixclone-frontend:latest -f frontend/Dockerfile frontend/

# Step 3: Load images into Kind
echo ""
echo "📥 Step 3: Loading images into Kind cluster..."
kind load docker-image netflixclone-backend:latest --name netflixclone
kind load docker-image netflixclone-frontend:latest --name netflixclone

# Step 4: Apply Kubernetes manifests
echo ""
echo "🚀 Step 4: Deploying to Kubernetes..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Step 5: Wait for pods to be ready
echo ""
echo "⏳ Step 5: Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend -n netflixclone --timeout=120s 2>/dev/null || true

# Step 6: Install NGINX Ingress Controller
echo ""
echo "🌐 Step 6: Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml

# Label the node for Ingress
kubectl label nodes netflixclone-control-plane ingress-ready=true --overwrite

# Wait for Ingress Controller to be ready
echo ""
echo "⏳ Waiting for Ingress Controller to be ready..."
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s

# Step 7: Apply Ingress
echo ""
echo "🔗 Step 7: Applying Ingress rules..."
kubectl apply -f k8s/ingress.yaml

# Step 8: Show status
echo ""
echo "================================================"
echo "  Deployment Status"
echo "================================================"
echo ""
kubectl get pods -n netflixclone
echo ""
echo "================================================"
echo "  Access the application at:"
echo "  → Frontend: http://localhost:80"
echo "  → Backend:  http://localhost:5001"
echo "  → Via Ingress: http://netflixclone.local (add to /etc/hosts)"
echo "================================================"
echo ""
echo "📝 To add DNS entries, add these lines to /etc/hosts:"
echo "   127.0.0.1 netflixclone.local api.netflixclone.local"
echo ""
echo "📝 To delete the cluster, run: kind delete cluster --name netflixclone"