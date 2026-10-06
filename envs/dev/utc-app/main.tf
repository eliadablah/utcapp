# ------------------------------------------------------------------------------
# UTC App - dev environment
# Switches on the modules and fills in their blanks with the dev values.
# ------------------------------------------------------------------------------
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = "dev"
}

# ------------------------------------------------------------------------------
# Network (NET-001)
# ------------------------------------------------------------------------------
module "network" {
  source = "../../../modules/network"

  environment = local.environment
  vpc_cidr    = "10.10.0.0/16"
  az_count    = 3

  public_subnet_cidrs = ["10.10.0.0/20", "10.10.16.0/20", "10.10.32.0/20"]

  # Two app subnets per AZ, listed a, b, c then a, b, c again
  private_subnet_cidrs = [
    "10.10.64.0/20", "10.10.96.0/20", "10.10.128.0/20",
    "10.10.80.0/20", "10.10.112.0/20", "10.10.144.0/20",
  ]

  database_subnet_cidrs = ["10.10.160.0/20", "10.10.176.0/20", "10.10.192.0/20"]

  # One shared NAT keeps the dev bill low
  single_nat_gateway = true
}

# ------------------------------------------------------------------------------
# Security groups (SEC-001)
# ------------------------------------------------------------------------------
module "security" {
  source = "../../../modules/security"

  environment = local.environment
  vpc_id      = module.network.vpc_id
}

# ------------------------------------------------------------------------------
# S3 and EFS (STO-001)
# ------------------------------------------------------------------------------
module "storage" {
  source = "../../../modules/storage"

  environment           = local.environment
  subnet_ids            = module.network.database_subnet_ids
  efs_security_group_id = module.security.efs_security_group_id

  # Dev only: lets terraform destroy remove the bucket even with files in it
  force_destroy = true
}

# ------------------------------------------------------------------------------
# Database and secret references (DB-001, SEC-002)
# ------------------------------------------------------------------------------
module "database" {
  source = "../../../modules/database"

  environment       = local.environment
  subnet_ids        = module.network.database_subnet_ids
  security_group_id = module.security.database_security_group_id

  # Dev only: cheapest settings, and no leftover snapshot after destroy
  multi_az                = false
  backup_retention_period = 1
  skip_final_snapshot     = true
}

# ------------------------------------------------------------------------------
# EC2 role (IAM-001)
# ------------------------------------------------------------------------------
module "iam" {
  source = "../../../modules/iam"

  environment        = local.environment
  s3_bucket_arn      = module.storage.s3_bucket_arn
  db_secret_arn      = module.database.db_secret_arn
  ssm_parameter_arns = module.database.ssm_parameter_arns
  efs_arn            = module.storage.efs_arn
}

# ------------------------------------------------------------------------------
# Load balancer, certificate and DNS (ING-001)
# ------------------------------------------------------------------------------
module "alb" {
  source = "../../../modules/alb"

  environment       = local.environment
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  security_group_id = module.security.alb_security_group_id
  health_check_path = "/"

  domain_name      = var.domain_name
  hosted_zone_name = var.hosted_zone_name
}

# ------------------------------------------------------------------------------
# Alarms, logs and notifications (OBS-001)
# ------------------------------------------------------------------------------
module "monitoring" {
  source = "../../../modules/monitoring"

  environment             = local.environment
  notification_email      = var.notification_email
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  db_instance_identifier  = module.database.db_instance_identifier
}

# ------------------------------------------------------------------------------
# App servers (CMP-001)
# ------------------------------------------------------------------------------
module "compute" {
  source = "../../../modules/compute"

  environment           = local.environment
  private_subnet_ids    = module.network.private_subnet_ids
  security_group_id     = module.security.app_security_group_id
  instance_profile_name = module.iam.instance_profile_name
  target_group_arn      = module.alb.target_group_arn
  efs_id                = module.storage.efs_id
  sns_topic_arn         = module.monitoring.sns_topic_arn
  log_group_name        = module.monitoring.log_group_name

  # The website and the backend live in folders at the top of the repository
  s3_bucket_name = module.storage.s3_bucket_name
  frontend_dir   = "${path.module}/../../../frontend"
  backend_dir    = "${path.module}/../../../backend"

  # Where the backend finds its database settings, and where /api traffic arrives
  ssm_prefix           = "/utc-app/${local.environment}"
  api_target_group_arn = module.alb.api_target_group_arn

  instance_type    = "t3.micro"
  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  # Servers download software at boot, so the NAT and routes must be ready first
  depends_on = [module.network]
}
