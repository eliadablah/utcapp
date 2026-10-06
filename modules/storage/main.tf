# ------------------------------------------------------------------------------
# S3 bucket (STO-001): logs, backups and uploaded files
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "main" {
  bucket        = "${var.environment}-utc-app-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.force_destroy

  tags = {
    Name        = "${var.environment}-utc-app"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ------------------------------------------------------------------------------
# EFS (STO-001): one shared folder every app server can mount
# ------------------------------------------------------------------------------
resource "aws_efs_file_system" "main" {
  encrypted = true

  tags = {
    Name        = "${var.environment}-utc-efs"
    Environment = var.environment
  }
}

# One doorway into the shared folder per AZ
resource "aws_efs_mount_target" "main" {
  count           = length(var.subnet_ids)
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = var.subnet_ids[count.index]
  security_groups = [var.efs_security_group_id]
}
