variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "mongo_uri" {
  description = "MongoDB Atlas connection string (stored as SSM SecureString parameter)"
  type        = string
  sensitive   = true
}