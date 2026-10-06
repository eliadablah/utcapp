output "sns_topic_arn" {
  description = "ARN of the notification topic"
  value       = aws_sns_topic.main.arn
}

output "log_group_name" {
  description = "Name of the log group the web servers write to"
  value       = aws_cloudwatch_log_group.httpd.name
}
