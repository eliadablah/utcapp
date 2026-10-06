variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC the security groups belong to"
}
