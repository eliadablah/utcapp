output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "efs_id" {
  description = "ID of the EFS file system"
  value       = aws_efs_file_system.main.id

  # Hand the ID out only once the doorways exist, so servers can mount it at boot
  depends_on = [aws_efs_mount_target.main]
}

output "efs_arn" {
  description = "ARN of the EFS file system"
  value       = aws_efs_file_system.main.arn
}
