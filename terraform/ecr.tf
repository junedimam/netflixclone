# ═══════════════════════════════════════════════
# ECR REPOSITORIES
# ═══════════════════════════════════════════════
# Stores Docker images so Kind can pull them.
# After terraform apply, build & push:
#   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
#   docker tag netflixclone-backend:latest <backend_repo_url>:latest
#   docker push <backend_repo_url>:latest
#   docker tag netflixclone-frontend:latest <frontend_repo_url>:latest
#   docker push <frontend_repo_url>:latest

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