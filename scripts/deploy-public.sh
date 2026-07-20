#!/bin/bash
set -e

echo "================================================"
echo "  Netflix Clone - Public Deployment"
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Ensure Kind cluster is running
echo ""
echo -e "${CYAN}📦 Step 1: Checking Kind cluster...${NC}"
if kind get clusters 2>/dev/null | grep -q netflixclone; then
  echo -e "${GREEN}  ✓ Cluster 'netflixclone' already exists${NC}"
else
  echo "  → Creating Kind cluster..."
  kind create cluster --name netflixclone --config kind-config.yaml
  echo -e "${GREEN}  ✓ Cluster created${NC}"
fi

# Step 2: Check if images are loaded, build if needed
echo ""
echo -e "${CYAN}🔨 Step 2: Checking Docker images...${NC}"

if ! docker image inspect netflixclone-backend:latest &>/dev/null; then
  echo "  → Building backend image..."
  docker build -t netflixclone-backend:latest -f backend/Dockerfile backend/
  echo -e "${GREEN}  ✓ Backend image built${NC}"
else
  echo -e "${GREEN}  ✓ Backend image exists${NC}"
fi

if ! docker image inspect netflixclone-frontend:latest &>/dev/null; then
  echo "  → Building frontend image..."
  docker build -t netflixclone-frontend:latest -f frontend/Dockerfile frontend/
  echo -e "${GREEN}  ✓ Frontend image built${NC}"
else
  echo -e "${GREEN}  ✓ Frontend image exists${NC}"
fi

# Step 3: Load images into Kind
echo ""
echo -e "${CYAN}📥 Step 3: Loading images into Kind cluster...${NC}"
kind load docker-image netflixclone-backend:latest --name netflixclone
kind load docker-image netflixclone-frontend:latest --name netflixclone
echo -e "${GREEN}  ✓ Images loaded${NC}"

# Step 4: Apply Kubernetes manifests
echo ""
echo -e "${CYAN}🚀 Step 4: Deploying to Kubernetes...${NC}"
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
echo -e "${GREEN}  ✓ Manifests applied${NC}"

# Step 5: Wait for pods to be ready
echo ""
echo -e "${CYAN}⏳ Step 5: Waiting for pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=backend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl get pods -n netflixclone

# Step 6: Install NGINX Ingress Controller if not present
echo ""
echo -e "${CYAN}🌐 Step 6: Checking NGINX Ingress Controller...${NC}"
if kubectl get pods -n ingress-nginx 2>/dev/null | grep -q "ingress-nginx-controller.*Running"; then
  echo -e "${GREEN}  ✓ Ingress Controller already running${NC}"
else
  echo "  → Installing NGINX Ingress Controller..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml
  kubectl label nodes netflixclone-control-plane ingress-ready=true --overwrite
  echo "  → Waiting for Ingress Controller..."
  kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
  echo -e "${GREEN}  ✓ Ingress Controller ready${NC}"
fi

# Step 7: Apply Ingress with the public IP
echo ""
echo -e "${CYAN}🔗 Step 7: Applying Ingress rules...${NC}"
kubectl apply -f k8s/ingress.yaml

# Step 8: Set up port-forward for local access
echo ""
echo -e "${CYAN}🔌 Step 8: Setting up port-forward...${NC}"
# Kill any existing port-forward on 8080
kill $(lsof -ti:8080) 2>/dev/null || true
sleep 1

kubectl port-forward -n netflixclone svc/frontend-service 8080:80 &
PF_PID=$!
echo -e "${GREEN}  ✓ Port-forward started (PID: $PF_PID)${NC}"

# Wait for port-forward to be ready
sleep 3

# Test application
echo ""
echo -e "${CYAN}🧪 Step 9: Verifying application...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}  ✓ Frontend responds on http://localhost:8080 (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${YELLOW}  ⚠ Frontend responded with HTTP $HTTP_CODE${NC}"
fi

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/movies 2>/dev/null)
if [ "$API_CODE" = "200" ]; then
  echo -e "${GREEN}  ✓ Backend API responds on http://localhost:8080/api/movies (HTTP $API_CODE)${NC}"
else
  echo -e "${YELLOW}  ⚠ Backend API responded with HTTP $API_CODE${NC}"
fi

# Step 10: Start Cloudflare Tunnel for public access
echo ""
echo -e "${CYAN}🌍 Step 10: Starting Cloudflare Tunnel for public access...${NC}"
echo ""
echo -e "${YELLOW}  Starting Cloudflare quick tunnel...${NC}"
echo -e "${YELLOW}  This will create a public URL like: https://random-name.trycloudflare.com${NC}"
echo ""
echo -e "${YELLOW}  ⚠ IMPORTANT: Leave this terminal running. The tunnel will stop when you exit.${NC}"
echo ""

cloudflared tunnel --url http://localhost:8080
</｜｜DSML｜｜>