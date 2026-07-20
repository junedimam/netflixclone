# ═══════════════════════════════════════════════
# AWS INFRASTRUCTURE (for cloud resources only)
# ═══════════════════════════════════════════════
# The Kubernetes resources are deployed via kubectl apply -f k8s/
# NOT via Terraform. Terraform only manages AWS cloud resources.

# ──────────────────────────────────────────────
# S3 Media Bucket
# ──────────────────────────────────────────────
resource "aws_s3_bucket" "media" {
  bucket        = var.media_bucket_name
  force_destroy = true

  tags = { Name = "${var.project_name}-media" }
}

# Block public access (private bucket)
resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ──────────────────────────────────────────────
# IAM User & Keys for App
# ──────────────────────────────────────────────
resource "aws_iam_user" "app" {
  name = "${var.project_name}-app-user"
  path = "/"

  tags = { Name = "${var.project_name}-app-user" }
}

resource "aws_iam_user_policy" "s3_access" {
  name = "${var.project_name}-s3-access"
  user = aws_iam_user.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.media_bucket_name}",
          "arn:aws:s3:::${var.media_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

# ──────────────────────────────────────────────
# ECR Repositories
# ──────────────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  count                = var.create_ecr_repos ? 1 : 0
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-backend-repo" }
}

resource "aws_ecr_repository" "frontend" {
  count                = var.create_ecr_repos ? 1 : 0
  name                 = "${var.project_name}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-frontend-repo" }
}

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