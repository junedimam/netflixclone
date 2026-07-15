# ═══════════════════════════════════════════════
# SENSITIVE OUTPUTS (AWS credentials for Kind)
# ═══════════════════════════════════════════════
# These are printed once after terraform apply.
# Use them to configure your Kind application:
#   export AWS_ACCESS_KEY_ID=<value>
#   export AWS_SECRET_ACCESS_KEY=<value>
#   export AWS_S3_BUCKET=<value>

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
  description = "S3 bucket used for media storage — set as AWS_S3_BUCKET in your Kind deployment"
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
  description = "ECR repository URL for the backend image — push your Docker image here"
  value       = var.create_ecr_repos ? aws_ecr_repository.backend[0].repository_url : null
}

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for the frontend image — push your Docker image here"
  value       = var.create_ecr_repos ? aws_ecr_repository.frontend[0].repository_url : null
}

# ═══════════════════════════════════════════════
# VPC
# ═══════════════════════════════════════════════

output "vpc_id" {
  description = "VPC ID (for future AWS-hosted resources connected to Kind)"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (for future AWS-hosted resources)"
  value       = aws_subnet.private[*].id
}