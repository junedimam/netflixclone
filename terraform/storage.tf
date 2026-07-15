# ═══════════════════════════════════════════════
# S3 MEDIA STORAGE
# ═══════════════════════════════════════════════

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

# Enable versioning (optional but good for media recovery)
resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}