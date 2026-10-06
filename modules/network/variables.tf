variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
  default     = "dev"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets (Tier 1: Web/ALB)"
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets"
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "single_nat_gateway" {
  type        = bool
  description = "Use one NAT gateway instead of one per AZ"
  default     = true
}

variable "az_count" {
  type        = number
  description = "Number of Availability Zones to use"
  default     = 3
}

variable "database_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for database subnets (Tier 3: Database)"
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}