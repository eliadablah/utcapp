variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Database subnets the RDS instance can live in"
}

variable "security_group_id" {
  type        = string
  description = "Security group attached to the database"
}

variable "engine_version" {
  type        = string
  description = "MySQL version"
  default     = "8.0"
}

variable "instance_class" {
  type        = string
  description = "Size of the database server"
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  type        = number
  description = "Disk size in GB"
  default     = 20
}

variable "db_name" {
  type        = string
  description = "Name of the first database created inside MySQL"
  default     = "utcapp"
}

variable "db_username" {
  type        = string
  description = "Master username (the password is generated and stored by AWS)"
  default     = "admin"
}

variable "multi_az" {
  type        = bool
  description = "Keep a standby copy in a second AZ (costs about double)"
  default     = false
}

variable "backup_retention_period" {
  type        = number
  description = "How many days of automatic backups to keep"
  default     = 7
}

variable "skip_final_snapshot" {
  type        = bool
  description = "Skip the last backup when the database is destroyed"
  default     = false
}
