variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "notification_email" {
  type        = string
  description = "Email address that receives alerts. Leave empty to skip the subscription"
  default     = ""
}

variable "alb_arn_suffix" {
  type        = string
  description = "Load balancer ARN suffix, for the unhealthy hosts alarm"
}

variable "target_group_arn_suffix" {
  type        = string
  description = "Target group ARN suffix, for the unhealthy hosts alarm"
}

variable "db_instance_identifier" {
  type        = string
  description = "RDS instance identifier, for the database alarms"
}
