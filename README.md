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
- **S3**: Media storage for uploads

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

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Accessing the Deployed App

After deployment completes, the ALB DNS name is displayed in the GitHub Actions logs:
```
Alb DNS: netflixclone-alb-xxxxx.us-east-1.elb.amazonaws.com
```

Visit this URL in your browser to access the application.