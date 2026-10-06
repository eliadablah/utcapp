variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnets for the EFS mount targets (one per AZ)"
}

variable "efs_security_group_id" {
  type        = string
  description = "Security group attached to the EFS mount targets"
}

variable "force_destroy" {
  type        = bool
  description = "Let terraform destroy delete the bucket even if it still has files in it"
  default     = false
}
