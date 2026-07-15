# Netflix Clone

## Infrastructure Deployment with Terraform + AWS ECS Fargate

This project uses **Terraform** to provision AWS infrastructure and **GitHub Actions** for CI/CD. On pushes to `main`, the pipeline:

1. **Provisions infrastructure** via Terraform (ECS Cluster, ALB, ECR repos, IAM roles, Security Groups, SSM parameters)
2. **Builds & pushes** Docker images to Amazon ECR
3. **Deploys** to AWS ECS Fargate with zero-downtime rolling updates

## Architecture

```
User → ALB (Application Load Balancer) → ECS Fargate Services
                                          ├── Backend (port 5000)
                                          └── Frontend (port 80)
```

- **Backend**: Node.js/Express API running on Fargate (256 CPU, 512 MB RAM)
- **Frontend**: React + Vite SPA served via Nginx on Fargate (256 CPU, 512 MB RAM)
- **MongoDB Atlas**: Connection string stored securely in AWS SSM Parameter Store
- **S3**: Media storage for uploads (`netflixclone-media` bucket)

## GitHub Secrets Required

Set these in your repository: **Settings → Secrets and variables → Actions**

| Secret Name | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key for the `github-actions-cicd` user |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for the `github-actions-cicd` user |
| `MONGO_URI` | MongoDB Atlas connection string |

### Required IAM Permissions for the CI/CD User

The `github-actions-cicd` IAM user needs the following permissions:
- **ECR**: Push/pull images
- **ECS**: Update services, describe clusters
- **S3**: Create/lookup Terraform state bucket
- **SSM**: Create/get SSM parameters
- **IAM**: Pass roles to ECS tasks
- **EC2**: Describe VPCs and subnets
- **CloudWatch**: Create log groups
- **ELB**: Create/manage load balancers

## Terraform Infrastructure

The Terraform configuration (`terraform/main.tf`) provisions:

| Resource | Description |
|---|---|
| **ECR Repositories** | `netflixclone-backend` and `netflixclone-frontend` |
| **S3 Bucket** | `netflixclone-media` for video/thumbnail uploads |
| **ECS Cluster** | `netflixclone-cluster` with Container Insights |
| **ECS Task Definitions** | Fargate tasks (256/512 CPU/Memory) |
| **ECS Services** | Backend (port 5000) and Frontend (port 80) |
| **ALB** | Application Load Balancer routing `/api/*` to backend |
| **Security Groups** | ALB → ECS tasks traffic flow |
| **IAM Roles** | Task execution + task roles with S3/CloudWatch access |
| **CloudWatch Log Groups** | Centralized logging (30-day retention) |
| **SSM Parameter** | Encrypted MongoDB connection string |

## Deployment Pipeline

On every push to `main`:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Terraform  │ ──→ │  Build Images│ ──→ │  Deploy to   │
│  (Infra)    │     │  Push to ECR │     │  ECS Fargate  │
└─────────────┘     └──────────────┘     └──────────────┘
     Job 1                Job 2                Job 3
```

### Jobs:
1. **terraform** - Applies infrastructure changes via Terraform
2. **build-and-push** - Builds Docker images and pushes to ECR (runs after terraform)
3. **deploy** - Forces new ECS deployments and waits for stabilization (runs after build-and-push)

## Local Development

### Prerequisites
- Node.js 24+
- MongoDB Atlas account (or use the built-in local file fallback)
- AWS CLI configured (for S3 uploads)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Copy the template and fill in your values
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string and AWS credentials

# Start the development server (with auto-reload)
npm run dev
```

The backend will start on **port 5001** by default. If MongoDB is unavailable, it automatically falls back to persistent local storage in `backend/data/store.json` with 13 seed movies.

> **Note:** The backend Docker image runs on port **5000** (set via `PORT` env var in ECS). Local dev uses port **5001** to avoid conflicts.

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The frontend will start on **port 5173** (Vite default) and proxy API calls to `http://localhost:5001`.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes (fallback to local store) | MongoDB Atlas connection string |
| `AWS_REGION` | For S3 uploads | AWS region (default: us-east-1) |
| `AWS_S3_BUCKET` | For S3 uploads | S3 bucket name (default: netflixclone-media) |
| `PORT` | No | Backend port (default: 5001 local, 5000 on ECS) |
| `JWT_SECRET` | No | JWT signing secret (default: MY_SECRET_KEY) |

## Frontend SPA Routing (Important)

The frontend uses React Router for client-side navigation. When deployed via Docker, a custom nginx configuration (`frontend/nginx/nginx.conf`) ensures that:

- All routes (`/`, `/login`, `/watch`) serve `index.html` correctly
- Refreshing a page or navigating directly to a URL won't return a 404
- Static assets are cached with optimal headers
- Gzip compression is enabled for faster load times

## S3 Media Uploads

The Terraform configuration creates an S3 bucket (`netflixclone-media`) with:
- Public access blocked (uploads via pre-signed URLs or direct SDK)
- Versioning disabled
- IAM task role grants PutObject/GetObject/DeleteObject/ListBucket permissions

The backend automatically uploads video and thumbnail files to S3 when files are submitted via the upload form.

## Accessing the Deployed App

After deployment completes, the ALB DNS name is displayed in the GitHub Actions logs:
```
Alb DNS: netflixclone-alb-xxxxx.us-east-1.elb.amazonaws.com
```

Visit this URL in your browser to access the application.

## Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Project Structure

```
netflixclone/
├── backend/
│   ├── Dockerfile           # Backend container image
│   ├── server.js            # Express app entry point
│   ├── routes/
│   │   ├── auth.js          # Authentication (register/login)
│   │   └── movies.js        # Movie CRUD + file uploads
│   ├── models/
│   │   ├── Movie.js         # Mongoose movie schema
│   │   └── User.js          # Mongoose user schema
│   ├── lib/
│   │   ├── s3.js            # S3 upload helpers
│   │   ├── store.js         # Local JSON file store (fallback)
│   │   └── seedMovies.js    # Seed movie data
│   └── data/
│       └── store.json       # Local data (auto-created)
├── frontend/
│   ├── Dockerfile           # Frontend container (multi-stage build)
│   ├── nginx/
│   │   └── nginx.conf       # SPA routing nginx config
│   ├── src/
│   │   ├── App.jsx          # React Router setup
│   │   ├── api.js           # API base URL config
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Main browse + upload page
│   │   │   └── Login.jsx    # Auth page
│   │   └── components/
│   │       ├── Featured.jsx # Hero banner section
│   │       └── VideoPlayer.jsx
│   └── index.html
├── terraform/
│   ├── main.tf              # AWS infrastructure as code
│   └── variables.tf         # Terraform variables
└── .github/workflows/
    └── deploy.yml           # CI/CD pipeline