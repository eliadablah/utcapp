output "alb_dns_name" {
  description = "AWS-generated address of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn_suffix" {
  description = "Load balancer ID in the form CloudWatch alarms need"
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn" {
  description = "ARN of the target group the app servers register with"
  value       = aws_lb_target_group.app.arn

  # A target group is only usable once a listener connects it to the load
  # balancer, so make the servers wait for that
  depends_on = [aws_lb_listener.http]
}

output "api_target_group_arn" {
  description = "ARN of the target group the API registers with"
  value       = aws_lb_target_group.api.arn

  depends_on = [aws_lb_listener_rule.api]
}

output "target_group_arn_suffix" {
  description = "Target group ID in the form CloudWatch alarms need"
  value       = aws_lb_target_group.app.arn_suffix
}

output "app_url" {
  description = "Address to open in a browser"
  value       = local.enable_https ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}
