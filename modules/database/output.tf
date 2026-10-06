output "db_instance_identifier" {
  description = "Identifier of the RDS instance"
  value       = aws_db_instance.main.identifier
}

output "db_endpoint" {
  description = "Hostname the app uses to reach the database"
  value       = aws_db_instance.main.address
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the database password"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "ssm_parameter_arns" {
  description = "ARNs of the SSM parameters the app is allowed to read"
  value = [
    aws_ssm_parameter.db_endpoint.arn,
    aws_ssm_parameter.db_name.arn,
    aws_ssm_parameter.db_secret_arn.arn,
  ]
}
