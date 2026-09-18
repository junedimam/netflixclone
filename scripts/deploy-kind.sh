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

# Step 5: Configure SMTP and install monitoring
echo ""
echo "📧 Step 5: Configuring email alerts..."
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

# Step 6: Wait for pods to be ready
echo ""
echo "⏳ Step 6: Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=frontend -n netflixclone --timeout=120s 2>/dev/null || true
kubectl wait --namespace monitoring --for=condition=ready pod -l app.kubernetes.io/name=grafana --timeout=180s 2>/dev/null || true

# Step 7: Install NGINX Ingress Controller
echo ""
echo "🌐 Step 7: Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml
kubectl label nodes netflixclone-control-plane ingress-ready=true --overwrite
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s

# Step 8: Apply Ingress
echo ""
echo "🔗 Step 8: Applying Ingress rules..."
kubectl apply -f k8s/ingress.yaml

echo ""
echo "================================================"
echo "  Deployment Status"
echo "================================================"
kubectl get pods -n netflixclone
kubectl get pods -n monitoring
echo ""
echo "Frontend: http://localhost:80"
echo "Grafana:  http://localhost:30082 (admin/admin123)"
echo "Email alerts are enabled for ${SMTP_USER}."
echo ""
echo "📝 To delete the cluster, run: kind delete cluster --name netflixclone"
