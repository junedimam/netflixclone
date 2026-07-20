# ──────────────────────────────────────────────
# General
# ──────────────────────────────────────────────
variable "aws_region" {
  type        = string
  description = "AWS Deployment Region"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Project name used for resource naming"
  default     = "netflixclone"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev / staging / prod)"
  default     = "dev"
}

# ──────────────────────────────────────────────
# S3 / Media
# ──────────────────────────────────────────────
variable "media_bucket_name" {
  type        = string
  description = "Globally unique name for the S3 media bucket"
  default     = "netflixclone-media-storage-bucket-simple"
}

# ──────────────────────────────────────────────
# ECR (for pushing local images)
# ──────────────────────────────────────────────
variable "create_ecr_repos" {
  type        = bool
  description = "Whether to create ECR repositories for backend/frontend images"
  default     = true
}

# ──────────────────────────────────────────────
# Networking (for future AWS-hosted resources)
# ──────────────────────────────────────────────
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of AZs to deploy into"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "create_vpc" {
  type        = bool
  description = "Whether to create VPC and networking resources"
  default     = true
}
variable "mongo_uri" {
  type        = string
  description = "MongoDB connection string"
  sensitive   = true
}

variable "backend_image" {
  type        = string
  description = "Docker image tag for the backend service"
}

variable "frontend_image" {
  type        = string
  description = "Docker image tag for the frontend service"
}