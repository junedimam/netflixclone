#!/bin/bash
set -e

echo "================================================"
echo "  Netflix Clone - Public Deployment"
echo "================================================"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}📦 Step 1: Checking Kind cluster...${NC}"
if kind get clusters 2>/dev/null | grep -q netflixclone; then
  echo -e "${GREEN}  ✓ Cluster 'netflixclone' already exists${NC}"
else
  kind create cluster --name netflixclone --config kind-config.yaml
fi

echo ""
echo -e "${CYAN}🔨 Step 2: Building Docker images...${NC}"
if ! docker image inspect netflixclone-backend:latest &>/dev/null; then
  docker build -t netflixclone-backend:latest -f backend/Dockerfile backend/
fi
if ! docker image inspect netflixclone-frontend:latest &>/dev/null; then
  docker build -t netflixclone-frontend:latest -f frontend/Dockerfile frontend/
fi
kind load docker-image netflixclone-backend:latest --name netflixclone
kind load docker-image netflixclone-frontend:latest --name netflixclone

echo ""
echo -e "${CYAN}🚀 Step 3: Deploying application...${NC}"
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

echo ""
echo -e "${CYAN}📧 Step 4: Configuring email alerts...${NC}"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
read -r -p "SMTP email [netflixclone-alerts@gmail.com]: " SMTP_USER
SMTP_USER=${SMTP_USER:-netflixclone-alerts@gmail.com}
read -r -s -p "SMTP Gmail app password: " SMTP_PASSWORD
echo
if [[ -z "${SMTP_PASSWORD}" ]]; then
  echo "SMTP app password is required." >&2
  exit 1
fi
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic grafana-smtp -n monitoring \
  --from-literal=smtp-user="${SMTP_USER}" \
  --from-literal=smtp-password="${SMTP_PASSWORD}" \
  --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install netflixclone-monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  -f monitoring/kube-prometheus-stack-values.yaml \
  --set grafana.smtp.from_address="${SMTP_USER}" \
  --set alertmanagerFiles.alertmanager\.yml.global.smtp_from="${SMTP_USER}" \
  --set alertmanagerFiles.alertmanager\.yml.global.smtp_auth_username="${SMTP_USER}" \
  --set alertmanagerFiles.alertmanager\.yml.receivers[0].email_configs[0].to="${SMTP_USER}"

echo ""
echo -e "${CYAN}⏳ Step 5: Waiting for pods...${NC}"
kubectl wait --for=condition=ready pod -l app=backend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl wait --namespace monitoring --for=condition=ready pod -l app.kubernetes.io/name=grafana --timeout=180s 2>/dev/null || true

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml
kubectl label nodes netflixclone-control-plane ingress-ready=true --overwrite
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
kubectl apply -f k8s/ingress.yaml

kill $(lsof -ti:8080) 2>/dev/null || true
sleep 1
kubectl port-forward -n netflixclone svc/frontend-service 8080:80 &
PF_PID=$!
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}  ✓ Frontend responds on http://localhost:8080 (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${YELLOW}  ⚠ Frontend responded with HTTP $HTTP_CODE${NC}"
fi

echo ""
echo -e "${GREEN}Grafana: http://localhost:30082 (admin/admin123)${NC}"
echo -e "${GREEN}Email alerts are enabled for ${SMTP_USER}.${NC}"
echo -e "${YELLOW}Leave this terminal running for the port-forward/tunnel.${NC}"
cloudflared tunnel --url http://localhost:8080
