variable "aws_region" {
  type        = string
  description = "AWS region to build in"
  default     = "us-east-1"
}

variable "domain_name" {
  type        = string
  description = "Full domain for the app (e.g., app.example.com). Leave empty for HTTP only"
  default     = ""
}

variable "hosted_zone_name" {
  type        = string
  description = "Route 53 hosted zone the domain lives in (e.g., example.com)"
  default     = ""
}

variable "notification_email" {
  type        = string
  description = "Email address that receives alerts. Leave empty to skip"
  default     = ""
}
