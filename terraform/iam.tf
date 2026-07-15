# ═══════════════════════════════════════════════
# IAM USER & ACCESS KEYS
# ═══════════════════════════════════════════════
# Creates an IAM user with programmatic access so that
# the Kind-based application (running locally) can
# authenticate to AWS and use S3 for media storage.

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

# Generate access keys for the IAM user
resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

# ── ECR Push/Pull Access (optional) ───────────
# If you push Docker images to ECR from Kind,
# uncomment the policy below and the ECR repos.

# resource "aws_iam_user_policy" "ecr_access" {
#   name = "${var.project_name}-ecr-access"
#   user = aws_iam_user.app.name
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "ecr:GetDownloadUrlForLayer",
#           "ecr:BatchGetImage",
#           "ecr:BatchCheckLayerAvailability",
#           "ecr:PutImage",
#           "ecr:InitiateLayerUpload",
#           "ecr:UploadLayerPart",
#           "ecr:CompleteLayerUpload",
#           "ecr:GetAuthorizationToken"
#         ]
#         Resource = "*"
#       }
#     ]
#   })
# }