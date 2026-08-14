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
# VPC & Networking
# ──────────────────────────────────────────────
resource "aws_vpc" "main" {
  count                = var.create_vpc ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-vpc" }
}

# ──────────────────────────────────────────────
# Public Subnets (for internet-facing resources)
# ──────────────────────────────────────────────
resource "aws_subnet" "public" {
  count             = var.create_vpc ? length(var.availability_zones) : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public-${var.availability_zones[count.index]}" }
}

# ──────────────────────────────────────────────
# Private Subnets (for internal resources)
# ──────────────────────────────────────────────
resource "aws_subnet" "private" {
  count             = var.create_vpc ? length(var.availability_zones) : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${var.project_name}-private-${var.availability_zones[count.index]}" }
}

# ──────────────────────────────────────────────
# Internet Gateway (for public internet access)
# ──────────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  tags = { Name = "${var.project_name}-igw" }
}

# ──────────────────────────────────────────────
# Elastic IP for NAT Gateway
# ──────────────────────────────────────────────
resource "aws_eip" "nat" {
  count  = var.create_vpc ? 1 : 0
  domain = "vpc"

  tags = { Name = "${var.project_name}-nat-eip" }
}

# ──────────────────────────────────────────────
# NAT Gateway (for private subnets to reach internet)
# ──────────────────────────────────────────────
resource "aws_nat_gateway" "main" {
  count         = var.create_vpc ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = { Name = "${var.project_name}-nat-gw" }

  depends_on = [aws_internet_gateway.main]
}

# ──────────────────────────────────────────────
# Route Tables
# ──────────────────────────────────────────────
# Public route table → Internet Gateway
resource "aws_route_table" "public" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

# Private route table → NAT Gateway
resource "aws_route_table" "private" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = { Name = "${var.project_name}-private-rt" }
}

# ──────────────────────────────────────────────
# Route Table Associations
# ──────────────────────────────────────────────
resource "aws_route_table_association" "public" {
  count          = var.create_vpc ? length(var.availability_zones) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "private" {
  count          = var.create_vpc ? length(var.availability_zones) : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

# ──────────────────────────────────────────────
# VPC Endpoint for S3 (private subnets → S3 without NAT)
# ──────────────────────────────────────────────
resource "aws_vpc_endpoint" "s3" {
  count        = var.create_vpc ? 1 : 0
  vpc_id       = aws_vpc.main[0].id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = { Name = "${var.project_name}-s3-vpce" }
}