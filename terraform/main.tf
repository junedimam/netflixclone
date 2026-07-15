# ═══════════════════════════════════════════════
# NETWORKING — VPC & Subnets
# ═══════════════════════════════════════════════
# These are provisioned for future AWS-hosted resources
# (e.g., RDS, ElastiCache) that Kind-based workloads may need.
# The Kind cluster itself runs locally and does not use these.

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${var.project_name}-private-${var.availability_zones[count.index]}" }
}

# ═══════════════════════════════════════════════
# S3 VPC ENDPOINT
# ═══════════════════════════════════════════════
# Allows resources in private subnets to reach S3
# without traversing the internet.

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = { Name = "${var.project_name}-s3-vpce" }
}