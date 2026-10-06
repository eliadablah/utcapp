variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "App subnets the servers launch into"
}

variable "security_group_id" {
  type        = string
  description = "Security group attached to the app servers"
}

variable "instance_profile_name" {
  type        = string
  description = "Instance profile that gives the servers their IAM role"
}

variable "target_group_arn" {
  type        = string
  description = "Target group the servers register with"
}

variable "efs_id" {
  type        = string
  description = "EFS file system to mount at /mnt/efs"
}

variable "sns_topic_arn" {
  type        = string
  description = "SNS topic that receives scaling notifications"
}

variable "log_group_name" {
  type        = string
  description = "CloudWatch log group for the web server logs"
}

variable "s3_bucket_name" {
  type        = string
  description = "Bucket the website files are uploaded to and copied from"
}

variable "frontend_dir" {
  type        = string
  description = "Local folder holding the website (frontend) files"
}

variable "backend_dir" {
  type        = string
  description = "Local folder holding the backend (API) files"
}

variable "api_target_group_arn" {
  type        = string
  description = "Target group for the API on port 3000. Leave empty to not register with it"
  default     = ""
}

variable "ssm_prefix" {
  type        = string
  description = "SSM Parameter Store path the API reads its settings from (e.g., /utc-app/dev)"
}

variable "instance_type" {
  type        = string
  description = "Size of each app server"
  default     = "t3.micro"
}

variable "min_size" {
  type        = number
  description = "Fewest servers allowed"
  default     = 2
}

variable "max_size" {
  type        = number
  description = "Most servers allowed"
  default     = 6
}

variable "desired_capacity" {
  type        = number
  description = "Number of servers to start with"
  default     = 2
}

variable "scale_out_cpu" {
  type        = number
  description = "Average CPU percent above which a server is added"
  default     = 80
}

variable "scale_in_cpu" {
  type        = number
  description = "Average CPU percent below which a server is removed"
  default     = 30
}
