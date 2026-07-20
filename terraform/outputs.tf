# ═══════════════════════════════════════════════
# SENSITIVE OUTPUTS (AWS credentials for Kind)
# ═══════════════════════════════════════════════

output "aws_access_key_id" {
  description = "AWS Access Key ID for the app IAM user"
  value       = aws_iam_access_key.app.id
  sensitive   = true
}

output "aws_secret_access_key" {
  description = "AWS Secret Access Key for the app IAM user"
  value       = aws_iam_access_key.app.secret
  sensitive   = true
}

# ═══════════════════════════════════════════════
# S3
# ═══════════════════════════════════════════════

output "s3_bucket_name" {
  description = "S3 bucket used for media storage"
  value       = aws_s3_bucket.media.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.media.arn
}

# ═══════════════════════════════════════════════
# ECR
# ═══════════════════════════════════════════════

output "backend_ecr_repository_url" {
  description = "ECR repository URL for the backend image"
  value       = var.create_ecr_repos ? aws_ecr_repository.backend[0].repository_url : null
}

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for the frontend image"
  value       = var.create_ecr_repos ? aws_ecr_repository.frontend[0].repository_url : null
}

# ═══════════════════════════════════════════════
# VPC
# ═══════════════════════════════════════════════

output "vpc_id" {
  description = "VPC ID"
  value       = var.create_vpc ? aws_vpc.main[0].id : null
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = var.create_vpc ? aws_subnet.private[*].id : null
}