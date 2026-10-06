variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnets the load balancer sits in"
}

variable "security_group_id" {
  type        = string
  description = "Security group attached to the load balancer"
}

variable "health_check_path" {
  type        = string
  description = "Page the load balancer requests to check a server is alive"
  default     = "/"
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
