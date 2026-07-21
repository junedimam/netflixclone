# ═══════════════════════════════════════════════
# AWS INFRASTRUCTURE (for cloud resources only)
# ═══════════════════════════════════════════════
# The Kubernetes resources are deployed via kubectl apply -f k8s/
# NOT via Terraform. Terraform only manages AWS cloud resources.
# Resources are split across files:
#   - storage.tf  → S3 bucket
#   - iam.tf      → IAM user, policy, access keys
#   - ecr.tf      → ECR repositories
#   - main.tf     → VPC & networking (below)

# ──────────────────────────────────────────────
# VPC & Networking (for future RDS/ElastiCache)
# ──────────────────────────────────────────────
resource "aws_vpc" "main" {
  count                = var.create_vpc ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_subnet" "private" {
  count             = var.create_vpc ? length(var.availability_zones) : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${var.project_name}-private-${var.availability_zones[count.index]}" }
}

resource "aws_vpc_endpoint" "s3" {
  count        = var.create_vpc ? 1 : 0
  vpc_id       = aws_vpc.main[0].id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = { Name = "${var.project_name}-s3-vpce" }
}