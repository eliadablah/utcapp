variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "s3_bucket_arn" {
  type        = string
  description = "ARN of the app's S3 bucket"
}

variable "db_secret_arn" {
  type        = string
  description = "ARN of the secret holding the database password"
}

variable "ssm_parameter_arns" {
  type        = list(string)
  description = "ARNs of the SSM parameters the app may read"
}

variable "efs_arn" {
  type        = string
  description = "ARN of the EFS file system"
}
