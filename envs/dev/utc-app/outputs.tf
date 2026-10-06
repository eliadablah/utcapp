output "app_url" {
  description = "Address to open in a browser"
  value       = module.alb.app_url
}

output "alb_dns_name" {
  description = "AWS-generated address of the load balancer"
  value       = module.alb.alb_dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "db_endpoint" {
  description = "Hostname of the database (reachable only from the app servers)"
  value       = module.database.db_endpoint
}

output "db_secret_arn" {
  description = "Where the database password lives. A reference, not the password"
  value       = module.database.db_secret_arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.compute.autoscaling_group_name
}
