# ------------------------------------------------------------------------------
# RDS MySQL (DB-001)
# ------------------------------------------------------------------------------
resource "aws_db_subnet_group" "main" {
  name       = "utc-${var.environment}-database"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "utc-${var.environment}-database"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier     = "utc-${var.environment}-database"
  engine         = "mysql"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  # SEC-002: AWS makes up the password and keeps it in Secrets Manager.
  # It never appears in this code or in the Terraform state.
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]
  publicly_accessible    = false
  multi_az               = var.multi_az

  backup_retention_period   = var.backup_retention_period
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = "utc-${var.environment}-database-final"

  tags = {
    Name        = "utc-${var.environment}-database"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Secret references (SEC-002)
# The app reads these to learn WHERE things are. None of them is a secret value.
# ------------------------------------------------------------------------------
resource "aws_ssm_parameter" "db_endpoint" {
  name  = "/utc-app/${var.environment}/db/endpoint"
  type  = "String"
  value = aws_db_instance.main.address

  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/utc-app/${var.environment}/db/name"
  type  = "String"
  value = aws_db_instance.main.db_name

  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_secret_arn" {
  name  = "/utc-app/${var.environment}/db/secret_arn"
  type  = "String"
  value = aws_db_instance.main.master_user_secret[0].secret_arn

  tags = {
    Environment = var.environment
  }
}
